import { Link } from "react-router-dom";

export function ExpertCard({ expert, isFavorite, onToggleFavorite }) {
  return (
    <article className="expert-card">
      <div className="expert-card-top">
        <div>
          <p className="category-chip">{expert.category}</p>
          <h2>{expert.name}</h2>
          <p className="expert-headline">{expert.headline}</p>
        </div>
        <button
          type="button"
          className={isFavorite ? "favorite-button active" : "favorite-button"}
          onClick={() => onToggleFavorite(expert._id)}
          aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
        >
          {isFavorite ? "Saved" : "Save"}
        </button>
      </div>

      <div className="expert-signal-row">
        <span>{expert.rating.toFixed(1)} rating</span>
        <span>{expert.experience}+ yrs</span>
        <span>{expert.reviewCount || 0} reviews</span>
      </div>

      <p className="expert-copy">{expert.bio}</p>

      <div className="tag-row">
        {(expert.tags || []).slice(0, 3).map((tag) => (
          <span key={tag}>{tag}</span>
        ))}
      </div>

      <div className="expert-footer">
        <div className="expert-footer-copy">
          <strong>Rs. {expert.pricePerSession}</strong>
          <span>{expert.nextAvailable}</span>
        </div>
        <Link className="primary-link" to={`/experts/${expert._id}`}>
          View profile
        </Link>
      </div>
    </article>
  );
}
