const mongoose = require("mongoose");

// LEVEL: BASIC/INTERMEDIATE → "theatre discovery" + seat layout foundation
// A theatre has multiple screens. Each screen has a fixed seat layout
// (rows x columns) which Shows will reference when generating bookable seats.
const screenSchema = new mongoose.Schema({
  name: { type: String, required: true }, // e.g. "Screen 1"
  totalRows: { type: Number, required: true, default: 8 },
  seatsPerRow: { type: Number, required: true, default: 10 },
  // Seat categories let you charge different prices per row-block, e.g. Silver/Gold/Premium
  seatCategories: [
    {
      name: { type: String, required: true }, // "Silver", "Gold", "Premium"
      rows: [String], // e.g. ["A","B"] belong to "Silver"
      priceMultiplier: { type: Number, default: 1 }, // applied on top of Show base price
    },
  ],
});

const theatreSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    city: { type: String, required: true, index: true },
    address: { type: String, required: true },
    screens: [screenSchema],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Theatre", theatreSchema);
