import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { getResourceById, updateResource } from "../../../api/resourceApi";
import CustomSelect from "../../../components/common/CustomSelect";

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

  return (
    <div className="rs-form-page">
      <style>{`
        .rs-form-page {
          min-height: 100vh;
          background-color: #F8FAFC;
          padding: 60px 24px;
          font-family: 'Inter', sans-serif;
          color: #0F172A;
          animation: fade-in 0.4s ease-out;
        }
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .rs-form-container {
          max-width: 680px;
          margin: 0 auto;
        }
        
        .rs-header {
          margin-bottom: 32px;
          display: flex;
          align-items: center;
          gap: 16px;
        }
        .rs-back-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 40px;
          height: 40px;
          border-radius: 12px;
          background: #ffffff;
          border: 1px solid #E2E8F0;
          color: #64748B;
          transition: all 0.2s;
        }
        .rs-back-btn:hover {
          background: #F1F5F9;
          color: #0F172A;
          border-color: #CBD5E1;
        }
        .rs-header-titles h1 {
          font-size: 28px;
          font-weight: 800;
          letter-spacing: -0.03em;
          margin: 0 0 4px 0;
          color: #0F172A;
        }
        .rs-header-titles p {
          font-size: 15px;
          color: #64748B;
          margin: 0;
        }

        .rs-section {
          background: #ffffff;
          border-radius: 20px;
          border: 1px solid #E2E8F0;
          box-shadow: 0 12px 32px -4px rgba(0,0,0,0.03), 0 4px 6px -2px rgba(0,0,0,0.01);
          padding: 32px;
          margin-bottom: 24px;
        }
        .rs-section-title {
          font-size: 18px;
          font-weight: 700;
          color: #0F172A;
          margin: 0 0 24px;
          padding-bottom: 16px;
          border-bottom: 1px solid #F1F5F9;
        }

        .rs-form-grid {
          display: grid;
          gap: 20px;
        }
        .rs-form-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .rs-row-2 {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
        }

        .rs-label {
          font-size: 14px;
          font-weight: 600;
          color: #334155;
        }
        .rs-input, .rs-select {
          width: 100%;
          height: 48px;
          padding: 0 16px;
          border-radius: 12px;
          border: 1px solid #E2E8F0;
          background: #F8FAFC;
          font-size: 15px;
          color: #0F172A;
          transition: all 0.2s;
          font-family: 'Inter', sans-serif;
        }
        .rs-input:hover, .rs-select:hover {
          border-color: #CBD5E1;
        }
        .rs-input:focus, .rs-select:focus {
          outline: none;
          background: #ffffff;
          border-color: #3B82F6;
          box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1);
        }
        .rs-select {
          appearance: none;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%2364748B' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 16px center;
        }

        .rs-actions {
          display: flex;
          justify-content: flex-end;
          gap: 16px;
          margin-top: 32px;
        }
        .rs-btn-cancel {
          padding: 12px 24px;
          border-radius: 12px;
          font-size: 15px;
          font-weight: 650;
          background: #ffffff;
          border: 1px solid #E2E8F0;
          color: #475569;
          cursor: pointer;
          transition: all 0.2s;
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }
        .rs-btn-cancel:hover {
          background: #F8FAFC;
          color: #0F172A;
          border-color: #CBD5E1;
        }
        .rs-btn-primary {
          background: linear-gradient(135deg, #2563EB, #1D4ED8);
          color: #ffffff;
          padding: 12px 32px;
          border-radius: 12px;
          font-size: 15px;
          font-weight: 700;
          border: none;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
          box-shadow: 0 4px 14px 0 rgba(37,99,235,0.25);
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }
        .rs-btn-primary:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(37,99,235,0.35);
        }
        .rs-btn-primary:active:not(:disabled) {
          transform: translateY(0);
        }
        .rs-btn-primary:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .rs-alert {
          background-color: #FEF2F2;
          border: 1px solid #FCA5A5;
          color: #991B1B;
          padding: 16px 20px;
          border-radius: 12px;
          margin-bottom: 24px;
          font-weight: 500;
          display: flex;
          align-items: center;
          gap: 12px;
        }

        /* Skeleton loader */
        .rs-skeleton-box {
          height: 48px;
          background: linear-gradient(90deg, #E2E8F0 25%, #F1F5F9 50%, #E2E8F0 75%);
          background-size: 400% 100%;
          animation: skeleton-loading 1.5s infinite ease-in-out;
          border-radius: 12px;
          margin-bottom: 16px;
        }
        @keyframes skeleton-loading {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }

        @media (max-width: 640px) {
          .rs-row-2 { grid-template-columns: 1fr; }
          .rs-actions { flex-direction: column-reverse; }
          .rs-btn-cancel, .rs-btn-primary { width: 100%; }
        }
      `}</style>

      <div className="rs-form-container">
        <header className="rs-header">
          <Link to="/resources" className="rs-back-btn" title="Back to Resources">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12"></line>
              <polyline points="12 19 5 12 12 5"></polyline>
            </svg>
          </Link>
          <div className="rs-header-titles">
            <h1>Update Resource</h1>
            <p>Modify the details or availability of this campus space.</p>
          </div>
        </header>

        {error && (
          <div className="rs-alert">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            {error}
          </div>
        )}

        {fetching ? (
          <div className="rs-section">
            <div className="rs-skeleton-box" style={{ width: '30%', height: '24px', marginBottom: '32px' }}></div>
            <div className="rs-skeleton-box"></div>
            <div className="rs-row-2">
              <div className="rs-skeleton-box"></div>
              <div className="rs-skeleton-box"></div>
            </div>
          </div>
        ) : (
          <form onSubmit={onSubmit}>
            <div className="rs-section">
              <h2 className="rs-section-title">Basic Information</h2>
              <div className="rs-form-grid">
                <div className="rs-form-group">
                  <label htmlFor="name" className="rs-label">Resource Name</label>
                  <input 
                    id="name" 
                    className="rs-input" 
                    placeholder="e.g. Main Auditorium"
                    value={form.name} 
                    onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} 
                    required 
                  />
                </div>
                <div className="rs-row-2">
                  <div className="rs-form-group">
                    <label htmlFor="location" className="rs-label">Location</label>
                    <input 
                      id="location" 
                      className="rs-input" 
                      placeholder="e.g. Building A, Floor 1"
                      value={form.location} 
                      onChange={(e) => setForm((p) => ({ ...p, location: e.target.value }))} 
                      required 
                    />
                  </div>
                  <div className="rs-form-group">
                    <label htmlFor="capacity" className="rs-label">Capacity (People)</label>
                    <input 
                      id="capacity" 
                      className="rs-input" 
                      type="number" 
                      min="1" 
                      value={form.capacity} 
                      onChange={(e) => setForm((p) => ({ ...p, capacity: e.target.value }))} 
                      required 
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="rs-section">
              <h2 className="rs-section-title">Availability & Status</h2>
              <div className="rs-form-grid">
                <div className="rs-form-group">
                  <label htmlFor="status" className="rs-label">Current Status</label>
                  <CustomSelect
                    id="status" 
                    className="rs-select" 
                    value={form.status} 
                    onChange={(val) => setForm((p) => ({ ...p, status: val }))}
                    options={[
                      { value: "AVAILABLE", label: "Available" },
                      { value: "UNAVAILABLE", label: "Unavailable" },
                      { value: "MAINTENANCE", label: "Maintenance" }
                    ]}
                  />
                </div>
                <div className="rs-form-group">
                  <label htmlFor="availableDate" className="rs-label">Next Available Date (Optional)</label>
                  <input 
                    id="availableDate" 
                    className="rs-input" 
                    type="date" 
                    value={form.availableDate} 
                    onChange={(e) => setForm((p) => ({ ...p, availableDate: e.target.value }))} 
                  />
                </div>
                <div className="rs-row-2">
                  <div className="rs-form-group">
                    <label htmlFor="startTime" className="rs-label">Available From</label>
                    <input 
                      id="startTime" 
                      className="rs-input" 
                      type="time" 
                      value={form.startTime} 
                      onChange={(e) => setForm((p) => ({ ...p, startTime: e.target.value }))} 
                    />
                  </div>
                  <div className="rs-form-group">
                    <label htmlFor="endTime" className="rs-label">Available Until</label>
                    <input 
                      id="endTime" 
                      className="rs-input" 
                      type="time" 
                      value={form.endTime} 
                      onChange={(e) => setForm((p) => ({ ...p, endTime: e.target.value }))} 
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="rs-actions">
              <Link to="/resources" className="rs-btn-cancel">Cancel</Link>
              <button className="rs-btn-primary" type="submit" disabled={loading}>
                {loading ? "Saving Changes..." : "Update Resource"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default UpdateResourcePage;
