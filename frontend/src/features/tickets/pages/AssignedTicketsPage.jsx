import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { getAssignedTickets, updateTicketStatus } from "../../../api/ticketApi";
import "../tickets.css";

const STATUS_LABELS = {
  ASSIGNED: "Assigned",
  IN_PROGRESS: "In Progress",
  RESOLVED: "Resolved",
  CLOSED: "Closed",
  REJECTED: "Rejected",
};

const CATEGORY_META = {
  ELECTRICAL:   { label: "Electrical",   icon: "⚡" },
  NETWORK:      { label: "Network",      icon: "📡" },
  FURNITURE:    { label: "Furniture",    icon: "🪑" },
  IT_EQUIPMENT: { label: "IT Equipment", icon: "💻" },
  PLUMBING:     { label: "Plumbing",     icon: "🚰" },
  OTHER:        { label: "Other",        icon: "📌" },
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
  if (Array.isArray(details) && details.length > 0) return details[0];
  return err?.response?.data?.message ?? fallback;
};

const AssignedTicketsPage = () => {
  const [tickets, setTickets] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState("");

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

  useEffect(() => { fetchTickets(); }, [fetchTickets]);

  const grouped = useMemo(() => {
    const active = [];
    const done = [];
    for (const ticket of tickets) {
      if (ticket.status === "ASSIGNED" || ticket.status === "IN_PROGRESS") active.push(ticket);
      else done.push(ticket);
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
    const cat = CATEGORY_META[ticket.category] ?? { label: ticket.category, icon: "📌" };

    return (
      <article className={`tk-card is-status-${ticket.status}`} key={ticket.id}>
        <div className="tk-card-head">
          <div>
            <h3 className="tk-card-title">{ticket.title}</h3>
            <p className="tk-card-date">
              Reported {formatDate(ticket.createdAt)}
              {(ticket.createdByName || ticket.createdByEmail) && (
                <> by <strong>{ticket.createdByName || ticket.createdByEmail}</strong></>
              )}
            </p>
          </div>
          <span className={`tk-pill is-${ticket.status}`}>
            {STATUS_LABELS[ticket.status] ?? ticket.status}
          </span>
        </div>

        <div className="tk-card-meta">
          <span className="tk-chip">
            <span className="tk-chip-icon">{cat.icon}</span>
            {cat.label}
          </span>
          <span className={`tk-chip is-prio-${ticket.priority}`}>
            {ticket.priority}
          </span>
          <span className="tk-chip">
            <span className="tk-chip-icon">📍</span>
            {ticket.location || "Resource"}
          </span>
        </div>

        {ticket.description && (
          <p className="tk-card-desc">{ticket.description}</p>
        )}

        {ticket.contactDetails && (
          <p className="tk-card-date">📞 Contact: {ticket.contactDetails}</p>
        )}

        {isResolveOpen && (
          <div className="tk-inline-form">
            <label className="tk-inline-form-label">Resolution notes</label>
            <textarea
              className="tk-textarea"
              rows={3}
              value={resolveNotes}
              onChange={(e) => setResolveNotes(e.target.value)}
              placeholder="What did you do to fix it?"
            />
            <div className="tk-inline-form-actions">
              <button
                className="tk-btn tk-btn-primary"
                type="button"
                onClick={onConfirmResolve}
                disabled={isBusy || !resolveNotes.trim()}
              >
                {isBusy ? "Saving..." : "✅ Confirm Resolve"}
              </button>
              <button
                className="tk-btn tk-btn-light"
                type="button"
                onClick={onCancelResolve}
                disabled={isBusy}
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        <div className="tk-card-actions">
          <Link className="tk-btn tk-btn-ghost" to={`/tickets/${ticket.id}`}>
            👁  View Details
          </Link>
          {canStart && (
            <button
              className="tk-btn tk-btn-primary"
              type="button"
              onClick={() => onStartWork(ticket.id)}
              disabled={isBusy}
            >
              {isBusy ? "Starting..." : "▶  Start Work"}
            </button>
          )}
          {canResolve && !isResolveOpen && (
            <button
              className="tk-btn tk-btn-primary"
              type="button"
              onClick={() => onOpenResolve(ticket.id)}
            >
              ✅ Resolve
            </button>
          )}
        </div>
      </article>
    );
  };

  return (
    <section className="tk-page">

      {/* HERO */}
      <div className="tk-hero">
        <div className="tk-hero-top">
          <div>
            <h2 className="tk-hero-title">🛠 My Queue</h2>
            <p className="tk-hero-sub">
              Tickets assigned to you. Pick up open work and resolve in-progress items.
            </p>
          </div>
          <div className="tk-hero-actions">
            <button className="tk-btn tk-btn-light" type="button" onClick={fetchTickets} disabled={loading}>
              🔄 Refresh
            </button>
          </div>
        </div>

        <div className="tk-stats">
          <div className="tk-stat">
            <div className="tk-stat-icon is-active">🔧</div>
            <div className="tk-stat-body">
              <span className="tk-stat-value">{grouped.active.length}</span>
              <span className="tk-stat-label">Active</span>
            </div>
          </div>
          <div className="tk-stat">
            <div className="tk-stat-icon is-done">✅</div>
            <div className="tk-stat-body">
              <span className="tk-stat-value">{grouped.done.length}</span>
              <span className="tk-stat-label">Done</span>
            </div>
          </div>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {loading && (
        <div className="tk-empty">
          <div className="tk-empty-icon">⏳</div>
          <p className="tk-empty-text">Loading your queue...</p>
        </div>
      )}

      {!loading && tickets.length === 0 && (
        <div className="tk-empty">
          <div className="tk-empty-icon">🎉</div>
          <h3 className="tk-empty-title">No tickets assigned to you</h3>
          <p className="tk-empty-text">When an admin assigns you a ticket it will appear here.</p>
        </div>
      )}

      {!loading && grouped.active.length > 0 && (
        <>
          <h3 className="tk-section-heading">Active</h3>
          <div className="tk-grid">
            {grouped.active.map(renderTicketCard)}
          </div>
        </>
      )}

      {!loading && grouped.done.length > 0 && (
        <>
          <h3 className="tk-section-heading">Done</h3>
          <div className="tk-grid">
            {grouped.done.map(renderTicketCard)}
          </div>
        </>
      )}
    </section>
  );
};

export default AssignedTicketsPage;
