import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { cancelBooking, getMyBookings } from "../../../api/bookingApi";

const statusClass = (status) => {
  if (status === "APPROVED") return "status-pill is-approved";
  if (status === "REJECTED") return "status-pill is-rejected";
  if (status === "CANCELLED") return "status-pill is-cancelled";
  return "status-pill is-pending";
};

const statusLabel = (status) => {
  if (status === "APPROVED") return "Approved";
  if (status === "REJECTED") return "Rejected";
  if (status === "CANCELLED") return "Cancelled";
  return "Pending";
};

const normalizeTime = (value) => {
  if (!value) return "";
  return value.length >= 5 ? value.slice(0, 5) : value;
};

const toDateTime = (date, time) => {
  const normalizedTime = normalizeTime(time);
  const timeWithSeconds = normalizedTime.length === 5 ? `${normalizedTime}:00` : normalizedTime;
  return new Date(`${date}T${timeWithSeconds}`);
};

const formatDateLabel = (date) => {
  const parsed = new Date(`${date}T00:00:00`);
  return parsed.toLocaleDateString(undefined, {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const parseErrorMessage = (err, fallback) => {
  const details = err?.response?.data?.details;
  if (Array.isArray(details) && details.length > 0) {
    return details[0];
  }
  return err?.response?.data?.message ?? fallback;
};

const MyBookingsPage = () => {
  const [bookings, setBookings] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [cancelingId, setCancelingId] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [segment, setSegment] = useState("UPCOMING");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const fetchBookings = useCallback(async (showLoader = false) => {
    if (showLoader) {
      setLoading(true);
    } else {
      setRefreshing(true);
    }

    try {
      const data = await getMyBookings();
      setBookings(data);
      setError("");
    } catch (err) {
      setError(parseErrorMessage(err, "Failed to fetch bookings"));
    } finally {
      if (showLoader) {
        setLoading(false);
      } else {
        setRefreshing(false);
      }
    }
  }, []);

  useEffect(() => {
    fetchBookings(true);
  }, [fetchBookings]);

  const preparedBookings = useMemo(() => {
    const now = new Date();

    return bookings
      .map((booking) => {
        const startTime = normalizeTime(booking.startTime);
        const endTime = normalizeTime(booking.endTime);
        const startAt = toDateTime(booking.date, booking.startTime);
        const endAt = toDateTime(booking.date, booking.endTime);

        return {
          ...booking,
          startTime,
          endTime,
          startAt,
          endAt,
          isPast: endAt < now,
          searchableText: `${booking.title} ${booking.purpose ?? ""} ${booking.resourceId}`.toLowerCase(),
        };
      })
      .sort((a, b) => b.startAt - a.startAt);
  }, [bookings]);

  const stats = useMemo(() => {
    const now = new Date();

    return preparedBookings.reduce(
      (acc, booking) => {
        acc.total += 1;

        if (booking.status === "PENDING") acc.pending += 1;
        if (booking.status === "APPROVED") acc.approved += 1;
        if (booking.status === "CANCELLED") acc.cancelled += 1;

        if (booking.endAt >= now && booking.status !== "CANCELLED" && booking.status !== "REJECTED") {
          acc.upcoming += 1;
        }

        return acc;
      },
      { total: 0, upcoming: 0, pending: 0, approved: 0, cancelled: 0 },
    );
  }, [preparedBookings]);

  const visibleBookings = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    const now = new Date();

    const base = preparedBookings.filter((booking) => {
      if (segment === "UPCOMING") {
        if (booking.endAt < now) return false;
        if (booking.status === "CANCELLED" || booking.status === "REJECTED") return false;
      }

      if (segment === "HISTORY") {
        if (booking.endAt >= now && booking.status !== "CANCELLED" && booking.status !== "REJECTED") {
          return false;
        }
      }

      if (statusFilter !== "ALL" && booking.status !== statusFilter) {
        return false;
      }

      if (term && !booking.searchableText.includes(term)) {
        return false;
      }

      return true;
    });

    return base.sort((a, b) => {
      if (segment === "UPCOMING") {
        return a.startAt - b.startAt;
      }
      return b.startAt - a.startAt;
    });
  }, [preparedBookings, searchTerm, segment, statusFilter]);

  const onCancel = async (bookingId) => {
    setCancelingId(bookingId);
    setError("");

    try {
      await cancelBooking(bookingId, { reason: "Cancelled by user" });
      await fetchBookings(false);
    } catch (err) {
      setError(parseErrorMessage(err, "Failed to cancel booking"));
    } finally {
      setCancelingId("");
    }
  };

  const clearFilters = () => {
    setSearchTerm("");
    setSegment("UPCOMING");
    setStatusFilter("ALL");
  };

  return (
    <section className="grid my-bookings-shell">
      <div className="card bookings-hero">
        <div className="spread">
          <div>
            <h2>My Booking Command Center</h2>
            <p className="bookings-subtitle">
              Track approvals, monitor upcoming sessions, and manage cancellations in real time.
            </p>
          </div>
          <div className="row">
            <button className="btn btn-light" type="button" onClick={() => fetchBookings(false)} disabled={refreshing}>
              {refreshing ? "Syncing..." : "Refresh"}
            </button>
            <Link className="btn btn-primary" to="/bookings/create">
              New Booking
            </Link>
          </div>
        </div>

        <div className="bookings-stats-grid">
          <div className="bookings-stat-card">
            <span className="bookings-stat-label">Total</span>
            <strong>{stats.total}</strong>
          </div>
          <div className="bookings-stat-card">
            <span className="bookings-stat-label">Upcoming</span>
            <strong>{stats.upcoming}</strong>
          </div>
          <div className="bookings-stat-card">
            <span className="bookings-stat-label">Pending</span>
            <strong>{stats.pending}</strong>
          </div>
          <div className="bookings-stat-card">
            <span className="bookings-stat-label">Approved</span>
            <strong>{stats.approved}</strong>
          </div>
          <div className="bookings-stat-card">
            <span className="bookings-stat-label">Cancelled</span>
            <strong>{stats.cancelled}</strong>
          </div>
        </div>
      </div>

      <div className="card bookings-controls">
        <div className="bookings-filter-tabs">
          <button
            type="button"
            className={`bookings-filter-tab${segment === "UPCOMING" ? " is-active" : ""}`}
            onClick={() => setSegment("UPCOMING")}
          >
            Upcoming
          </button>
          <button
            type="button"
            className={`bookings-filter-tab${segment === "ALL" ? " is-active" : ""}`}
            onClick={() => setSegment("ALL")}
          >
            All
          </button>
          <button
            type="button"
            className={`bookings-filter-tab${segment === "HISTORY" ? " is-active" : ""}`}
            onClick={() => setSegment("HISTORY")}
          >
            History
          </button>
        </div>

        <div className="row bookings-input-row">
          <input
            className="input"
            placeholder="Search by title, purpose, or resource id"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
          />
          <select
            className="input bookings-status-select"
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
          >
            <option value="ALL">All Statuses</option>
            <option value="PENDING">Pending</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
          <button type="button" className="btn btn-light" onClick={clearFilters}>
            Reset
          </button>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {loading && <div className="card">Loading your booking stream...</div>}

      {!loading && visibleBookings.length === 0 && (
        <div className="card bookings-empty">
          <h3>No bookings match your current filters</h3>
          <p>Try changing filters or create a new booking slot.</p>
          <div className="row">
            <button type="button" className="btn btn-light" onClick={clearFilters}>
              Clear Filters
            </button>
            <Link className="btn btn-primary" to="/bookings/create">
              Create Booking
            </Link>
          </div>
        </div>
      )}

      {!loading && visibleBookings.length > 0 && (
        <div className="bookings-card-grid">
          {visibleBookings.map((booking) => {
            const actionable = booking.status === "PENDING" || booking.status === "APPROVED";
            const canceling = cancelingId === booking.id;

            return (
              <article className="card booking-modern-card" key={booking.id}>
                <div className="spread">
                  <div>
                    <h3>{booking.title}</h3>
                    <p className="muted booking-date-line">{formatDateLabel(booking.date)}</p>
                  </div>
                  <span className={statusClass(booking.status)}>{statusLabel(booking.status)}</span>
                </div>

                <div className="booking-modern-meta">
                  <span>{booking.startTime} - {booking.endTime}</span>
                  <span>Resource: {booking.resourceId}</span>
                </div>

                {booking.purpose && <p className="booking-modern-purpose">{booking.purpose}</p>}

                {booking.rejectionReason && (
                  <div className="alert alert-error booking-inline-alert">
                    Reason: {booking.rejectionReason}
                  </div>
                )}

                <div className="row booking-modern-actions">
                  <Link className="btn btn-light" to={`/bookings/${booking.id}`}>
                    View Details
                  </Link>
                  {actionable && (
                    <button
                      className="btn btn-danger"
                      type="button"
                      onClick={() => onCancel(booking.id)}
                      disabled={canceling}
                    >
                      {canceling ? "Cancelling..." : "Cancel"}
                    </button>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
};

export default MyBookingsPage;
