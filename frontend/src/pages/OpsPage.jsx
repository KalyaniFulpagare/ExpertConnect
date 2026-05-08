import { useEffect, useState } from "react";
import { api, getApiError } from "../api/client";
import { ErrorState } from "../components/ErrorState";
import { Loader } from "../components/Loader";
import { StatusBadge } from "../components/StatusBadge";

const statusOptions = ["Pending", "Confirmed", "Completed", "Cancelled"];
const emptyExpertForm = {
  name: "",
  category: "",
  headline: "",
  company: "",
  bio: "",
  experience: 5,
  rating: 4.8,
  pricePerSession: 2500,
  languagesText: "English, Hindi",
  tagsText: "Mentoring, Strategy",
  featured: false,
  sessionFormat: "1:1 expert session",
  responseTime: "Replies within 12 hours",
  sessionsCompleted: 50,
  availabilityText:
    '[{"date":"2026-05-15","slots":["10:00 AM","01:00 PM"]},{"date":"2026-05-16","slots":["11:00 AM","04:00 PM"]}]'
};

const parseExpertPayload = (form) => ({
  name: form.name.trim(),
  category: form.category.trim(),
  headline: form.headline.trim(),
  company: form.company.trim(),
  bio: form.bio.trim(),
  experience: Number(form.experience),
  rating: Number(form.rating),
  pricePerSession: Number(form.pricePerSession),
  languages: form.languagesText.split(",").map((item) => item.trim()).filter(Boolean),
  tags: form.tagsText.split(",").map((item) => item.trim()).filter(Boolean),
  featured: Boolean(form.featured),
  sessionFormat: form.sessionFormat.trim(),
  responseTime: form.responseTime.trim(),
  sessionsCompleted: Number(form.sessionsCompleted),
  availability: JSON.parse(form.availabilityText)
});

