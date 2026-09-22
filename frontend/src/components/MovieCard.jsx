import { Link } from "react-router-dom";

export default function MovieCard({ movie }) {
  return (
    <Link to={`/movies/${movie._id}`} className="movie-card">
      <img src={movie.posterUrl || "https://via.placeholder.com/300x450?text=No+Poster"} alt={movie.title} />
      <div className="info">
        <h3>{movie.title}</h3>
        <div className="meta">
          {movie.language} · {movie.duration} min · ⭐ {movie.rating || "N/A"}
        </div>
      </div>
    </Link>
  );
}
