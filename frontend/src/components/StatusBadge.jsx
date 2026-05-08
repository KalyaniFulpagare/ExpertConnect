export function StatusBadge({ status }) {
  const className =
    status === "Confirmed"
      ? "status-badge confirmed"
      : status === "Completed"
        ? "status-badge completed"
        : "status-badge pending";

  return <span className={className}>{status}</span>;
}
