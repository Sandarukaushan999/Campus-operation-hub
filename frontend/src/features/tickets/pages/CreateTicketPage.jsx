import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { createTicket } from "../../../api/ticketApi";
import { getResources } from "../../../api/resourceApi";

// Hard limits we share with the backend (FileStorageService and TicketServiceImpl).
// Keep them in sync if the backend numbers change.
const MAX_ATTACHMENTS = 3;
const MAX_FILE_SIZE_BYTES = 2 * 1024 * 1024; // 2 MB
const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/webp"];

const CATEGORIES = [
  { value: "ELECTRICAL", label: "Electrical" },
  { value: "NETWORK", label: "Network / WiFi" },
  { value: "FURNITURE", label: "Furniture" },
  { value: "IT_EQUIPMENT", label: "IT Equipment" },
  { value: "PLUMBING", label: "Plumbing" },
  { value: "OTHER", label: "Other" },
];

const PRIORITIES = [
  { value: "LOW", label: "Low" },
  { value: "MEDIUM", label: "Medium" },
  { value: "HIGH", label: "High" },
  { value: "URGENT", label: "Urgent" },
];

// Pull a friendly error message out of an axios error response.
const parseErrorMessage = (err, fallback) => {
  const details = err?.response?.data?.details;
  if (Array.isArray(details) && details.length > 0) {
    return details[0];
  }
  return err?.response?.data?.message ?? fallback;
};

