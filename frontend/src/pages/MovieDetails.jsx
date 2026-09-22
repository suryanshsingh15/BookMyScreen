import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../services/api";

// LEVEL: BASIC/INTERMEDIATE → shows the movie + all its showtimes, grouped by theatre.
export default function MovieDetails() {
  const { id } = useParams();
  const [movie, setMovie] = useState(null);
  const [shows, setShows] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [movieRes, showsRes] = await Promise.all([
          api.get(`/movies/${id}`),
          api.get("/shows", { params: { movie: id } }),
        ]);
        setMovie(movieRes.data);
        setShows(showsRes.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  if (loading) return <p className="center-msg">Loading...</p>;
  if (!movie) return <p className="center-msg">Movie not found.</p>;

  // Group shows by theatre so the UI reads like: Theatre Name -> [7:30PM] [9:00PM] ...
  const groupedByTheatre = shows.reduce((acc, show) => {
    const key = show.theatre?._id || "unknown";
    if (!acc[key]) acc[key] = { theatre: show.theatre, shows: [] };
    acc[key].shows.push(show);
    return acc;
  }, {});

  return (
    <div className="container">
      <div className="movie-header">
        <img src={movie.posterUrl || "https://via.placeholder.com/220x330"} alt={movie.title} />
        <div className="details">
          <h1>{movie.title}</h1>
          <p style={{ color: "#9a9a9a" }}>
            {movie.language} · {movie.duration} min · ⭐ {movie.rating || "N/A"}
          </p>
          <p>{movie.description}</p>
          <p style={{ color: "#9a9a9a" }}>Genres: {movie.genre?.join(", ")}</p>
        </div>
      </div>

      <h2>Showtimes</h2>
      {Object.keys(groupedByTheatre).length === 0 && (
        <p className="center-msg">No shows scheduled for this movie yet.</p>
      )}
      {Object.values(groupedByTheatre).map(({ theatre, shows: theatreShows }) => (
        <div className="theatre-block" key={theatre?._id}>
          <h3>{theatre?.name} — {theatre?.city}</h3>
          <p style={{ color: "#9a9a9a", fontSize: "0.85rem", marginTop: -6 }}>{theatre?.address}</p>
          <div>
            {theatreShows.map((show) => (
              <button
                key={show._id}
                className="show-time-btn"
                onClick={() => navigate(`/shows/${show._id}/seats`)}
              >
                {new Date(show.startTime).toLocaleString([], {
                  weekday: "short",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
