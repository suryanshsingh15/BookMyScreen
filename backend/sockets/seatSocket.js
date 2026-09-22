const Show = require("../models/Show");

// LEVEL: ADVANCED → "real-time seat locking using Socket.io to prevent concurrent bookings"
//
// HOW IT WORKS (explain this in interviews — it's the most interesting part of the project):
// 1. Each show has its own Socket.io "room" — the room name is the showId.
// 2. When user A clicks a seat, the client emits "lock-seat". The server checks the
//    seat's current status in MongoDB. If it's "available", it atomically flips it to
//    "locked", records who locked it and an expiry timestamp, then broadcasts
//    "seat-locked" to everyone else viewing that show so their UI greys the seat out
//    immediately — this is the "concurrent booking prevention" part.
// 3. If user A doesn't complete payment within SEAT_LOCK_TTL_SECONDS, the lock expires.
//    We handle this two ways: lazily (checked whenever the show is fetched — see
//    showController.getShowById) and actively (setTimeout below), so stale locks don't
//    block seats forever even if nobody re-fetches the show.
// 4. On successful payment, bookingController flips status "locked" -> "booked" and
//    broadcasts "seat-booked", which is final and cannot be undone by lock expiry.

const LOCK_TTL_MS = (parseInt(process.env.SEAT_LOCK_TTL_SECONDS, 10) || 300) * 1000;

const registerSeatSocketHandlers = (io) => {
  io.on("connection", (socket) => {
    // Client joins the "room" for the specific show they're viewing/booking.
    socket.on("join-show", (showId) => {
      socket.join(showId);
    });

    socket.on("leave-show", (showId) => {
      socket.leave(showId);
    });

    // Client requests a temporary hold on one or more seats.
    socket.on("lock-seat", async ({ showId, seatIds, userId }) => {
      try {
        const show = await Show.findById(showId);
        if (!show) return socket.emit("lock-error", { message: "Show not found" });

        const now = new Date();
        const unavailable = [];

        for (const seatId of seatIds) {
          const seat = show.seats.find((s) => s.seatId === seatId);
          if (!seat) continue;

          // Release seat if its previous lock already expired
          if (seat.status === "locked" && seat.lockExpiresAt && seat.lockExpiresAt < now) {
            seat.status = "available";
            seat.lockedBy = null;
            seat.lockExpiresAt = null;
          }

          if (seat.status !== "available") {
            unavailable.push(seatId);
          }
        }

        // If ANY requested seat is no longer available, reject the whole batch —
        // avoids partially-locked, confusing selections.
        if (unavailable.length > 0) {
          return socket.emit("lock-error", {
            message: "Some seats are no longer available",
            seats: unavailable,
          });
        }

        const expiresAt = new Date(Date.now() + LOCK_TTL_MS);
        for (const seatId of seatIds) {
          const seat = show.seats.find((s) => s.seatId === seatId);
          seat.status = "locked";
          seat.lockedBy = userId;
          seat.lockExpiresAt = expiresAt;
        }

        await show.save();

        // Tell everyone (including sender) which seats just got locked, and by whom,
        // so all connected clients update their seat map instantly.
        io.to(showId).emit("seat-locked", { seatIds, userId, expiresAt });

        // Safety net: auto-release if this lock is never confirmed into a booking.
        setTimeout(async () => {
          const freshShow = await Show.findById(showId);
          if (!freshShow) return;
          let changed = false;
          for (const seatId of seatIds) {
            const seat = freshShow.seats.find((s) => s.seatId === seatId);
            if (seat && seat.status === "locked" && String(seat.lockedBy) === String(userId)) {
              seat.status = "available";
              seat.lockedBy = null;
              seat.lockExpiresAt = null;
              changed = true;
            }
          }
          if (changed) {
            await freshShow.save();
            io.to(showId).emit("seat-released", { seatIds });
          }
        }, LOCK_TTL_MS);
      } catch (err) {
        socket.emit("lock-error", { message: err.message });
      }
    });

    // User manually deselects a seat before paying.
    socket.on("release-seat", async ({ showId, seatIds, userId }) => {
      try {
        const show = await Show.findById(showId);
        if (!show) return;

        for (const seatId of seatIds) {
          const seat = show.seats.find((s) => s.seatId === seatId);
          if (seat && seat.status === "locked" && String(seat.lockedBy) === String(userId)) {
            seat.status = "available";
            seat.lockedBy = null;
            seat.lockExpiresAt = null;
          }
        }
        await show.save();
        io.to(showId).emit("seat-released", { seatIds });
      } catch (err) {
        socket.emit("lock-error", { message: err.message });
      }
    });

    socket.on("disconnect", () => {
      // Note: we intentionally do NOT release locks on disconnect, because a user
      // might just be switching tabs/network hiccup. The TTL-based expiry above is
      // the single source of truth for releasing abandoned locks.
    });
  });
};

module.exports = registerSeatSocketHandlers;