const CreateTicketPage = () => {
  const navigate = useNavigate();

  // Form state
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

  // Selected files (real File objects) and their preview URLs (object URLs).
  // We keep them as parallel arrays so we can revoke the preview URLs cleanly.
  const [files, setFiles] = useState([]);
  const [previews, setPreviews] = useState([]);

  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Load the list of resources for the dropdown. The user can also leave
  // the dropdown blank and type a free-text location instead.
  useEffect(() => {
    const fetchResources = async () => {
      try {
        const data = await getResources();
        setResources(data);
      } catch {
        // Not fatal - the user can still type a location instead.
        setResources([]);
      }
    };
    fetchResources();
  }, []);

  // When the component unmounts, free any object URLs we created so the
  // browser does not hold them in memory forever.
  useEffect(() => {
    return () => {
      previews.forEach((url) => URL.revokeObjectURL(url));
    };
    // We intentionally leave previews out of the deps - we only want this
    // cleanup to run when the page goes away.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onField = (name, value) => {
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  // Handle file picker change. Validates count, type and size client-side
  // so the user gets feedback before we even hit the network.
  const onFilesChange = (event) => {
    setError("");

    const picked = Array.from(event.target.files ?? []);
    if (picked.length === 0) {
      return;
    }

    if (picked.length > MAX_ATTACHMENTS) {
      setError(`You can attach at most ${MAX_ATTACHMENTS} images`);
      event.target.value = "";
      return;
    }

    for (const file of picked) {
      if (!ALLOWED_TYPES.includes(file.type)) {
        setError(`"${file.name}" is not a supported image type (png, jpeg, webp only)`);
        event.target.value = "";
        return;
      }
      if (file.size > MAX_FILE_SIZE_BYTES) {
        setError(`"${file.name}" is too large (max 2 MB per image)`);
        event.target.value = "";
        return;
      }
    }

    // Free old preview URLs before replacing them.
    previews.forEach((url) => URL.revokeObjectURL(url));

    setFiles(picked);
    setPreviews(picked.map((file) => URL.createObjectURL(file)));
  };

  // Remove one selected file and its preview.
  const removeFile = (index) => {
    URL.revokeObjectURL(previews[index]);
    setFiles((prev) => prev.filter((_, i) => i !== index));
    setPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const onSubmit = async (event) => {
    event.preventDefault();
    setError("");

    // The user must point at a resource OR type a location. The backend
    // checks the same thing - we just give a faster error here.
    if (!form.resourceId && !form.location.trim()) {
      setError("Please pick a resource or enter a location");
      return;
    }
    if (!form.title.trim()) {
      setError("Title is required");
      return;
    }
    if (!form.description.trim()) {
      setError("Description is required");
      return;
    }
    if (!form.contactDetails.trim()) {
      setError("Contact details are required");
      return;
    }

    // Build the multipart body. We append every text field, then every file.
    const formData = new FormData();
    if (form.resourceId) formData.append("resourceId", form.resourceId);
    if (form.location.trim()) formData.append("location", form.location.trim());
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
    <section className="grid">
      <div className="card">
        <div className="spread">
          <div>
            <h2>Report an Incident</h2>
            <p className="muted">
              Tell us where the problem is and what happened. You can attach up to {MAX_ATTACHMENTS} images.
            </p>
          </div>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <form className="grid" onSubmit={onSubmit}>

          {/* Where is the problem? */}
          <div className="grid grid-2">
            <div className="form-field">
              <label htmlFor="resourceId">Resource (optional)</label>
              <select
                id="resourceId"
                className="input"
                value={form.resourceId}
                onChange={(e) => onField("resourceId", e.target.value)}
              >
                <option value="">-- pick a resource --</option>
                {resources.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name} - {r.location}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-field">
              <label htmlFor="location">Or location (free text)</label>
              <input
                id="location"
                className="input"
                placeholder="e.g. Block A, Room 12"
                value={form.location}
                onChange={(e) => onField("location", e.target.value)}
              />
            </div>
          </div>

          {/* What is the problem? */}
          <div className="form-field">
            <label htmlFor="title">Title</label>
            <input
              id="title"
              className="input"
              placeholder="Short summary"
              value={form.title}
              onChange={(e) => onField("title", e.target.value)}
              required
            />
          </div>

          <div className="form-field">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              className="input"
              rows={5}
              placeholder="Describe what happened, when, and any details that might help"
              value={form.description}
              onChange={(e) => onField("description", e.target.value)}
              required
            />
          </div>

          <div className="grid grid-2">
            <div className="form-field">
              <label htmlFor="category">Category</label>
              <select
                id="category"
                className="input"
                value={form.category}
                onChange={(e) => onField("category", e.target.value)}
              >
                {CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>

            <div className="form-field">
              <label htmlFor="priority">Priority</label>
              <select
                id="priority"
                className="input"
                value={form.priority}
                onChange={(e) => onField("priority", e.target.value)}
              >
                {PRIORITIES.map((p) => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Contact */}
          <div className="form-field">
            <label htmlFor="contactDetails">Contact details</label>
            <input
              id="contactDetails"
              className="input"
              placeholder="Phone or email so the technician can reach you"
              value={form.contactDetails}
              onChange={(e) => onField("contactDetails", e.target.value)}
              required
            />
          </div>

          {/* Attachments */}
          <div className="form-field">
            <label htmlFor="attachments">
              Image attachments (up to {MAX_ATTACHMENTS}, 2 MB each)
            </label>
            <input
              id="attachments"
              className="input"
              type="file"
              accept="image/png,image/jpeg,image/webp"
              multiple
              onChange={onFilesChange}
            />

            {previews.length > 0 && (
              <div className="row" style={{ marginTop: 10, flexWrap: "wrap" }}>
                {previews.map((url, index) => (
                  <div key={url} style={{ position: "relative" }}>
                    <img
                      src={url}
                      alt={`attachment ${index + 1}`}
                      style={{
                        width: 120,
                        height: 120,
                        objectFit: "cover",
                        borderRadius: 8,
                        border: "1px solid #ddd",
                      }}
                    />
                    <button
                      type="button"
                      className="btn btn-danger"
                      style={{
                        position: "absolute",
                        top: 4,
                        right: 4,
                        padding: "2px 8px",
                        fontSize: 12,
                      }}
                      onClick={() => removeFile(index)}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="row">
            <button
              type="submit"
              className="btn btn-primary"
              disabled={submitting}
            >
              {submitting ? "Submitting..." : "Submit Ticket"}
            </button>
            <button
              type="button"
              className="btn btn-light"
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
