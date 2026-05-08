import { NavLink, Route, Routes } from "react-router-dom";
import { useAuth } from "./auth/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { useI18n } from "./i18n/I18nContext";
import { AuthPage } from "./pages/AuthPage";
import { BookingPage } from "./pages/BookingPage";
import { ExpertDetailPage } from "./pages/ExpertDetailPage";
import { ExpertsPage } from "./pages/ExpertsPage";
import { FavoritesPage } from "./pages/FavoritesPage";
import { MyBookingsPage } from "./pages/MyBookingsPage";
import { ProfileSetupPage } from "./pages/ProfileSetupPage";

const navClassName = ({ isActive }) => (isActive ? "nav-link active" : "nav-link");

function App() {
  const { currentUser, isAuthenticated, logout } = useAuth();
  const { language, languageOptions, setLanguage, t } = useI18n();
  const isReady = Boolean(isAuthenticated && currentUser?.profileCompleted);

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand-block">
          <p className="eyebrow">{t("expertTagline")}</p>
          <NavLink to="/" className="brand-mark">
            ExpertConnect
          </NavLink>
        </div>

        <nav className="nav">
          {isReady ? (
            <>
              <NavLink to="/" className={navClassName} end>
                {t("experts")}
              </NavLink>
              <NavLink to="/favorites" className={navClassName}>
                {t("saved")}
              </NavLink>
              <NavLink to="/my-bookings" className={navClassName}>
                {t("mySessions")}
              </NavLink>
            </>
          ) : isAuthenticated ? (
            <NavLink to="/profile-setup" className={navClassName}>
              {t("profile")}
            </NavLink>
          ) : (
            <NavLink to="/auth" className={navClassName}>
              {t("login")}
            </NavLink>
          )}
        </nav>

        <div className="topbar-actions">
          <label className="language-picker">
            <span>{t("preferredLanguage")}</span>
            <select value={language} onChange={(event) => setLanguage(event.target.value)}>
              {languageOptions.map((option) => (
                <option key={option.code} value={option.code}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          {isAuthenticated ? (
            <>
              <div className="account-chip">
                <strong>{currentUser.name || currentUser.email}</strong>
                <span>{currentUser.email}</span>
              </div>
              <button type="button" className="secondary-button" onClick={logout}>
                {t("logout")}
              </button>
            </>
          ) : (
            <NavLink to="/auth" className="primary-link">
              {t("signup")}
            </NavLink>
          )}
        </div>
      </header>

      <main className="page-shell">
        <Routes>
          <Route path="/auth" element={<AuthPage />} />
          <Route
            path="/profile-setup"
            element={
              <ProtectedRoute>
                <ProfileSetupPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <ExpertsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/favorites"
            element={
              <ProtectedRoute>
                <FavoritesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/experts/:expertId"
            element={
              <ProtectedRoute>
                <ExpertDetailPage />
              </ProtectedRoute>
            }
          />
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
        </Routes>
      </main>
    </div>
  );
}

export default App;
