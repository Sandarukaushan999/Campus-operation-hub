import { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { getAllBookings, approveBooking, rejectBooking } from "../../../api/bookingApi";
import { getUsers } from "../../../api/userApi";
import CustomSelect from "../../../components/common/CustomSelect";

const parseErr = (err, fallback) => {
  const details = err?.response?.data?.details;
  if (Array.isArray(details) && details.length > 0) return details[0];
  return err?.response?.data?.message ?? fallback;
};

const BookingListPage = () => {
  const [bookings, setBookings] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [pendingId, setPendingId] = useState("");

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Modals
  const [approveModal, setApproveModal] = useState({ isOpen: false, bookingId: null });
  const [rejectModal, setRejectModal] = useState({ isOpen: false, bookingId: null });
  const [rejectReason, setRejectReason] = useState("");

  const fetchBookings = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await getAllBookings();
      setBookings(data || []);
    } catch (err) {
      setError(parseErr(err, "Failed to load all bookings"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const confirmApprove = async () => {
    if (!approveModal.bookingId) return;
    setPendingId(approveModal.bookingId);
    setError("");
    setApproveModal({ isOpen: false, bookingId: null });
    
    try {
      await approveBooking(approveModal.bookingId, { note: "Approved by admin" });
      await fetchBookings();
    } catch (err) {
      setError(parseErr(err, "Failed to approve booking"));
    } finally {
      setPendingId("");
    }
  };

  const confirmReject = async () => {
    if (!rejectModal.bookingId) return;
    if (!rejectReason.trim()) {
      alert("A rejection reason is required.");
      return;
    }
    
    setPendingId(rejectModal.bookingId);
    setError("");
    const idToReject = rejectModal.bookingId;
    setRejectModal({ isOpen: false, bookingId: null });
    setRejectReason("");
    
    try {
      await rejectBooking(idToReject, { reason: rejectReason.trim() });
      await fetchBookings();
    } catch (err) {
      setError(parseErr(err, "Failed to reject booking"));
    } finally {
      setPendingId("");
    }
  };

  const filteredBookings = useMemo(() => {
    return bookings.filter(b => {
      const matchStatus = statusFilter === "ALL" || b.status === statusFilter;
      const matchSearch = 
        b.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.userId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.userName?.toLowerCase().includes(searchTerm.toLowerCase());
      return matchStatus && matchSearch;
    });
  }, [bookings, searchTerm, statusFilter]);

  const renderStatusBadge = (status) => {
    let styleClass = "badge-gray";
    let label = status || "UNKNOWN";
    
    if (status === "APPROVED") styleClass = "badge-green";
    if (status === "REJECTED") styleClass = "badge-red";
    if (status === "PENDING") styleClass = "badge-yellow";
    if (status === "CANCELLED") styleClass = "badge-gray";

    return <span className={`admin-badge ${styleClass}`}>{label}</span>;
  };

  return (
    <div className="admin-page-container">
      <style>{`
        .admin-page-container {
          min-height: 100vh;
          background-color: #F8FAFC;
          padding: 60px 24px;
          font-family: 'Inter', sans-serif;
          color: #0F172A;
        }
        .admin-content-wrapper {
          max-width: 1200px;
          margin: 0 auto;
          animation: fade-in 0.4s ease-out forwards;
        }
        
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        /* Header */
        .admin-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          margin-bottom: 40px;
        }
        .admin-header-actions {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .admin-header-titles h1 {
          font-size: 32px;
          font-weight: 800;
          letter-spacing: -0.03em;
          margin: 0 0 8px 0;
          color: #0F172A;
        }
        .admin-header-titles p {
          font-size: 16px;
          color: #475569;
          margin: 0;
          font-weight: 400;
        }
        .admin-btn-secondary {
          background-color: #ffffff;
          border: 1px solid #E2E8F0;
          color: #334155;
          font-weight: 600;
          font-size: 14px;
          padding: 10px 18px;
          border-radius: 12px;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 1px 3px rgba(0,0,0,0.05);
        }
        .admin-btn-secondary:hover {
          background-color: #F8FAFC;
          border-color: #CBD5E1;
          transform: translateY(-1px);
          box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);
        }
        .admin-btn-secondary:active {
          transform: translateY(0);
        }
        .admin-btn-primary-link {
          background: linear-gradient(135deg, #2563EB, #1D4ED8);
          color: #ffffff;
          border: 1px solid transparent;
          font-weight: 650;
          font-size: 14px;
          padding: 10px 18px;
          border-radius: 12px;
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 4px 12px rgba(37, 99, 235, 0.25);
        }
        .admin-btn-primary-link:hover {
          transform: translateY(-1px);
          box-shadow: 0 8px 16px rgba(37, 99, 235, 0.35);
        }

        /* Toolbar */
        .admin-toolbar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
          gap: 16px;
          flex-wrap: wrap;
        }
        .admin-search-box {
          position: relative;
          width: 360px;
        }
        .admin-search-box svg {
          position: absolute;
          left: 14px;
          top: 50%;
          transform: translateY(-50%);
          color: #94A3B8;
          transition: color 0.2s;
        }
        .admin-search-input {
          width: 100%;
          height: 46px;
          padding: 0 16px 0 44px;
          border-radius: 12px;
          border: 1px solid #E2E8F0;
          background: #ffffff;
          font-size: 14px;
          color: #0F172A;
          transition: all 0.2s;
          box-shadow: 0 1px 2px rgba(0,0,0,0.02);
          font-weight: 500;
        }
        .admin-search-input:hover {
          border-color: #CBD5E1;
        }
        .admin-search-input:focus {
          outline: none;
          border-color: #3B82F6;
          box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1);
        }
        .admin-search-input:focus + svg {
          color: #3B82F6;
        }
        
        .admin-filters {
          display: flex;
          gap: 12px;
        }
        .admin-select {
          height: 46px;
          padding: 0 40px 0 18px;
          border-radius: 12px;
          border: 1px solid #E2E8F0;
          background: #ffffff;
          font-size: 14px;
          font-weight: 600;
          color: #334155;
          cursor: pointer;
          appearance: none;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%2364748B' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 14px center;
          transition: all 0.2s;
          box-shadow: 0 1px 2px rgba(0,0,0,0.02);
        }
        .admin-select:hover {
          border-color: #CBD5E1;
        }
        .admin-select:focus {
          outline: none;
          border-color: #3B82F6;
          box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1);
        }

        /* Table Card */
        .admin-table-card {
          background: #ffffff;
          border-radius: 20px;
          border: 1px solid #E2E8F0;
          box-shadow: 0 10px 30px -5px rgba(0, 0, 0, 0.04), 0 4px 6px -2px rgba(0, 0, 0, 0.02);
          overflow: hidden;
          position: relative;
        }
        .admin-table-card::before {
          content: "";
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 4px;
          background: linear-gradient(90deg, #3B82F6, #60A5FA);
        }
        .admin-table-wrapper {
          overflow-x: auto;
        }
        .admin-table {
          width: 100%;
          border-collapse: collapse;
          text-align: left;
        }
        .admin-table th {
          background: #F8FAFC;
          padding: 20px 24px;
          font-size: 12px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          color: #475569;
          border-bottom: 1px solid #E2E8F0;
        }
        .admin-table td {
          padding: 22px 24px;
          border-bottom: 1px solid #F1F5F9;
          vertical-align: middle;
          font-size: 14px;
          color: #334155;
        }
        .admin-table tbody tr {
          transition: background-color 0.2s ease;
          opacity: 0;
          animation: row-fade-in 0.4s ease-out forwards;
          animation-delay: calc(var(--row-idx, 0) * 0.05s);
        }
        @keyframes row-fade-in {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .admin-table tbody tr:hover {
          background-color: #F8FAFC;
        }
        .admin-table tbody tr:last-child td {
          border-bottom: none;
        }

        /* Columns styling */
        .admin-cell-title {
          font-weight: 650;
          color: #0F172A;
          display: flex;
          align-items: center;
          gap: 12px;
          font-size: 15px;
        }
        .admin-cell-title svg {
          color: #94A3B8;
        }
        
        .admin-user-block {
          display: flex;
          align-items: center;
          gap: 14px;
        }
        .admin-user-avatar {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: linear-gradient(135deg, #3B82F6, #1D4ED8);
          color: #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 750;
          font-size: 15px;
          box-shadow: 0 2px 4px rgba(37,99,235,0.2);
        }
        .admin-user-meta {
          display: flex;
          flex-direction: column;
        }
        .admin-user-name {
          font-weight: 650;
          color: #0F172A;
          font-size: 14px;
        }
        .admin-user-id {
          font-size: 12px;
          color: #64748B;
          font-weight: 500;
        }

        .admin-datetime {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .admin-date {
          font-weight: 600;
          color: #1E293B;
          font-size: 14px;
        }
        .admin-time {
          font-size: 13px;
          color: #64748B;
        }

        /* Badges */
        .admin-badge {
          display: inline-flex;
          align-items: center;
          padding: 6px 14px;
          border-radius: 999px;
          font-size: 12px;
          font-weight: 750;
          letter-spacing: 0.03em;
        }
        .badge-yellow { background: #FEF9C3; color: #854D0E; border: 1px solid #FEF08A; }
        .badge-green { background: #DCFCE7; color: #166534; border: 1px solid #BBF7D0; }
        .badge-red { background: #FEE2E2; color: #991B1B; border: 1px solid #FECACA; }
        .badge-gray { background: #F1F5F9; color: #475569; border: 1px solid #E2E8F0; }

        /* Actions */
        .admin-actions {
          display: flex;
          gap: 10px;
          align-items: center;
          justify-content: flex-end;
        }
        .admin-action-btn {
          width: 38px;
          height: 38px;
          border-radius: 12px;
          border: 1px solid transparent;
          background: #F8FAFC;
          color: #64748B;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .admin-action-btn:hover:not(:disabled) {
          transform: translateY(-2px) scale(1.05);
          box-shadow: 0 4px 6px rgba(0,0,0,0.05);
        }
        .admin-action-btn:active:not(:disabled) {
          transform: translateY(0) scale(1);
        }
        .admin-action-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        
        .btn-view:hover {
          background: #EFF6FF;
          color: #2563EB;
          border-color: #BFDBFE;
        }
        .btn-approve {
          background: #F0FDF4;
          color: #166534;
          border-color: #DCFCE7;
        }
        .btn-approve:hover {
          background: #DCFCE7;
          border-color: #86EFAC;
          box-shadow: 0 4px 10px rgba(22, 101, 52, 0.15);
        }
        .btn-reject {
          background: #FEF2F2;
          color: #991B1B;
          border-color: #FEE2E2;
        }
        .btn-reject:hover {
          background: #FEE2E2;
          border-color: #FCA5A5;
          box-shadow: 0 4px 10px rgba(153, 27, 27, 0.15);
        }

        /* Empty State */
        .admin-empty-state {
          padding: 80px 20px;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          animation: fade-in 0.5s ease-out;
        }
        .admin-empty-icon {
          width: 72px;
          height: 72px;
          border-radius: 50%;
          background: #F1F5F9;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #94A3B8;
          margin-bottom: 24px;
        }
        .admin-empty-state h3 {
          font-size: 20px;
          font-weight: 700;
          color: #0F172A;
          margin: 0 0 10px;
        }
        .admin-empty-state p {
          color: #64748B;
          margin: 0;
          font-size: 15px;
        }

        /* Skeletons */
        .skeleton-row td {
          padding: 24px;
        }
        .skeleton-box {
          height: 20px;
          background: linear-gradient(90deg, #E2E8F0 25%, #F1F5F9 50%, #E2E8F0 75%);
          background-size: 400% 100%;
          animation: skeleton-loading 1.5s infinite ease-in-out;
          border-radius: 6px;
        }
        .skeleton-circle {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: #E2E8F0;
          animation: skeleton-loading 1.5s infinite ease-in-out;
          background-size: 400% 100%;
        }
        @keyframes skeleton-loading {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }

        /* Modals */
        .admin-modal-overlay {
          position: fixed;
          top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(15, 23, 42, 0.6);
          backdrop-filter: blur(8px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          animation: modal-fade-in 0.25s ease-out;
        }
        .admin-modal {
          background: #ffffff;
          border-radius: 24px;
          padding: 40px;
          width: 100%;
          max-width: 460px;
          box-shadow: 0 25px 50px -12px rgba(0,0,0,0.3);
          animation: modal-slide-up 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }
        @keyframes modal-fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes modal-slide-up {
          from { opacity: 0; transform: translateY(30px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        .admin-modal-header {
          margin-bottom: 28px;
        }
        .admin-modal-title {
          font-size: 22px;
          font-weight: 800;
          color: #0F172A;
          margin: 0 0 10px;
        }
        .admin-modal-desc {
          color: #475569;
          font-size: 15px;
          margin: 0;
          line-height: 1.6;
        }
        .admin-modal-textarea {
          width: 100%;
          min-height: 120px;
          border: 1px solid #E2E8F0;
          border-radius: 12px;
          padding: 14px 16px;
          font-family: 'Inter', sans-serif;
          font-size: 15px;
          resize: vertical;
          margin-bottom: 28px;
          transition: all 0.2s;
        }
        .admin-modal-textarea:focus {
          outline: none;
          border-color: #3B82F6;
          box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.15);
        }
        .admin-modal-actions {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
        }
        .admin-btn-primary {
          background: linear-gradient(135deg, #2563EB, #1D4ED8);
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 12px;
          font-weight: 650;
          font-size: 15px;
          cursor: pointer;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 4px 12px rgba(37,99,235,0.25);
        }
        .admin-btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 16px rgba(37,99,235,0.35);
        }
        .admin-btn-primary:active {
          transform: translateY(0);
        }
        .admin-btn-danger {
          background: linear-gradient(135deg, #DC2626, #B91C1C);
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 12px;
          font-weight: 650;
          font-size: 15px;
          cursor: pointer;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 4px 12px rgba(220,38,38,0.25);
        }
        .admin-btn-danger:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 16px rgba(220,38,38,0.35);
        }
        .admin-btn-danger:active {
          transform: translateY(0);
        }
        .admin-btn-cancel {
          background: #ffffff;
          color: #475569;
          border: 1px solid #E2E8F0;
          padding: 12px 24px;
          border-radius: 12px;
          font-weight: 650;
          font-size: 15px;
          cursor: pointer;
          transition: all 0.2s;
        }
        .admin-btn-cancel:hover {
          background: #F8FAFC;
          color: #0F172A;
          border-color: #CBD5E1;
        }
        
        .alert-error {
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
          animation: fade-in 0.3s ease-out;
        }

        @media (max-width: 768px) {
          .admin-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 16px;
          }
          .admin-header-actions {
            width: 100%;
            justify-content: flex-start;
            flex-wrap: wrap;
          }
          .admin-search-box, .admin-search-input {
            width: 100%;
          }
          .admin-table thead {
            display: none;
          }
          .admin-table, .admin-table tbody, .admin-table tr, .admin-table td {
            display: block;
            width: 100%;
          }
          .admin-table tr {
            margin-bottom: 16px;
            border: 1px solid #E2E8F0;
            border-radius: 16px;
            padding: 20px;
          }
          .admin-table td {
            border: none;
            padding: 10px 0;
            display: flex;
            justify-content: space-between;
            align-items: center;
          }
          .admin-table td::before {
            content: attr(data-label);
            font-weight: 650;
            color: #64748B;
            font-size: 12px;
            text-transform: uppercase;
          }
          .admin-user-block, .admin-cell-title, .admin-datetime {
            text-align: right;
            align-items: flex-end;
          }
        }
      `}</style>

      <div className="admin-content-wrapper">
        <header className="admin-header">
          <div className="admin-header-titles">
            <h1>Bookings Management</h1>
            <p>Review and manage all booking requests across the campus.</p>
          </div>
          <div className="admin-header-actions">
            <Link to="/bookings/create" className="admin-btn-primary-link">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
              Create Booking
            </Link>
            <button className="admin-btn-secondary" onClick={fetchBookings}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="23 4 23 10 17 10"></polyline>
                <polyline points="1 20 1 14 7 14"></polyline>
                <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
              </svg>
              Refresh
            </button>
          </div>
        </header>

        {error && (
          <div className="alert-error">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            {error}
          </div>
        )}

        <div className="admin-toolbar">
          <div className="admin-search-box">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            <input 
              type="text" 
              className="admin-search-input" 
              placeholder="Search by title, user name, or ID..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="admin-filters">
            <CustomSelect 
              className="admin-select"
              value={statusFilter}
              onChange={(val) => setStatusFilter(val)}
              options={[
                { value: "ALL", label: "All Statuses" },
                { value: "PENDING", label: "Pending" },
                { value: "APPROVED", label: "Approved" },
                { value: "REJECTED", label: "Rejected" },
                { value: "CANCELLED", label: "Cancelled" }
              ]}
            />
          </div>
        </div>

        <div className="admin-table-card">
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Booking Details</th>
                  <th>Requester</th>
                  <th>Date & Time</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, idx) => (
                    <tr key={idx} className="skeleton-row" style={{ "--row-idx": idx }}>
                      <td><div className="skeleton-box" style={{ width: '60%' }}></div></td>
                      <td>
                        <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
                          <div className="skeleton-circle"></div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100px' }}>
                            <div className="skeleton-box" style={{ width: '100%' }}></div>
                            <div className="skeleton-box" style={{ width: '60%' }}></div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          <div className="skeleton-box" style={{ width: '90px' }}></div>
                          <div className="skeleton-box" style={{ width: '60px' }}></div>
                        </div>
                      </td>
                      <td><div className="skeleton-box" style={{ width: '80px', borderRadius: '999px', height: '26px' }}></div></td>
                      <td><div className="skeleton-box" style={{ width: '90px', marginLeft: 'auto' }}></div></td>
                    </tr>
                  ))
                ) : filteredBookings.length > 0 ? (
                  filteredBookings.map((booking, index) => {
                    const name = booking.userName || `User ${booking.userId?.substring(0,4) || '??'}`;
                    const initial = name.charAt(0).toUpperCase();
                    
                    return (
                      <tr key={booking.id} style={{ "--row-idx": index }}>
                        <td data-label="Booking Details">
                          <div className="admin-cell-title">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                              <line x1="16" y1="2" x2="16" y2="6"></line>
                              <line x1="8" y1="2" x2="8" y2="6"></line>
                              <line x1="3" y1="10" x2="21" y2="10"></line>
                            </svg>
                            {booking.title}
                          </div>
                        </td>
                        <td data-label="Requester">
                          <div className="admin-user-block">
                            <div className="admin-user-avatar">{initial}</div>
                            <div className="admin-user-meta">
                              <span className="admin-user-name">{name}</span>
                              <span className="admin-user-id">ID: {booking.userId}</span>
                            </div>
                          </div>
                        </td>
                        <td data-label="Date & Time">
                          <div className="admin-datetime">
                            <span className="admin-date">{booking.date}</span>
                            <span className="admin-time">{booking.startTime} — {booking.endTime}</span>
                          </div>
                        </td>
                        <td data-label="Status">
                          {renderStatusBadge(booking.status)}
                        </td>
                        <td data-label="Actions" style={{ textAlign: 'right' }}>
                          <div className="admin-actions">
                            <Link to={`/bookings/${booking.id}`} className="admin-action-btn btn-view" title="View Details">
                              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                                <circle cx="12" cy="12" r="3"></circle>
                              </svg>
                            </Link>
                            
                            {booking.status === "PENDING" && (
                              <>
                                <button
                                  className="admin-action-btn btn-approve"
                                  onClick={() => setApproveModal({ isOpen: true, bookingId: booking.id })}
                                  disabled={pendingId === booking.id}
                                  title="Approve Request"
                                >
                                  {pendingId === booking.id ? (
                                    <span style={{ fontSize: '14px', fontWeight: '700' }}>...</span>
                                  ) : (
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                      <polyline points="20 6 9 17 4 12"></polyline>
                                    </svg>
                                  )}
                                </button>
                                <button
                                  className="admin-action-btn btn-reject"
                                  onClick={() => setRejectModal({ isOpen: true, bookingId: booking.id })}
                                  disabled={pendingId === booking.id}
                                  title="Reject Request"
                                >
                                  {pendingId === booking.id ? (
                                    <span style={{ fontSize: '14px', fontWeight: '700' }}>...</span>
                                  ) : (
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                      <line x1="18" y1="6" x2="6" y2="18"></line>
                                      <line x1="6" y1="6" x2="18" y2="18"></line>
                                    </svg>
                                  )}
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={5}>
                      <div className="admin-empty-state">
                        <div className="admin-empty-icon">
                          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="11" cy="11" r="8"></circle>
                            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                          </svg>
                        </div>
                        <h3>No Bookings Found</h3>
                        <p>We couldn't find any bookings matching your current filters.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Approve Modal */}
      {approveModal.isOpen && (
        <div className="admin-modal-overlay">
          <div className="admin-modal">
            <div className="admin-modal-header">
              <h3 className="admin-modal-title">Approve Booking</h3>
              <p className="admin-modal-desc">Are you sure you want to approve this booking request? The requester will be notified immediately.</p>
            </div>
            <div className="admin-modal-actions">
              <button className="admin-btn-cancel" onClick={() => setApproveModal({ isOpen: false, bookingId: null })}>Cancel</button>
              <button className="admin-btn-primary" onClick={confirmApprove}>Yes, Approve</button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {rejectModal.isOpen && (
        <div className="admin-modal-overlay">
          <div className="admin-modal">
            <div className="admin-modal-header">
              <h3 className="admin-modal-title">Reject Booking</h3>
              <p className="admin-modal-desc">Please provide a reason for rejecting this request. This will be visible to the requester.</p>
            </div>
            <textarea
              className="admin-modal-textarea"
              placeholder="E.g., The requested room is undergoing maintenance..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              autoFocus
            />
            <div className="admin-modal-actions">
              <button className="admin-btn-cancel" onClick={() => setRejectModal({ isOpen: false, bookingId: null })}>Cancel</button>
              <button className="admin-btn-danger" onClick={confirmReject}>Reject Booking</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BookingListPage;