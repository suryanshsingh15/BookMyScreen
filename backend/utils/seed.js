require("dotenv").config();
const mongoose = require("mongoose");
const connectDB = require("../config/db");
const User = require("../models/User");
const Movie = require("../models/Movie");
const Theatre = require("../models/Theatre");
const Show = require("../models/Show");
const Booking = require("../models/Booking");

// LEVEL: BASIC (but genuinely useful) — run with `npm run seed`.
// Wipes existing demo collections and inserts an admin user, a regular user,
// two movies, one theatre with one screen, and one show — enough to click
// through the whole app immediately: browse -> pick show -> select seats -> pay.

const run = async () => {
  await connectDB();

  await Promise.all([
    User.deleteMany({}),
    Movie.deleteMany({}),
    Theatre.deleteMany({}),
    Show.deleteMany({}),
    Booking.deleteMany({}),
  ]);

  const admin = await User.create({
    name: "Admin",
    email: "admin@bookmyscreen.com",
    password: "admin123",
    role: "admin",
  });

  const demoUser = await User.create({
    name: "Demo User",
    email: "user@bookmyscreen.com",
    password: "user123",
    role: "user",
  });

  const movie = await Movie.create({
    title: "Interstellar Odyssey",
    description:
      "A crew of explorers travels through a wormhole in search of a new home for humanity.",
    language: "English",
    genre: ["Sci-Fi", "Drama"],
    duration: 169,
    posterUrl: "https://via.placeholder.com/300x450?text=Interstellar+Odyssey",
    releaseDate: new Date("2026-01-15"),
    rating: 8.7,
  });

  const movie2 = await Movie.create({
    title: "The Last Heist",
    description: "A retired thief is pulled back in for one final, impossible job.",
    language: "English",
    genre: ["Action", "Thriller"],
    duration: 128,
    posterUrl: "https://via.placeholder.com/300x450?text=The+Last+Heist",
    releaseDate: new Date("2026-02-01"),
    rating: 7.9,
  });

  const theatre = await Theatre.create({
    name: "PVR Forum Mall",
    city: "Bengaluru",
    address: "Forum Mall, Koramangala, Bengaluru",
    screens: [
      {
        name: "Screen 1",
        totalRows: 6,
        seatsPerRow: 10,
        seatCategories: [
          { name: "Silver", rows: ["A", "B"], priceMultiplier: 1 },
          { name: "Gold", rows: ["C", "D"], priceMultiplier: 1.5 },
          { name: "Premium", rows: ["E", "F"], priceMultiplier: 2 },
        ],
      },
    ],
  });

  // Build seat map the same way showController.createShow does, so seeded
  // data matches exactly what the API would generate.
  const screen = theatre.screens[0];
  const basePrice = 150;
  const seats = [];
  const rowLetters = Array.from({ length: screen.totalRows }, (_, i) => String.fromCharCode(65 + i));
  for (const row of rowLetters) {
    const category = screen.seatCategories.find((c) => c.rows.includes(row));
    for (let col = 1; col <= screen.seatsPerRow; col++) {
      seats.push({
        seatId: `${row}${col}`,
        row,
        category: category ? category.name : "Standard",
        price: Math.round(basePrice * (category ? category.priceMultiplier : 1)),
        status: "available",
      });
    }
  }

  const showTime = new Date();
  showTime.setDate(showTime.getDate() + 1);
  showTime.setHours(19, 30, 0, 0);

  await Show.create({
    movie: movie._id,
    theatre: theatre._id,
    screenName: "Screen 1",
    startTime: showTime,
    basePrice,
    seats,
  });

  console.log("Seed complete:");
  console.log(`  Admin login:  admin@bookmyscreen.com / admin123`);
  console.log(`  User login:   user@bookmyscreen.com / user123`);
  console.log(`  Movies: "${movie.title}", "${movie2.title}"`);
  console.log(`  Theatre: "${theatre.name}" (${theatre.city}) with a show tomorrow 7:30 PM`);

  await mongoose.connection.close();
  process.exit(0);
};

run().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
