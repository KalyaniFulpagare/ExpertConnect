import { useEffect, useState } from "react";
import { api, getApiError } from "../api/client";
import { Loader } from "../components/Loader";
import { ErrorState } from "../components/ErrorState";
import { StatusBadge } from "../components/StatusBadge";

const statusOptions = ["Pending", "Confirmed", "Completed"];

export function OpsPage() {
  const [bookings, setBookings] = useState([]);
  const [overview, setOverview] = useState(null);
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchOpsData = async () => {
    try {
      setLoading(true);
      setError("");
      const [bookingsResponse, overviewResponse] = await Promise.all([
        api.get("/bookings/manage/all", { params: statusFilter ? { status: statusFilter } : {} }),
        api.get("/bookings/overview/stats")
      ]);
      setBookings(bookingsResponse.data.data);
      setOverview(overviewResponse.data);
    } catch (requestError) {
      setError(getApiError(requestError, "We could not load booking operations data."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOpsData();
  }, [statusFilter]);

  const updateStatus = async (bookingId, status) => {
    try {
      await api.patch(`/bookings/${bookingId}/status`, { status });
      setBookings((current) =>
        current.map((booking) => (booking.id === bookingId ? { ...booking, status } : booking))
      );
      setOverview((current) => current);
      await fetchOpsData();
    } catch (requestError) {
      setError(getApiError(requestError, "Status update failed."));
    }
  };

  if (loading) {
    return <Loader label="Loading ops view..." />;
  }

  if (error) {
    return <ErrorState message={error} onAction={fetchOpsData} />;
  }

  return (
    <div className="page-stack">
      <section className="card">
        <div className="section-header">
          <div>
            <p className="eyebrow">Extra functionality</p>
            <h1>Ops view for booking status management</h1>
          </div>
          <label className="field-block compact">
            <span>Status filter</span>
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
              <option value="">All</option>
              {statusOptions.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="overview-grid">
          <article className="overview-card">
            <span>Total bookings</span>
            <strong>{overview.totalBookings}</strong>
          </article>
          {overview.statusCounts.map((item) => (
            <article key={item._id} className="overview-card">
              <span>{item._id}</span>
              <strong>{item.count}</strong>
            </article>
          ))}
        </div>
      </section>

      <section className="bookings-list">
        {bookings.map((booking) => (
          <article key={booking.id} className="booking-card">
            <div className="booking-card-top">
              <div>
                <h2>{booking.expertName}</h2>
                <p>
                  {booking.name} • {booking.date} • {booking.timeSlot}
                </p>
              </div>
              <StatusBadge status={booking.status} />
            </div>
            <div className="status-action-row">
              {statusOptions.map((status) => (
                <button
                  key={status}
                  type="button"
                  className={status === booking.status ? "chip-button active" : "chip-button"}
                  onClick={() => updateStatus(booking.id, status)}
                >
                  {status}
                </button>
              ))}
            </div>
          </article>
        ))}

        {!bookings.length ? (
          <div className="state-card">
            <h3>No bookings match this filter.</h3>
            <p>Try another status or create a new booking from the expert list.</p>
          </div>
        ) : null}
      </section>
    </div>
  );
}
