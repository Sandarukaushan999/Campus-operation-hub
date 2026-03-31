import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createResource } from "../../../api/resourceApi";

const CreateResourcePage = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    location: "",
    capacity: 1,
    status: "AVAILABLE",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      await createResource({ ...form, capacity: Number(form.capacity) });
      navigate("/resources");
    } catch (err) {
      setError(err?.response?.data?.message ?? "Failed to create resource");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="card" style={{ maxWidth: 640 }}>
      <h2>Create Resource</h2>
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
        <button className="btn btn-primary" type="submit" disabled={loading}>
          {loading ? "Saving..." : "Create Resource"}
        </button>
      </form>
    </section>
  );
};

export default CreateResourcePage;