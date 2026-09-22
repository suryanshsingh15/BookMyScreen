import { useEffect, useState } from "react";
import api from "../services/api";

// LEVEL: BASIC → "booking history" feature
export default function MyBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const { data } = await api.get("/bookings/my");
        setBookings(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchBookings();
  }, []);

  if (loading) return <p className="center-msg">Loading bookings...</p>;

  return (
    <div className="container">
      <h2>My Bookings</h2>
      {bookings.length === 0 ? (
        <p className="center-msg">No bookings yet. Go book a movie!</p>
      ) : (
        bookings.map((b) => (
          <div className="booking-card" key={b._id}>
            <div>
              <strong>{b.show?.movie?.title}</strong>
              <div style={{ color: "#9a9a9a", fontSize: "0.85rem" }}>
                {b.show?.theatre?.name} · {b.show?.theatre?.city}
              </div>
              <div style={{ color: "#9a9a9a", fontSize: "0.85rem" }}>
                {b.show?.startTime && new Date(b.show.startTime).toLocaleString([], { weekday: "short", hour: "2-digit", minute: "2-digit" })}
                {" · "}Seats: {b.seats.join(", ")}
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ marginBottom: 6 }}>₹{b.totalAmount}</div>
              <span className={`status-badge status-${b.status}`}>{b.status}</span>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
