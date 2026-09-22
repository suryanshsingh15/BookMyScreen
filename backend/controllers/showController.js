const Show = require("../models/Show");
const Theatre = require("../models/Theatre");
const asyncHandler = require("../middleware/asyncHandler");

// LEVEL: ADVANCED → "showtime management" + generates the seat map that
// "interactive seat selection" is built on top of.

// Helper: turns a screen's row/column config + seat categories into a flat
// list of individual bookable seats, e.g. A1, A2, ... B1, B2 ...
const generateSeatsFromScreen = (screen, basePrice) => {
  const seats = [];
  const rowLetters = Array.from({ length: screen.totalRows }, (_, i) =>
    String.fromCharCode(65 + i) // 65 = 'A'
  );

  for (const row of rowLetters) {
    // find which category this row belongs to (default multiplier 1 if none match)
    const category = screen.seatCategories.find((c) => c.rows.includes(row));
    const categoryName = category ? category.name : "Standard";
    const multiplier = category ? category.priceMultiplier : 1;

    for (let col = 1; col <= screen.seatsPerRow; col++) {
      seats.push({
        seatId: `${row}${col}`,
        row,
        category: categoryName,
        price: Math.round(basePrice * multiplier),
        status: "available",
      });
    }
  }
  return seats;
};

// @route  POST /api/shows
// @access Private/Admin
// Creates a show and snapshots the seat layout at this moment in time.
const createShow = asyncHandler(async (req, res) => {
  const { movie, theatre, screenName, startTime, basePrice } = req.body;

  const theatreDoc = await Theatre.findById(theatre);
  if (!theatreDoc) {
    res.status(404);
    throw new Error("Theatre not found");
  }

  const screen = theatreDoc.screens.find((s) => s.name === screenName);
  if (!screen) {
    res.status(404);
    throw new Error("Screen not found in this theatre");
  }

  const seats = generateSeatsFromScreen(screen, basePrice);

  const show = await Show.create({
    movie,
    theatre,
    screenName,
    startTime,
    basePrice,
    seats,
  });

  res.status(201).json(show);
});

// @route  GET /api/shows?movie=&theatre=&city=&date=
// @access Public
const getShows = asyncHandler(async (req, res) => {
  const { movie, theatre, date } = req.query;
  const filter = {};
  if (movie) filter.movie = movie;
  if (theatre) filter.theatre = theatre;

  if (date) {
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    const end = new Date(date);
    end.setHours(23, 59, 59, 999);
    filter.startTime = { $gte: start, $lte: end };
  }

  const shows = await Show.find(filter)
    .populate("movie", "title posterUrl duration language")
    .populate("theatre", "name city address")
    .sort({ startTime: 1 });

  res.json(shows);
});

// @route  GET /api/shows/:id
// @access Public
// Returns full seat map — this is what the frontend renders as the seat grid.
const getShowById = asyncHandler(async (req, res) => {
  const show = await Show.findById(req.params.id)
    .populate("movie", "title posterUrl duration language")
    .populate("theatre", "name city address");

  if (!show) {
    res.status(404);
    throw new Error("Show not found");
  }

  // Lazily release any expired locks before sending seat map to client,
  // so a user doesn't see a seat as "locked" forever if someone abandoned it.
  const now = new Date();
  let changed = false;
  show.seats.forEach((seat) => {
    if (seat.status === "locked" && seat.lockExpiresAt && seat.lockExpiresAt < now) {
      seat.status = "available";
      seat.lockedBy = null;
      seat.lockExpiresAt = null;
      changed = true;
    }
  });
  if (changed) await show.save();

  res.json(show);
});

// @route  DELETE /api/shows/:id
// @access Private/Admin
const deleteShow = asyncHandler(async (req, res) => {
  const show = await Show.findByIdAndDelete(req.params.id);
  if (!show) {
    res.status(404);
    throw new Error("Show not found");
  }
  res.json({ message: "Show removed" });
});

module.exports = { createShow, getShows, getShowById, deleteShow };
