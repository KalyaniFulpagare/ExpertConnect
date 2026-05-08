import { Link } from "react-router-dom";

export function SlotGroup({ expertId, availability, bookingMode = false, selected, onSelect }) {
  return (
    <div className="slot-groups">
      {availability.map((entry) => (
        <section key={entry.date} className="slot-day">
          <div className="slot-day-header">
            <h3>{entry.date}</h3>
            <span>{entry.slots.filter((slot) => !slot.isBooked).length} open</span>
          </div>

          <div className="slot-grid">
            {entry.slots.map((slot) => {
              const isSelected =
                selected?.date === entry.date && selected?.timeSlot === slot.time;

              if (bookingMode) {
                return (
                  <button
                    key={`${entry.date}-${slot.time}`}
                    type="button"
                    className={
                      slot.isBooked
                        ? "slot-pill booked"
                        : isSelected
                          ? "slot-pill selected"
                          : "slot-pill"
                    }
                    disabled={slot.isBooked}
                    onClick={() => onSelect?.({ date: entry.date, timeSlot: slot.time })}
                  >
                    {slot.time}
                  </button>
                );
              }

              return slot.isBooked ? (
                <button
                  key={`${entry.date}-${slot.time}`}
                  type="button"
                  className="slot-pill booked"
                  disabled
                >
                  {slot.time}
                </button>
              ) : (
                <Link
                  key={`${entry.date}-${slot.time}`}
                  className="slot-pill action"
                  to={`/experts/${expertId}/book?date=${encodeURIComponent(
                    entry.date
                  )}&time=${encodeURIComponent(slot.time)}`}
                >
                  {slot.time}
                </Link>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
