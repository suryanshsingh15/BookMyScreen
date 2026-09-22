const mongoose = require("mongoose");

// LEVEL: ADVANCED → "booking history" + "Razorpay payment integration"
const bookingSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    show: { type: mongoose.Schema.Types.ObjectId, ref: "Show", required: true },
    seats: [{ type: String, required: true }], // seatIds, e.g. ["A1","A2"]
    totalAmount: { type: Number, required: true },
    status: {
      type: String,
      enum: ["pending", "confirmed", "failed", "cancelled"],
      default: "pending",
    },
    payment: {
      razorpayOrderId: { type: String },
      razorpayPaymentId: { type: String },
      razorpaySignature: { type: String },
      paidAt: { type: Date },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Booking", bookingSchema);
