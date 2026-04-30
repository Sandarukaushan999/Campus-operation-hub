import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { createBooking, getBookingAvailability } from "../../../api/bookingApi";
import CustomSelect from "../../../components/common/CustomSelect";
import { getResources } from "../../../api/resourceApi";

const weekdayLabels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const slotStartHour = 8;
const slotEndHour = 20;
const slotMinutes = 60;
const availabilityPollMs = 2000;

const pad2 = (value) => String(value).padStart(2, "0");

const toDateKey = (date) =>
  `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;

const toTimeKey = (time) => (time && time.length >= 5 ? time.slice(0, 5) : "");

const slotKey = (startTime, endTime) => `${toTimeKey(startTime)}-${toTimeKey(endTime)}`;

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

const buildDaySlots = () => {
  const slots = [];
  for (let minute = slotStartHour * 60; minute + slotMinutes <= slotEndHour * 60; minute += slotMinutes) {
    const startHour = Math.floor(minute / 60);
    const startMinute = minute % 60;
    const end = minute + slotMinutes;
    const endHour = Math.floor(end / 60);
    const endMinute = end % 60;

    slots.push({
      startTime: `${pad2(startHour)}:${pad2(startMinute)}`,
      endTime: `${pad2(endHour)}:${pad2(endMinute)}`,
    });
  }
  return slots;
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

  const monthFrom = useMemo(
    () => toDateKey(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), 1)),
    [calendarMonth],
  );
  const monthTo = useMemo(
    () => toDateKey(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 0)),
    [calendarMonth],
  );

  const today = new Date();
  const todayKey = toDateKey(today);
  const currentTimeKey = `${pad2(today.getHours())}:${pad2(today.getMinutes())}`;
  const currentMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const canGoPrevMonth = calendarMonth > currentMonthStart;
  const calendarDays = useMemo(() => buildCalendarDays(calendarMonth), [calendarMonth]);
  const daySlots = useMemo(() => buildDaySlots(), []);
  const selectedDay = form.date ? availabilityByDate[form.date] : null;

  const availableSlotKeySet = useMemo(() => {
    const keys = new Set();
    (selectedDay?.availableSlots ?? []).forEach((slot) => {
      keys.add(slotKey(slot.startTime, slot.endTime));
    });
    return keys;
  }, [selectedDay]);

  const refreshAvailability = useCallback(
    async (showLoader) => {
      if (!form.resourceId) {
        setAvailabilityByDate({});
        return;
      }

      if (showLoader) {
        setAvailabilityLoading(true);
      }

      try {
        const data = await getBookingAvailability(form.resourceId, monthFrom, monthTo);

        const next = {};
        data.days.forEach((day) => {
          next[day.date] = day;
        });

        setAvailabilityByDate(next);

        setForm((prev) => {
          if (prev.date && next[prev.date]) {
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
        if (showLoader) {
          setError(parseServerError(err, "Failed to load availability calendar"));
        }
      } finally {
        if (showLoader) {
          setAvailabilityLoading(false);
        }
      }
    },
    [form.resourceId, monthFrom, monthTo],
  );

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
    refreshAvailability(true);
  }, [refreshAvailability]);

  useEffect(() => {
    if (!form.resourceId) {
      return undefined;
    }

    const intervalId = setInterval(() => {
      refreshAvailability(false);
    }, availabilityPollMs);

    return () => clearInterval(intervalId);
  }, [form.resourceId, refreshAvailability]);

  useEffect(() => {
    if (!form.date || !form.startTime || !form.endTime || !selectedDay) {
      return;
    }

    const selectedSlotKey = slotKey(form.startTime, form.endTime);
    const stillAvailable = selectedDay.availableSlots.some(
      (slot) => slotKey(slot.startTime, slot.endTime) === selectedSlotKey,
    );

    if (!stillAvailable) {
      setForm((prev) => ({ ...prev, startTime: "", endTime: "" }));
      setError("That slot was just booked by another student. Please choose another available slot.");
    }
  }, [selectedDay, form.date, form.startTime, form.endTime]);

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
      const latest = await getBookingAvailability(form.resourceId, form.date, form.date);
      const latestDay = latest.days[0];
      const selectedSlotKey = slotKey(form.startTime, form.endTime);
      const stillAvailable = latestDay?.availableSlots?.some(
        (slot) => slotKey(slot.startTime, slot.endTime) === selectedSlotKey,
      );

      if (!stillAvailable) {
        if (latestDay) {
          setAvailabilityByDate((prev) => ({ ...prev, [form.date]: latestDay }));
        }
        setForm((prev) => ({ ...prev, startTime: "", endTime: "" }));
        setError("That slot was just booked by another student. Please choose another available slot.");
        return;
      }

      const created = await createBooking({
        ...form,
        title: form.title.trim(),
        purpose: form.purpose.trim() || null,
      });
      navigate(`/bookings/${created.id}`);
    } catch (err) {
      setError(parseServerError(err, "Failed to create booking"));
      refreshAvailability(false);
    } finally {
      setLoading(false);
    }
  };

  const groupSlots = () => {
    const morning = [];
    const afternoon = [];
    const evening = [];

    daySlots.forEach(slot => {
      const hour = parseInt(slot.startTime.split(':')[0], 10);
      const key = slotKey(slot.startTime, slot.endTime);
      const isPastTimeToday = form.date === todayKey && slot.startTime <= currentTimeKey;
      const isAvailable = availableSlotKeySet.has(key) && !isPastTimeToday;
      const isTaken = !isAvailable;
      const active = isAvailable && form.startTime === slot.startTime && form.endTime === slot.endTime;
      
      const slotData = { ...slot, key, isAvailable, isPastTimeToday, isTaken, active };

      if (hour < 12) morning.push(slotData);
      else if (hour < 17) afternoon.push(slotData);
      else evening.push(slotData);
    });

    return { morning, afternoon, evening };
  };

  const { morning, afternoon, evening } = groupSlots();

  return (
    <section className="modern-booking-page" style={{ padding: '32px 24px 64px', backgroundColor: '#F8FAFC', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>
      <style>{`
        .modern-booking-layout {
          max-width: 1200px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: 420px minmax(0, 1fr);
          gap: 32px;
          align-items: start;
        }
        
        .modern-booking-header {
          max-width: 1200px;
          margin: 0 auto 24px auto;
        }
        .modern-booking-header h1 {
          font-size: 28px;
          font-weight: 800;
          color: #0F172A;
          margin: 0 0 4px 0;
          letter-spacing: -0.02em;
        }
        .modern-booking-header p {
          font-size: 15px;
          color: #64748B;
          margin: 0;
        }

        .booking-card {
          background: #FFFFFF;
          border-radius: 12px;
          box-shadow: 0 4px 20px -2px rgba(0, 0, 0, 0.03);
          border: 1px solid #E2E8F0;
          padding: 24px;
          overflow: hidden;
        }

        .calendar-controls {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }
        .calendar-controls strong {
          font-size: 15px;
          font-weight: 700;
          color: #0F172A;
        }
        .cal-btn {
          background: #F1F5F9;
          border: none;
          padding: 6px 12px;
          border-radius: 6px;
          color: #334155;
          font-weight: 600;
          font-size: 12px;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .cal-btn:hover:not(:disabled) {
          background: #E2E8F0;
          color: #0F172A;
        }
        .cal-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .modern-calendar-weekdays {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: 4px;
          margin-bottom: 8px;
          text-align: center;
          font-size: 11px;
          font-weight: 700;
          color: #64748B;
          text-transform: uppercase;
        }
        
        .modern-calendar-grid {
          display: grid;
          grid-template-columns: repeat(7, minmax(0, 1fr));
          gap: 4px;
        }

        .modern-calendar-cell {
          min-height: 54px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          border-radius: 8px;
          border: 1px solid transparent;
          background: #FFFFFF;
          cursor: pointer;
          transition: all 0.15s ease;
          padding: 6px 2px;
        }
        .modern-calendar-cell:hover:not(:disabled):not(.is-selected) {
          background: #EFF6FF;
          border-color: #DBEAFE;
        }
        .modern-calendar-cell.is-muted {
          color: #CBD5E1;
        }
        .modern-calendar-cell:disabled {
          cursor: not-allowed;
          opacity: 0.4;
          background: #F8FAFC;
        }
        .modern-calendar-cell.is-selected {
          background: #EFF6FF;
          border-color: #3B82F6;
          box-shadow: 0 2px 8px rgba(37, 99, 235, 0.15);
          z-index: 10;
        }
        .modern-calendar-cell.is-selected .calendar-day-number {
          color: #1D4ED8;
          font-weight: 700;
        }
        .calendar-day-number {
          font-size: 14px;
          font-weight: 500;
          color: #334155;
          margin-bottom: 2px;
        }
        .calendar-day-meta {
          font-size: 10px;
          color: #64748B;
          font-weight: 600;
          line-height: 1.2;
          margin-top: 2px;
          text-align: center;
        }

        .slot-group {
          margin-bottom: 24px;
        }
        .slot-group h4 {
          font-size: 12px;
          font-weight: 700;
          color: #64748B;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin: 0 0 12px 0;
          padding-bottom: 6px;
          border-bottom: 1px solid #F1F5F9;
        }
        .slot-list {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(170px, 1fr));
          gap: 12px;
        }
        
        .slot-btn {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 10px 12px;
          border-radius: 8px;
          border: 1px solid #E2E8F0;
          background: #FFFFFF;
          cursor: pointer;
          transition: all 0.15s ease;
          font-family: inherit;
          gap: 8px;
        }
        .slot-btn span:first-child {
          font-size: 13px;
          font-weight: 600;
          color: #0F172A;
          white-space: nowrap;
        }
        .slot-btn .slot-status {
          font-size: 10px;
          font-weight: 700;
          padding: 2px 6px;
          border-radius: 4px;
          text-transform: uppercase;
        }
        
        /* Slot States */
        .slot-btn:hover:not(:disabled):not(.is-active) {
          border-color: #CBD5E1;
          background: #F8FAFC;
        }
        .slot-btn .slot-status.is-open {
          background: #DCFCE7;
          color: #166534;
        }
        .slot-btn.is-active {
          background: #2563EB;
          border-color: #2563EB;
          box-shadow: 0 4px 12px rgba(37, 99, 235, 0.2);
        }
        .slot-btn.is-active span:first-child {
          color: #FFFFFF;
        }
        .slot-btn.is-active .slot-status {
          background: rgba(255,255,255,0.2);
          color: #FFFFFF;
        }
        .slot-btn.is-taken {
          background: #F8FAFC;
          border-color: #F1F5F9;
          opacity: 0.6;
          cursor: not-allowed;
        }
        .slot-btn.is-taken .slot-status {
          background: transparent;
          color: #94A3B8;
        }

        .booking-details-section {
          margin-top: 24px;
          padding-top: 24px;
          border-top: 1px solid #E2E8F0;
        }
        .booking-details-section h3 {
          font-size: 18px;
          font-weight: 700;
          color: #0F172A;
          margin: 0 0 16px 0;
        }

        .form-grid {
          display: grid;
          gap: 16px;
        }
        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }
        .form-field {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .form-field label {
          font-size: 12px;
          font-weight: 600;
          color: #475569;
          text-transform: uppercase;
          letter-spacing: 0.02em;
        }
        .modern-input {
          width: 100%;
          padding: 10px 14px;
          border-radius: 8px;
          border: 1px solid #CBD5E1;
          font-size: 14px;
          color: #0F172A;
          background: #FFFFFF;
          transition: all 0.2s ease;
          box-sizing: border-box;
          font-family: inherit;
        }
        .modern-input:focus {
          outline: none;
          border-color: #2563EB;
          box-shadow: 0 0 0 2px rgba(37,99,235,0.15);
        }
        .modern-input:read-only {
          background: #F1F5F9;
          color: #334155;
          font-weight: 500;
          border-color: #E2E8F0;
          cursor: default;
        }

        .submit-btn {
          width: 100%;
          background: #2563EB;
          color: #FFFFFF;
          border: none;
          padding: 14px;
          border-radius: 8px;
          font-size: 15px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          margin-top: 8px;
        }
        .submit-btn:hover:not(:disabled) {
          background: #1D4ED8;
        }
        .submit-btn:disabled {
          background: #94A3B8;
          cursor: not-allowed;
          opacity: 0.8;
        }

        .spinner {
          width: 20px;
          height: 20px;
          border: 3px solid rgba(255,255,255,0.3);
          border-radius: 50%;
          border-top-color: #fff;
          animation: spin 1s ease-in-out infinite;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        @media (max-width: 1024px) {
          .modern-booking-layout {
            grid-template-columns: 1fr;
          }
        }
        @media (max-width: 640px) {
          .form-row {
            grid-template-columns: 1fr;
          }
          .slot-list {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <div className="modern-booking-header">
        <h1>Schedule Booking</h1>
        <p>Select a date and time to reserve a campus resource.</p>
      </div>

      <div className="modern-booking-layout">
        
        {/* Left Column: Calendar */}
        <div className="booking-card">
          <div className="form-field" style={{ marginBottom: '32px' }}>
            <label htmlFor="resourceId">Select Resource</label>
            <CustomSelect
              id="resourceId"
              className="modern-input"
              value={form.resourceId}
              onChange={(val) =>
                setForm((prev) => ({
                  ...prev,
                  resourceId: val,
                  date: "",
                  startTime: "",
                  endTime: "",
                }))
              }
              options={resources.map((resource) => ({
                value: resource.id,
                label: `${resource.name} - ${resource.location}`
              }))}
            />
          </div>

          <div className="calendar-controls">
            <button
              className="cal-btn"
              type="button"
              disabled={!canGoPrevMonth}
              onClick={() => {
                if (canGoPrevMonth) {
                  setCalendarMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
                }
              }}
            >
              Previous
            </button>
            <strong>{monthLabel(calendarMonth)}</strong>
            <button
              className="cal-btn"
              type="button"
              onClick={() => setCalendarMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))}
            >
              Next
            </button>
          </div>

          <div className="modern-calendar-weekdays">
            {weekdayLabels.map((label) => (
              <div key={label}>{label}</div>
            ))}
          </div>

          <div className="modern-calendar-grid">
            {calendarDays.map((day) => {
              const dateKey = toDateKey(day);
              const dayAvailability = availabilityByDate[dateKey];
              const isCurrentMonth = day.getMonth() === calendarMonth.getMonth();
              const isPast = dateKey < todayKey;
              const isSelected = form.date === dateKey;
              const isSelectable = isCurrentMonth && !isPast && Boolean(dayAvailability);

              const selectedResource = resources.find(r => r.id === form.resourceId);
              const capacity = selectedResource?.capacity || 0;
              let remainingCapacity = 0;
              
              if (dayAvailability) {
                  const bookedSlots = dayAvailability.totalSlots - dayAvailability.availableSlotCount;
                  remainingCapacity = Math.max(0, capacity - bookedSlots);
              }

              return (
                <button
                  key={dateKey}
                  type="button"
                  className={`modern-calendar-cell${isCurrentMonth ? "" : " is-muted"}${isSelected ? " is-selected" : ""}`}
                  disabled={!isSelectable}
                  onClick={() => onDateSelect(dateKey)}
                >
                  <span className="calendar-day-number">{day.getDate()}</span>
                  <span className="calendar-day-meta">
                    {availabilityLoading && isCurrentMonth && !isPast && "..."}
                    {!availabilityLoading && isCurrentMonth && !isPast && dayAvailability && (
                      remainingCapacity > 0
                        ? `${remainingCapacity} slots`
                        : "Full"
                    )}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Column: Time Slots & Booking Details */}
        <div className="booking-card">
          <div style={{ marginBottom: '20px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#0F172A', margin: '0 0 6px 0' }}>Available Time Slots</h3>
            {!form.date ? (
              <p style={{ color: '#64748B', margin: 0, fontSize: '14px' }}>Please select a date from the calendar first.</p>
            ) : (
              <p style={{ color: '#0F172A', margin: 0, fontSize: '14px', fontWeight: 500 }}>
                Date: <span style={{ color: '#2563EB', fontWeight: 600 }}>{new Date(form.date).toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}</span>
              </p>
            )}
          </div>

          {form.date && (
            <>
              {!selectedDay && availabilityLoading && <p style={{ color: '#64748B' }}>Loading available slots...</p>}

              {selectedDay && (
                <>
                  {morning.length > 0 && (
                    <div className="slot-group">
                      <h4>Morning</h4>
                      <div className="slot-list">
                        {morning.map((slot) => (
                          <button
                            key={slot.key}
                            type="button"
                            className={`slot-btn${slot.active ? " is-active" : ""}${slot.isTaken ? " is-taken" : ""}`}
                            disabled={slot.isTaken}
                            onClick={() => onSlotSelect(form.date, slot)}
                          >
                            <span>{slot.startTime} - {slot.endTime}</span>
                            <span className={`slot-status${slot.isTaken ? " is-taken" : " is-open"}`}>
                              {slot.isAvailable ? "Available" : (slot.isPastTimeToday ? "Past" : "Taken")}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {afternoon.length > 0 && (
                    <div className="slot-group">
                      <h4>Afternoon</h4>
                      <div className="slot-list">
                        {afternoon.map((slot) => (
                          <button
                            key={slot.key}
                            type="button"
                            className={`slot-btn${slot.active ? " is-active" : ""}${slot.isTaken ? " is-taken" : ""}`}
                            disabled={slot.isTaken}
                            onClick={() => onSlotSelect(form.date, slot)}
                          >
                            <span>{slot.startTime} - {slot.endTime}</span>
                            <span className={`slot-status${slot.isTaken ? " is-taken" : " is-open"}`}>
                              {slot.isAvailable ? "Available" : (slot.isPastTimeToday ? "Past" : "Taken")}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {evening.length > 0 && (
                    <div className="slot-group" style={{ marginBottom: 0 }}>
                      <h4>Evening</h4>
                      <div className="slot-list">
                        {evening.map((slot) => (
                          <button
                            key={slot.key}
                            type="button"
                            className={`slot-btn${slot.active ? " is-active" : ""}${slot.isTaken ? " is-taken" : ""}`}
                            disabled={slot.isTaken}
                            onClick={() => onSlotSelect(form.date, slot)}
                          >
                            <span>{slot.startTime} - {slot.endTime}</span>
                            <span className={`slot-status${slot.isTaken ? " is-taken" : " is-open"}`}>
                              {slot.isAvailable ? "Available" : (slot.isPastTimeToday ? "Past" : "Taken")}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </>
          )}

          {/* Booking Details Form */}
          <div className="booking-details-section">
            <h3>Booking Details</h3>
            
            {error && (
              <div style={{ padding: '16px', background: '#FEF2F2', border: '1px solid #FCA5A5', color: '#991B1B', borderRadius: '12px', marginBottom: '24px', fontSize: '14px', fontWeight: 500 }}>
                {error}
              </div>
            )}

            <form className="form-grid" onSubmit={onSubmit}>
              <div className="form-field">
                <label htmlFor="title">Event Title</label>
                <input
                  id="title"
                  className="modern-input"
                  placeholder="e.g. Weekly Team Sync"
                  value={form.title}
                  onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
                  required
                />
              </div>

              <div className="form-field">
                <label htmlFor="purpose">Purpose</label>
                <textarea
                  id="purpose"
                  className="modern-input"
                  placeholder="Briefly describe what this booking is for..."
                  value={form.purpose}
                  onChange={(e) => setForm((prev) => ({ ...prev, purpose: e.target.value }))}
                  rows={2}
                  style={{ resize: 'vertical' }}
                />
              </div>

              <div className="form-row">
                <div className="form-field">
                  <label>Selected Date</label>
                  <input className="modern-input" value={form.date} readOnly placeholder="None" />
                </div>
                <div className="form-field">
                  <label>Time Slot</label>
                  <input
                    className="modern-input"
                    value={form.startTime && form.endTime ? `${form.startTime} - ${form.endTime}` : ""}
                    readOnly
                    placeholder="None"
                  />
                </div>
              </div>

              <button 
                className="submit-btn" 
                type="submit" 
                disabled={loading || availabilityLoading || !resources.length || !form.startTime}
              >
                {loading ? (
                  <>
                    <div className="spinner"></div>
                    Processing...
                  </>
                ) : (
                  "Create Booking"
                )}
              </button>
            </form>
          </div>

        </div>
      </div>
    </section>
  );
};

export default CreateBookingPage;

