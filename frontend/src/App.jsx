import { NavLink, Route, Routes } from "react-router-dom";
import { useAuth } from "./auth/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { AuthPage } from "./pages/AuthPage";
import { ExpertsPage } from "./pages/ExpertsPage";
import { ExpertDetailPage } from "./pages/ExpertDetailPage";
import { BookingPage } from "./pages/BookingPage";
import { MyBookingsPage } from "./pages/MyBookingsPage";
import { OpsPage } from "./pages/OpsPage";
import { FavoritesPage } from "./pages/FavoritesPage";

const navClassName = ({ isActive }) => (isActive ? "nav-link active" : "nav-link");

function App() {
  const { currentUser, isAuthenticated, logout } = useAuth();

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand-block">
          <p className="eyebrow">Expert session booking</p>
          <NavLink to="/" className="brand-mark">
            ExpertConnect
          </NavLink>
        </div>
        <nav className="nav">
          <NavLink to="/" className={navClassName} end>
            Experts
          </NavLink>
          {isAuthenticated ? (
            <>
              <NavLink to="/favorites" className={navClassName}>
                Saved
              </NavLink>
              <NavLink to="/my-bookings" className={navClassName}>
                My Sessions
              </NavLink>
              <NavLink to="/ops" className={navClassName}>
                Admin
              </NavLink>
            </>
          ) : (
            <NavLink to="/auth" className={navClassName}>
              Login
            </NavLink>
          )}
        </nav>
        <div className="topbar-actions">
          {isAuthenticated ? (
            <>
              <div className="account-chip">
                <strong>{currentUser.name}</strong>
                <span>{currentUser.email}</span>
              </div>
              <button type="button" className="secondary-button" onClick={logout}>
                Logout
              </button>
            </>
          ) : (
            <NavLink to="/auth" className="primary-link">
              Sign up
            </NavLink>
          )}
        </div>
      </header>

      <main className="page-shell">
        <Routes>
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/" element={<ExpertsPage />} />
          <Route
            path="/favorites"
            element={
              <ProtectedRoute>
                <FavoritesPage />
              </ProtectedRoute>
            }
          />
          <Route path="/experts/:expertId" element={<ExpertDetailPage />} />
          <Route
            path="/experts/:expertId/book"
            element={
              <ProtectedRoute>
                <BookingPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/my-bookings"
            element={
              <ProtectedRoute>
                <MyBookingsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/ops"
            element={
              <ProtectedRoute>
                <OpsPage />
              </ProtectedRoute>
            }
          />
        </Routes>
      </main>
    </div>
  );
}

export default App;
