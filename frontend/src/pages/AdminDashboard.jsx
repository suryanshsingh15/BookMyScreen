import { useEffect, useState } from "react";
import api from "../services/api";

// LEVEL: INTERMEDIATE/ADVANCED → admin-only CRUD screens, gated by ProtectedRoute
// (requireAdmin) in App.jsx and by the `admin` middleware on the backend.
export default function AdminDashboard() {
  const [movies, setMovies] = useState([]);
  const [theatres, setTheatres] = useState([]);
  const [shows, setShows] = useState([]);
  const [message, setMessage] = useState("");

  const [movieForm, setMovieForm] = useState({
    title: "", description: "", language: "English", genre: "", duration: "", posterUrl: "", releaseDate: "",
  });

  const [theatreForm, setTheatreForm] = useState({ name: "", city: "", address: "" });

  const [showForm, setShowForm] = useState({
    movie: "", theatre: "", screenName: "Screen 1", startTime: "", basePrice: 150,
  });

  const refreshAll = async () => {
    const [m, t, s] = await Promise.all([
      api.get("/movies"),
      api.get("/theatres"),
      api.get("/shows"),
    ]);
    setMovies(m.data);
    setTheatres(t.data);
    setShows(s.data);
  };

  useEffect(() => { refreshAll(); }, []);

  const notify = (msg) => {
    setMessage(msg);
    setTimeout(() => setMessage(""), 3000);
  };

  const handleCreateMovie = async (e) => {
    e.preventDefault();
    try {
      await api.post("/movies", {
        ...movieForm,
        genre: movieForm.genre.split(",").map((g) => g.trim()).filter(Boolean),
        duration: Number(movieForm.duration),
      });
      setMovieForm({ title: "", description: "", language: "English", genre: "", duration: "", posterUrl: "", releaseDate: "" });
      notify("Movie created");
      refreshAll();
    } catch (err) {
      notify(err.response?.data?.message || "Failed to create movie");
    }
  };

  const handleCreateTheatre = async (e) => {
    e.preventDefault();
    try {
      // Default single screen with a standard 3-tier layout — enough to demo.
      await api.post("/theatres", {
        ...theatreForm,
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
      setTheatreForm({ name: "", city: "", address: "" });
      notify("Theatre created (with default Screen 1 layout)");
      refreshAll();
    } catch (err) {
      notify(err.response?.data?.message || "Failed to create theatre");
    }
  };

  const handleCreateShow = async (e) => {
    e.preventDefault();
    try {
      await api.post("/shows", { ...showForm, basePrice: Number(showForm.basePrice) });
      setShowForm({ movie: "", theatre: "", screenName: "Screen 1", startTime: "", basePrice: 150 });
      notify("Show created");
      refreshAll();
    } catch (err) {
      notify(err.response?.data?.message || "Failed to create show");
    }
  };

  const handleDeleteMovie = async (id) => {
    await api.delete(`/movies/${id}`);
    refreshAll();
  };

  const handleDeleteShow = async (id) => {
    await api.delete(`/shows/${id}`);
    refreshAll();
  };

  return (
    <div className="container">
      <h2>Admin Dashboard</h2>
      {message && <p style={{ color: "#4ade80" }}>{message}</p>}

      {/* ---- Movies ---- */}
      <div className="admin-section">
        <h2>Movies</h2>
        <form onSubmit={handleCreateMovie}>
          <div className="form-group"><label>Title</label>
            <input value={movieForm.title} onChange={(e) => setMovieForm({ ...movieForm, title: e.target.value })} required />
          </div>
          <div className="form-group"><label>Description</label>
            <textarea value={movieForm.description} onChange={(e) => setMovieForm({ ...movieForm, description: e.target.value })} required />
          </div>
          <div className="form-group"><label>Language</label>
            <input value={movieForm.language} onChange={(e) => setMovieForm({ ...movieForm, language: e.target.value })} required />
          </div>
          <div className="form-group"><label>Genre (comma separated)</label>
            <input value={movieForm.genre} onChange={(e) => setMovieForm({ ...movieForm, genre: e.target.value })} />
          </div>
          <div className="form-group"><label>Duration (minutes)</label>
            <input type="number" value={movieForm.duration} onChange={(e) => setMovieForm({ ...movieForm, duration: e.target.value })} required />
          </div>
          <div className="form-group"><label>Poster URL</label>
            <input value={movieForm.posterUrl} onChange={(e) => setMovieForm({ ...movieForm, posterUrl: e.target.value })} />
          </div>
          <div className="form-group"><label>Release Date</label>
            <input type="date" value={movieForm.releaseDate} onChange={(e) => setMovieForm({ ...movieForm, releaseDate: e.target.value })} required />
          </div>
          <button className="btn" type="submit">Add Movie</button>
        </form>
        <table>
          <thead><tr><th>Title</th><th>Language</th><th>Duration</th><th></th></tr></thead>
          <tbody>
            {movies.map((m) => (
              <tr key={m._id}>
                <td>{m.title}</td><td>{m.language}</td><td>{m.duration} min</td>
                <td><button onClick={() => handleDeleteMovie(m._id)}>Remove</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ---- Theatres ---- */}
      <div className="admin-section">
        <h2>Theatres</h2>
        <form onSubmit={handleCreateTheatre}>
          <div className="form-group"><label>Name</label>
            <input value={theatreForm.name} onChange={(e) => setTheatreForm({ ...theatreForm, name: e.target.value })} required />
          </div>
          <div className="form-group"><label>City</label>
            <input value={theatreForm.city} onChange={(e) => setTheatreForm({ ...theatreForm, city: e.target.value })} required />
          </div>
          <div className="form-group"><label>Address</label>
            <input value={theatreForm.address} onChange={(e) => setTheatreForm({ ...theatreForm, address: e.target.value })} required />
          </div>
          <button className="btn" type="submit">Add Theatre</button>
        </form>
        <table>
          <thead><tr><th>Name</th><th>City</th><th>Screens</th></tr></thead>
          <tbody>
            {theatres.map((t) => (
              <tr key={t._id}><td>{t.name}</td><td>{t.city}</td><td>{t.screens.length}</td></tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ---- Shows ---- */}
      <div className="admin-section">
        <h2>Shows</h2>
        <form onSubmit={handleCreateShow}>
          <div className="form-group"><label>Movie</label>
            <select value={showForm.movie} onChange={(e) => setShowForm({ ...showForm, movie: e.target.value })} required>
              <option value="">Select movie</option>
              {movies.map((m) => <option key={m._id} value={m._id}>{m.title}</option>)}
            </select>
          </div>
          <div className="form-group"><label>Theatre</label>
            <select value={showForm.theatre} onChange={(e) => setShowForm({ ...showForm, theatre: e.target.value })} required>
              <option value="">Select theatre</option>
              {theatres.map((t) => <option key={t._id} value={t._id}>{t.name} ({t.city})</option>)}
            </select>
          </div>
          <div className="form-group"><label>Screen Name</label>
            <input value={showForm.screenName} onChange={(e) => setShowForm({ ...showForm, screenName: e.target.value })} required />
          </div>
          <div className="form-group"><label>Start Time</label>
            <input type="datetime-local" value={showForm.startTime} onChange={(e) => setShowForm({ ...showForm, startTime: e.target.value })} required />
          </div>
          <div className="form-group"><label>Base Price (₹)</label>
            <input type="number" value={showForm.basePrice} onChange={(e) => setShowForm({ ...showForm, basePrice: e.target.value })} required />
          </div>
          <button className="btn" type="submit">Add Show</button>
        </form>
        <table>
          <thead><tr><th>Movie</th><th>Theatre</th><th>Time</th><th></th></tr></thead>
          <tbody>
            {shows.map((s) => (
              <tr key={s._id}>
                <td>{s.movie?.title}</td>
                <td>{s.theatre?.name}</td>
                <td>{new Date(s.startTime).toLocaleString()}</td>
                <td><button onClick={() => handleDeleteShow(s._id)}>Remove</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
