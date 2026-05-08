import { useEffect, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { api, getApiError } from "../api/client";
import { Loader } from "../components/Loader";
import { ErrorState } from "../components/ErrorState";
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
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [lastBookedEmail, setLastBookedEmail] = useState(searchParams.get("email") || "");

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
      setExpert((current) => {
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
                    slot.time === timeSlot ? { ...slot, isBooked: true } : slot
                  )
                }
          )
        };
      });

      setSelectedSlot((current) =>
        current.date === date && current.timeSlot === timeSlot ? { date: "", timeSlot: "" } : current
      );
    };

    socket.on("slot:booked", handleSlotBooked);

    return () => {
      socket.emit("leave-expert", expertId);
      socket.off("slot:booked", handleSlotBooked);
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

    if (!selectedSlot.date || !selectedSlot.timeSlot) {
      return "Please choose a date and time slot.";
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

    try {
      setSubmitting(true);
      setError("");

      await api.post("/bookings", {
        expertId,
        ...form,
        date: selectedSlot.date,
        timeSlot: selectedSlot.timeSlot
      });

      setLastBookedEmail(form.email.trim().toLowerCase());
      setSuccess("Your session is booked. You can track it from My Bookings.");
      setForm((current) => ({ ...initialForm, email: current.email }));
      setSelectedSlot({ date: "", timeSlot: "" });
      await fetchExpert();
    } catch (requestError) {
      setError(getApiError(requestError, "Booking failed. Please try again."));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <Loader label="Preparing booking form..." />;
  }

  if (error && !expert) {
    return <ErrorState message={error} onAction={fetchExpert} />;
  }

  return (
    <div className="page-stack booking-layout">
      <section className="card">
        <p className="eyebrow">Booking screen</p>
        <h1>Book a session with {expert.name}</h1>
        <p>{expert.category}</p>
        {error ? <div className="inline-alert error">{error}</div> : null}
        {success ? (
          <div className="inline-alert success">
            {success}{" "}
            <button
              type="button"
              className="text-button"
              onClick={() => navigate(`/my-bookings?email=${encodeURIComponent(lastBookedEmail)}`)}
            >
              View my bookings
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
            <span>Date</span>
            <input type="text" value={selectedSlot.date || "Select a slot below"} disabled />
          </div>

          <div className="field-block">
            <span>Time slot</span>
            <input type="text" value={selectedSlot.timeSlot || "Select a slot below"} disabled />
          </div>

          <label className="field-block full-width">
            <span>Notes</span>
            <textarea
              rows="4"
              value={form.notes}
              onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))}
              placeholder="Share your goals for the session"
            />
          </label>

          <button type="submit" className="primary-button" disabled={submitting}>
            {submitting ? "Booking..." : "Confirm booking"}
          </button>
          <Link className="secondary-link" to={`/experts/${expertId}`}>
            Back to expert
          </Link>
        </form>
      </section>

      <section className="card">
        <div className="section-header">
          <div>
            <p className="eyebrow">Live slot picker</p>
            <h2>Choose an available slot</h2>
          </div>
        </div>
        <SlotGroup
          expertId={expertId}
          availability={expert.availability}
          bookingMode
          selected={selectedSlot}
          onSelect={setSelectedSlot}
        />
      </section>
    </div>
  );
}
