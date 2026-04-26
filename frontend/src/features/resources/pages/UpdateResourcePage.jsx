import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getResourceById, updateResource } from "../../../api/resourceApi";

const UpdateResourcePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    location: "",
    capacity: 1,
    status: "AVAILABLE",
    availableDate: "",
    startTime: "",
    endTime: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    const fetchResource = async () => {
      try {
        const data = await getResourceById(id);
        setForm({
          name: data.name || "",
          location: data.location || "",
          capacity: data.capacity || 1,
          status: data.status || "AVAILABLE",
          availableDate: data.availableDate || "",
          startTime: data.startTime || "",
          endTime: data.endTime || "",
        });
      } catch (err) {
        setError("Failed to load resource details");
      } finally {
        setFetching(false);
      }
    };
    fetchResource();
  }, [id]);

  const onSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      await updateResource(id, { ...form, capacity: Number(form.capacity) });
      navigate("/resources");
    } catch (err) {
      setError(err?.response?.data?.message ?? "Failed to update resource");
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return <div className="card">Loading resource...</div>;
  }

  return (
    <section className="card" style={{ maxWidth: 640 }}>
      <h2>Update Resource</h2>
      {error && <div className="alert alert-error">{error}</div>}
      <form className="grid" onSubmit={onSubmit}>
        <div className="form-field">
          <label htmlFor="name">Name</label>
          <input id="name" className="input" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} required />
        </div>
        <div className="form-field">
          <label htmlFor="location">Location</label>
          <input id="location" className="input" value={form.location} onChange={(e) => setForm((p) => ({ ...p, location: e.target.value }))} required />
        </div>
        <div className="form-field">
          <label htmlFor="capacity">Capacity</label>
          <input id="capacity" className="input" type="number" min="1" value={form.capacity} onChange={(e) => setForm((p) => ({ ...p, capacity: e.target.value }))} required />
        </div>
        <div className="form-field">
          <label htmlFor="status">Status</label>
          <select id="status" className="input" value={form.status} onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))}>
            <option value="AVAILABLE">AVAILABLE</option>
            <option value="UNAVAILABLE">UNAVAILABLE</option>
            <option value="MAINTENANCE">MAINTENANCE</option>
          </select>
        </div>
        <div className="form-field">
          <label htmlFor="availableDate">Available Date</label>
          <input id="availableDate" className="input" type="date" value={form.availableDate} onChange={(e) => setForm((p) => ({ ...p, availableDate: e.target.value }))} />
        </div>
        <div className="form-field" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
          <div>
            <label htmlFor="startTime">Start Time</label>
            <input id="startTime" className="input" type="time" value={form.startTime} onChange={(e) => setForm((p) => ({ ...p, startTime: e.target.value }))} />
          </div>
          <div>
            <label htmlFor="endTime">End Time</label>
            <input id="endTime" className="input" type="time" value={form.endTime} onChange={(e) => setForm((p) => ({ ...p, endTime: e.target.value }))} />
          </div>
        </div>
        <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
          <button className="btn btn-primary" type="submit" disabled={loading}>
            {loading ? "Saving..." : "Update Resource"}
          </button>
          <button className="btn btn-light" type="button" onClick={() => navigate("/resources")} disabled={loading}>
            Cancel
          </button>
        </div>
      </form>
    </section>
  );
};

export default UpdateResourcePage;
