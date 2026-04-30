import { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { getResources, deleteResource } from "../../../api/resourceApi";
import useAuth from "../../../hooks/useAuth";
import CustomSelect from "../../../components/common/CustomSelect";

const ResourceListPage = () => {
  const { user } = useAuth();
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Delete Modal state
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, resourceId: null, isDeleting: false });

  const fetchData = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await getResources();
      setResources(data || []);
    } catch (err) {
      setError(err?.response?.data?.message ?? "Failed to load resources");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const confirmDelete = async () => {
    if (!deleteModal.resourceId) return;
    setDeleteModal(prev => ({ ...prev, isDeleting: true }));
    try {
      await deleteResource(deleteModal.resourceId);
      setResources((prev) => prev.filter((r) => r.id !== deleteModal.resourceId));
      setDeleteModal({ isOpen: false, resourceId: null, isDeleting: false });
    } catch (err) {
      alert(err?.response?.data?.message ?? "Failed to delete resource");
      setDeleteModal(prev => ({ ...prev, isDeleting: false }));
    }
  };

  const filteredResources = useMemo(() => {
    return resources.filter((r) => {
      const q = searchQuery.toLowerCase();
      const matchSearch = 
        (r.name && r.name.toLowerCase().includes(q)) ||
        (r.location && r.location.toLowerCase().includes(q)) ||
        (r.capacity && r.capacity.toString().includes(q));
      
      const matchStatus = statusFilter === "ALL" || r.status === statusFilter;
      
      return matchSearch && matchStatus;
    });
  }, [resources, searchQuery, statusFilter]);

  const renderStatusBadge = (status) => {
    let styleClass = "badge-gray";
    let label = status || "UNKNOWN";
    
    if (status === "AVAILABLE") styleClass = "badge-green";
    if (status === "MAINTENANCE") styleClass = "badge-yellow";
    if (status === "UNAVAILABLE" || status === "INACTIVE") styleClass = "badge-red";

    return <span className={`rm-badge ${styleClass}`}>{label}</span>;
  };

  return (
    <div className="rm-page-container">
      <style>{`
        .rm-page-container {
          min-height: 100vh;
          background-color: #F8FAFC;
          padding: 60px 24px;
          font-family: 'Inter', sans-serif;
          color: #0F172A;
        }
        .rm-content-wrapper {
          max-width: 1200px;
          margin: 0 auto;
          animation: fade-in 0.4s ease-out forwards;
        }

        @keyframes fade-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        /* Header */
        .rm-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          margin-bottom: 40px;
          flex-wrap: wrap;
          gap: 20px;
        }
        .rm-header-titles h1 {
          font-size: 34px;
          font-weight: 800;
          letter-spacing: -0.04em;
          margin: 0 0 8px 0;
          color: #0F172A;
        }
        .rm-header-titles p {
          font-size: 16px;
          color: #475569;
          margin: 0;
          font-weight: 450;
        }
        .rm-btn-primary {
          background: linear-gradient(135deg, #2563EB, #1D4ED8);
          color: #ffffff;
          padding: 12px 28px;
          border-radius: 12px;
          font-size: 15px;
          font-weight: 700;
          border: none;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 10px;
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
          box-shadow: 0 4px 14px 0 rgba(37,99,235,0.25);
          text-decoration: none;
        }
        .rm-btn-primary:hover {
          transform: translateY(-3px) scale(1.02);
          box-shadow: 0 8px 24px rgba(37,99,235,0.35);
          color: #ffffff;
        }
        .rm-btn-primary:active {
          transform: translateY(0) scale(1);
        }

        /* Toolbar */
        .rm-toolbar {
          background: #ffffff;
          border-radius: 16px;
          padding: 16px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 32px;
          border: 1px solid #E2E8F0;
          box-shadow: 0 4px 6px -1px rgba(0,0,0,0.02);
          flex-wrap: wrap;
          gap: 16px;
        }
        .rm-search-container {
          flex: 1;
          min-width: 280px;
          position: relative;
        }
        .rm-search-container svg {
          position: absolute;
          left: 16px;
          top: 50%;
          transform: translateY(-50%);
          color: #94A3B8;
          transition: color 0.2s;
        }
        .rm-search-input {
          width: 100%;
          height: 48px;
          padding: 0 16px 0 48px;
          border-radius: 12px;
          border: 1px solid #E2E8F0;
          background: #F8FAFC;
          font-size: 15px;
          color: #0F172A;
          transition: all 0.2s;
          font-weight: 500;
        }
        .rm-search-input:focus {
          outline: none;
          background: #ffffff;
          border-color: #3B82F6;
          box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1);
        }
        .rm-search-input:focus + svg {
          color: #3B82F6;
        }
        
        .rm-filters {
          display: flex;
          gap: 12px;
        }
        .rm-select {
          height: 48px;
          padding: 0 40px 0 16px;
          border-radius: 12px;
          border: 1px solid #E2E8F0;
          background: #ffffff;
          font-size: 15px;
          font-weight: 600;
          color: #334155;
          cursor: pointer;
          appearance: none;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%2364748B' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 16px center;
          transition: all 0.2s;
        }
        .rm-select:focus {
          outline: none;
          border-color: #3B82F6;
          box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1);
        }

        /* Grid */
        .rm-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 24px;
        }

        /* Resource Card */
        .rm-card {
          background: #ffffff;
          border-radius: 20px;
          border: 1px solid #E2E8F0;
          box-shadow: 0 12px 32px -4px rgba(0,0,0,0.03), 0 4px 6px -2px rgba(0,0,0,0.01);
          overflow: hidden;
          transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.3s cubic-bezier(0.16, 1, 0.3, 1);
          display: flex;
          flex-direction: column;
          position: relative;
        }
        .rm-card:hover {
          transform: translateY(-6px) scale(1.02);
          box-shadow: 0 24px 48px -12px rgba(0,0,0,0.08), 0 10px 15px -5px rgba(0,0,0,0.04);
          border-color: #CBD5E1;
        }
        .rm-card-image-placeholder {
          height: 110px;
          background: linear-gradient(135deg, #F8FAFC, #E2E8F0);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #94A3B8;
        }
        .rm-card-content {
          padding: 24px;
          flex: 1;
          display: flex;
          flex-direction: column;
        }
        .rm-card-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 16px;
          gap: 12px;
        }
        .rm-card-title {
          font-size: 18px;
          font-weight: 750;
          color: #0F172A;
          margin: 0;
          line-height: 1.3;
        }
        
        .rm-badge {
          display: inline-flex;
          align-items: center;
          padding: 4px 10px;
          border-radius: 999px;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 0.04em;
          text-transform: uppercase;
          white-space: nowrap;
        }
        .badge-green { background: #DCFCE7; color: #166534; }
        .badge-yellow { background: #FEF9C3; color: #854D0E; }
        .badge-red { background: #FEE2E2; color: #991B1B; }
        .badge-gray { background: #F1F5F9; color: #475569; }

        .rm-card-body {
          display: flex;
          flex-direction: column;
          gap: 12px;
          margin-bottom: 24px;
        }
        .rm-info-row {
          display: flex;
          align-items: center;
          gap: 10px;
          color: #475569;
          font-size: 14px;
          font-weight: 500;
        }
        .rm-info-row svg {
          color: #94A3B8;
          flex-shrink: 0;
        }

        .rm-card-footer {
          margin-top: auto;
          padding-top: 20px;
          border-top: 1px solid #F1F5F9;
          display: flex;
          gap: 12px;
        }
        
        .rm-btn-outline {
          flex: 1;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          background: #ffffff;
          border: 1px solid #E2E8F0;
          color: #334155;
          padding: 10px 16px;
          border-radius: 10px;
          font-weight: 650;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.2s;
          text-decoration: none;
        }
        .rm-btn-outline:hover {
          background: #F8FAFC;
          border-color: #CBD5E1;
          color: #0F172A;
        }
        
        .rm-btn-danger-outline {
          flex: 1;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          background: #ffffff;
          border: 1px solid #FECACA;
          color: #DC2626;
          padding: 10px 16px;
          border-radius: 10px;
          font-weight: 650;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.2s;
        }
        .rm-btn-danger-outline:hover {
          background: #FEF2F2;
          border-color: #F87171;
          color: #B91C1C;
        }

        /* Empty State */
        .rm-empty-state {
          grid-column: 1 / -1;
          background: #ffffff;
          border-radius: 16px;
          padding: 80px 20px;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          border: 1px dashed #CBD5E1;
          animation: fade-in 0.4s ease-out;
        }
        .rm-empty-icon {
          width: 80px;
          height: 80px;
          border-radius: 50%;
          background: #F1F5F9;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #94A3B8;
          margin-bottom: 24px;
        }
        .rm-empty-state h3 {
          font-size: 20px;
          font-weight: 750;
          color: #0F172A;
          margin: 0 0 10px;
        }
        .rm-empty-state p {
          color: #64748B;
          margin: 0 0 24px;
          font-size: 15px;
          max-width: 400px;
        }

        /* Skeleton Loaders */
        .rm-skeleton-card {
          background: #ffffff;
          border-radius: 16px;
          border: 1px solid #E2E8F0;
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }
        .rm-skeleton-img {
          height: 100px;
          background: #F1F5F9;
        }
        .rm-skeleton-body {
          padding: 24px;
        }
        .rm-skeleton-line {
          height: 20px;
          background: linear-gradient(90deg, #E2E8F0 25%, #F1F5F9 50%, #E2E8F0 75%);
          background-size: 400% 100%;
          animation: skeleton-loading 1.5s infinite ease-in-out;
          border-radius: 6px;
          margin-bottom: 16px;
        }
        .rm-skeleton-line.short {
          width: 60%;
        }
        @keyframes skeleton-loading {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }

        /* Modal */
        .rm-modal-overlay {
          position: fixed;
          top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(15, 23, 42, 0.6);
          backdrop-filter: blur(8px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          animation: modal-fade-in 0.2s ease-out;
        }
        .rm-modal {
          background: #ffffff;
          border-radius: 24px;
          padding: 40px;
          width: 100%;
          max-width: 440px;
          box-shadow: 0 25px 50px -12px rgba(0,0,0,0.3);
          animation: modal-slide-up 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }
        @keyframes modal-fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes modal-slide-up {
          from { opacity: 0; transform: translateY(30px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        .rm-modal-title {
          font-size: 22px;
          font-weight: 800;
          color: #0F172A;
          margin: 0 0 12px;
        }
        .rm-modal-desc {
          color: #475569;
          font-size: 15px;
          margin: 0 0 32px;
          line-height: 1.6;
        }
        .rm-modal-actions {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
        }

        @media (max-width: 992px) {
          .rm-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
        @media (max-width: 640px) {
          .rm-grid {
            grid-template-columns: 1fr;
          }
          .rm-header {
            flex-direction: column;
            align-items: flex-start;
          }
          .rm-search-container, .rm-filters {
            width: 100%;
          }
          .rm-select {
            width: 100%;
          }
        }
      `}</style>

      <div className="rm-content-wrapper">
        <header className="rm-header">
          <div className="rm-header-titles">
            <h1>Resources</h1>
            <p>Discover, manage, and book available campus spaces.</p>
          </div>
          {user?.role === "ADMIN" && (
            <Link to="/resources/create" className="rm-btn-primary">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
              Add Resource
            </Link>
          )}
        </header>

        {error && (
          <div style={{ background: '#FEF2F2', color: '#991B1B', padding: '16px', borderRadius: '12px', marginBottom: '24px', border: '1px solid #FCA5A5', fontWeight: 500 }}>
            {error}
          </div>
        )}

        <div className="rm-toolbar">
          <div className="rm-search-container">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            <input
              type="text"
              className="rm-search-input"
              placeholder="Search spaces by name, location, or capacity..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="rm-filters">
            <CustomSelect
              className="rm-select"
              value={statusFilter}
              onChange={(val) => setStatusFilter(val)}
              options={[
                { value: "ALL", label: "All Statuses" },
                { value: "AVAILABLE", label: "Available" },
                { value: "MAINTENANCE", label: "Maintenance" },
                { value: "UNAVAILABLE", label: "Unavailable" }
              ]}
            />
          </div>
        </div>

        <div className="rm-grid">
          {loading ? (
            Array.from({ length: 6 }).map((_, idx) => (
              <div key={idx} className="rm-skeleton-card">
                <div className="rm-skeleton-img"></div>
                <div className="rm-skeleton-body">
                  <div className="rm-skeleton-line"></div>
                  <div className="rm-skeleton-line short"></div>
                  <div className="rm-skeleton-line" style={{ marginTop: '24px' }}></div>
                </div>
              </div>
            ))
          ) : filteredResources.length > 0 ? (
            filteredResources.map((item, index) => (
              <div key={item.id} className="rm-card" style={{ animationDelay: `${index * 0.05}s`, animation: 'fade-in 0.4s ease-out forwards', opacity: 0 }}>
                <div className="rm-card-image-placeholder">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                    <line x1="3" y1="9" x2="21" y2="9"></line>
                    <line x1="9" y1="21" x2="9" y2="9"></line>
                  </svg>
                </div>
                <div className="rm-card-content">
                  <div className="rm-card-header">
                    <h3 className="rm-card-title">{item.name}</h3>
                    {renderStatusBadge(item.status)}
                  </div>
                  
                  <div className="rm-card-body">
                    <div className="rm-info-row">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                        <circle cx="12" cy="10" r="3"></circle>
                      </svg>
                      {item.location || "No Location provided"}
                    </div>
                    
                    <div className="rm-info-row">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                        <circle cx="9" cy="7" r="4"></circle>
                        <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                        <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                      </svg>
                      Capacity: {item.capacity || "N/A"}
                    </div>

                    {(item.availableDate || item.startTime) && (
                      <div className="rm-info-row" style={{ marginTop: '4px', fontSize: '13px' }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                          <line x1="16" y1="2" x2="16" y2="6"></line>
                          <line x1="8" y1="2" x2="8" y2="6"></line>
                          <line x1="3" y1="10" x2="21" y2="10"></line>
                        </svg>
                        {item.availableDate} {item.startTime && item.endTime ? `(${item.startTime} - ${item.endTime})` : ""}
                      </div>
                    )}
                  </div>

                  {user?.role === "ADMIN" && (
                    <div className="rm-card-footer">
                      <Link to={`/resources/update/${item.id}`} className="rm-btn-outline">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                        </svg>
                        Edit
                      </Link>
                      <button 
                        className="rm-btn-danger-outline" 
                        onClick={() => setDeleteModal({ isOpen: true, resourceId: item.id, isDeleting: false })}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="3 6 5 6 21 6"></polyline>
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                        </svg>
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="rm-empty-state">
              <div className="rm-empty-icon">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                  <polyline points="9 22 9 12 15 12 15 22"></polyline>
                </svg>
              </div>
              <h3>No Resources Found</h3>
              <p>We couldn't find any resources matching your search or filter criteria.</p>
              {user?.role === "ADMIN" && (
                <Link to="/resources/create" className="rm-btn-primary" style={{ marginTop: '8px' }}>
                  Add First Resource
                </Link>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteModal.isOpen && (
        <div className="rm-modal-overlay">
          <div className="rm-modal">
            <h3 className="rm-modal-title">Delete Resource</h3>
            <p className="rm-modal-desc">
              Are you sure you want to permanently delete this resource? This action cannot be undone and will cancel any associated bookings.
            </p>
            <div className="rm-modal-actions">
              <button 
                className="rm-btn-outline" 
                onClick={() => setDeleteModal({ isOpen: false, resourceId: null, isDeleting: false })}
                disabled={deleteModal.isDeleting}
              >
                Cancel
              </button>
              <button 
                className="rm-btn-primary" 
                style={{ background: 'linear-gradient(135deg, #DC2626, #B91C1C)', boxShadow: '0 4px 12px rgba(220,38,38,0.25)' }}
                onClick={confirmDelete}
                disabled={deleteModal.isDeleting}
              >
                {deleteModal.isDeleting ? "Deleting..." : "Yes, Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResourceListPage;