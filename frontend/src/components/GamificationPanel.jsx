import { useI18n } from "../i18n/I18nContext";

const questLabelById = {
  profile: "completeProfileQuest",
  favorites: "saveExpertsQuest",
  booking: "bookSessionQuest",
  review: "reviewQuest"
};

const badgeLabelById = {
  profile: "completeProfileQuest",
  explorer: "saveExpertsQuest",
  booking: "bookSessionQuest",
  review: "reviewQuest"
};

export function GamificationPanel({ journey }) {
  const { t } = useI18n();

  return (
    <section className="surface-panel progress-panel">
      <div className="section-header">
        <div>
          <p className="eyebrow">{t("journeyTitle")}</p>
          <h2>{t("journeySubtitle")}</h2>
        </div>
      </div>

      <div className="hero-metrics-grid">
        <article className="metric-card">
          <span>{t("level")}</span>
          <strong>{journey.level}</strong>
        </article>
        <article className="metric-card">
          <span>{t("points")}</span>
          <strong>{journey.points}</strong>
        </article>
        <article className="metric-card">
          <span>{t("streak")}</span>
          <strong>{journey.streak}</strong>
        </article>
        <article className="metric-card">
          <span>{t("nextGoal")}</span>
          <strong>{t(questLabelById[journey.nextQuest.id])}</strong>
          <p>
            {journey.nextQuest.progress}/{journey.nextQuest.target}
          </p>
        </article>
      </div>

      <div className="badge-grid">
        {journey.badges.map((badge) => (
          <article
            key={badge.id}
            className={badge.earned ? "badge-card badge-card-earned" : "badge-card"}
          >
            <strong>{t(badgeLabelById[badge.id])}</strong>
            <span>{badge.earned ? "Unlocked" : "Locked"}</span>
          </article>
        ))}
      </div>
    </section>
  );
}
