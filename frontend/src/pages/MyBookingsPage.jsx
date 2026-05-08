import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { api, getApiError } from "../api/client";
import { Loader } from "../components/Loader";
import { ErrorState } from "../components/ErrorState";
import { StatusBadge } from "../components/StatusBadge";
import { socket } from "../lib/socket";

export function MyBookingsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [email, setEmail] = useState(searchParams.get("email") || "");
  const [activeEmail, setActiveEmail] = useState(searchParams.get("email") || "");
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(Boolean(searchParams.get("email")));
  const [error, setError] = useState("");

  const fetchBookings = async (targetEmail) => {
    if (!targetEmail) {
      setBookings([]);
      return;
    }

    try {
      setLoading(true);
      setError("");
      const response = await api.get("/bookings", { params: { email: targetEmail } });
      setBookings(response.data.data);
      setActiveEmail(targetEmail);
    } catch (requestError) {
      setError(getApiError(requestError, "We could not fetch bookings for this email."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const initialEmail = searchParams.get("email") || "";
    if (initialEmail) {
      fetchBookings(initialEmail);
    }
  }, []);

  useEffect(() => {
    if (!activeEmail) {
      return undefined;
    }

    const roomEmail = activeEmail.trim().toLowerCase();
    socket.emit("join-bookings", roomEmail);

    const handleBookingCreated = ({ booking }) => {
      setBookings((current) => [booking, ...current]);
    };

    const handleStatusUpdated = ({ booking }) => {
      setBookings((current) => current.map((item) => (item.id === booking.id ? booking : item)));
    };

    socket.on("booking:created", handleBookingCreated);
    socket.on("booking:status-updated", handleStatusUpdated);

    return () => {
      socket.emit("leave-bookings", roomEmail);
      socket.off("booking:created", handleBookingCreated);
      socket.off("booking:status-updated", handleStatusUpdated);
    };
  }, [activeEmail]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    const targetEmail = email.trim().toLowerCase();
    setSearchParams(targetEmail ? { email: targetEmail } : {});
    await fetchBookings(targetEmail);
  };

  return (
    <div className="page-stack">
      <section className="card">
        <p className="eyebrow">My bookings</p>
        <h1>Track your sessions by email</h1>
        <form className="email-form" onSubmit={handleSubmit}>
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="Enter the email used while booking"
          />
          <button type="submit" className="primary-button">
            Find bookings
          </button>
        </form>
      </section>

      {loading ? <Loader label="Loading your bookings..." /> : null}
      {!loading && error ? <ErrorState message={error} onAction={() => fetchBookings(email)} /> : null}

      {!loading && !error ? (
        <section className="bookings-list">
          {bookings.map((booking) => (
            <article key={booking.id} className="booking-card">
              <div className="booking-card-top">
                <div>
                  <h2>{booking.expertName}</h2>
                  <p>
                    {booking.date} at {booking.timeSlot}
                  </p>
                </div>
                <StatusBadge status={booking.status} />
              </div>
              <p className="booking-notes">{booking.notes || "No additional notes shared."}</p>
              <div className="booking-meta">
                <span>{booking.email}</span>
                <span>{booking.phone}</span>
              </div>
            </article>
          ))}

          {!bookings.length ? (
            <div className="state-card">
              <h3>No bookings yet.</h3>
              <p>Search with the same email you used during booking.</p>
            </div>
          ) : null}
        </section>
      ) : null}
    </div>
  );
}
