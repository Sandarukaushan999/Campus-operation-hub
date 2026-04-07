import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { createTicket } from "../../../api/ticketApi";
import { getResources } from "../../../api/resourceApi";
import "../tickets.css";

// Hard limits we share with the backend (FileStorageService and TicketServiceImpl).
const MAX_ATTACHMENTS = 3;
const MAX_FILE_SIZE_BYTES = 2 * 1024 * 1024; // 2 MB
const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/webp"];

const CATEGORIES = [
  { value: "ELECTRICAL",   label: "Electrical",    icon: "⚡" },
  { value: "NETWORK",      label: "Network / WiFi", icon: "📡" },
  { value: "FURNITURE",    label: "Furniture",     icon: "🪑" },
  { value: "IT_EQUIPMENT", label: "IT Equipment",  icon: "💻" },
  { value: "PLUMBING",     label: "Plumbing",      icon: "🚰" },
  { value: "OTHER",        label: "Other",         icon: "📌" },
];

const PRIORITIES = [
  { value: "LOW",    label: "Low" },
  { value: "MEDIUM", label: "Medium" },
  { value: "HIGH",   label: "High" },
  { value: "URGENT", label: "Urgent" },
];

const parseErrorMessage = (err, fallback) => {
  const details = err?.response?.data?.details;
  if (Array.isArray(details) && details.length > 0) return details[0];
  return err?.response?.data?.message ?? fallback;
};

