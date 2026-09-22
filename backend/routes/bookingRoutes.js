const express = require("express");
const {
  createBookingOrder,
  verifyPayment,
  getMyBookings,
  getBookingById,
} = require("../controllers/bookingController");
const { protect } = require("../middleware/auth");

const router = express.Router();

// All booking routes require a logged-in user
router.post("/create-order", protect, createBookingOrder);
router.post("/verify-payment", protect, verifyPayment);
router.get("/my", protect, getMyBookings);
router.get("/:id", protect, getBookingById);

module.exports = router;
