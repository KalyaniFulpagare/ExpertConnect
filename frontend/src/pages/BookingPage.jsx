import { useEffect, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { api, getApiError } from "../api/client";
import { ErrorState } from "../components/ErrorState";
import { Loader } from "../components/Loader";
import { SlotGroup } from "../components/SlotGroup";
import { socket } from "../lib/socket";
import { loadBookingProfile, saveBookingProfile } from "../utils/localState";

const baseProfile = loadBookingProfile();
const initialForm = {
  name: baseProfile.name,
  email: baseProfile.email,
  phone: baseProfile.phone,
  notes: ""
};

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phonePattern = /^[0-9+\-\s()]{7,20}$/;

const applySlotState = (current, date, timeSlot, isBooked) => {
  if (!current) {
    return current;
  }

  return {
    ...current,
    availability: current.availability.map((entry) =>
      entry.date !== date
        ? entry
        : {
            ...entry,
            slots: entry.slots.map((slot) =>
              slot.time === timeSlot ? { ...slot, isBooked } : slot
            )
          }
    )
  };
};

export function BookingPage() {
  const { expertId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [expert, setExpert] = useState(null);
  const [form, setForm] = useState(initialForm);
  const [selectedSlot, setSelectedSlot] = useState({
    date: searchParams.get("date") || "",
    timeSlot: searchParams.get("time") || ""
  });
  const [waitlistSlot, setWaitlistSlot] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [lastBookedEmail, setLastBookedEmail] = useState(searchParams.get("email") || baseProfile.email || "");

  const fetchExpert = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await api.get(`/experts/${expertId}`);
      setExpert(response.data.expert);
    } catch (requestError) {
      setError(getApiError(requestError, "We could not load the booking screen."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpert();
  }, [expertId]);

  useEffect(() => {
    socket.emit("join-expert", expertId);

    const handleSlotBooked = ({ date, timeSlot }) => {
      setExpert((current) => applySlotState(current, date, timeSlot, true));
      setSelectedSlot((current) =>
        current.date === date && current.timeSlot === timeSlot ? { date: "", timeSlot: "" } : current
      );
    };

    const handleSlotReleased = ({ date, timeSlot }) => {
      setExpert((current) => applySlotState(current, date, timeSlot, false));
    };

    socket.on("slot:booked", handleSlotBooked);
    socket.on("slot:released", handleSlotReleased);

    return () => {
      socket.emit("leave-expert", expertId);
      socket.off("slot:booked", handleSlotBooked);
      socket.off("slot:released", handleSlotReleased);
    };
  }, [expertId]);

  const validateForm = () => {
    if (form.name.trim().length < 2) {
      return "Please enter a valid name.";
    }

    if (!emailPattern.test(form.email.trim())) {
      return "Please enter a valid email.";
    }

    if (!phonePattern.test(form.phone.trim())) {
      return "Please enter a valid phone number.";
    }

    return "";
  };

  const persistProfile = () => {
    saveBookingProfile({
      name: form.name.trim(),
      email: form.email.trim().toLowerCase(),
      phone: form.phone.trim()
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSuccess("");
    const validationError = validateForm();

    if (validationError) {
      setError(validationError);
      return;
    }

    if (!selectedSlot.date || !selectedSlot.timeSlot) {
      setError("Please choose an available date and time slot.");
      return;
    }

    try {
      setSubmitting(true);
      setError("");

      await api.post("/bookings", {
        expertId,
        ...form,
        date: selectedSlot.date,
        timeSlot: selectedSlot.timeSlot
      });

      persistProfile();
      setLastBookedEmail(form.email.trim().toLowerCase());
      setSuccess("Your session is booked. Workspace now tracks reschedules, cancellations, and reviews.");
      setForm((current) => ({ ...initialForm, email: current.email, name: current.name, phone: current.phone }));
      setSelectedSlot({ date: "", timeSlot: "" });
      setWaitlistSlot(null);
      await fetchExpert();
    } catch (requestError) {
      setError(getApiError(requestError, "Booking failed. Please try again."));
    } finally {
      setSubmitting(false);
    }
  };

  const handleJoinWaitlist = async () => {
    const validationError = validateForm();

    if (validationError) {
      setError(validationError);
      return;
    }

    if (!waitlistSlot) {
      setError("Choose a booked slot before joining the waitlist.");
      return;
    }

    try {
      setSubmitting(true);
      setError("");
      await api.post("/bookings/waitlist", {
        expertId,
        name: form.name,
        email: form.email,
        date: waitlistSlot.date,
        timeSlot: waitlistSlot.timeSlot,
        notes: form.notes
      });

      persistProfile();
      setSuccess(`You are on the waitlist for ${waitlistSlot.date} at ${waitlistSlot.timeSlot}.`);
      setWaitlistSlot(null);
    } catch (requestError) {
      setError(getApiError(requestError, "Waitlist sign-up failed. Please try again."));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <Loader label="Preparing booking workspace..." />;
  }

  if (error && !expert) {
    return <ErrorState message={error} onAction={fetchExpert} />;
  }

  return (
    <div className="page-stack booking-layout">
      <section className="atlas-panel">
        <p className="eyebrow">Booking workspace</p>
        <h1>Reserve time with {expert.name}</h1>
        <p className="hero-copy">
          Atlas-style workflow: choose an open slot or join the waitlist for a booked one without
          losing your profile details.
        </p>

        <div className="booking-context-grid">
          <div className="metric-card">
            <span>Category</span>
            <strong>{expert.category}</strong>
          </div>
          <div className="metric-card">
            <span>Response time</span>
            <strong>{expert.responseTime}</strong>
          </div>
          <div className="metric-card">
            <span>Session price</span>
            <strong>Rs. {expert.pricePerSession}</strong>
          </div>
        </div>

        {error ? <div className="inline-alert error">{error}</div> : null}
        {success ? (
          <div className="inline-alert success">
            {success}{" "}
            <button
              type="button"
              className="text-button"
              onClick={() => navigate(`/my-bookings?email=${encodeURIComponent(lastBookedEmail)}`)}
            >
              Open workspace
            </button>
          </div>
        ) : null}

        <form className="booking-form" onSubmit={handleSubmit}>
          <label className="field-block">
            <span>Name</span>
            <input
              type="text"
              value={form.name}
              onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
              placeholder="Your full name"
            />
          </label>

          <label className="field-block">
            <span>Email</span>
            <input
              type="email"
              value={form.email}
              onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
              placeholder="you@example.com"
            />
          </label>

          <label className="field-block">
            <span>Phone</span>
            <input
              type="tel"
              value={form.phone}
              onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))}
              placeholder="+91 98765 43210"
            />
          </label>

          <div className="field-block">
            <span>Selected open slot</span>
            <input
              type="text"
              value={
                selectedSlot.date && selectedSlot.timeSlot
                  ? `${selectedSlot.date} at ${selectedSlot.timeSlot}`
                  : "Select an open slot below"
              }
              disabled
            />
          </div>

          <div className="field-block">
            <span>Selected waitlist slot</span>
            <input
              type="text"
              value={
                waitlistSlot
                  ? `${waitlistSlot.date} at ${waitlistSlot.timeSlot}`
                  : "Click a booked slot to waitlist"
              }
              disabled
            />
          </div>

          <label className="field-block full-width">
            <span>Notes</span>
            <textarea
              rows="4"
              value={form.notes}
              onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))}
              placeholder="Goals, context, or reschedule constraints"
            />
          </label>

          <div className="button-row full-width">
            <button type="submit" className="primary-button" disabled={submitting}>
              {submitting ? "Working..." : "Confirm booking"}
            </button>
            <button
              type="button"
              className="secondary-button"
              disabled={submitting}
              onClick={handleJoinWaitlist}
            >
              Join waitlist
            </button>
            <Link className="secondary-link" to={`/experts/${expertId}`}>
              Back to expert
            </Link>
          </div>
        </form>
      </section>

      <section className="atlas-panel">
        <div className="section-header">
          <div>
            <p className="eyebrow">Live slot fabric</p>
            <h2>Book open slots or waitlist booked ones</h2>
          </div>
        </div>
        <SlotGroup
          expertId={expertId}
          availability={expert.availability}
          bookingMode
          selected={selectedSlot}
          onSelect={(slot) => {
            setSelectedSlot(slot);
            setWaitlistSlot(null);
          }}
          allowBookedSelection
          onBookedSelect={(slot) => {
            setWaitlistSlot(slot);
            setSelectedSlot({ date: "", timeSlot: "" });
          }}
        />
      </section>
    </div>
  );
}
