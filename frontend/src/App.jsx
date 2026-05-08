import { NavLink, Route, Routes } from "react-router-dom";
import { ExpertsPage } from "./pages/ExpertsPage";
import { ExpertDetailPage } from "./pages/ExpertDetailPage";
import { BookingPage } from "./pages/BookingPage";
import { MyBookingsPage } from "./pages/MyBookingsPage";
import { OpsPage } from "./pages/OpsPage";

const navClassName = ({ isActive }) => (isActive ? "nav-link active" : "nav-link");

function App() {
  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand-block">
          <p className="eyebrow">Real-time scheduling</p>
          <NavLink to="/" className="brand-mark">
            Expert Session Booking
          </NavLink>
        </div>
        <nav className="nav">
          <NavLink to="/" className={navClassName} end>
            Experts
          </NavLink>
          <NavLink to="/my-bookings" className={navClassName}>
            My Bookings
          </NavLink>
          <NavLink to="/ops" className={navClassName}>
            Ops View
          </NavLink>
        </nav>
      </header>

      <main className="page-shell">
        <Routes>
          <Route path="/" element={<ExpertsPage />} />
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
