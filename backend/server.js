require("dotenv").config();
const express = require("express");
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");
const connectDB = require("./config/db");
const { notFound, errorHandler } = require("./middleware/errorHandler");
const registerSeatSocketHandlers = require("./sockets/seatSocket");

// Route imports
const authRoutes = require("./routes/authRoutes");
const movieRoutes = require("./routes/movieRoutes");
const theatreRoutes = require("./routes/theatreRoutes");
const showRoutes = require("./routes/showRoutes");
const bookingRoutes = require("./routes/bookingRoutes");

// LEVEL: BASIC → app entry point, but wiring Socket.io alongside Express (ADVANCED)
// is worth understanding well: they share the same underlying HTTP server so that
// both REST calls and WebSocket connections work on the same port.

connectDB();

const app = express();

// ---- Core middleware ----
app.use(cors({ origin: process.env.CLIENT_URL || "*", credentials: true }));
app.use(express.json()); // parses incoming JSON bodies into req.body

// ---- Health check ----
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// ---- Mounted routes ----
app.use("/api/auth", authRoutes);
app.use("/api/movies", movieRoutes);
app.use("/api/theatres", theatreRoutes);
app.use("/api/shows", showRoutes);
app.use("/api/bookings", bookingRoutes);

// ---- Error handling (must be registered AFTER all routes) ----
app.use(notFound);
app.use(errorHandler);

// ---- HTTP server + Socket.io ----
// We create a plain http.Server wrapping the Express app, then attach Socket.io
// to that same server. This is why seat locking (WebSocket) and everything else
// (REST) both work from one `npm start`.
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || "*",
    methods: ["GET", "POST"],
  },
});

registerSeatSocketHandlers(io);

// Make `io` available inside REST controllers (e.g. bookingController emits
// "seat-booked" after a successful payment) via req.app.get("io").
app.set("io", io);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`BookMyScreen backend running on port ${PORT} [${process.env.NODE_ENV || "development"}]`);
});
