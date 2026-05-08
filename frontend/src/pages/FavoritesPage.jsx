import { useEffect, useState } from "react";
import { api, getApiError } from "../api/client";
import { ExpertCard } from "../components/ExpertCard";
import { ErrorState } from "../components/ErrorState";
import { Loader } from "../components/Loader";
import { loadFavorites, toggleFavoriteId } from "../utils/localState";

export function FavoritesPage() {
  const [experts, setExperts] = useState([]);
  const [favoriteIds, setFavoriteIds] = useState(loadFavorites);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchFavorites = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await api.get("/experts", { params: { limit: 24 } });
      const filtered = response.data.data.filter((expert) => favoriteIds.includes(expert._id));
      setExperts(filtered);
    } catch (requestError) {
      setError(getApiError(requestError, "We could not load favorite experts."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFavorites();
  }, [favoriteIds]);

  const toggleFavorite = (expertId) => {
    setFavoriteIds(toggleFavoriteId(expertId));
    setExperts((current) => current.filter((expert) => expert._id !== expertId));
  };

  if (loading) {
    return <Loader label="Loading favorites..." />;
  }

  if (error) {
    return <ErrorState message={error} onAction={fetchFavorites} />;
  }

  return (
    <div className="page-stack">
      <section className="atlas-panel atlas-header-panel">
        <div>
          <p className="eyebrow">Saved experts</p>
          <h1>Your short list</h1>
          <p className="hero-copy">
            Keep the strongest experts close, compare availability, and jump back into booking
            without repeating the search flow.
          </p>
        </div>
      </section>

      <section className="expert-grid">
        {experts.map((expert) => (
          <ExpertCard
            key={expert._id}
            expert={expert}
            isFavorite={favoriteIds.includes(expert._id)}
            onToggleFavorite={toggleFavorite}
          />
        ))}
      </section>

      {!experts.length ? (
        <div className="state-card">
          <h3>No favorites yet.</h3>
          <p>Save experts from the directory to build a shortlist.</p>
        </div>
      ) : null}
    </div>
  );
}