export function OpsPage() {
  const [bookings, setBookings] = useState([]);
  const [experts, setExperts] = useState([]);
  const [overview, setOverview] = useState(null);
  const [statusFilter, setStatusFilter] = useState("");
  const [expertForm, setExpertForm] = useState(emptyExpertForm);
  const [editingExpertId, setEditingExpertId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchOpsData = async () => {
    try {
      setLoading(true);
      setError("");
      const [bookingsResponse, overviewResponse, expertsResponse] = await Promise.all([
        api.get("/bookings/manage/all", { params: statusFilter ? { status: statusFilter } : {} }),
        api.get("/bookings/overview/stats"),
        api.get("/experts", { params: { limit: 24, sortBy: "newest" } })
      ]);
      setBookings(bookingsResponse.data.data);
      setOverview(overviewResponse.data);
      setExperts(expertsResponse.data.data);
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
      await fetchOpsData();
    } catch (requestError) {
      setError(getApiError(requestError, "Status update failed."));
    }
  };

  const startEdit = (expert) => {
    setEditingExpertId(expert._id);
    setExpertForm({
      name: expert.name,
      category: expert.category,
      headline: expert.headline || "",
      company: expert.company || "",
      bio: expert.bio,
      experience: expert.experience,
      rating: expert.rating,
      pricePerSession: expert.pricePerSession,
      languagesText: (expert.languages || []).join(", "),
      tagsText: (expert.tags || []).join(", "),
      featured: expert.featured,
      sessionFormat: expert.sessionFormat || "",
      responseTime: expert.responseTime || "",
      sessionsCompleted: expert.sessionsCompleted || 0,
      availabilityText: JSON.stringify(expert.availability || [])
    });
  };

  const saveExpert = async (event) => {
    event.preventDefault();

    try {
      const payload = parseExpertPayload(expertForm);

      if (editingExpertId) {
        await api.patch(`/experts/${editingExpertId}`, payload);
      } else {
        await api.post("/experts", payload);
      }

      setExpertForm(emptyExpertForm);
      setEditingExpertId("");
      await fetchOpsData();
    } catch (requestError) {
      setError(getApiError(requestError, "Expert save failed. Check availability JSON formatting."));
    }
  };

  if (loading) {
    return <Loader label="Loading control center..." />;
  }

  if (error) {
    return <ErrorState message={error} onAction={fetchOpsData} />;
  }

  return (
    <div className="page-stack">
      <section className="atlas-panel">
        <div className="section-header">
          <div>
            <p className="eyebrow">Control center</p>
            <h1>Ops dashboard for experts, demand, and booking state</h1>
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

        <div className="hero-metrics-grid">
          <article className="metric-card">
            <span>Total bookings</span>
            <strong>{overview.totalBookings}</strong>
          </article>
          <article className="metric-card">
            <span>Waitlist</span>
            <strong>{overview.waitlistCount}</strong>
          </article>
          <article className="metric-card">
            <span>Experts</span>
            <strong>{experts.length}</strong>
          </article>
          {overview.statusCounts.map((item) => (
            <article key={item._id} className="metric-card">
              <span>{item._id}</span>
              <strong>{item.count}</strong>
            </article>
          ))}
        </div>
      </section>

      <section className="atlas-split-grid ops-grid">
        <section className="atlas-panel">
          <div className="section-header">
            <div>
              <p className="eyebrow">Expert admin</p>
              <h2>{editingExpertId ? "Edit expert" : "Create expert"}</h2>
            </div>
          </div>
          <form className="booking-form" onSubmit={saveExpert}>
            <label className="field-block">
              <span>Name</span>
              <input value={expertForm.name} onChange={(event) => setExpertForm((current) => ({ ...current, name: event.target.value }))} />
            </label>
            <label className="field-block">
              <span>Category</span>
              <input value={expertForm.category} onChange={(event) => setExpertForm((current) => ({ ...current, category: event.target.value }))} />
            </label>
            <label className="field-block">
              <span>Headline</span>
              <input value={expertForm.headline} onChange={(event) => setExpertForm((current) => ({ ...current, headline: event.target.value }))} />
            </label>
            <label className="field-block">
              <span>Company</span>
              <input value={expertForm.company} onChange={(event) => setExpertForm((current) => ({ ...current, company: event.target.value }))} />
            </label>
            <label className="field-block">
              <span>Experience</span>
              <input type="number" value={expertForm.experience} onChange={(event) => setExpertForm((current) => ({ ...current, experience: event.target.value }))} />
            </label>
            <label className="field-block">
              <span>Rating</span>
              <input type="number" step="0.1" value={expertForm.rating} onChange={(event) => setExpertForm((current) => ({ ...current, rating: event.target.value }))} />
            </label>
            <label className="field-block">
              <span>Price</span>
              <input type="number" value={expertForm.pricePerSession} onChange={(event) => setExpertForm((current) => ({ ...current, pricePerSession: event.target.value }))} />
            </label>
            <label className="field-block">
              <span>Sessions completed</span>
              <input type="number" value={expertForm.sessionsCompleted} onChange={(event) => setExpertForm((current) => ({ ...current, sessionsCompleted: event.target.value }))} />
            </label>
            <label className="field-block full-width">
              <span>Bio</span>
              <textarea rows="3" value={expertForm.bio} onChange={(event) => setExpertForm((current) => ({ ...current, bio: event.target.value }))} />
            </label>
            <label className="field-block">
              <span>Languages</span>
              <input value={expertForm.languagesText} onChange={(event) => setExpertForm((current) => ({ ...current, languagesText: event.target.value }))} />
            </label>
            <label className="field-block">
              <span>Tags</span>
              <input value={expertForm.tagsText} onChange={(event) => setExpertForm((current) => ({ ...current, tagsText: event.target.value }))} />
            </label>
            <label className="field-block">
              <span>Session format</span>
              <input value={expertForm.sessionFormat} onChange={(event) => setExpertForm((current) => ({ ...current, sessionFormat: event.target.value }))} />
            </label>
            <label className="field-block">
              <span>Response time</span>
              <input value={expertForm.responseTime} onChange={(event) => setExpertForm((current) => ({ ...current, responseTime: event.target.value }))} />
            </label>
            <label className="field-block full-width">
              <span>Availability JSON</span>
              <textarea rows="4" value={expertForm.availabilityText} onChange={(event) => setExpertForm((current) => ({ ...current, availabilityText: event.target.value }))} />
            </label>
            <label className="toggle-row full-width">
              <input type="checkbox" checked={expertForm.featured} onChange={(event) => setExpertForm((current) => ({ ...current, featured: event.target.checked }))} />
              <span>Featured expert</span>
            </label>
            <div className="button-row full-width">
              <button type="submit" className="primary-button">
                {editingExpertId ? "Update expert" : "Create expert"}
              </button>
              <button
                type="button"
                className="secondary-button"
                onClick={() => {
                  setExpertForm(emptyExpertForm);
                  setEditingExpertId("");
                }}
              >
                Reset form
              </button>
            </div>
          </form>
        </section>

        <section className="atlas-panel">
          <div className="section-header">
            <div>
              <p className="eyebrow">Live operations</p>
              <h2>Bookings and expert inventory</h2>
            </div>
          </div>
          <div className="ops-list">
            {experts.map((expert) => (
              <article key={expert._id} className="mini-card">
                <div className="booking-card-top">
                  <div>
                    <strong>{expert.name}</strong>
                    <p>{expert.category}</p>
                  </div>
                  <button type="button" className="secondary-button" onClick={() => startEdit(expert)}>
                    Edit
                  </button>
                </div>
              </article>
            ))}
          </div>

          <div className="ops-list">
            {bookings.map((booking) => (
              <article key={booking.id} className="booking-card">
                <div className="booking-card-top">
                  <div>
                    <h2>{booking.expertName}</h2>
                    <p>
                      {booking.name} | {booking.date} | {booking.timeSlot}
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
          </div>
        </section>
      </section>
    </div>
  );
}
