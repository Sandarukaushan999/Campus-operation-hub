import { useCallback, useEffect, useMemo, useState } from "react";
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
import { getUsers } from "../../../api/userApi";
import useAuth from "../../../hooks/useAuth";
import "../tickets.css";

// =====================================================================
// Helpers
// =====================================================================

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
  if (Array.isArray(details) && details.length > 0) return details[0];
  return err?.response?.data?.message ?? fallback;
};

const extractFilename = (url) => url.substring(url.lastIndexOf("/") + 1);


// =====================================================================
// Comment row
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
    <div className={`tk-comment${isAuthor ? " is-mine" : ""}`}>
      <div className="tk-comment-head">
        <span className="tk-comment-author">
          {isAuthor ? "🙋 You" : `👤 ${comment.userId.slice(0, 8)}`}
        </span>
        <span className="tk-comment-date">
          {formatDateTime(comment.createdAt)}
          {comment.updatedAt !== comment.createdAt && (
            <span className="tk-comment-edited"> · edited</span>
          )}
        </span>
      </div>

      {!isEditing && <p className="tk-comment-text">{comment.text}</p>}

      {isEditing && (
        <textarea
          className="tk-textarea"
          rows={3}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          style={{ marginBottom: 10 }}
        />
      )}

      <div className="tk-comment-actions">
        {!isEditing && canEdit && (
          <button type="button" className="tk-btn tk-btn-light" onClick={() => setIsEditing(true)}>
            ✏  Edit
          </button>
        )}
        {!isEditing && canDelete && (
          <button
            type="button"
            className="tk-btn tk-btn-danger"
            onClick={onClickDelete}
            disabled={busy}
          >
            {busy ? "Deleting..." : "🗑  Delete"}
          </button>
        )}
        {isEditing && (
          <>
            <button
              type="button"
              className="tk-btn tk-btn-primary"
              onClick={onSave}
              disabled={busy || !draft.trim()}
            >
              {busy ? "Saving..." : "💾 Save"}
            </button>
            <button
              type="button"
              className="tk-btn tk-btn-light"
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
  const [attachmentBlobs, setAttachmentBlobs] = useState([]);
  const [users, setUsers] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  // userId -> user, so we can show names instead of id fragments.
  const userMap = useMemo(() => {
    const map = new Map();
    for (const u of users) {
      if (u?.id) map.set(u.id, u);
    }
    return map;
  }, [users]);

  const [newComment, setNewComment] = useState("");

  const [showResolveForm, setShowResolveForm] = useState(false);
  const [resolveNotes, setResolveNotes] = useState("");

  const [showRejectForm, setShowRejectForm] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  const fetchAll = useCallback(async () => {
    try {
      setLoading(true);
      const [ticketData, commentData] = await Promise.all([
        getTicketById(id),
        getComments(id).catch(() => []),
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

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // Load users so we can resolve reporter + assignee ids to real names.
  // Fails silently for non-admin USERs who cannot hit /api/users; in that case
  // we fall back to id fragments (existing behavior).
  useEffect(() => {
    let cancelled = false;
    getUsers()
      .then((data) => { if (!cancelled) setUsers(Array.isArray(data) ? data : []); })
      .catch(() => { if (!cancelled) setUsers([]); });
    return () => { cancelled = true; };
  }, []);

  // Fetch attachments as blob URLs so the protected endpoint works with <img>.
  useEffect(() => {
    if (!ticket || !ticket.attachmentUrls || ticket.attachmentUrls.length === 0) {
      setAttachmentBlobs([]);
      return undefined;
    }

    let cancelled = false;
    const loaded = [];

    const loadAll = async () => {
      // Fetch all attachments in parallel so the gallery doesn't appear one
      // image at a time when a ticket has several images.
      const results = await Promise.allSettled(
        ticket.attachmentUrls.map(async (url) => {
          const filename = extractFilename(url);
          const blobUrl = await loadAttachmentBlob(ticket.id, filename);
          return { filename, url: blobUrl };
        }),
      );
      if (cancelled) {
        results.forEach((r) => {
          if (r.status === "fulfilled") URL.revokeObjectURL(r.value.url);
        });
        return;
      }
      results.forEach((r) => {
        if (r.status === "fulfilled") loaded.push(r.value);
      });
      setAttachmentBlobs(loaded.slice());
    };
    loadAll();

    return () => {
      cancelled = true;
      loaded.forEach((b) => URL.revokeObjectURL(b.url));
    };
  }, [ticket]);

  if (loading) {
    return (
      <section className="tk-page">
        <div className="tk-empty">
          <div className="tk-empty-icon">⏳</div>
          <p className="tk-empty-text">Loading ticket...</p>
        </div>
      </section>
    );
  }

  if (error && !ticket) {
    return (
      <section className="tk-page">
        <div className="tk-empty">
          <div className="tk-empty-icon">⚠️</div>
          <h3 className="tk-empty-title">Could not load ticket</h3>
          <p className="tk-empty-text">{error}</p>
          <div className="tk-empty-actions">
            <Link className="tk-btn tk-btn-primary" to="/tickets/my">Back to my tickets</Link>
          </div>
        </div>
      </section>
    );
  }

  if (!ticket) return null;

  // Permission flags used to decide which buttons appear.
  const isAdmin = user?.role === "ADMIN";
  const isOwner = user?.id === ticket.createdBy;
  const isAssignee = user?.id === ticket.assignedTo;

  const canStartWork = ticket.status === "ASSIGNED" && (isAssignee || isAdmin);
  const canResolve = ticket.status === "IN_PROGRESS" && (isAssignee || isAdmin);
  const canReject = isAdmin && ["OPEN", "ASSIGNED", "IN_PROGRESS"].includes(ticket.status);
  const canClose = ticket.status === "RESOLVED" && (isOwner || isAdmin);
  const canReopen = ticket.status === "RESOLVED" && (isOwner || isAdmin);
  const canDelete = isAdmin || (isOwner && ticket.status === "OPEN");

  const noActions = !canStartWork && !canResolve && !canReject && !canClose && !canReopen && !canDelete;

  // ---- handlers ----
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

  const cat = CATEGORY_META[ticket.category] ?? { label: ticket.category, icon: "📌" };

  return (
    <section className="tk-page">

      {/* HEADER */}
      <div className="tk-detail-head">
        <div className="tk-detail-title-row">
          <div>
            <h2 className="tk-detail-title">{ticket.title}</h2>
            <p className="tk-detail-sub">
              Reported {formatDateTime(ticket.createdAt)}
              {ticket.updatedAt !== ticket.createdAt &&
                ` · last updated ${formatDateTime(ticket.updatedAt)}`}
            </p>
          </div>
          <span className={`tk-pill is-${ticket.status}`}>
            {STATUS_LABELS[ticket.status] ?? ticket.status}
          </span>
        </div>

        <div className="tk-detail-info-grid">
          <div className="tk-detail-info-item">
            <span className="tk-detail-info-label">Category</span>
            <span className="tk-detail-info-value">{cat.icon} {cat.label}</span>
          </div>
          <div className="tk-detail-info-item">
            <span className="tk-detail-info-label">Priority</span>
            <span className="tk-detail-info-value">
              <span className={`tk-chip is-prio-${ticket.priority}`}>{ticket.priority}</span>
            </span>
          </div>
          <div className="tk-detail-info-item">
            <span className="tk-detail-info-label">Where</span>
            <span className="tk-detail-info-value">
              📍 {ticket.location || `Resource ${ticket.resourceId ?? "-"}`}
            </span>
          </div>
          <div className="tk-detail-info-item">
            <span className="tk-detail-info-label">Contact</span>
            <span className="tk-detail-info-value">{ticket.contactDetails}</span>
          </div>
          <div className="tk-detail-info-item">
            <span className="tk-detail-info-label">Reported by</span>
            <span className="tk-detail-info-value">
              {isOwner
                ? "🙋 You"
                : (userMap.get(ticket.createdBy)?.fullName
                   ?? userMap.get(ticket.createdBy)?.email
                   ?? ticket.createdBy?.slice(0, 8))}
            </span>
          </div>
          <div className="tk-detail-info-item">
            <span className="tk-detail-info-label">Assigned to</span>
            <span className="tk-detail-info-value">
              {ticket.assignedTo
                ? (isAssignee
                    ? "🙋 You"
                    : `🛠 ${userMap.get(ticket.assignedTo)?.fullName
                          ?? userMap.get(ticket.assignedTo)?.email
                          ?? ticket.assignedTo.slice(0, 8)}`)
                : "Nobody yet"}
            </span>
          </div>
        </div>

        <div className="tk-detail-description">{ticket.description}</div>

        {ticket.resolutionNotes && (
          <div className="tk-detail-callout is-resolution">
            <strong>✅ Resolution: </strong>{ticket.resolutionNotes}
          </div>
        )}

        {ticket.rejectionReason && (
          <div className="tk-detail-callout is-rejection">
            <strong>❌ Rejected: </strong>{ticket.rejectionReason}
          </div>
        )}
      </div>

      {/* ATTACHMENTS */}
      {ticket.attachmentUrls && ticket.attachmentUrls.length > 0 && (
        <div className="tk-section">
          <h3 className="tk-section-title">📷 Attachments</h3>
          <div className="tk-gallery">
            {attachmentBlobs.map((b) => (
              <a key={b.filename} className="tk-gallery-item" href={b.url} target="_blank" rel="noreferrer">
                <img src={b.url} alt={b.filename} />
              </a>
            ))}
            {attachmentBlobs.length < ticket.attachmentUrls.length && (
              <span className="tk-gallery-loading">
                Loading {ticket.attachmentUrls.length - attachmentBlobs.length} more...
              </span>
            )}
          </div>
        </div>
      )}

      {/* ACTIONS */}
      {!noActions && (
        <div className="tk-section">
          <h3 className="tk-section-title">⚙️ Actions</h3>
          {error && <div className="alert alert-error" style={{ marginBottom: 12 }}>{error}</div>}

          <div className="tk-action-panel">
            {canStartWork && (
              <button className="tk-btn tk-btn-primary" type="button" onClick={onStartWork} disabled={busy}>
                ▶  Start Work
              </button>
            )}
            {canResolve && !showResolveForm && (
              <button className="tk-btn tk-btn-primary" type="button" onClick={() => setShowResolveForm(true)} disabled={busy}>
                ✅ Resolve
              </button>
            )}
            {canReject && !showRejectForm && (
              <button className="tk-btn tk-btn-danger" type="button" onClick={() => setShowRejectForm(true)} disabled={busy}>
                ❌ Reject
              </button>
            )}
            {canClose && (
              <button className="tk-btn tk-btn-primary" type="button" onClick={onClose} disabled={busy}>
                📕 Close
              </button>
            )}
            {canReopen && (
              <button className="tk-btn tk-btn-light" type="button" onClick={onReopen} disabled={busy}>
                🔄 Re-open
              </button>
            )}
            {canDelete && (
              <button className="tk-btn tk-btn-danger" type="button" onClick={onDeleteTicket} disabled={busy}>
                🗑  Delete
              </button>
            )}
          </div>

          {showResolveForm && (
            <div className="tk-inline-form">
              <label className="tk-inline-form-label">What was done to fix it?</label>
              <textarea
                className="tk-textarea"
                rows={3}
                value={resolveNotes}
                onChange={(e) => setResolveNotes(e.target.value)}
                placeholder="Describe the fix..."
              />
              <div className="tk-inline-form-actions">
                <button className="tk-btn tk-btn-primary" type="button" onClick={onConfirmResolve} disabled={busy}>
                  {busy ? "Saving..." : "✅ Confirm Resolve"}
                </button>
                <button
                  className="tk-btn tk-btn-light"
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
            <div className="tk-inline-form">
              <label className="tk-inline-form-label">Reason for rejecting</label>
              <textarea
                className="tk-textarea"
                rows={3}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Why are you rejecting this ticket?"
              />
              <div className="tk-inline-form-actions">
                <button className="tk-btn tk-btn-danger" type="button" onClick={onConfirmReject} disabled={busy}>
                  {busy ? "Saving..." : "❌ Confirm Reject"}
                </button>
                <button
                  className="tk-btn tk-btn-light"
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

      {/* COMMENTS */}
      <div className="tk-section">
        <h3 className="tk-section-title">💬 Comments ({comments.length})</h3>

        {comments.length === 0 && (
          <p className="tk-comment-empty">No comments yet. Be the first to add one.</p>
        )}

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

        <div className="tk-comment-form">
          <div className="tk-field" style={{ marginBottom: 10 }}>
            <label className="tk-field-label">Add a comment</label>
            <textarea
              className="tk-textarea"
              rows={3}
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Write a comment..."
            />
          </div>
          <button
            className="tk-btn tk-btn-primary"
            type="button"
            onClick={onAddComment}
            disabled={!newComment.trim()}
          >
            💬 Post Comment
          </button>
        </div>
      </div>

      <div>
        <Link className="tk-btn tk-btn-light" to="/tickets/my">
          ← Back to my tickets
        </Link>
      </div>
    </section>
  );
};

export default TicketDetailsPage;
