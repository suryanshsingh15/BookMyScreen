const mongoose = require("mongoose");

// LEVEL: BASIC → "movie discovery" feature
const movieSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    language: { type: String, required: true },
    genre: [{ type: String }],
    duration: { type: Number, required: true }, // in minutes
    posterUrl: { type: String, default: "" },
    releaseDate: { type: Date, required: true },
    rating: { type: Number, min: 0, max: 10, default: 0 }, // avg user rating
    isActive: { type: Boolean, default: true }, // "now showing" vs archived
  },
  { timestamps: true }
);

module.exports = mongoose.model("Movie", movieSchema);
