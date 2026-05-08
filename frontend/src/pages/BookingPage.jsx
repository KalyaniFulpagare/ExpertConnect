import { useEffect, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { api, getApiError } from "../api/client";
import { useAuth } from "../auth/AuthContext";
import { ErrorState } from "../components/ErrorState";
import { Loader } from "../components/Loader";
import { SlotGroup } from "../components/SlotGroup";
import { socket } from "../lib/socket";

const initialForm = {
  name: "",
  email: "",
  phone: "",
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
  const { currentUser, updateProfile } = useAuth();
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
    if (!currentUser) {
      return;
    }

    setForm((current) => ({
      ...current,
      name: currentUser.name || "",
      email: currentUser.email || "",
      phone: currentUser.phone || ""
    }));
  }, [currentUser]);

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

    if (!emailPattern.test((currentUser?.email || form.email).trim())) {
      return "Please enter a valid email.";
    }

    if (!phonePattern.test(form.phone.trim())) {
      return "Please enter a valid phone number.";
    }

    return "";
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

      await updateProfile({
        name: form.name.trim(),
        phone: form.phone.trim()
      });

      await api.post("/bookings", {
        expertId,
        name: form.name.trim(),
        phone: form.phone.trim(),
        date: selectedSlot.date,
        timeSlot: selectedSlot.timeSlot,
        notes: form.notes.trim()
      });

      setSuccess("Your session is booked. You can track updates from My Sessions.");
      setForm((current) => ({ ...current, notes: "" }));
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
      await updateProfile({
        name: form.name.trim(),
        phone: form.phone.trim()
      });

      await api.post("/bookings/waitlist", {
        expertId,
        name: form.name.trim(),
        date: waitlistSlot.date,
        timeSlot: waitlistSlot.timeSlot,
        notes: form.notes.trim()
      });

      setSuccess(`You are on the waitlist for ${waitlistSlot.date} at ${waitlistSlot.timeSlot}.`);
      setWaitlistSlot(null);
    } catch (requestError) {
      setError(getApiError(requestError, "Waitlist sign-up failed. Please try again."));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <Loader label="Preparing your booking..." />;
  }

  if (error && !expert) {
    return <ErrorState message={error} onAction={fetchExpert} />;
  }

  return (
    <div className="page-stack booking-layout">
      <section className="surface-panel">
        <p className="eyebrow">Book a session</p>
        <h1>Reserve time with {expert.name}</h1>
        <p className="hero-copy">
          Pick an open slot or join the waitlist for a booked one. Your account details stay ready
          for future bookings.
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
              onClick={() => navigate("/my-bookings")}
            >
              Open my sessions
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
              value={currentUser?.email || form.email}
              disabled
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

      <section className="surface-panel">
        <div className="section-header">
          <div>
            <p className="eyebrow">Available time slots</p>
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
