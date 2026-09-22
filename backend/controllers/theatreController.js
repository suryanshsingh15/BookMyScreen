const Theatre = require("../models/Theatre");
const asyncHandler = require("../middleware/asyncHandler");

// LEVEL: BASIC → "theatre discovery"

// @route  GET /api/theatres?city=
// @access Public
const getTheatres = asyncHandler(async (req, res) => {
  const { city } = req.query;
  const filter = {};
  if (city) filter.city = { $regex: `^${city}$`, $options: "i" };
  const theatres = await Theatre.find(filter);
  res.json(theatres);
});

// @route  GET /api/theatres/:id
// @access Public
const getTheatreById = asyncHandler(async (req, res) => {
  const theatre = await Theatre.findById(req.params.id);
  if (!theatre) {
    res.status(404);
    throw new Error("Theatre not found");
  }
  res.json(theatre);
});

// @route  POST /api/theatres
// @access Private/Admin
const createTheatre = asyncHandler(async (req, res) => {
  const theatre = await Theatre.create(req.body);
  res.status(201).json(theatre);
});

// @route  PUT /api/theatres/:id
// @access Private/Admin
const updateTheatre = asyncHandler(async (req, res) => {
  const theatre = await Theatre.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!theatre) {
    res.status(404);
    throw new Error("Theatre not found");
  }
  res.json(theatre);
});

// @route  DELETE /api/theatres/:id
// @access Private/Admin
const deleteTheatre = asyncHandler(async (req, res) => {
  const theatre = await Theatre.findByIdAndDelete(req.params.id);
  if (!theatre) {
    res.status(404);
    throw new Error("Theatre not found");
  }
  res.json({ message: "Theatre removed" });
});

module.exports = {
  getTheatres,
  getTheatreById,
  createTheatre,
  updateTheatre,
  deleteTheatre,
};
