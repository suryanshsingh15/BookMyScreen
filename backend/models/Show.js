const mongoose = require("mongoose");

// LEVEL: ADVANCED → this is the heart of "showtime management" + "interactive seat selection"
// + "real-time seat locking". A Show = one movie playing on one screen at one time.
// Each Show pre-generates its own list of seats (snapshot of the screen layout at
// creation time) so that seat status (available/locked/booked) can be tracked per-show,
// not shared globally across shows on the same screen.

const seatSchema = new mongoose.Schema(
  {
    seatId: { type: String, required: true }, // e.g. "A1", "B7"
    row: { type: String, required: true },
    category: { type: String, required: true }, // "Silver" | "Gold" | "Premium"
    price: { type: Number, required: true },
    status: {
      type: String,
      enum: ["available", "locked", "booked"],
      default: "available",
    },
    // Who currently holds the temporary lock, and when it expires.
    // This is what "real-time seat locking using Socket.io" is built on top of.
    lockedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    lockExpiresAt: { type: Date, default: null },
  },
  { _id: false }
);

const showSchema = new mongoose.Schema(
  {
    movie: { type: mongoose.Schema.Types.ObjectId, ref: "Movie", required: true },
    theatre: { type: mongoose.Schema.Types.ObjectId, ref: "Theatre", required: true },
    screenName: { type: String, required: true },
    startTime: { type: Date, required: true },
    basePrice: { type: Number, required: true },
    seats: [seatSchema],
  },
  { timestamps: true }
);

showSchema.index({ movie: 1, theatre: 1, startTime: 1 });

module.exports = mongoose.model("Show", showSchema);
