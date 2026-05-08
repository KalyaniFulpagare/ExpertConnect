import { NavLink, Route, Routes } from "react-router-dom";
import { ExpertsPage } from "./pages/ExpertsPage";
import { ExpertDetailPage } from "./pages/ExpertDetailPage";
import { BookingPage } from "./pages/BookingPage";
import { MyBookingsPage } from "./pages/MyBookingsPage";
import { OpsPage } from "./pages/OpsPage";
import { FavoritesPage } from "./pages/FavoritesPage";

const navClassName = ({ isActive }) => (isActive ? "nav-link active" : "nav-link");

function App() {
  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand-block">
          <p className="eyebrow">Atlas-inspired expert cloud</p>
          <NavLink to="/" className="brand-mark">
            ExpertConnect Atlas
          </NavLink>
        </div>
        <nav className="nav">
          <NavLink to="/" className={navClassName} end>
            Directory
          </NavLink>
          <NavLink to="/favorites" className={navClassName}>
            Favorites
          </NavLink>
          <NavLink to="/my-bookings" className={navClassName}>
            Workspace
          </NavLink>
          <NavLink to="/ops" className={navClassName}>
            Control Center
          </NavLink>
        </nav>
      </header>

      <main className="page-shell">
        <Routes>
          <Route path="/" element={<ExpertsPage />} />
          <Route path="/favorites" element={<FavoritesPage />} />
          <Route path="/experts/:expertId" element={<ExpertDetailPage />} />
          <Route path="/experts/:expertId/book" element={<BookingPage />} />
          <Route path="/my-bookings" element={<MyBookingsPage />} />
          <Route path="/ops" element={<OpsPage />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
