import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  addComment,
  deleteComment,
  deleteTicket,
  editComment,
  getComments,
  getTicketById,
  loadAttachmentBlob,
  updateTicketStatus,
} from "../../../api/ticketApi";
import useAuth from "../../../hooks/useAuth";

// =====================================================================
// Tiny formatting helpers (kept inline so the file is self contained).
// =====================================================================

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

const formatDateTime = (isoString) => {
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
  if (Array.isArray(details) && details.length > 0) {
    return details[0];
  }
  return err?.response?.data?.message ?? fallback;
};

// Pull the filename out of an attachmentUrl like
//   /api/tickets/abc/attachments/uuid.png
const extractFilename = (url) => url.substring(url.lastIndexOf("/") + 1);


// =====================================================================
// Comment row - small inline component so the main page stays readable.
// =====================================================================

const CommentItem = ({ comment, currentUserId, isAdmin, onEdit, onDelete }) => {
  const isAuthor = comment.userId === currentUserId;
  const canEdit = isAuthor;
  const canDelete = isAuthor || isAdmin;

  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(comment.text);
  const [busy, setBusy] = useState(false);

  const onSave = async () => {
    if (!draft.trim()) return;
    setBusy(true);
    try {
      await onEdit(comment.id, draft.trim());
      setIsEditing(false);
    } finally {
      setBusy(false);
    }
  };

  const onCancel = () => {
    setDraft(comment.text);
    setIsEditing(false);
  };

  const onClickDelete = async () => {
    const ok = window.confirm("Delete this comment?");
    if (!ok) return;
    setBusy(true);
    try {
      await onDelete(comment.id);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="card" style={{ padding: 12 }}>
      <div className="spread">
        <div>
          <strong>{isAuthor ? "You" : comment.userId}</strong>
          <span className="muted" style={{ marginLeft: 8, fontSize: 12 }}>
            {formatDateTime(comment.createdAt)}
            {comment.updatedAt !== comment.createdAt && " (edited)"}
          </span>
        </div>
      </div>

      {!isEditing && (
        <p style={{ marginTop: 8, marginBottom: 8, whiteSpace: "pre-wrap" }}>
          {comment.text}
        </p>
      )}

      {isEditing && (
        <textarea
          className="input"
          rows={3}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          style={{ marginTop: 8, marginBottom: 8 }}
        />
      )}

      <div className="row">
        {!isEditing && canEdit && (
          <button
            type="button"
            className="btn btn-light"
            onClick={() => setIsEditing(true)}
          >
            Edit
          </button>
        )}
        {!isEditing && canDelete && (
          <button
            type="button"
            className="btn btn-danger"
            onClick={onClickDelete}
            disabled={busy}
          >
            {busy ? "Deleting..." : "Delete"}
          </button>
        )}
        {isEditing && (
          <>
            <button
              type="button"
              className="btn btn-primary"
              onClick={onSave}
              disabled={busy || !draft.trim()}
            >
              {busy ? "Saving..." : "Save"}
            </button>
            <button
              type="button"
              className="btn btn-light"
              onClick={onCancel}
              disabled={busy}
            >
              Cancel
            </button>
          </>
        )}
      </div>
    </div>
  );
};


// =====================================================================
// Main page
// =====================================================================

const TicketDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [ticket, setTicket] = useState(null);
  const [comments, setComments] = useState([]);
  const [attachmentBlobs, setAttachmentBlobs] = useState([]); // [{filename, url}]
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  // New comment input
  const [newComment, setNewComment] = useState("");

  // Inline forms toggled by the action buttons
  const [showResolveForm, setShowResolveForm] = useState(false);
  const [resolveNotes, setResolveNotes] = useState("");

  const [showRejectForm, setShowRejectForm] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  // Load ticket + comments
  const fetchAll = useCallback(async () => {
    try {
      setLoading(true);
      const [ticketData, commentData] = await Promise.all([
        getTicketById(id),
        getComments(id).catch(() => []), // comments might fail if no access
      ]);
      setTicket(ticketData);
      setComments(commentData);
      setError("");
    } catch (err) {
      setError(parseErrorMessage(err, "Failed to load ticket"));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  // After the ticket loads, fetch each attachment as a blob URL so the
  // <img> tag can show it (the protected GET needs the JWT, plain <img>
  // does not send headers).
  useEffect(() => {
    if (!ticket || !ticket.attachmentUrls || ticket.attachmentUrls.length === 0) {
      setAttachmentBlobs([]);
      return undefined;
    }

    let cancelled = false;
    const blobs = [];

    const loadAll = async () => {
      for (const url of ticket.attachmentUrls) {
        const filename = extractFilename(url);
        try {
          const blobUrl = await loadAttachmentBlob(ticket.id, filename);
          if (cancelled) {
            URL.revokeObjectURL(blobUrl);
            return;
          }
          blobs.push({ filename, url: blobUrl });
          setAttachmentBlobs([...blobs]);
        } catch {
          // Just skip the failing one - the user can still see the rest.
        }
      }
    };

    loadAll();

    // Cleanup: revoke every blob URL we created so memory is freed.
    return () => {
      cancelled = true;
      blobs.forEach((b) => URL.revokeObjectURL(b.url));
    };
  }, [ticket]);

  if (loading) {
    return <div className="card">Loading ticket...</div>;
  }

  if (error && !ticket) {
    return (
      <div className="card alert alert-error">
        {error}
        <div className="row" style={{ marginTop: 12 }}>
          <Link className="btn btn-light" to="/tickets/my">Back to my tickets</Link>
        </div>
      </div>
    );
  }

  if (!ticket) {
    return null;
  }

  // ----- role / permission flags used throughout the JSX -----
  const isAdmin = user?.role === "ADMIN";
  const isOwner = user?.id === ticket.createdBy;
  const isAssignee = user?.id === ticket.assignedTo;

  // What buttons should appear in the workflow panel?
  // Based on the same state machine that the backend enforces.
  const canStartWork =
    ticket.status === "ASSIGNED" && (isAssignee || isAdmin);
  const canResolve =
    ticket.status === "IN_PROGRESS" && (isAssignee || isAdmin);
  const canReject =
    isAdmin && ["OPEN", "ASSIGNED", "IN_PROGRESS"].includes(ticket.status);
  const canClose =
    ticket.status === "RESOLVED" && (isOwner || isAdmin);
  const canReopen =
    ticket.status === "RESOLVED" && (isOwner || isAdmin);
  const canDelete =
    isAdmin || (isOwner && ticket.status === "OPEN");

  const noActions =
    !canStartWork && !canResolve && !canReject && !canClose && !canReopen && !canDelete;

  // ----- handlers -----

  const moveStatus = async (status, payload = {}) => {
    setBusy(true);
    setError("");
    try {
      const updated = await updateTicketStatus(id, { status, ...payload });
      setTicket(updated);
      setShowResolveForm(false);
      setShowRejectForm(false);
      setResolveNotes("");
      setRejectReason("");
    } catch (err) {
      setError(parseErrorMessage(err, "Failed to update ticket status"));
    } finally {
      setBusy(false);
    }
  };

  const onStartWork = () => moveStatus("IN_PROGRESS");

  const onConfirmResolve = () => {
    if (!resolveNotes.trim()) {
      setError("Please describe what was done");
      return;
    }
    moveStatus("RESOLVED", { resolutionNotes: resolveNotes.trim() });
  };

  const onConfirmReject = () => {
    if (!rejectReason.trim()) {
      setError("Please give a reason for rejecting");
      return;
    }
    moveStatus("REJECTED", { rejectionReason: rejectReason.trim() });
  };

  const onClose = () => moveStatus("CLOSED");
  const onReopen = () => moveStatus("IN_PROGRESS");

  const onDeleteTicket = async () => {
    const ok = window.confirm("Delete this ticket? This cannot be undone.");
    if (!ok) return;
    setBusy(true);
    try {
      await deleteTicket(id);
      navigate("/tickets/my");
    } catch (err) {
      setError(parseErrorMessage(err, "Failed to delete ticket"));
      setBusy(false);
    }
  };

  const onAddComment = async () => {
    const text = newComment.trim();
    if (!text) return;
    try {
      const created = await addComment(id, text);
      setComments((prev) => [...prev, created]);
      setNewComment("");
    } catch (err) {
      setError(parseErrorMessage(err, "Failed to add comment"));
    }
  };

  const onEditComment = async (commentId, text) => {
    try {
      const updated = await editComment(id, commentId, text);
      setComments((prev) => prev.map((c) => (c.id === commentId ? updated : c)));
    } catch (err) {
      setError(parseErrorMessage(err, "Failed to edit comment"));
    }
  };

  const onDeleteComment = async (commentId) => {
    try {
      await deleteComment(id, commentId);
      setComments((prev) => prev.filter((c) => c.id !== commentId));
    } catch (err) {
      setError(parseErrorMessage(err, "Failed to delete comment"));
    }
  };

  return (
    <section className="grid">

      {/* ---- Header card ---- */}
      <div className="card">
        <div className="spread">
          <div>
            <h2 style={{ marginBottom: 4 }}>{ticket.title}</h2>
            <p className="muted">
              Reported {formatDateTime(ticket.createdAt)}
              {ticket.updatedAt !== ticket.createdAt &&
                ` · last updated ${formatDateTime(ticket.updatedAt)}`}
            </p>
          </div>
          <span className={statusClass(ticket.status)}>
            {statusLabel(ticket.status)}
          </span>
        </div>

        <div className="grid grid-2" style={{ marginTop: 12 }}>
          <div>
            <p className="muted" style={{ margin: 0 }}>Category</p>
            <strong>{ticket.category}</strong>
          </div>
          <div>
            <p className="muted" style={{ margin: 0 }}>Priority</p>
            <strong>{ticket.priority}</strong>
          </div>
          <div>
            <p className="muted" style={{ margin: 0 }}>Where</p>
            <strong>{ticket.location || `Resource ${ticket.resourceId ?? "-"}`}</strong>
          </div>
          <div>
            <p className="muted" style={{ margin: 0 }}>Contact</p>
            <strong>{ticket.contactDetails}</strong>
          </div>
          <div>
            <p className="muted" style={{ margin: 0 }}>Reported by</p>
            <strong>{isOwner ? "You" : ticket.createdBy}</strong>
          </div>
          <div>
            <p className="muted" style={{ margin: 0 }}>Assigned to</p>
            <strong>{ticket.assignedTo ? (isAssignee ? "You" : ticket.assignedTo) : "Nobody yet"}</strong>
          </div>
        </div>

        <hr />

        <p style={{ whiteSpace: "pre-wrap" }}>{ticket.description}</p>

        {ticket.resolutionNotes && (
          <div className="alert alert-info booking-inline-alert">
            <strong>Resolution: </strong>{ticket.resolutionNotes}
          </div>
        )}

        {ticket.rejectionReason && (
          <div className="alert alert-error booking-inline-alert">
            <strong>Rejected: </strong>{ticket.rejectionReason}
          </div>
        )}
      </div>

      {/* ---- Attachment gallery ---- */}
      {ticket.attachmentUrls && ticket.attachmentUrls.length > 0 && (
        <div className="card">
          <h3>Attachments</h3>
          <div className="row" style={{ flexWrap: "wrap" }}>
            {attachmentBlobs.map((b) => (
              <a key={b.filename} href={b.url} target="_blank" rel="noreferrer">
                <img
                  src={b.url}
                  alt={b.filename}
                  style={{
                    width: 160,
                    height: 160,
                    objectFit: "cover",
                    borderRadius: 8,
                    border: "1px solid #ddd",
                  }}
                />
              </a>
            ))}
            {attachmentBlobs.length < ticket.attachmentUrls.length && (
              <p className="muted">Loading {ticket.attachmentUrls.length - attachmentBlobs.length} more...</p>
            )}
          </div>
        </div>
      )}

      {/* ---- Workflow actions ---- */}
      {!noActions && (
        <div className="card">
          <h3>Actions</h3>
          {error && <div className="alert alert-error">{error}</div>}

          <div className="row" style={{ flexWrap: "wrap" }}>
            {canStartWork && (
              <button className="btn btn-primary" type="button" onClick={onStartWork} disabled={busy}>
                Start Work
              </button>
            )}

            {canResolve && !showResolveForm && (
              <button className="btn btn-primary" type="button" onClick={() => setShowResolveForm(true)} disabled={busy}>
                Resolve
              </button>
            )}

            {canReject && !showRejectForm && (
              <button className="btn btn-danger" type="button" onClick={() => setShowRejectForm(true)} disabled={busy}>
                Reject
              </button>
            )}

            {canClose && (
              <button className="btn btn-primary" type="button" onClick={onClose} disabled={busy}>
                Close
              </button>
            )}

            {canReopen && (
              <button className="btn btn-light" type="button" onClick={onReopen} disabled={busy}>
                Re-open
              </button>
            )}

            {canDelete && (
              <button className="btn btn-danger" type="button" onClick={onDeleteTicket} disabled={busy}>
                Delete
              </button>
            )}
          </div>

          {showResolveForm && (
            <div style={{ marginTop: 12 }}>
              <label>What was done to fix it?</label>
              <textarea
                className="input"
                rows={3}
                value={resolveNotes}
                onChange={(e) => setResolveNotes(e.target.value)}
              />
              <div className="row" style={{ marginTop: 8 }}>
                <button className="btn btn-primary" type="button" onClick={onConfirmResolve} disabled={busy}>
                  {busy ? "Saving..." : "Confirm Resolve"}
                </button>
                <button
                  className="btn btn-light"
                  type="button"
                  onClick={() => { setShowResolveForm(false); setResolveNotes(""); }}
                  disabled={busy}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {showRejectForm && (
            <div style={{ marginTop: 12 }}>
              <label>Reason for rejecting</label>
              <textarea
                className="input"
                rows={3}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
              />
              <div className="row" style={{ marginTop: 8 }}>
                <button className="btn btn-danger" type="button" onClick={onConfirmReject} disabled={busy}>
                  {busy ? "Saving..." : "Confirm Reject"}
                </button>
                <button
                  className="btn btn-light"
                  type="button"
                  onClick={() => { setShowRejectForm(false); setRejectReason(""); }}
                  disabled={busy}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ---- Comments thread ---- */}
      <div className="card">
        <h3>Comments</h3>

        {comments.length === 0 && <p className="muted">No comments yet.</p>}

        <div className="grid">
          {comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              currentUserId={user?.id}
              isAdmin={isAdmin}
              onEdit={onEditComment}
              onDelete={onDeleteComment}
            />
          ))}
        </div>

        <hr />

        <div className="form-field">
          <label>Add a comment</label>
          <textarea
            className="input"
            rows={3}
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Write a comment..."
          />
        </div>
        <button
          className="btn btn-primary"
          type="button"
          onClick={onAddComment}
          disabled={!newComment.trim()}
        >
          Post Comment
        </button>
      </div>

      <div className="row">
        <Link className="btn btn-light" to="/tickets/my">
          Back to my tickets
        </Link>
      </div>
    </section>
  );
};

export default TicketDetailsPage;
