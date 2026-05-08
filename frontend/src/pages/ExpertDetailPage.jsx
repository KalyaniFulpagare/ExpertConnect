import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api, getApiError } from "../api/client";
import { Loader } from "../components/Loader";
import { ErrorState } from "../components/ErrorState";
import { SlotGroup } from "../components/SlotGroup";
import { socket } from "../lib/socket";

export function ExpertDetailPage() {
  const { expertId } = useParams();
  const [expert, setExpert] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [liveNotice, setLiveNotice] = useState("");

  const fetchExpert = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await api.get(`/experts/${expertId}`);
      setExpert(response.data.expert);
    } catch (requestError) {
      setError(getApiError(requestError, "We could not load this expert right now."));
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

      setLiveNotice(`Live update: ${timeSlot} on ${date} was just booked.`);
    };

    socket.on("slot:booked", handleSlotBooked);

    return () => {
      socket.emit("leave-expert", expertId);
      socket.off("slot:booked", handleSlotBooked);
    };
  }, [expertId]);

  if (loading) {
    return <Loader label="Loading expert details..." />;
  }

  if (error) {
    return <ErrorState message={error} onAction={fetchExpert} />;
  }

  return (
    <div className="page-stack">
      <section className="detail-hero card">
        <div className="detail-copy">
          <p className="category-chip">{expert.category}</p>
          <h1>{expert.name}</h1>
          <p>{expert.bio}</p>
          <div className="detail-stats">
            <span>{expert.experience}+ years</span>
            <span>{expert.rating.toFixed(1)} rating</span>
            <span>Rs. {expert.pricePerSession} / session</span>
          </div>
          <div className="language-row">
            {expert.languages.map((language) => (
              <span key={language}>{language}</span>
            ))}
          </div>
          <Link className="primary-link" to={`/experts/${expert._id}/book`}>
            Go to booking form
          </Link>
        </div>

        <aside className="live-panel">
          <h2>Availability</h2>
          <p>Slots are updated in real time whenever another user books.</p>
          {liveNotice ? <div className="live-notice">{liveNotice}</div> : null}
        </aside>
      </section>

      <section className="card">
        <div className="section-header">
          <div>
            <p className="eyebrow">Choose a time</p>
            <h2>Available slots by date</h2>
          </div>
        </div>
        <SlotGroup expertId={expert._id} availability={expert.availability} />
      </section>
    </div>
  );
}
