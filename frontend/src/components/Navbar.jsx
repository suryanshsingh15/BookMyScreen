import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <nav className="navbar">
      <Link to="/" className="brand">BookMyScreen</Link>
      <div className="links">
        <Link to="/">Movies</Link>
        {user && <Link to="/my-bookings">My Bookings</Link>}
        {user?.role === "admin" && <Link to="/admin">Admin</Link>}
        {user ? (
          <>
            <span style={{ color: "#9a9a9a", fontSize: "0.9rem" }}>Hi, {user.name}</span>
            <button onClick={handleLogout}>Logout</button>
          </>
        ) : (
          <>
            <Link to="/login">Login</Link>
            <Link to="/register">Register</Link>
          </>
        )}
      </div>
    </nav>
  );
}
