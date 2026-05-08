export function ReviewStars({ score }) {
  return (
    <span className="review-stars" aria-label={`${score} out of 5`}>
      {"★".repeat(score)}
      <span className="review-stars-muted">{"★".repeat(5 - score)}</span>
    </span>
  );
}
