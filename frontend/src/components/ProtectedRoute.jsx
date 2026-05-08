import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { Loader } from "./Loader";

export function ProtectedRoute({ children }) {
  const location = useLocation();
  const { currentUser, isAuthenticated, loading } = useAuth();

  if (loading) {
    return <Loader label="Checking your session..." />;
  }

  if (!isAuthenticated) {
    const redirectTo = `${location.pathname}${location.search}`;
    return <Navigate to="/auth" replace state={{ from: redirectTo }} />;
  }

  if (!currentUser?.profileCompleted && location.pathname !== "/profile-setup") {
    return <Navigate to="/profile-setup" replace />;
  }

  return children;
}
