import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { createBooking, getBookingAvailability } from "../../../api/bookingApi";
import { getResources } from "../../../api/resourceApi";

const weekdayLabels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const pad2 = (value) => String(value).padStart(2, "0");

const toDateKey = (date) =>
  `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;

const toTimeKey = (time) => (time && time.length >= 5 ? time.slice(0, 5) : "");

const parseServerError = (err, fallback) => {
  const details = err?.response?.data?.details;
  if (Array.isArray(details) && details.length > 0) {
    return details[0];
  }
  return err?.response?.data?.message ?? fallback;
};

const monthLabel = (date) =>
  date.toLocaleString(undefined, { month: "long", year: "numeric" });

const buildCalendarDays = (monthDate) => {
  const firstDayOfMonth = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
  const weekDayIndex = (firstDayOfMonth.getDay() + 6) % 7;
  const gridStart = new Date(firstDayOfMonth);
  gridStart.setDate(firstDayOfMonth.getDate() - weekDayIndex);

  return Array.from({ length: 42 }, (_, index) => {
    const day = new Date(gridStart);
    day.setDate(gridStart.getDate() + index);
    return day;
  });
};

const CreateBookingPage = () => {
  const navigate = useNavigate();
  const [resources, setResources] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [availabilityLoading, setAvailabilityLoading] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(
    () => new Date(new Date().getFullYear(), new Date().getMonth(), 1),
  );
  const [availabilityByDate, setAvailabilityByDate] = useState({});
  const [form, setForm] = useState({
    resourceId: "",
    title: "",
    purpose: "",
    date: "",
    startTime: "",
    endTime: "",
  });

  const todayKey = toDateKey(new Date());
  const calendarDays = useMemo(() => buildCalendarDays(calendarMonth), [calendarMonth]);
  const selectedDay = form.date ? availabilityByDate[form.date] : null;

  useEffect(() => {
    const fetchResources = async () => {
      try {
        const data = await getResources();
        setResources(data);
        if (data.length > 0) {
          setForm((prev) => ({
            ...prev,
            resourceId: prev.resourceId || data[0].id,
          }));
        }
      } catch {
        setError("Could not load resources for booking.");
      }
    };

    fetchResources();
  }, []);

  useEffect(() => {
    if (!form.resourceId) {
      setAvailabilityByDate({});
      return;
    }

    const fetchAvailability = async () => {
      setAvailabilityLoading(true);
      try {
        const from = toDateKey(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), 1));
        const to = toDateKey(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 0));
        const data = await getBookingAvailability(form.resourceId, from, to);

        const next = {};
        data.days.forEach((day) => {
          next[day.date] = day;
        });

        setAvailabilityByDate(next);

        setForm((prev) => {
          if (prev.date && next[prev.date]?.availableSlotCount > 0) {
            return prev;
          }

          const firstAvailableDay = data.days.find((day) => day.availableSlotCount > 0);
          if (!firstAvailableDay) {
            return { ...prev, date: "", startTime: "", endTime: "" };
          }

          return {
            ...prev,
            date: firstAvailableDay.date,
            startTime: "",
            endTime: "",
          };
        });
      } catch (err) {
        setError(parseServerError(err, "Failed to load availability calendar"));
      } finally {
        setAvailabilityLoading(false);
      }
    };

    fetchAvailability();
  }, [form.resourceId, calendarMonth]);

  const onDateSelect = (dateKey) => {
    setError("");
    setForm((prev) => ({
      ...prev,
      date: dateKey,
      startTime: "",
      endTime: "",
    }));
  };

  const onSlotSelect = (dateKey, slot) => {
    setError("");
    setForm((prev) => ({
      ...prev,
      date: dateKey,
      startTime: toTimeKey(slot.startTime),
      endTime: toTimeKey(slot.endTime),
    }));
  };

  const onSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (!form.date || !form.startTime || !form.endTime) {
      setError("Please select an available date and time slot from the calendar.");
      return;
    }

    setLoading(true);
    try {
      const created = await createBooking({
        ...form,
        title: form.title.trim(),
        purpose: form.purpose.trim() || null,
      });
      navigate(`/bookings/${created.id}`);
    } catch (err) {
      setError(parseServerError(err, "Failed to create booking"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="grid booking-create-layout">
      <div className="card">
        <div className="spread">
          <h2>Schedule Booking</h2>
          <div className="row">
            <button
              className="btn btn-light"
              type="button"
              onClick={() => setCalendarMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))}
            >
              Previous
            </button>
            <strong>{monthLabel(calendarMonth)}</strong>
            <button
              className="btn btn-light"
              type="button"
              onClick={() => setCalendarMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))}
            >
              Next
            </button>
          </div>
        </div>

        <div className="form-field" style={{ marginTop: 10 }}>
          <label htmlFor="resourceId">Resource</label>
          <select
            id="resourceId"
            className="input"
            value={form.resourceId}
            onChange={(e) =>
              setForm((prev) => ({
                ...prev,
                resourceId: e.target.value,
                date: "",
                startTime: "",
                endTime: "",
              }))
            }
            required
          >
            {resources.map((resource) => (
              <option key={resource.id} value={resource.id}>
                {resource.name} - {resource.location}
              </option>
            ))}
          </select>
        </div>

        <div className="calendar-weekdays">
          {weekdayLabels.map((label) => (
            <div key={label}>{label}</div>
          ))}
        </div>

        <div className="calendar-grid">
          {calendarDays.map((day) => {
            const dateKey = toDateKey(day);
            const dayAvailability = availabilityByDate[dateKey];
            const isCurrentMonth = day.getMonth() === calendarMonth.getMonth();
            const isPast = dateKey < todayKey;
            const isSelected = form.date === dateKey;
            const isSelectable = isCurrentMonth && !isPast && dayAvailability?.availableSlotCount > 0;

            return (
              <button
                key={dateKey}
                type="button"
                className={`calendar-cell${isCurrentMonth ? "" : " is-muted"}${isSelected ? " is-selected" : ""}`}
                disabled={!isSelectable}
                onClick={() => onDateSelect(dateKey)}
              >
                <span className="calendar-day-number">{day.getDate()}</span>
                <span className="calendar-day-meta">
                  {availabilityLoading && isCurrentMonth && !isPast && "..."}
                  {!availabilityLoading && isCurrentMonth && !isPast && dayAvailability && (
                    dayAvailability.availableSlotCount > 0
                      ? `${dayAvailability.availableSlotCount} slots`
                      : "Full"
                  )}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="card">
        <h3>Available Time Slots</h3>
        {!form.date && <p>Select a date from the calendar to view available times.</p>}

        {form.date && (
          <>
            <p className="muted">
              Date: <strong>{form.date}</strong>
            </p>
            <div className="slot-list">
              {(selectedDay?.availableSlots ?? []).map((slot) => {
                const start = toTimeKey(slot.startTime);
                const end = toTimeKey(slot.endTime);
                const active = form.startTime === start && form.endTime === end;

                return (
                  <button
                    key={`${start}-${end}`}
                    type="button"
                    className={`slot-btn${active ? " is-active" : ""}`}
                    onClick={() => onSlotSelect(form.date, slot)}
                  >
                    {start} - {end}
                  </button>
                );
              })}
              {selectedDay && selectedDay.availableSlots.length === 0 && (
                <p>No available slots on this date.</p>
              )}
            </div>
          </>
        )}

        <hr />

        {error && <div className="alert alert-error">{error}</div>}

        <form className="grid" onSubmit={onSubmit}>
          <div className="form-field">
            <label htmlFor="title">Title</label>
            <input
              id="title"
              className="input"
              value={form.title}
              onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
              required
            />
          </div>

          <div className="form-field">
            <label htmlFor="purpose">Purpose</label>
            <textarea
              id="purpose"
              className="input"
              value={form.purpose}
              onChange={(e) => setForm((prev) => ({ ...prev, purpose: e.target.value }))}
              rows={3}
            />
          </div>

          <div className="grid grid-2">
            <div className="form-field">
              <label>Date</label>
              <input className="input" value={form.date} readOnly placeholder="Select from calendar" />
            </div>
            <div className="form-field">
              <label>Time Slot</label>
              <input
                className="input"
                value={form.startTime && form.endTime ? `${form.startTime} - ${form.endTime}` : ""}
                readOnly
                placeholder="Select available slot"
              />
            </div>
          </div>

          <button className="btn btn-primary" type="submit" disabled={loading || availabilityLoading || !resources.length}>
            {loading ? "Creating..." : "Create Booking"}
          </button>
        </form>
      </div>
    </section>
  );
};

export default CreateBookingPage;
