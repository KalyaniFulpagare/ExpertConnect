import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { api, getApiError } from "../api/client";
import { ErrorState } from "../components/ErrorState";
import { Loader } from "../components/Loader";
import { ReviewStars } from "../components/ReviewStars";
import { SlotGroup } from "../components/SlotGroup";
import { StatusBadge } from "../components/StatusBadge";
import { socket } from "../lib/socket";

const initialReviewDraft = { score: 5, comment: "", submitting: false, success: "" };

export function MyBookingsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [email, setEmail] = useState(searchParams.get("email") || "");
  const [activeEmail, setActiveEmail] = useState(searchParams.get("email") || "");
  const [bookings, setBookings] = useState([]);
  const [waitlistEntries, setWaitlistEntries] = useState([]);
  const [reviewDrafts, setReviewDrafts] = useState({});
  const [rescheduleState, setRescheduleState] = useState({});
  const [activeTab, setActiveTab] = useState("bookings");
  const [loading, setLoading] = useState(Boolean(searchParams.get("email")));
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");

  const fetchWorkspaceData = async (targetEmail) => {
    if (!targetEmail) {
      setBookings([]);
      setWaitlistEntries([]);
      return;
    }

    try {
      setLoading(true);
      setError("");
      const [bookingsResponse, waitlistResponse] = await Promise.all([
        api.get("/bookings", { params: { email: targetEmail } }),
        api.get("/bookings/waitlist", { params: { email: targetEmail } })
      ]);
      setBookings(bookingsResponse.data.data);
      setWaitlistEntries(waitlistResponse.data.data);
      setActiveEmail(targetEmail);
    } catch (requestError) {
      setError(getApiError(requestError, "We could not load your workspace for this email."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const initialEmail = searchParams.get("email") || "";
    if (initialEmail) {
      fetchWorkspaceData(initialEmail);
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
      setToast(`New booking created for ${booking.expertName}.`);
    };

    const handleStatusUpdated = ({ booking }) => {
      setBookings((current) => current.map((item) => (item.id === booking.id ? booking : item)));
      setToast(`Booking updated: ${booking.expertName} is now ${booking.status}.`);
    };

    const handleWaitlistOpened = ({ waitlistEntry }) => {
      setWaitlistEntries((current) =>
        current.map((item) => (item.id === waitlistEntry.id ? waitlistEntry : item))
      );
      setToast(`Waitlist alert: ${waitlistEntry.timeSlot} on ${waitlistEntry.date} reopened.`);
    };

    socket.on("booking:created", handleBookingCreated);
    socket.on("booking:status-updated", handleStatusUpdated);
    socket.on("waitlist:slot-opened", handleWaitlistOpened);

    return () => {
      socket.emit("leave-bookings", roomEmail);
      socket.off("booking:created", handleBookingCreated);
      socket.off("booking:status-updated", handleStatusUpdated);
      socket.off("waitlist:slot-opened", handleWaitlistOpened);
    };
  }, [activeEmail]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    const targetEmail = email.trim().toLowerCase();
    setSearchParams(targetEmail ? { email: targetEmail } : {});
    await fetchWorkspaceData(targetEmail);
  };

  const cancelBooking = async (bookingId) => {
    try {
      await api.patch(`/bookings/${bookingId}/cancel`, { reason: "Cancelled by user" });
      await fetchWorkspaceData(activeEmail);
    } catch (requestError) {
      setError(getApiError(requestError, "Cancellation failed."));
    }
  };

  const startReschedule = async (booking) => {
    try {
      setRescheduleState((current) => ({
        ...current,
        [booking.id]: {
          loading: true,
          selected: { date: "", timeSlot: "" },
          availability: []
        }
      }));

      const response = await api.get(`/experts/${booking.expertId}`);
      setRescheduleState((current) => ({
        ...current,
        [booking.id]: {
          loading: false,
          selected: { date: "", timeSlot: "" },
          availability: response.data.expert.availability
        }
      }));
    } catch (requestError) {
      setError(getApiError(requestError, "We could not load slots for rescheduling."));
    }
  };

  const submitReschedule = async (bookingId) => {
    const target = rescheduleState[bookingId];

    if (!target?.selected?.date || !target?.selected?.timeSlot) {
      setError("Select a new slot before rescheduling.");
      return;
    }

    try {
      await api.patch(`/bookings/${bookingId}/reschedule`, target.selected);
      setRescheduleState((current) => {
        const next = { ...current };
        delete next[bookingId];
        return next;
      });
      await fetchWorkspaceData(activeEmail);
    } catch (requestError) {
      setError(getApiError(requestError, "Reschedule failed."));
    }
  };

  const submitReview = async (booking) => {
    const draft = reviewDrafts[booking.id] || initialReviewDraft;

    if (draft.comment.trim().length < 10) {
      setError("Review comment must be at least 10 characters long.");
      return;
    }

    try {
      setReviewDrafts((current) => ({
        ...current,
        [booking.id]: { ...draft, submitting: true, success: "" }
      }));

      await api.post(`/experts/${booking.expertId}/reviews`, {
        name: booking.name,
        email: booking.email,
        score: Number(draft.score),
        comment: draft.comment
      });

      setReviewDrafts((current) => ({
        ...current,
        [booking.id]: { ...initialReviewDraft, success: "Review submitted." }
      }));
    } catch (requestError) {
      setError(getApiError(requestError, "Review submission failed."));
      setReviewDrafts((current) => ({
        ...current,
        [booking.id]: { ...draft, submitting: false }
      }));
    }
  };

  return (
    <div className="page-stack">
      <section className="atlas-panel">
        <p className="eyebrow">Workspace</p>
        <h1>Manage bookings, waitlist, and session follow-up</h1>
        <form className="email-form" onSubmit={handleSubmit}>
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="Enter the email used while booking"
          />
          <button type="submit" className="primary-button">
            Load workspace
          </button>
        </form>
        {toast ? <div className="inline-alert success">{toast}</div> : null}
      </section>

      <div className="tab-row">
        <button
          type="button"
          className={activeTab === "bookings" ? "tab-button active" : "tab-button"}
          onClick={() => setActiveTab("bookings")}
        >
          Bookings
        </button>
        <button
          type="button"
          className={activeTab === "waitlist" ? "tab-button active" : "tab-button"}
          onClick={() => setActiveTab("waitlist")}
        >
          Waitlist
        </button>
      </div>

      {loading ? <Loader label="Loading workspace..." /> : null}
      {!loading && error ? <ErrorState message={error} onAction={() => fetchWorkspaceData(activeEmail || email)} /> : null}

      {!loading && !error && activeTab === "bookings" ? (
        <section className="bookings-list">
          {bookings.map((booking) => {
            const draft = reviewDrafts[booking.id] || initialReviewDraft;
            const reschedule = rescheduleState[booking.id];

            return (
              <article key={booking.id} className="booking-card atlas-booking-card">
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
                  {booking.previousSlot?.date ? (
                    <span>
                      Previously {booking.previousSlot.date} at {booking.previousSlot.timeSlot}
                    </span>
                  ) : null}
                </div>

                {booking.status !== "Cancelled" && booking.status !== "Completed" ? (
                  <div className="button-row">
                    <button
                      type="button"
                      className="secondary-button"
                      onClick={() => startReschedule(booking)}
                    >
                      Reschedule
                    </button>
                    <button
                      type="button"
                      className="secondary-button danger"
                      onClick={() => cancelBooking(booking.id)}
                    >
                      Cancel booking
                    </button>
                  </div>
                ) : null}

                {reschedule ? (
                  <div className="subpanel">
                    <div className="section-header">
                      <div>
                        <p className="eyebrow">Reschedule flow</p>
                        <h3>Choose a new open slot</h3>
                      </div>
                    </div>
                    {reschedule.loading ? (
                      <Loader label="Loading reschedule slots..." />
                    ) : (
                      <>
                        <SlotGroup
                          expertId={booking.expertId}
                          availability={reschedule.availability}
                          bookingMode
                          selected={reschedule.selected}
                          onSelect={(slot) =>
                            setRescheduleState((current) => ({
                              ...current,
                              [booking.id]: {
                                ...current[booking.id],
                                selected: slot
                              }
                            }))
                          }
                        />
                        <div className="button-row">
                          <button
                            type="button"
                            className="primary-button"
                            onClick={() => submitReschedule(booking.id)}
                          >
                            Confirm reschedule
                          </button>
                          <button
                            type="button"
                            className="secondary-button"
                            onClick={() =>
                              setRescheduleState((current) => {
                                const next = { ...current };
                                delete next[booking.id];
                                return next;
                              })
                            }
                          >
                            Close
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ) : null}

                {booking.status === "Completed" ? (
                  <div className="subpanel">
                    <div className="section-header">
                      <div>
                        <p className="eyebrow">Post-session review</p>
                        <h3>Share outcome quality</h3>
                      </div>
                    </div>
                    <div className="review-form">
                      <label className="field-block">
                        <span>Score</span>
                        <select
                          value={draft.score}
                          onChange={(event) =>
                            setReviewDrafts((current) => ({
                              ...current,
                              [booking.id]: {
                                ...draft,
                                score: Number(event.target.value)
                              }
                            }))
                          }
                        >
                          <option value="5">5</option>
                          <option value="4">4</option>
                          <option value="3">3</option>
                          <option value="2">2</option>
                          <option value="1">1</option>
                        </select>
                      </label>
                      <ReviewStars score={Number(draft.score)} />
                      <label className="field-block full-width">
                        <span>Comment</span>
                        <textarea
                          rows="3"
                          value={draft.comment}
                          onChange={(event) =>
                            setReviewDrafts((current) => ({
                              ...current,
                              [booking.id]: {
                                ...draft,
                                comment: event.target.value,
                                success: ""
                              }
                            }))
                          }
                          placeholder="What was most valuable about the session?"
                        />
                      </label>
                      <div className="button-row">
                        <button
                          type="button"
                          className="primary-button"
                          disabled={draft.submitting}
                          onClick={() => submitReview(booking)}
                        >
                          {draft.submitting ? "Submitting..." : "Submit review"}
                        </button>
                        {draft.success ? <span className="helper-label">{draft.success}</span> : null}
                      </div>
                    </div>
                  </div>
                ) : null}
              </article>
            );
          })}

          {!bookings.length ? (
            <div className="state-card">
              <h3>No bookings yet.</h3>
              <p>Search using the same email you used when booking.</p>
            </div>
          ) : null}
        </section>
      ) : null}

      {!loading && !error && activeTab === "waitlist" ? (
        <section className="bookings-list">
          {waitlistEntries.map((entry) => (
            <article key={entry.id} className="booking-card">
              <div className="booking-card-top">
                <div>
                  <h2>{entry.expertName}</h2>
                  <p>
                    {entry.date} at {entry.timeSlot}
                  </p>
                </div>
                <StatusBadge status={entry.status} />
              </div>
              <p className="booking-notes">{entry.notes || "No extra waitlist note added."}</p>
            </article>
          ))}

          {!waitlistEntries.length ? (
            <div className="state-card">
              <h3>No waitlist entries yet.</h3>
              <p>Join a booked slot waitlist from the booking page to get notified when it opens.</p>
            </div>
          ) : null}
        </section>
      ) : null}
    </div>
  );
}
