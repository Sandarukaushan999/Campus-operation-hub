import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { getAssignedTickets, updateTicketStatus } from "../../../api/ticketApi";

// Technician view: tickets that have been assigned to me.
// Active queue at the top, finished work below.

const statusClass = (status) => {
  if (status === "ASSIGNED") return "status-pill is-pending";
  if (status === "IN_PROGRESS") return "status-pill is-pending";
  if (status === "RESOLVED") return "status-pill is-approved";
  if (status === "CLOSED") return "status-pill is-approved";
  if (status === "REJECTED") return "status-pill is-rejected";
  return "status-pill";
};

const statusLabel = (status) => {
  if (status === "ASSIGNED") return "Assigned";
  if (status === "IN_PROGRESS") return "In Progress";
  if (status === "RESOLVED") return "Resolved";
  if (status === "CLOSED") return "Closed";
  if (status === "REJECTED") return "Rejected";
  return status;
};

const formatDate = (isoString) => {
  if (!isoString) return "";
  return new Date(isoString).toLocaleString(undefined, {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const parseErrorMessage = (err, fallback) => {
  const details = err?.response?.data?.details;
  if (Array.isArray(details) && details.length > 0) {
    return details[0];
  }
  return err?.response?.data?.message ?? fallback;
};

const AssignedTicketsPage = () => {
  const [tickets, setTickets] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState("");

  // For the inline resolve form
  const [resolveTargetId, setResolveTargetId] = useState("");
  const [resolveNotes, setResolveNotes] = useState("");

  const fetchTickets = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getAssignedTickets();
      setTickets(data);
      setError("");
    } catch (err) {
      setError(parseErrorMessage(err, "Failed to load assigned tickets"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  // Group tickets into "active" and "done" so the technician sees their
  // current work first.
  const grouped = useMemo(() => {
    const active = [];
    const done = [];
    for (const ticket of tickets) {
      if (ticket.status === "ASSIGNED" || ticket.status === "IN_PROGRESS") {
        active.push(ticket);
      } else {
        done.push(ticket);
      }
    }
    return { active, done };
  }, [tickets]);

  const onStartWork = async (ticketId) => {
    setBusyId(ticketId);
    setError("");
    try {
      await updateTicketStatus(ticketId, { status: "IN_PROGRESS" });
      await fetchTickets();
    } catch (err) {
      setError(parseErrorMessage(err, "Failed to start work"));
    } finally {
      setBusyId("");
    }
  };

  const onOpenResolve = (ticketId) => {
    setResolveTargetId(ticketId);
    setResolveNotes("");
    setError("");
  };

  const onCancelResolve = () => {
    setResolveTargetId("");
    setResolveNotes("");
  };

  const onConfirmResolve = async () => {
    if (!resolveNotes.trim()) {
      setError("Please describe what was done");
      return;
    }
    setBusyId(resolveTargetId);
    try {
      await updateTicketStatus(resolveTargetId, {
        status: "RESOLVED",
        resolutionNotes: resolveNotes.trim(),
      });
      onCancelResolve();
      await fetchTickets();
    } catch (err) {
      setError(parseErrorMessage(err, "Failed to resolve ticket"));
    } finally {
      setBusyId("");
    }
  };

  const renderTicketCard = (ticket) => {
    const isResolveOpen = resolveTargetId === ticket.id;
    const isBusy = busyId === ticket.id;
    const canStart = ticket.status === "ASSIGNED";
    const canResolve = ticket.status === "IN_PROGRESS";

    return (
      <article className="card booking-modern-card" key={ticket.id}>
        <div className="spread">
          <div>
            <h3>{ticket.title}</h3>
            <p className="muted booking-date-line">
              Reported {formatDate(ticket.createdAt)}
            </p>
          </div>
          <span className={statusClass(ticket.status)}>
            {statusLabel(ticket.status)}
          </span>
        </div>

        <div className="booking-modern-meta">
          <span>{ticket.category}</span>
          <span>Priority: {ticket.priority}</span>
          <span>{ticket.location || `Resource: ${ticket.resourceId ?? "-"}`}</span>
        </div>

        {ticket.description && (
          <p className="booking-modern-purpose">
            {ticket.description.length > 200
              ? `${ticket.description.slice(0, 200)}...`
              : ticket.description}
          </p>
        )}

        {ticket.contactDetails && (
          <p className="muted">Contact: {ticket.contactDetails}</p>
        )}

        {/* Resolve form */}
        {isResolveOpen && (
          <div style={{ marginTop: 8 }}>
            <label>Resolution notes</label>
            <textarea
              className="input"
              rows={3}
              value={resolveNotes}
              onChange={(e) => setResolveNotes(e.target.value)}
              placeholder="What did you do to fix it?"
            />
            <div className="row" style={{ marginTop: 8 }}>
              <button
                className="btn btn-primary"
                type="button"
                onClick={onConfirmResolve}
                disabled={isBusy || !resolveNotes.trim()}
              >
                {isBusy ? "Saving..." : "Confirm Resolve"}
              </button>
              <button
                className="btn btn-light"
                type="button"
                onClick={onCancelResolve}
                disabled={isBusy}
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        <div className="row booking-modern-actions">
          <Link className="btn btn-light" to={`/tickets/${ticket.id}`}>
            View Details
          </Link>
          {canStart && (
            <button
              className="btn btn-primary"
              type="button"
              onClick={() => onStartWork(ticket.id)}
              disabled={isBusy}
            >
              {isBusy ? "Starting..." : "Start Work"}
            </button>
          )}
          {canResolve && !isResolveOpen && (
            <button
              className="btn btn-primary"
              type="button"
              onClick={() => onOpenResolve(ticket.id)}
            >
              Resolve
            </button>
          )}
        </div>
      </article>
    );
  };

  return (
    <section className="grid my-bookings-shell">

      <div className="card bookings-hero">
        <div className="spread">
          <div>
            <h2>My Queue</h2>
            <p className="bookings-subtitle">
              Tickets that have been assigned to you. Pick up open work and resolve in-progress items.
            </p>
          </div>
          <div className="row">
            <button className="btn btn-light" type="button" onClick={fetchTickets} disabled={loading}>
              Refresh
            </button>
          </div>
        </div>

        <div className="bookings-stats-grid">
          <div className="bookings-stat-card">
            <span className="bookings-stat-label">Active</span>
            <strong>{grouped.active.length}</strong>
          </div>
          <div className="bookings-stat-card">
            <span className="bookings-stat-label">Done</span>
            <strong>{grouped.done.length}</strong>
          </div>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {loading && <div className="card">Loading your queue...</div>}

      {!loading && tickets.length === 0 && (
        <div className="card bookings-empty">
          <h3>No tickets assigned to you</h3>
          <p>When an admin assigns you a ticket it will appear here.</p>
        </div>
      )}

      {!loading && grouped.active.length > 0 && (
        <>
          <h3 style={{ marginTop: 0 }}>Active</h3>
          <div className="bookings-card-grid">
            {grouped.active.map(renderTicketCard)}
          </div>
        </>
      )}

      {!loading && grouped.done.length > 0 && (
        <>
          <h3>Done</h3>
          <div className="bookings-card-grid">
            {grouped.done.map(renderTicketCard)}
          </div>
        </>
      )}
    </section>
  );
};

export default AssignedTicketsPage;
