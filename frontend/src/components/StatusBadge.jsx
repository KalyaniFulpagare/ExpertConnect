export function StatusBadge({ status }) {
  const className =
    status === "Confirmed"
      ? "status-badge confirmed"
      : status === "Completed"
        ? "status-badge completed"
        : status === "Cancelled"
          ? "status-badge cancelled"
          : status === "Notified"
            ? "status-badge notified"
            : status === "Converted"
              ? "status-badge converted"
        : "status-badge pending";

  return <span className={className}>{status}</span>;
}
