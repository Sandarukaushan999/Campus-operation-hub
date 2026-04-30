import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { createResource } from "../../../api/resourceApi";
import CustomSelect from "../../../components/common/CustomSelect";

const CreateResourcePage = () => {
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
  const [validationErrors, setValidationErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = "Name is required";
    if (!form.location.trim()) errs.location = "Location is required";
    if (!form.capacity || form.capacity < 1) errs.capacity = "Capacity must be at least 1";
    if (!form.availableDate) errs.availableDate = "Available date is required";
    if (!form.startTime) errs.startTime = "Start time is required";
    if (!form.endTime) errs.endTime = "End time is required";
    if (form.startTime && form.endTime && form.startTime >= form.endTime) {
      errs.endTime = "End time must be after start time";
    }
    setValidationErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const onSubmit = async (event) => {
    event.preventDefault();
    if (!validate()) return;
    
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

  const handleChange = (field) => (e) => {
    const val = e.target ? e.target.value : e;
    setForm((p) => ({ ...p, [field]: val }));
    if (validationErrors[field]) {
      setValidationErrors((p) => ({ ...p, [field]: null }));
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
        .rs-label.is-required::after {
          content: "*";
          color: #DC2626;
          margin-left: 4px;
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
        .rs-input:hover:not(.has-error), .rs-select:hover {
          border-color: #CBD5E1;
        }
        .rs-input:focus, .rs-select:focus {
          outline: none;
          background: #ffffff;
          border-color: #3B82F6;
          box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1);
        }
        .rs-input.has-error {
          border-color: #EF4444;
          background-color: #FEF2F2;
        }
        .rs-input.has-error:focus {
          border-color: #DC2626;
          box-shadow: 0 0 0 4px rgba(220, 38, 38, 0.1);
        }
        .rs-error-text {
          color: #DC2626;
          font-size: 13px;
          font-weight: 500;
          margin-top: -2px;
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
            <h1>Create New Resource</h1>
            <p>Add a new space or asset to the campus marketplace.</p>
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

        <form onSubmit={onSubmit} noValidate>
          <div className="rs-section">
            <h2 className="rs-section-title">Basic Information</h2>
            <div className="rs-form-grid">
              <div className="rs-form-group">
                <label htmlFor="name" className="rs-label is-required">Resource Name</label>
                <input 
                  id="name" 
                  className={`rs-input ${validationErrors.name ? "has-error" : ""}`} 
                  placeholder="e.g. Main Auditorium"
                  value={form.name} 
                  onChange={handleChange("name")} 
                />
                {validationErrors.name && <span className="rs-error-text">{validationErrors.name}</span>}
              </div>
              <div className="rs-row-2">
                <div className="rs-form-group">
                  <label htmlFor="location" className="rs-label is-required">Location</label>
                  <input 
                    id="location" 
                    className={`rs-input ${validationErrors.location ? "has-error" : ""}`} 
                    placeholder="e.g. Building A, Floor 1"
                    value={form.location} 
                    onChange={handleChange("location")} 
                  />
                  {validationErrors.location && <span className="rs-error-text">{validationErrors.location}</span>}
                </div>
                <div className="rs-form-group">
                  <label htmlFor="capacity" className="rs-label is-required">Capacity (People)</label>
                  <input 
                    id="capacity" 
                    className={`rs-input ${validationErrors.capacity ? "has-error" : ""}`} 
                    type="number" 
                    min="1" 
                    value={form.capacity} 
                    onChange={handleChange("capacity")} 
                  />
                  {validationErrors.capacity && <span className="rs-error-text">{validationErrors.capacity}</span>}
                </div>
              </div>
            </div>
          </div>

          <div className="rs-section">
            <h2 className="rs-section-title">Availability & Status</h2>
            <div className="rs-form-grid">
              <div className="rs-form-group">
                <label htmlFor="status" className="rs-label is-required">Current Status</label>
                <CustomSelect
                  id="status" 
                  className="rs-select" 
                  value={form.status} 
                  onChange={handleChange("status")}
                  options={[
                    { value: "AVAILABLE", label: "Available" },
                    { value: "UNAVAILABLE", label: "Unavailable" },
                    { value: "MAINTENANCE", label: "Maintenance" }
                  ]}
                />
              </div>
              <div className="rs-form-group">
                <label htmlFor="availableDate" className="rs-label is-required">Available Date</label>
                <input 
                  id="availableDate" 
                  className={`rs-input ${validationErrors.availableDate ? "has-error" : ""}`} 
                  type="date" 
                  value={form.availableDate} 
                  onChange={handleChange("availableDate")} 
                />
                {validationErrors.availableDate && <span className="rs-error-text">{validationErrors.availableDate}</span>}
              </div>
              <div className="rs-row-2">
                <div className="rs-form-group">
                  <label htmlFor="startTime" className="rs-label is-required">Available From</label>
                  <input 
                    id="startTime" 
                    className={`rs-input ${validationErrors.startTime ? "has-error" : ""}`} 
                    type="time" 
                    value={form.startTime} 
                    onChange={handleChange("startTime")} 
                  />
                  {validationErrors.startTime && <span className="rs-error-text">{validationErrors.startTime}</span>}
                </div>
                <div className="rs-form-group">
                  <label htmlFor="endTime" className="rs-label is-required">Available Until</label>
                  <input 
                    id="endTime" 
                    className={`rs-input ${validationErrors.endTime ? "has-error" : ""}`} 
                    type="time" 
                    value={form.endTime} 
                    onChange={handleChange("endTime")} 
                  />
                  {validationErrors.endTime && <span className="rs-error-text">{validationErrors.endTime}</span>}
                </div>
              </div>
            </div>
          </div>

          <div className="rs-actions">
            <Link to="/resources" className="rs-btn-cancel">Cancel</Link>
            <button className="rs-btn-primary" type="submit" disabled={loading}>
              {loading ? "Creating Resource..." : "Create Resource"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateResourcePage;