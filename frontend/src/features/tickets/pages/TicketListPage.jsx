import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { assignTicket, getAllTickets } from "../../../api/ticketApi";
import "../tickets.css";

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
    hour: "2-digit",
    minute: "2-digit",
  });
};

const parseErrorMessage = (err, fallback) => {
  const details = err?.response?.data?.details;
  if (Array.isArray(details) && details.length > 0) return details[0];
  return err?.response?.data?.message ?? fallback;
};

const TicketListPage = () => {
  const [tickets, setTickets] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [searchTerm, setSearchTerm] = useState("");

  const [assignTargetId, setAssignTargetId] = useState("");
  const [assignTechId, setAssignTechId] = useState("");
  const [assigning, setAssigning] = useState(false);

  const fetchTickets = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getAllTickets(statusFilter === "ALL" ? null : statusFilter);
      setTickets(data);
      setError("");
    } catch (err) {
      setError(parseErrorMessage(err, "Failed to load tickets"));
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => { fetchTickets(); }, [fetchTickets]);

  const visibleTickets = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return tickets;
    return tickets.filter((ticket) => {
      const haystack = `${ticket.title} ${ticket.description} ${ticket.location ?? ""} ${ticket.createdBy}`.toLowerCase();
      return haystack.includes(term);
    });
  }, [tickets, searchTerm]);

  const onOpenAssign = (ticketId) => {
    setAssignTargetId(ticketId);
    setAssignTechId("");
  };

  const onCancelAssign = () => {
    setAssignTargetId("");
    setAssignTechId("");
  };

  const onConfirmAssign = async () => {
    if (!assignTechId.trim()) {
      setError("Enter a technician user id");
      return;
    }
    setAssigning(true);
    setError("");
    try {
      await assignTicket(assignTargetId, assignTechId.trim());
      onCancelAssign();
      await fetchTickets();
    } catch (err) {
      setError(parseErrorMessage(err, "Failed to assign technician"));
    } finally {
      setAssigning(false);
    }
  };

  return (
    <section className="tk-page">

      {/* HERO */}
      <div className="tk-hero">
        <div className="tk-hero-top">
          <div>
            <h2 className="tk-hero-title">🛠 All Tickets · Admin</h2>
            <p className="tk-hero-sub">
              Moderate every reported incident across the campus. Assign technicians to open tickets.
            </p>
          </div>
        </div>
      </div>

      {/* FILTERS */}
      <div className="tk-filters">
        <div className="tk-filter-search">
          <input
            type="text"
            placeholder="Search by title, description, location, reporter id"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <select
          className="tk-filter-select"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="ALL">All Statuses</option>
          <option value="OPEN">Open</option>
          <option value="ASSIGNED">Assigned</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="RESOLVED">Resolved</option>
          <option value="CLOSED">Closed</option>
          <option value="REJECTED">Rejected</option>
        </select>
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
            Either nothing has been reported yet, or your filters hide everything.
          </p>
        </div>
      )}

      {!loading && visibleTickets.length > 0 && (
        <div className="tk-grid">
          {visibleTickets.map((ticket) => {
            const isAssignOpen = assignTargetId === ticket.id;
            const canAssign = ticket.status === "OPEN";
            const cat = CATEGORY_META[ticket.category] ?? { label: ticket.category, icon: "📌" };

            return (
              <article className={`tk-card is-status-${ticket.status}`} key={ticket.id}>
                <div className="tk-card-head">
                  <div>
                    <h3 className="tk-card-title">{ticket.title}</h3>
                    <p className="tk-card-date">
                      Reported {formatDate(ticket.createdAt)} by {ticket.createdBy?.slice(0, 8)}
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

                {ticket.assignedTo && (
                  <p className="tk-card-date">
                    🛠 Assigned to: {ticket.assignedTo.slice(0, 12)}
                  </p>
                )}

                {/* Quick assign panel */}
                {isAssignOpen && (
                  <div className="tk-inline-form">
                    <label className="tk-inline-form-label">Technician user id</label>
                    <input
                      type="text"
                      className="tk-input"
                      placeholder="Paste the technician's user id"
                      value={assignTechId}
                      onChange={(e) => setAssignTechId(e.target.value)}
                    />
                    <p style={{ fontSize: 11, color: "var(--muted)", marginTop: 4, marginBottom: 0 }}>
                      Tip: a "list technicians" endpoint is coming from Member 4 — until then, paste the user id from MongoDB.
                    </p>
                    <div className="tk-inline-form-actions">
                      <button
                        className="tk-btn tk-btn-primary"
                        type="button"
                        onClick={onConfirmAssign}
                        disabled={assigning || !assignTechId.trim()}
                      >
                        {assigning ? "Assigning..." : "✅ Confirm Assign"}
                      </button>
                      <button
                        className="tk-btn tk-btn-light"
                        type="button"
                        onClick={onCancelAssign}
                        disabled={assigning}
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
                  {canAssign && !isAssignOpen && (
                    <button
                      className="tk-btn tk-btn-primary"
                      type="button"
                      onClick={() => onOpenAssign(ticket.id)}
                    >
                      🛠 Quick Assign
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

export default TicketListPage;
