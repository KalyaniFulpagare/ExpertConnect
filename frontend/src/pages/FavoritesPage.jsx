import { useEffect, useState } from "react";
import { api, getApiError } from "../api/client";
import { ExpertCard } from "../components/ExpertCard";
import { ErrorState } from "../components/ErrorState";
import { Loader } from "../components/Loader";
import { useI18n } from "../i18n/I18nContext";
import { loadFavorites, toggleFavoriteId } from "../utils/localState";

export function FavoritesPage() {
  const { t } = useI18n();
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
      <section className="surface-panel header-panel">
        <div>
          <p className="eyebrow">{t("saved")}</p>
          <h1>{t("savedTitle")}</h1>
          <p className="hero-copy">{t("savedSubtitle")}</p>
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
          <h3>{t("noFavoritesTitle")}</h3>
          <p>{t("noFavoritesSubtitle")}</p>
        </div>
      ) : null}
    </div>
  );
}
