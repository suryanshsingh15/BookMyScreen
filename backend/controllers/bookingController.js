const crypto = require("crypto");
const Razorpay = require("razorpay");
const Show = require("../models/Show");
const Booking = require("../models/Booking");
const asyncHandler = require("../middleware/asyncHandler");

// LEVEL: ADVANCED → "Razorpay payment integration" + "booking history"

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// @route  POST /api/bookings/create-order
// @access Private
// Step 1 of payment flow: seats must already be "locked" by this user (via socket)
// before an order can be created — this stops someone paying for a seat they
// never actually held.
const createBookingOrder = asyncHandler(async (req, res) => {
  const { showId, seatIds } = req.body;
  const userId = req.user._id;

  const show = await Show.findById(showId);
  if (!show) {
    res.status(404);
    throw new Error("Show not found");
  }

  let totalAmount = 0;
  for (const seatId of seatIds) {
    const seat = show.seats.find((s) => s.seatId === seatId);
    if (!seat) {
      res.status(400);
      throw new Error(`Seat ${seatId} does not exist on this show`);
    }
    if (seat.status !== "locked" || String(seat.lockedBy) !== String(userId)) {
      res.status(409);
      throw new Error(`Seat ${seatId} is not locked by you. Select seats again.`);
    }
    totalAmount += seat.price;
  }

  // Razorpay expects amount in the smallest currency unit (paise for INR)
  const order = await razorpay.orders.create({
    amount: totalAmount * 100,
    currency: "INR",
    receipt: `receipt_${Date.now()}`,
  });

  const booking = await Booking.create({
    user: userId,
    show: showId,
    seats: seatIds,
    totalAmount,
    status: "pending",
    payment: { razorpayOrderId: order.id },
  });

  res.status(201).json({
    bookingId: booking._id,
    orderId: order.id,
    amount: order.amount,
    currency: order.currency,
    keyId: process.env.RAZORPAY_KEY_ID, // frontend needs this to open Razorpay checkout
  });
});

// @route  POST /api/bookings/verify-payment
// @access Private
// Step 2: Razorpay's checkout.js returns payment_id + signature to the frontend,
// which sends them here. We verify the signature ourselves (HMAC SHA256) rather
// than trusting the client — this is the part interviewers usually ask about.
const verifyPayment = asyncHandler(async (req, res) => {
  const { bookingId, razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

  const body = `${razorpay_order_id}|${razorpay_payment_id}`;
  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(body)
    .digest("hex");

  const isValid = expectedSignature === razorpay_signature;

  const booking = await Booking.findById(bookingId);
  if (!booking) {
    res.status(404);
    throw new Error("Booking not found");
  }

  if (!isValid) {
    booking.status = "failed";
    await booking.save();
    res.status(400);
    throw new Error("Payment verification failed");
  }

  // Mark booking confirmed
  booking.status = "confirmed";
  booking.payment.razorpayPaymentId = razorpay_payment_id;
  booking.payment.razorpaySignature = razorpay_signature;
  booking.payment.paidAt = new Date();
  await booking.save();

  // Flip seats from "locked" -> "booked" permanently
  const show = await Show.findById(booking.show);
  for (const seatId of booking.seats) {
    const seat = show.seats.find((s) => s.seatId === seatId);
    if (seat) {
      seat.status = "booked";
      seat.lockExpiresAt = null;
    }
  }
  await show.save();

  // Broadcast final state so every connected client sees these seats as booked,
  // not just locked. `req.app.get("io")` — see server.js for how io is attached.
  const io = req.app.get("io");
  if (io) io.to(String(booking.show)).emit("seat-booked", { seatIds: booking.seats });

  res.json({ message: "Payment verified, booking confirmed", booking });
});

// @route  GET /api/bookings/my
// @access Private
// "booking history" feature
const getMyBookings = asyncHandler(async (req, res) => {
  const bookings = await Booking.find({ user: req.user._id })
    .populate({
      path: "show",
      populate: [
        { path: "movie", select: "title posterUrl duration" },
        { path: "theatre", select: "name city" },
      ],
    })
    .sort({ createdAt: -1 });

  res.json(bookings);
});

// @route  GET /api/bookings/:id
// @access Private
const getBookingById = asyncHandler(async (req, res) => {
  const booking = await Booking.findById(req.params.id).populate({
    path: "show",
    populate: [{ path: "movie" }, { path: "theatre" }],
  });

  if (!booking) {
    res.status(404);
    throw new Error("Booking not found");
  }

  // Ownership check: a user should only see their own booking (unless admin)
  if (String(booking.user) !== String(req.user._id) && req.user.role !== "admin") {
    res.status(403);
    throw new Error("Not authorized to view this booking");
  }

  res.json(booking);
});

module.exports = { createBookingOrder, verifyPayment, getMyBookings, getBookingById };
