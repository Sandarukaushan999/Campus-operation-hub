import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { deleteTicket, getMyTickets } from "../../../api/ticketApi";
import "../tickets.css";

// Friendly labels and icons for the ticket fields.
const STATUS_LABELS = {
  OPEN: "Open",
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
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const parseErrorMessage = (err, fallback) => {
  const details = err?.response?.data?.details;
  if (Array.isArray(details) && details.length > 0) return details[0];
  return err?.response?.data?.message ?? fallback;
};

const MyTicketsPage = () => {
  const [tickets, setTickets] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [deletingId, setDeletingId] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const fetchTickets = useCallback(async (showLoader = false) => {
    if (showLoader) setLoading(true);
    else setRefreshing(true);

    try {
      const data = await getMyTickets();
      setTickets(data);
      setError("");
    } catch (err) {
      setError(parseErrorMessage(err, "Failed to load tickets"));
    } finally {
      if (showLoader) setLoading(false);
      else setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchTickets(true); }, [fetchTickets]);

  const stats = useMemo(() => {
    return tickets.reduce(
      (acc, ticket) => {
        acc.total += 1;
        if (ticket.status === "OPEN") acc.open += 1;
        if (ticket.status === "ASSIGNED" || ticket.status === "IN_PROGRESS") acc.inProgress += 1;
        if (ticket.status === "RESOLVED") acc.resolved += 1;
        if (ticket.status === "CLOSED") acc.closed += 1;
        return acc;
      },
      { total: 0, open: 0, inProgress: 0, resolved: 0, closed: 0 },
    );
  }, [tickets]);

  const visibleTickets = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return tickets.filter((ticket) => {
      if (statusFilter !== "ALL" && ticket.status !== statusFilter) return false;
      if (term) {
        const haystack = `${ticket.title} ${ticket.description} ${ticket.location ?? ""}`.toLowerCase();
        if (!haystack.includes(term)) return false;
      }
      return true;
    });
  }, [tickets, searchTerm, statusFilter]);

  const onDelete = async (ticketId) => {
    const ok = window.confirm("Delete this ticket? This cannot be undone.");
    if (!ok) return;

    setDeletingId(ticketId);
    setError("");
    try {
      await deleteTicket(ticketId);
      await fetchTickets(false);
    } catch (err) {
      setError(parseErrorMessage(err, "Failed to delete ticket"));
    } finally {
      setDeletingId("");
    }
  };

  const clearFilters = () => {
    setSearchTerm("");
    setStatusFilter("ALL");
  };

  return (
    <section className="tk-page">

      {/* HERO */}
      <div className="tk-hero">
        <div className="tk-hero-top">
          <div>
            <h2 className="tk-hero-title">🎫 My Tickets</h2>
            <p className="tk-hero-sub">
              Track the maintenance and incident reports you have submitted.
            </p>
          </div>
          <div className="tk-hero-actions">
            <button
              className="tk-btn tk-btn-light"
              type="button"
              onClick={() => fetchTickets(false)}
              disabled={refreshing}
            >
              {refreshing ? "Syncing..." : "🔄 Refresh"}
            </button>
            <Link className="tk-btn tk-btn-primary" to="/tickets/create">
              ➕ New Ticket
            </Link>
          </div>
        </div>

        <div className="tk-stats">
          <div className="tk-stat">
            <div className="tk-stat-icon is-total">📊</div>
            <div className="tk-stat-body">
              <span className="tk-stat-value">{stats.total}</span>
              <span className="tk-stat-label">Total</span>
            </div>
          </div>
          <div className="tk-stat">
            <div className="tk-stat-icon is-open">📬</div>
            <div className="tk-stat-body">
              <span className="tk-stat-value">{stats.open}</span>
              <span className="tk-stat-label">Open</span>
            </div>
          </div>
          <div className="tk-stat">
            <div className="tk-stat-icon is-progress">🔧</div>
            <div className="tk-stat-body">
              <span className="tk-stat-value">{stats.inProgress}</span>
              <span className="tk-stat-label">In Progress</span>
            </div>
          </div>
          <div className="tk-stat">
            <div className="tk-stat-icon is-resolved">✅</div>
            <div className="tk-stat-body">
              <span className="tk-stat-value">{stats.resolved}</span>
              <span className="tk-stat-label">Resolved</span>
            </div>
          </div>
          <div className="tk-stat">
            <div className="tk-stat-icon is-closed">📕</div>
            <div className="tk-stat-body">
              <span className="tk-stat-value">{stats.closed}</span>
              <span className="tk-stat-label">Closed</span>
            </div>
          </div>
        </div>
      </div>

      {/* FILTERS */}
      <div className="tk-filters">
        <div className="tk-filter-search">
          <input
            type="text"
            placeholder="Search by title, description or location"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
          />
        </div>
        <select
          className="tk-filter-select"
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
        >
          <option value="ALL">All Statuses</option>
          <option value="OPEN">Open</option>
          <option value="ASSIGNED">Assigned</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="RESOLVED">Resolved</option>
          <option value="CLOSED">Closed</option>
          <option value="REJECTED">Rejected</option>
        </select>
        <button type="button" className="tk-btn tk-btn-light" onClick={clearFilters}>
          Reset
        </button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {loading && (
        <div className="tk-empty">
          <div className="tk-empty-icon">⏳</div>
          <p className="tk-empty-text">Loading tickets...</p>
        </div>
      )}

      {!loading && visibleTickets.length === 0 && (
        <div className="tk-empty">
          <div className="tk-empty-icon">📭</div>
          <h3 className="tk-empty-title">No tickets to show</h3>
          <p className="tk-empty-text">
            {tickets.length === 0
              ? "You have not reported any incidents yet."
              : "No tickets match the current filters."}
          </p>
          <div className="tk-empty-actions">
            {tickets.length > 0 && (
              <button type="button" className="tk-btn tk-btn-light" onClick={clearFilters}>
                Clear Filters
              </button>
            )}
            <Link className="tk-btn tk-btn-primary" to="/tickets/create">
              ➕ Report an Incident
            </Link>
          </div>
        </div>
      )}

      {!loading && visibleTickets.length > 0 && (
        <div className="tk-grid">
          {visibleTickets.map((ticket) => {
            const canDelete = ticket.status === "OPEN";
            const isDeleting = deletingId === ticket.id;
            const cat = CATEGORY_META[ticket.category] ?? { label: ticket.category, icon: "📌" };

            return (
              <article className={`tk-card is-status-${ticket.status}`} key={ticket.id}>
                <div className="tk-card-head">
                  <div>
                    <h3 className="tk-card-title">{ticket.title}</h3>
                    <p className="tk-card-date">Reported {formatDate(ticket.createdAt)}</p>
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

                {ticket.rejectionReason && (
                  <div className="tk-card-rejected-note">
                    <strong>Reason:</strong> {ticket.rejectionReason}
                  </div>
                )}

                <div className="tk-card-actions">
                  <Link className="tk-btn tk-btn-ghost" to={`/tickets/${ticket.id}`}>
                    👁  View Details
                  </Link>
                  {canDelete && (
                    <button
                      className="tk-btn tk-btn-danger"
                      type="button"
                      onClick={() => onDelete(ticket.id)}
                      disabled={isDeleting}
                    >
                      {isDeleting ? "Deleting..." : "🗑  Delete"}
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

export default MyTicketsPage;
