import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api, getApiError } from "../api/client";
import { ErrorState } from "../components/ErrorState";
import { ExpertCard } from "../components/ExpertCard";
import { Loader } from "../components/Loader";
import { ReviewStars } from "../components/ReviewStars";
import { SlotGroup } from "../components/SlotGroup";
import { socket } from "../lib/socket";
import { loadFavorites, pushRecentExpert, toggleFavoriteId } from "../utils/localState";

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

export function ExpertDetailPage() {
  const { expertId } = useParams();
  const [expert, setExpert] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [favoriteIds, setFavoriteIds] = useState(loadFavorites);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [liveNotice, setLiveNotice] = useState("");

  const fetchExpert = async () => {
    try {
      setLoading(true);
      setError("");
      const [expertResponse, recommendationsResponse] = await Promise.all([
        api.get(`/experts/${expertId}`),
        api.get(`/experts/${expertId}/recommendations`)
      ]);
      setExpert(expertResponse.data.expert);
      setRecommendations(recommendationsResponse.data.data);
      pushRecentExpert({
        _id: expertResponse.data.expert._id,
        name: expertResponse.data.expert.name,
        category: expertResponse.data.expert.category
      });
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
      setExpert((current) => applySlotState(current, date, timeSlot, true));
      setLiveNotice(`Live update: ${timeSlot} on ${date} was just booked.`);
    };

    const handleSlotReleased = ({ date, timeSlot }) => {
      setExpert((current) => applySlotState(current, date, timeSlot, false));
      setLiveNotice(`Availability changed: ${timeSlot} on ${date} reopened.`);
    };

    socket.on("slot:booked", handleSlotBooked);
    socket.on("slot:released", handleSlotReleased);

    return () => {
      socket.emit("leave-expert", expertId);
      socket.off("slot:booked", handleSlotBooked);
      socket.off("slot:released", handleSlotReleased);
    };
  }, [expertId]);

  const toggleFavorite = (id) => {
    setFavoriteIds(toggleFavoriteId(id));
  };

  if (loading) {
    return <Loader label="Loading expert command center..." />;
  }

  if (error) {
    return <ErrorState message={error} onAction={fetchExpert} />;
  }

  return (
    <div className="page-stack">
      <section className="atlas-panel detail-hero-panel">
        <div className="detail-copy">
          <p className="category-chip">{expert.category}</p>
          <h1>{expert.name}</h1>
          <p className="expert-headline detail-headline">{expert.headline}</p>
          <p>{expert.bio}</p>
          <div className="detail-stats">
            <span>{expert.experience}+ years</span>
            <span>{expert.company || "Independent expert"}</span>
            <span>{expert.sessionsCompleted}+ sessions</span>
          </div>
          <div className="language-row">
            {expert.languages.map((language) => (
              <span key={language}>{language}</span>
            ))}
            {expert.tags.map((tag) => (
              <span key={tag}>{tag}</span>
            ))}
          </div>
          <div className="detail-action-row">
            <Link className="primary-link" to={`/experts/${expert._id}/book`}>
              Open booking flow
            </Link>
            <button
              type="button"
              className={favoriteIds.includes(expert._id) ? "secondary-button active-soft" : "secondary-button"}
              onClick={() => toggleFavorite(expert._id)}
            >
              {favoriteIds.includes(expert._id) ? "Saved to favorites" : "Save expert"}
            </button>
          </div>
        </div>

        <aside className="atlas-side-panel">
          <div className="metric-card tall">
            <span>Atlas health</span>
            <strong>{expert.rating.toFixed(1)} / 5</strong>
            <p>{expert.reviewCount} verified reviews</p>
          </div>
          <div className="metric-card">
            <span>Session format</span>
            <strong>{expert.sessionFormat}</strong>
          </div>
          <div className="metric-card">
            <span>Response time</span>
            <strong>{expert.responseTime}</strong>
          </div>
          {liveNotice ? <div className="live-notice">{liveNotice}</div> : null}
        </aside>
      </section>

      <section className="atlas-panel">
        <div className="section-header">
          <div>
            <p className="eyebrow">Availability fabric</p>
            <h2>Live slots by date</h2>
          </div>
          <span className="helper-label">Booked slots can be waitlisted from the booking page.</span>
        </div>
        <SlotGroup expertId={expert._id} availability={expert.availability} />
      </section>

      <section className="atlas-split-grid">
        <div className="atlas-panel">
          <div className="section-header">
            <div>
              <p className="eyebrow">Reviews</p>
              <h2>What people say after sessions</h2>
            </div>
          </div>
          <div className="review-list">
            {expert.reviews?.length ? (
              expert.reviews.slice(0, 4).map((review) => (
                <article key={review._id || `${review.email}-${review.createdAt}`} className="review-card">
                  <div className="review-card-top">
                    <strong>{review.name}</strong>
                    <ReviewStars score={review.score} />
                  </div>
                  <p>{review.comment}</p>
                </article>
              ))
            ) : (
              <div className="state-card compact-state">
                <p>No reviews yet. Completed sessions can submit one from Workspace.</p>
              </div>
            )}
          </div>
        </div>

        <div className="atlas-panel">
          <div className="section-header">
            <div>
              <p className="eyebrow">Recommended experts</p>
              <h2>Similar expertise nearby</h2>
            </div>
          </div>
          <div className="recommendation-stack">
            {recommendations.map((item) => (
              <ExpertCard
                key={item._id}
                expert={item}
                isFavorite={favoriteIds.includes(item._id)}
                onToggleFavorite={toggleFavorite}
              />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
