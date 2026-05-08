export function ErrorState({ message, actionLabel = "Try again", onAction }) {
  return (
    <div className="state-card error">
      <h3>Something needs attention</h3>
      <p>{message}</p>
      {onAction ? (
        <button type="button" className="secondary-button" onClick={onAction}>
          {actionLabel}
        </button>
      ) : null}
    </div>
  );
}
