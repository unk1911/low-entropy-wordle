import { useRef } from 'react';
import { getDateString } from '../utils/gameLogic';

const MIN_DATE = '2026-02-24';

export default function DateSelector({ selectedDate, onDateChange }) {
  const today = getDateString();
  const dateInputRef = useRef(null);

  const canGoBack = selectedDate > MIN_DATE;
  const canGoForward = selectedDate < today;

  function shiftDate(days) {
    const d = new Date(selectedDate + 'T12:00:00');
    d.setDate(d.getDate() + days);
    const newDate = d.toISOString().slice(0, 10);
    if (newDate >= MIN_DATE && newDate <= today) {
      onDateChange(newDate);
    }
  }

  function handleDateClick() {
    dateInputRef.current?.showPicker?.();
    dateInputRef.current?.click();
  }

  function handleDateInput(e) {
    const val = e.target.value;
    if (val >= MIN_DATE && val <= today) {
      onDateChange(val);
    }
  }

  return (
    <div className="date-selector">
      <button
        className="date-arrow"
        onClick={() => shiftDate(-1)}
        disabled={!canGoBack}
        tabIndex={-1}
        aria-label="Previous day"
      >
        ‹
      </button>

      <span className="date-display" onClick={handleDateClick}>
        {selectedDate}
        <input
          ref={dateInputRef}
          type="date"
          className="date-picker-hidden"
          value={selectedDate}
          min={MIN_DATE}
          max={today}
          onChange={handleDateInput}
          tabIndex={-1}
        />
      </span>

      <button
        className="date-arrow"
        onClick={() => shiftDate(1)}
        disabled={!canGoForward}
        tabIndex={-1}
        aria-label="Next day"
      >
        ›
      </button>
    </div>
  );
}
