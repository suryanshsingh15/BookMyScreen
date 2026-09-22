import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../services/api";
import { getSocket } from "../services/socket";
import { useAuth } from "../context/AuthContext";
import SeatMap from "../components/SeatMap";

// LEVEL: ADVANCED → this page ties together showtime data, live Socket.io seat
// locking, and the Razorpay checkout flow. Walk through the useEffect below in
// an interview — it's the whole "why Socket.io" story in one place.

// Dynamically loads Razorpay's checkout.js the first time it's needed, instead
// of always loading it on every page (keeps other pages lighter).
const loadRazorpayScript = () =>
  new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });

export default function SeatSelection() {
  const { showId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [show, setShow] = useState(null);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");
  const socketRef = useRef(null);

  // ---- Initial load: fetch show + seat map, connect socket, join its room ----
  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }

    const fetchShow = async () => {
      try {
        const { data } = await api.get(`/shows/${showId}`);
        setShow(data);
      } catch (err) {
        setError("Could not load show");
      } finally {
        setLoading(false);
      }
    };
    fetchShow();

    const socket = getSocket();
    socketRef.current = socket;
    socket.emit("join-show", showId);

    // Another client locked seats -> mark them "locked" in our local state too,
    // so we see it grey out in real time without refetching.
    const handleSeatLocked = ({ seatIds, userId }) => {
      setShow((prev) => {
        if (!prev) return prev;
        const updated = { ...prev, seats: prev.seats.map((s) => ({ ...s })) };
        seatIds.forEach((seatId) => {
          const seat = updated.seats.find((s) => s.seatId === seatId);
          if (seat) {
            seat.status = "locked";
            seat.lockedBy = userId;
          }
        });
        return updated;
      });
    };

    const handleSeatReleased = ({ seatIds }) => {
      setShow((prev) => {
        if (!prev) return prev;
        const updated = { ...prev, seats: prev.seats.map((s) => ({ ...s })) };
        seatIds.forEach((seatId) => {
          const seat = updated.seats.find((s) => s.seatId === seatId);
          if (seat && seat.status !== "booked") {
            seat.status = "available";
            seat.lockedBy = null;
          }
        });
        return updated;
      });
    };

    const handleSeatBooked = ({ seatIds }) => {
      setShow((prev) => {
        if (!prev) return prev;
        const updated = { ...prev, seats: prev.seats.map((s) => ({ ...s })) };
        seatIds.forEach((seatId) => {
          const seat = updated.seats.find((s) => s.seatId === seatId);
          if (seat) seat.status = "booked";
        });
        return updated;
      });
    };

    const handleLockError = ({ message }) => setError(message);

    socket.on("seat-locked", handleSeatLocked);
    socket.on("seat-released", handleSeatReleased);
    socket.on("seat-booked", handleSeatBooked);
    socket.on("lock-error", handleLockError);

    return () => {
      socket.emit("leave-show", showId);
      socket.off("seat-locked", handleSeatLocked);
      socket.off("seat-released", handleSeatReleased);
      socket.off("seat-booked", handleSeatBooked);
      socket.off("lock-error", handleLockError);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showId, user]);

  // ---- Clicking a seat: select -> lock via socket, deselect -> release via socket ----
  const handleSeatClick = (seat) => {
    setError("");
    const socket = socketRef.current;
    if (!socket) return;

    if (selectedSeats.includes(seat.seatId)) {
      const next = selectedSeats.filter((id) => id !== seat.seatId);
      setSelectedSeats(next);
      socket.emit("release-seat", { showId, seatIds: [seat.seatId], userId: user._id });
    } else {
      if (selectedSeats.length >= 8) {
        setError("You can select up to 8 seats at a time");
        return;
      }
      const next = [...selectedSeats, seat.seatId];
      setSelectedSeats(next);
      socket.emit("lock-seat", { showId, seatIds: [seat.seatId], userId: user._id });
    }
  };

  const totalAmount = show
    ? show.seats.filter((s) => selectedSeats.includes(s.seatId)).reduce((sum, s) => sum + s.price, 0)
    : 0;

  // ---- Pay: create Razorpay order on backend, open checkout, verify signature ----
  const handlePay = async () => {
    setError("");
    setProcessing(true);
    try {
      const { data: order } = await api.post("/bookings/create-order", { showId, seatIds: selectedSeats });

      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        setError("Could not load Razorpay checkout. Check your internet connection.");
        setProcessing(false);
        return;
      }

      const options = {
        key: order.keyId,
        amount: order.amount,
        currency: order.currency,
        name: "BookMyScreen",
        description: `${selectedSeats.length} seat(s) · ${show?.movie?.title || ""}`,
        order_id: order.orderId,
        handler: async (response) => {
          try {
            await api.post("/bookings/verify-payment", {
              bookingId: order.bookingId,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });
            navigate("/my-bookings");
          } catch (err) {
            setError(err.response?.data?.message || "Payment verification failed");
          } finally {
            setProcessing(false);
          }
        },
        modal: {
          ondismiss: () => setProcessing(false),
        },
        prefill: { name: user.name, email: user.email },
        theme: { color: "#e50914" },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      setError(err.response?.data?.message || "Could not start payment");
      setProcessing(false);
    }
  };

  if (loading) return <p className="center-msg">Loading seat map...</p>;
  if (!show) return <p className="center-msg">Show not found.</p>;

  return (
    <div className="container">
      <h2 style={{ marginBottom: 0 }}>{show.movie?.title}</h2>
      <p style={{ color: "#9a9a9a", marginTop: 4 }}>
        {show.theatre?.name} · {show.screenName} ·{" "}
        {new Date(show.startTime).toLocaleString([], { weekday: "short", hour: "2-digit", minute: "2-digit" })}
      </p>

      <SeatMap seats={show.seats} selectedSeats={selectedSeats} onSeatClick={handleSeatClick} />

      {error && <p className="error-text" style={{ textAlign: "center" }}>{error}</p>}

      <div className="booking-summary">
        <div>
          <strong>{selectedSeats.length}</strong> seat(s) selected: {selectedSeats.join(", ") || "—"}
          <br />
          <span style={{ color: "#9a9a9a" }}>Total: ₹{totalAmount}</span>
        </div>
        <button
          className="btn"
          disabled={selectedSeats.length === 0 || processing}
          onClick={handlePay}
        >
          {processing ? "Processing..." : `Pay ₹${totalAmount}`}
        </button>
      </div>
    </div>
  );
}