const CreateTicketPage = () => {
  const navigate = useNavigate();

  const [resources, setResources] = useState([]);
  const [form, setForm] = useState({
    resourceId: "",
    location: "",
    title: "",
    description: "",
    category: "IT_EQUIPMENT",
    priority: "MEDIUM",
    contactDetails: "",
  });

  const [files, setFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchResources = async () => {
      try {
        const data = await getResources();
        setResources(data);
      } catch {
        setResources([]);
      }
    };
    fetchResources();
  }, []);

  // Free preview object URLs when the page goes away.
  useEffect(() => {
    return () => previews.forEach((url) => URL.revokeObjectURL(url));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onField = (name, value) => setForm((prev) => ({ ...prev, [name]: value }));

  const onFilesChange = (event) => {
    setError("");
    const picked = Array.from(event.target.files ?? []);
    if (picked.length === 0) return;

    if (picked.length > MAX_ATTACHMENTS) {
      setError(`You can attach at most ${MAX_ATTACHMENTS} images`);
      event.target.value = "";
      return;
    }

    for (const file of picked) {
      if (!ALLOWED_TYPES.includes(file.type)) {
        setError(`"${file.name}" is not a supported image type (PNG, JPEG, WEBP only)`);
        event.target.value = "";
        return;
      }
      if (file.size > MAX_FILE_SIZE_BYTES) {
        setError(`"${file.name}" is too large (max 2 MB per image)`);
        event.target.value = "";
        return;
      }
    }

    previews.forEach((url) => URL.revokeObjectURL(url));
    setFiles(picked);
    setPreviews(picked.map((file) => URL.createObjectURL(file)));
  };

  const removeFile = (index) => {
    URL.revokeObjectURL(previews[index]);
    setFiles((prev) => prev.filter((_, i) => i !== index));
    setPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const onSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (!form.resourceId && !form.location.trim()) {
      setError("Please pick a resource or enter a location");
      return;
    }
    if (!form.title.trim())          return setError("Title is required");
    if (!form.description.trim())    return setError("Description is required");
    if (!form.contactDetails.trim()) return setError("Contact details are required");

    const formData = new FormData();
    if (form.resourceId)        formData.append("resourceId", form.resourceId);
    if (form.location.trim())   formData.append("location", form.location.trim());
    formData.append("title", form.title.trim());
    formData.append("description", form.description.trim());
    formData.append("category", form.category);
    formData.append("priority", form.priority);
    formData.append("contactDetails", form.contactDetails.trim());
    files.forEach((file) => formData.append("attachments", file));

    setSubmitting(true);
    try {
      const created = await createTicket(formData);
      navigate(`/tickets/${created.id}`);
    } catch (err) {
      setError(parseErrorMessage(err, "Failed to create ticket"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="tk-page">
      <div className="tk-form-card">

        <div className="tk-form-header">
          <h2 className="tk-form-title">📝 Report an Incident</h2>
          <p className="tk-form-sub">
            Tell us where the problem is and what happened.
            You can attach up to {MAX_ATTACHMENTS} photos.
          </p>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={onSubmit}>

          {/* SECTION 1 - Where */}
          <div className="tk-form-section">
            <h3 className="tk-form-section-title">Where is the problem?</h3>
            <div className="tk-form-grid">
              <div className="tk-field">
                <label className="tk-field-label" htmlFor="resourceId">Resource (optional)</label>
                <select
                  id="resourceId"
                  className="tk-select"
                  value={form.resourceId}
                  onChange={(e) => onField("resourceId", e.target.value)}
                  disabled={resources.length === 0}
                >
                  <option value="" disabled hidden>
                    {resources.length === 0 ? "No resources available" : "Select a resource..."}
                  </option>
                  <option value="">— None / use location instead —</option>
                  {resources.map((r) => (
                    <option key={r.id} value={r.id}>{r.name} — {r.location}</option>
                  ))}
                </select>
                {resources.length === 0 && (
                  <small style={{ color: "var(--muted)", fontSize: 12 }}>
                    No resources in the system yet. Type a location on the right instead.
                  </small>
                )}
              </div>

              <div className="tk-field">
                <label className="tk-field-label" htmlFor="location">Or location (free text)</label>
                <input
                  id="location"
                  className="tk-input"
                  placeholder="e.g. Block A, Room 12"
                  value={form.location}
                  onChange={(e) => onField("location", e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* SECTION 2 - What */}
          <div className="tk-form-section">
            <h3 className="tk-form-section-title">What is the problem?</h3>

            <div className="tk-field" style={{ marginBottom: 14 }}>
              <label className="tk-field-label" htmlFor="title">Title</label>
              <input
                id="title"
                className="tk-input"
                placeholder="Short summary"
                value={form.title}
                onChange={(e) => onField("title", e.target.value)}
                required
              />
            </div>

            <div className="tk-field" style={{ marginBottom: 14 }}>
              <label className="tk-field-label" htmlFor="description">Description</label>
              <textarea
                id="description"
                className="tk-textarea"
                rows={5}
                placeholder="Describe what happened, when, and any details that might help"
                value={form.description}
                onChange={(e) => onField("description", e.target.value)}
                required
              />
            </div>

            <div className="tk-form-grid">
              <div className="tk-field">
                <label className="tk-field-label" htmlFor="category">Category</label>
                <select
                  id="category"
                  className="tk-select"
                  value={form.category}
                  onChange={(e) => onField("category", e.target.value)}
                >
                  {CATEGORIES.map((c) => (
                    <option key={c.value} value={c.value}>{c.icon}  {c.label}</option>
                  ))}
                </select>
              </div>

              <div className="tk-field">
                <label className="tk-field-label" htmlFor="priority">Priority</label>
                <select
                  id="priority"
                  className="tk-select"
                  value={form.priority}
                  onChange={(e) => onField("priority", e.target.value)}
                >
                  {PRIORITIES.map((p) => (
                    <option key={p.value} value={p.value}>{p.label}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* SECTION 3 - Contact */}
          <div className="tk-form-section">
            <h3 className="tk-form-section-title">How can we reach you?</h3>
            <div className="tk-field">
              <label className="tk-field-label" htmlFor="contactDetails">Contact details</label>
              <input
                id="contactDetails"
                className="tk-input"
                placeholder="Phone or email so the technician can reach you"
                value={form.contactDetails}
                onChange={(e) => onField("contactDetails", e.target.value)}
                required
              />
            </div>
          </div>

          {/* SECTION 4 - Attachments */}
          <div className="tk-form-section">
            <h3 className="tk-form-section-title">Image attachments (optional)</h3>

            <div className="tk-filepicker-wrap">
              <input
                id="ticket-attachments"
                className="tk-filepicker-input"
                type="file"
                accept="image/png,image/jpeg,image/webp"
                multiple
                onChange={onFilesChange}
              />
              <label htmlFor="ticket-attachments" className="tk-filepicker-label">
                <div className="tk-filepicker-icon">📁</div>
                <div className="tk-filepicker-text">
                  <strong>Click to choose images</strong>
                  <br />
                  Up to {MAX_ATTACHMENTS} files · 2 MB each · PNG, JPEG or WEBP
                </div>
              </label>
            </div>

            {previews.length > 0 && (
              <div className="tk-preview-grid">
                {previews.map((url, index) => (
                  <div key={url} className="tk-preview">
                    <img src={url} alt={`attachment ${index + 1}`} />
                    <button
                      type="button"
                      className="tk-preview-remove"
                      onClick={() => removeFile(index)}
                      aria-label="Remove image"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Submit / cancel */}
          <div className="tk-form-actions">
            <button
              type="submit"
              className="tk-btn tk-btn-primary"
              disabled={submitting}
            >
              {submitting ? "Submitting..." : "🚀 Submit Ticket"}
            </button>
            <button
              type="button"
              className="tk-btn tk-btn-light"
              onClick={() => navigate("/tickets/my")}
              disabled={submitting}
            >
              Cancel
            </button>
          </div>

        </form>
      </div>
    </section>
  );
};

export default CreateTicketPage;
