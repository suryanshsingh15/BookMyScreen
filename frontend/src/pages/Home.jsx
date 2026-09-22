import { useEffect, useState } from "react";
import api from "../services/api";
import MovieCard from "../components/MovieCard";

export default function Home() {
  const [movies, setMovies] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMovies = async () => {
      setLoading(true);
      try {
        const { data } = await api.get("/movies", { params: search ? { search } : {} });
        setMovies(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    const debounce = setTimeout(fetchMovies, 300);
    return () => clearTimeout(debounce);
  }, [search]);

  return (
    <div className="container">
      <div style={{ padding: "24px 0 0" }}>
        <input
          placeholder="Search movies..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            width: "100%",
            padding: "12px",
            borderRadius: "6px",
            border: "1px solid #333",
            background: "#1f1f1f",
            color: "#fff",
          }}
        />
      </div>

      {loading ? (
        <p className="center-msg">Loading movies...</p>
      ) : movies.length === 0 ? (
        <p className="center-msg">No movies found. Try running the seed script.</p>
      ) : (
        <div className="movie-grid">
          {movies.map((movie) => (
            <MovieCard key={movie._id} movie={movie} />
          ))}
        </div>
      )}
    </div>
  );
}
