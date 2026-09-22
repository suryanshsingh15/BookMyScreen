const Movie = require("../models/Movie");
const asyncHandler = require("../middleware/asyncHandler");

// LEVEL: BASIC → CRUD + "movie discovery"

// @route  GET /api/movies?city=&language=&genre=&search=
// @access Public
const getMovies = asyncHandler(async (req, res) => {
  const { language, genre, search } = req.query;
  const filter = { isActive: true };

  if (language) filter.language = language;
  if (genre) filter.genre = genre;
  if (search) filter.title = { $regex: search, $options: "i" };

  const movies = await Movie.find(filter).sort({ releaseDate: -1 });
  res.json(movies);
});

// @route  GET /api/movies/:id
// @access Public
const getMovieById = asyncHandler(async (req, res) => {
  const movie = await Movie.findById(req.params.id);
  if (!movie) {
    res.status(404);
    throw new Error("Movie not found");
  }
  res.json(movie);
});

// @route  POST /api/movies
// @access Private/Admin
const createMovie = asyncHandler(async (req, res) => {
  const movie = await Movie.create(req.body);
  res.status(201).json(movie);
});

// @route  PUT /api/movies/:id
// @access Private/Admin
const updateMovie = asyncHandler(async (req, res) => {
  const movie = await Movie.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!movie) {
    res.status(404);
    throw new Error("Movie not found");
  }
  res.json(movie);
});

// @route  DELETE /api/movies/:id
// @access Private/Admin
const deleteMovie = asyncHandler(async (req, res) => {
  const movie = await Movie.findByIdAndUpdate(
    req.params.id,
    { isActive: false }, // soft delete — keeps history intact for past bookings
    { new: true }
  );
  if (!movie) {
    res.status(404);
    throw new Error("Movie not found");
  }
  res.json({ message: "Movie removed" });
});

module.exports = { getMovies, getMovieById, createMovie, updateMovie, deleteMovie };
