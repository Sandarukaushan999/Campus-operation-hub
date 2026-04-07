import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { deleteTicket, getMyTickets } from "../../../api/ticketApi";

// Map a ticket status to a CSS class for the colored pill.
// We reuse the same status-pill classes the booking pages use so the
// look stays consistent.
const statusClass = (status) => {
  if (status === "OPEN") return "status-pill is-pending";
  if (status === "ASSIGNED") return "status-pill is-pending";
  if (status === "IN_PROGRESS") return "status-pill is-pending";
  if (status === "RESOLVED") return "status-pill is-approved";
  if (status === "CLOSED") return "status-pill is-approved";
  if (status === "REJECTED") return "status-pill is-rejected";
  return "status-pill";
};

const statusLabel = (status) => {
  if (status === "OPEN") return "Open";
  if (status === "ASSIGNED") return "Assigned";
  if (status === "IN_PROGRESS") return "In Progress";
  if (status === "RESOLVED") return "Resolved";
  if (status === "CLOSED") return "Closed";
  if (status === "REJECTED") return "Rejected";
  return status;
};

const priorityLabel = (priority) => {
  if (priority === "LOW") return "Low";
  if (priority === "MEDIUM") return "Medium";
  if (priority === "HIGH") return "High";
  if (priority === "URGENT") return "Urgent";
  return priority;
};

const categoryLabel = (category) => {
  if (category === "ELECTRICAL") return "Electrical";
  if (category === "NETWORK") return "Network";
  if (category === "FURNITURE") return "Furniture";
  if (category === "IT_EQUIPMENT") return "IT Equipment";
  if (category === "PLUMBING") return "Plumbing";
  if (category === "OTHER") return "Other";
  return category;
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

// Same error helper as the booking pages.
const parseErrorMessage = (err, fallback) => {
  const details = err?.response?.data?.details;
  if (Array.isArray(details) && details.length > 0) {
    return details[0];
  }
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
    if (showLoader) {
      setLoading(true);
    } else {
      setRefreshing(true);
    }

    try {
      const data = await getMyTickets();
      setTickets(data);
      setError("");
    } catch (err) {
      setError(parseErrorMessage(err, "Failed to load tickets"));
    } finally {
      if (showLoader) {
        setLoading(false);
      } else {
        setRefreshing(false);
      }
    }
  }, []);

  useEffect(() => {
    fetchTickets(true);
  }, [fetchTickets]);

  // Compute summary numbers from the loaded tickets.
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

  // Apply the filter and search box.
  const visibleTickets = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return tickets.filter((ticket) => {
      if (statusFilter !== "ALL" && ticket.status !== statusFilter) {
        return false;
      }
      if (term) {
        const haystack = `${ticket.title} ${ticket.description} ${ticket.location ?? ""}`.toLowerCase();
        if (!haystack.includes(term)) {
          return false;
        }
      }
      return true;
    });
  }, [tickets, searchTerm, statusFilter]);

  const onDelete = async (ticketId) => {
    // Plain confirm for simplicity. We can swap to ConfirmDialog later if needed.
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
    <section className="grid my-bookings-shell">

      {/* Hero card */}
      <div className="card bookings-hero">
        <div className="spread">
          <div>
            <h2>My Tickets</h2>
            <p className="bookings-subtitle">
              Track the maintenance and incident reports you have submitted.
            </p>
          </div>
          <div className="row">
            <button
              className="btn btn-light"
              type="button"
              onClick={() => fetchTickets(false)}
              disabled={refreshing}
            >
              {refreshing ? "Syncing..." : "Refresh"}
            </button>
            <Link className="btn btn-primary" to="/tickets/create">
              New Ticket
            </Link>
          </div>
        </div>

        <div className="bookings-stats-grid">
          <div className="bookings-stat-card">
            <span className="bookings-stat-label">Total</span>
            <strong>{stats.total}</strong>
          </div>
          <div className="bookings-stat-card">
            <span className="bookings-stat-label">Open</span>
            <strong>{stats.open}</strong>
          </div>
          <div className="bookings-stat-card">
            <span className="bookings-stat-label">In Progress</span>
            <strong>{stats.inProgress}</strong>
          </div>
          <div className="bookings-stat-card">
            <span className="bookings-stat-label">Resolved</span>
            <strong>{stats.resolved}</strong>
          </div>
          <div className="bookings-stat-card">
            <span className="bookings-stat-label">Closed</span>
            <strong>{stats.closed}</strong>
          </div>
        </div>
      </div>

      {/* Filter / search controls */}
      <div className="card bookings-controls">
        <div className="row bookings-input-row">
          <input
            className="input"
            placeholder="Search by title, description or location"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
          />
          <select
            className="input bookings-status-select"
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
          <button type="button" className="btn btn-light" onClick={clearFilters}>
            Reset
          </button>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {loading && <div className="card">Loading tickets...</div>}

      {!loading && visibleTickets.length === 0 && (
        <div className="card bookings-empty">
          <h3>No tickets to show</h3>
          <p>
            {tickets.length === 0
              ? "You have not reported any incidents yet."
              : "No tickets match the current filters."}
          </p>
          <div className="row">
            {tickets.length > 0 && (
              <button type="button" className="btn btn-light" onClick={clearFilters}>
                Clear Filters
              </button>
            )}
            <Link className="btn btn-primary" to="/tickets/create">
              Report an Incident
            </Link>
          </div>
        </div>
      )}

      {!loading && visibleTickets.length > 0 && (
        <div className="bookings-card-grid">
          {visibleTickets.map((ticket) => {
            // The owner can only delete while the ticket is still OPEN.
            // We hide the delete button otherwise.
            const canDelete = ticket.status === "OPEN";
            const isDeleting = deletingId === ticket.id;

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
                  <span>{categoryLabel(ticket.category)}</span>
                  <span>Priority: {priorityLabel(ticket.priority)}</span>
                  <span>
                    {ticket.location
                      ? ticket.location
                      : `Resource: ${ticket.resourceId ?? "-"}`}
                  </span>
                </div>

                {ticket.description && (
                  <p className="booking-modern-purpose">
                    {ticket.description.length > 200
                      ? `${ticket.description.slice(0, 200)}...`
                      : ticket.description}
                  </p>
                )}

                {ticket.rejectionReason && (
                  <div className="alert alert-error booking-inline-alert">
                    Reason: {ticket.rejectionReason}
                  </div>
                )}

                <div className="row booking-modern-actions">
                  <Link className="btn btn-light" to={`/tickets/${ticket.id}`}>
                    View Details
                  </Link>
                  {canDelete && (
                    <button
                      className="btn btn-danger"
                      type="button"
                      onClick={() => onDelete(ticket.id)}
                      disabled={isDeleting}
                    >
                      {isDeleting ? "Deleting..." : "Delete"}
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
