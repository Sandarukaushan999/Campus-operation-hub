import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { assignTicket, getAllTickets } from "../../../api/ticketApi";

// Admin moderation view: see every ticket in the system, filter by status,
// quick-assign a technician without leaving the list.
//
// Detailed actions like Resolve / Reject / Close are done from
// TicketDetailsPage.

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

const TicketListPage = () => {
  const [tickets, setTickets] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [searchTerm, setSearchTerm] = useState("");

  // For the quick-assign panel: which ticket id is open and what value
  // the admin has typed.
  const [assignTargetId, setAssignTargetId] = useState("");
  const [assignTechId, setAssignTechId] = useState("");
  const [assigning, setAssigning] = useState(false);

  const fetchTickets = useCallback(async () => {
    setLoading(true);
    try {
      // We pass the status to the backend so the filter is server-side too.
      // ALL means "no filter".
      const data = await getAllTickets(statusFilter === "ALL" ? null : statusFilter);
      setTickets(data);
      setError("");
    } catch (err) {
      setError(parseErrorMessage(err, "Failed to load tickets"));
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  // Client-side search on top of the server filter.
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
    <section className="grid my-bookings-shell">

      <div className="card bookings-hero">
        <div className="spread">
          <div>
            <h2>All Tickets (Admin)</h2>
            <p className="bookings-subtitle">
              Moderate every reported incident across the campus.
            </p>
          </div>
        </div>
      </div>

      <div className="card bookings-controls">
        <div className="row bookings-input-row">
          <input
            className="input"
            placeholder="Search by title, description, location, reporter id"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <select
            className="input bookings-status-select"
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
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {loading && <div className="card">Loading tickets...</div>}

      {!loading && visibleTickets.length === 0 && (
        <div className="card bookings-empty">
          <h3>No tickets to show</h3>
          <p>Either nothing has been reported yet, or your filters hide everything.</p>
        </div>
      )}

      {!loading && visibleTickets.length > 0 && (
        <div className="bookings-card-grid">
          {visibleTickets.map((ticket) => {
            const isAssignOpen = assignTargetId === ticket.id;
            const canAssign = ticket.status === "OPEN";

            return (
              <article className="card booking-modern-card" key={ticket.id}>
                <div className="spread">
                  <div>
                    <h3>{ticket.title}</h3>
                    <p className="muted booking-date-line">
                      Reported {formatDate(ticket.createdAt)} by {ticket.createdBy}
                    </p>
                  </div>
                  <span className={statusClass(ticket.status)}>
                    {statusLabel(ticket.status)}
                  </span>
                </div>

                <div className="booking-modern-meta">
                  <span>{ticket.category}</span>
                  <span>Priority: {ticket.priority}</span>
                  <span>
                    {ticket.location || `Resource: ${ticket.resourceId ?? "-"}`}
                  </span>
                </div>

                {ticket.description && (
                  <p className="booking-modern-purpose">
                    {ticket.description.length > 200
                      ? `${ticket.description.slice(0, 200)}...`
                      : ticket.description}
                  </p>
                )}

                {ticket.assignedTo && (
                  <p className="muted">Assigned to: {ticket.assignedTo}</p>
                )}

                {/* Quick assign panel */}
                {isAssignOpen && (
                  <div style={{ marginTop: 8 }}>
                    <label>Technician user id</label>
                    <input
                      className="input"
                      placeholder="Paste the technician's user id"
                      value={assignTechId}
                      onChange={(e) => setAssignTechId(e.target.value)}
                    />
                    <p className="muted" style={{ fontSize: 12, marginTop: 4 }}>
                      Tip: a "list technicians" endpoint is coming from Member 4 - until then, paste the user id from MongoDB.
                    </p>
                    <div className="row" style={{ marginTop: 8 }}>
                      <button
                        className="btn btn-primary"
                        type="button"
                        onClick={onConfirmAssign}
                        disabled={assigning || !assignTechId.trim()}
                      >
                        {assigning ? "Assigning..." : "Confirm Assign"}
                      </button>
                      <button
                        className="btn btn-light"
                        type="button"
                        onClick={onCancelAssign}
                        disabled={assigning}
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
                  {canAssign && !isAssignOpen && (
                    <button
                      className="btn btn-primary"
                      type="button"
                      onClick={() => onOpenAssign(ticket.id)}
                    >
                      Quick Assign
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
