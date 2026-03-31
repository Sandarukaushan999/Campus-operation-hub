import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { createBooking } from "../../../api/bookingApi";
import { getResources } from "../../../api/resourceApi";

const CreateBookingPage = () => {
  const navigate = useNavigate();
  const [resources, setResources] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    resourceId: "",
    title: "",
    purpose: "",
    date: "",
    startTime: "",
    endTime: "",
  });

  useEffect(() => {
    const fetchResources = async () => {
      try {
        const data = await getResources();
        setResources(data);
        if (data.length > 0) {
          setForm((prev) => ({ ...prev, resourceId: data[0].id }));
        }
      } catch {
        setError("Could not load resources for booking.");
      }
    };

    fetchResources();
  }, []);

  const onSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      const created = await createBooking(form);
      navigate(`/bookings/${created.id}`);
    } catch (err) {
      setError(err?.response?.data?.message ?? "Failed to create booking");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="card" style={{ maxWidth: 720 }}>
      <h2>Create Booking</h2>
      {error && <div className="alert alert-error">{error}</div>}

      <form className="grid" onSubmit={onSubmit}>
        <div className="form-field">
          <label htmlFor="resourceId">Resource</label>
          <select id="resourceId" className="input" value={form.resourceId} onChange={(e) => setForm((p) => ({ ...p, resourceId: e.target.value }))} required>
            {resources.map((resource) => (
              <option key={resource.id} value={resource.id}>{resource.name} - {resource.location}</option>
            ))}
          </select>
        </div>

        <div className="form-field">
          <label htmlFor="title">Title</label>
          <input id="title" className="input" value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} required />
        </div>

        <div className="form-field">
          <label htmlFor="purpose">Purpose</label>
          <textarea id="purpose" className="input" value={form.purpose} onChange={(e) => setForm((p) => ({ ...p, purpose: e.target.value }))} rows={3} />
        </div>

        <div className="grid grid-2">
          <div className="form-field">
            <label htmlFor="date">Date</label>
            <input id="date" className="input" type="date" value={form.date} onChange={(e) => setForm((p) => ({ ...p, date: e.target.value }))} required />
          </div>
          <div className="form-field">
            <label htmlFor="startTime">Start Time</label>
            <input id="startTime" className="input" type="time" value={form.startTime} onChange={(e) => setForm((p) => ({ ...p, startTime: e.target.value }))} required />
          </div>
        </div>

        <div className="form-field">
          <label htmlFor="endTime">End Time</label>
          <input id="endTime" className="input" type="time" value={form.endTime} onChange={(e) => setForm((p) => ({ ...p, endTime: e.target.value }))} required />
        </div>

        <button className="btn btn-primary" type="submit" disabled={loading}>
          {loading ? "Creating..." : "Create Booking"}
        </button>
      </form>
    </section>
  );
};

export default CreateBookingPage;