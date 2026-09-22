import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

// LEVEL: INTERMEDIATE
// Wrap any <Route element={...}> that requires login (or admin role) with this.
// requireAdmin=true additionally checks role, e.g. for the /admin dashboard.
export default function ProtectedRoute({ children, requireAdmin = false }) {
  const { user, loading } = useAuth();

  if (loading) return <div className="center-msg">Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (requireAdmin && user.role !== "admin") return <Navigate to="/" replace />;

  return children;
}
