// LEVEL: ADVANCED (visual half of "interactive seat selection")
// Pure presentational component: groups the flat seats array by row and
// renders a clickable grid. All the real-time logic lives in the parent
// (SeatSelection.jsx), which passes down seat status + click handler.
export default function SeatMap({ seats, selectedSeats, onSeatClick }) {
  const rows = {};
  seats.forEach((seat) => {
    if (!rows[seat.row]) rows[seat.row] = [];
    rows[seat.row].push(seat);
  });

  const rowKeys = Object.keys(rows).sort();

  const getSeatClass = (seat) => {
    if (selectedSeats.includes(seat.seatId)) return "seat selected";
    if (seat.status === "booked") return "seat booked";
    if (seat.status === "locked" && !selectedSeats.includes(seat.seatId)) return "seat locked";
    return "seat available";
  };

  return (
    <div>
      <div className="screen-label">S C R E E N</div>
      <div className="screen-curve" />
      <div className="seat-map">
        {rowKeys.map((row) => (
          <div className="seat-row" key={row}>
            <span className="row-label">{row}</span>
            {rows[row]
              .sort((a, b) => parseInt(a.seatId.slice(1)) - parseInt(b.seatId.slice(1)))
              .map((seat) => (
                <button
                  key={seat.seatId}
                  className={getSeatClass(seat)}
                  disabled={seat.status === "booked" || (seat.status === "locked" && !selectedSeats.includes(seat.seatId))}
                  onClick={() => onSeatClick(seat)}
                  title={`${seat.seatId} · ${seat.category} · ₹${seat.price}`}
                >
                  {seat.seatId.replace(/[A-Z]/, "")}
                </button>
              ))}
          </div>
        ))}
      </div>
      <div className="legend">
        <div className="legend-item"><div className="legend-swatch" style={{ background: "#2a2a2a" }} /> Available</div>
        <div className="legend-item"><div className="legend-swatch" style={{ background: "#e50914" }} /> Selected</div>
        <div className="legend-item"><div className="legend-swatch" style={{ background: "#d9a441" }} /> Locked</div>
        <div className="legend-item"><div className="legend-swatch" style={{ background: "#555" }} /> Booked</div>
      </div>
    </div>
  );
}
