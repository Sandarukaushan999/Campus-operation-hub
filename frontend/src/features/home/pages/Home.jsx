import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import useAuth from "../../../hooks/useAuth";
import { getMyBookings, getAllBookings } from "../../../api/bookingApi";
import { getMyTickets, getAssignedTickets, getAllTickets } from "../../../api/ticketApi";
import { getResources } from "../../../api/resourceApi";
import { getMyUnreadNotificationCount } from "../../../api/notificationApi";

const Home = () => {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [assignedTickets, setAssignedTickets] = useState([]);
  
  // Admin state
  const [allBookings, setAllBookings] = useState([]);
  const [allTickets, setAllTickets] = useState([]);
  const [resources, setResources] = useState([]);

  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const isTechnician = user?.role === "TECHNICIAN";
  const isAdmin = user?.role === "ADMIN";
  const firstName = user?.fullName?.split(" ")?.[0] ?? "User";

  useEffect(() => {
    let active = true;
    const loadData = async () => {
      try {
        const promises = [
          getMyUnreadNotificationCount().catch(() => 0),
        ];

        if (isAdmin) {
          promises.push(getAllBookings().catch(() => []));
          promises.push(getAllTickets().catch(() => []));
          promises.push(getResources().catch(() => []));
        } else if (isTechnician) {
          promises.push(getAssignedTickets().catch(() => []));
        } else {
          promises.push(getMyBookings().catch(() => []));
          promises.push(getMyTickets().catch(() => []));
        }

        const results = await Promise.all(promises);

        if (active) {
          setUnreadCount(Number(results[0]) || 0);
          
          if (isAdmin) {
            setAllBookings(Array.isArray(results[1]) ? results[1] : []);
            setAllTickets(Array.isArray(results[2]) ? results[2] : []);
            setResources(Array.isArray(results[3]) ? results[3] : []);
          } else if (isTechnician) {
            setAssignedTickets(Array.isArray(results[1]) ? results[1] : []);
          } else {
            setBookings(Array.isArray(results[1]) ? results[1] : []);
            setTickets(Array.isArray(results[2]) ? results[2] : []);
          }
          setLoading(false);
        }
      } catch (err) {
        if (active) setLoading(false);
      }
    };
    loadData();
    return () => { active = false; };
  }, [isTechnician, isAdmin]);

  const formatDate = (iso) => {
    if (!iso) return "Unknown date";
    return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  };

  // --- Normal User Data ---
  const pendingBookings = bookings.filter((b) => b.status === "PENDING").length;
  const activeTickets = tickets.filter((t) => t.status !== "CLOSED" && t.status !== "RESOLVED" && t.status !== "REJECTED").length;
  
  const sortedBookings = [...bookings].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  const sortedTickets = [...tickets].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  
  const recentBookings = sortedBookings.slice(0, 3);
  const recentTickets = sortedTickets.slice(0, 3);

  // --- Technician Data ---
  const techSortedTickets = [...assignedTickets].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  const techInProgress = techSortedTickets.filter(t => t.status === "IN_PROGRESS").length;
  const techCompletedList = techSortedTickets.filter(t => t.status === "RESOLVED" || t.status === "CLOSED");
  const techCompleted = techCompletedList.length;
  const techHighPriority = techSortedTickets.filter(t => t.priority === "HIGH" || t.priority === "CRITICAL").length;
  
  const recentAssigned = techSortedTickets.filter(t => t.status !== "RESOLVED" && t.status !== "CLOSED").slice(0, 3);
  const recentCompleted = techCompletedList.slice(0, 3);

  // --- Admin Data ---
  const adminTotalBookings = allBookings.length;
  const adminPendingBookings = allBookings.filter(b => b.status === "PENDING");
  const adminPendingCount = adminPendingBookings.length;
  const adminActiveResources = resources.filter(r => r.status === "AVAILABLE").length;
  
  const adminSortedTickets = [...allTickets].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  const adminOpenTickets = adminSortedTickets.filter(t => t.status === "OPEN" || t.status === "ASSIGNED" || t.status === "IN_PROGRESS");
  const adminOpenCount = adminOpenTickets.length;

  const adminRecentBookings = [...allBookings].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)).slice(0, 3);
  const adminRecentTickets = adminSortedTickets.slice(0, 3);

  const adminHighPriorityTickets = adminOpenTickets.filter(t => t.priority === "HIGH" || t.priority === "CRITICAL");

  return (
    <div className="modern-home-page">
      <style>{`
        .modern-home-page {
          padding: 40px 24px;
          background: #F1F5F9;
          min-height: calc(100vh - 64px);
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
        }

        .home-container {
          max-width: 1200px;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          gap: 32px;
        }

        /* --- Hero Section --- */
        .home-hero {
          background: linear-gradient(135deg, #1E40AF 0%, #3B82F6 100%);
          border-radius: 24px;
          padding: 48px;
          color: #ffffff;
          display: flex;
          align-items: center;
          justify-content: space-between;
          box-shadow: 0 20px 40px -12px rgba(37, 99, 235, 0.25);
          position: relative;
          overflow: hidden;
        }

        .home-hero.admin-hero {
          background: linear-gradient(135deg, #0F172A 0%, #334155 100%);
          box-shadow: 0 20px 40px -12px rgba(15, 23, 42, 0.25);
        }

        .home-hero.tech-hero {
          background: linear-gradient(135deg, #0F766E 0%, #0D9488 100%);
          box-shadow: 0 20px 40px -12px rgba(13, 148, 136, 0.25);
        }

        .home-hero::after {
          content: "🎓";
          position: absolute;
          right: -20px;
          top: -40px;
          font-size: 280px;
          opacity: 0.05;
          transform: rotate(15deg);
          pointer-events: none;
        }

        .home-hero.admin-hero::after {
          content: "🛡️";
        }

        .home-hero.tech-hero::after {
          content: "🛠️";
        }

        .home-hero-content {
          position: relative;
          z-index: 1;
          max-width: 600px;
        }

        .home-hero h1 {
          font-size: 36px;
          font-weight: 800;
          margin: 0 0 12px 0;
          letter-spacing: -0.02em;
          color: #ffffff;
        }

        .home-hero p {
          font-size: 18px;
          color: rgba(255,255,255,0.9);
          margin: 0 0 24px 0;
          line-height: 1.5;
        }

        .home-quick-actions {
          display: flex;
          gap: 16px;
        }

        .btn-hero {
          padding: 12px 24px;
          border-radius: 12px;
          font-weight: 600;
          font-size: 15px;
          text-decoration: none;
          transition: all 0.2s ease;
          display: inline-flex;
          align-items: center;
          gap: 8px;
        }

        .btn-hero-primary {
          background: #ffffff;
          color: #1E40AF;
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }
        .admin-hero .btn-hero-primary {
          color: #0F172A;
        }
        .tech-hero .btn-hero-primary {
          color: #0F766E;
        }
        .btn-hero-primary:hover {
          background: #F8FAFC;
          transform: translateY(-2px);
          box-shadow: 0 6px 16px rgba(0,0,0,0.15);
        }

        .btn-hero-secondary {
          background: rgba(255,255,255,0.15);
          color: #ffffff;
          backdrop-filter: blur(8px);
          border: 1px solid rgba(255,255,255,0.2);
        }
        .btn-hero-secondary:hover {
          background: rgba(255,255,255,0.25);
          transform: translateY(-2px);
        }

        /* --- Grid Layouts --- */
        .home-grid-top {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 24px;
        }

        .home-card {
          background: #ffffff;
          border-radius: 20px;
          padding: 32px;
          box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -2px rgba(0,0,0,0.025);
          border: 1px solid #E2E8F0;
        }

        .home-card-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 20px;
        }

        .home-card-icon {
          font-size: 24px;
          background: #EFF6FF;
          width: 48px;
          height: 48px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 12px;
          color: #2563EB;
        }

        .home-card-icon.is-gray {
          background: #F1F5F9;
          color: #475569;
        }

        .home-card-icon.is-teal {
          background: #F0FDFA;
          color: #0D9488;
        }

        .home-card h2 {
          font-size: 20px;
          font-weight: 700;
          color: #0F172A;
          margin: 0;
        }

        .home-card p {
          color: #64748B;
          line-height: 1.6;
          margin: 0;
          font-size: 15px;
        }

        .role-list {
          list-style: none;
          padding: 0;
          margin: 0;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .role-list li {
          display: flex;
          align-items: center;
          gap: 12px;
          color: #334155;
          font-weight: 500;
          font-size: 15px;
        }

        .role-list li::before {
          content: "✓";
          display: flex;
          align-items: center;
          justify-content: center;
          width: 24px;
          height: 24px;
          background: #ECFDF5;
          color: #10B981;
          border-radius: 50%;
          font-size: 12px;
          font-weight: 800;
        }

        /* --- Stats Row --- */
        .home-stats-row {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 24px;
        }

        .stat-card {
          background: #ffffff;
          border-radius: 20px;
          padding: 24px;
          box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);
          border: 1px solid #E2E8F0;
          display: flex;
          align-items: center;
          gap: 20px;
          transition: transform 0.2s ease;
        }
        
        .stat-card:hover {
          transform: translateY(-4px);
        }

        .stat-icon {
          font-size: 28px;
          width: 56px;
          height: 56px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 16px;
        }
        
        .stat-icon.is-blue { background: #EFF6FF; color: #2563EB; }
        .stat-icon.is-yellow { background: #FEF3C7; color: #D97706; }
        .stat-icon.is-purple { background: #FAF5FF; color: #9333EA; }
        .stat-icon.is-red { background: #FEF2F2; color: #DC2626; }
        .stat-icon.is-green { background: #ECFDF5; color: #10B981; }
        .stat-icon.is-gray { background: #F1F5F9; color: #475569; }
        .stat-icon.is-teal { background: #F0FDFA; color: #0D9488; }

        .stat-content {
          display: flex;
          flex-direction: column;
        }

        .stat-value {
          font-size: 28px;
          font-weight: 800;
          color: #0F172A;
          line-height: 1;
          margin-bottom: 4px;
        }

        .stat-label {
          font-size: 14px;
          font-weight: 600;
          color: #64748B;
        }

        /* --- Alerts Area --- */
        .alerts-panel {
          background: #FFFBEB;
          border-radius: 16px;
          padding: 20px 24px;
          border: 1px solid #FDE68A;
          display: flex;
          gap: 24px;
          align-items: center;
          margin-bottom: 8px;
        }

        .alert-item {
          display: flex;
          align-items: center;
          gap: 12px;
          font-weight: 600;
          color: #92400E;
          font-size: 15px;
        }

        .alert-item.danger {
          color: #991B1B;
        }

        .alert-badge {
          background: #F59E0B;
          color: white;
          padding: 4px 10px;
          border-radius: 20px;
          font-size: 13px;
          font-weight: 800;
        }

        .alert-item.danger .alert-badge {
          background: #EF4444;
        }

        /* --- Recent Activity --- */
        .home-grid-bottom {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 24px;
        }

        .home-grid-three {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 24px;
        }

        .activity-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
          margin-top: 24px;
        }

        .activity-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px;
          background: #F8FAFC;
          border-radius: 14px;
          border: 1px solid #E2E8F0;
          text-decoration: none;
          color: inherit;
          transition: all 0.2s ease;
        }

        .activity-item:hover {
          background: #ffffff;
          border-color: #CBD5E1;
          box-shadow: 0 4px 12px rgba(0,0,0,0.05);
        }

        .activity-info h4 {
          margin: 0 0 4px 0;
          font-size: 15px;
          font-weight: 600;
          color: #0F172A;
        }

        .activity-info p {
          margin: 0;
          font-size: 13px;
          color: #64748B;
        }

        .activity-status {
          font-size: 12px;
          font-weight: 700;
          padding: 6px 12px;
          border-radius: 20px;
          text-transform: uppercase;
        }
        
        .status-badge-blue { background: #DBEAFE; color: #1E40AF; }
        .status-badge-yellow { background: #FEF3C7; color: #92400E; }
        .status-badge-green { background: #D1FAE5; color: #065F46; }
        .status-badge-gray { background: #F1F5F9; color: #475569; }
        .status-badge-red { background: #FEE2E2; color: #991B1B; }

        .empty-state {
          padding: 32px;
          text-align: center;
          background: #F8FAFC;
          border-radius: 14px;
          border: 1px dashed #CBD5E1;
          color: #64748B;
          font-size: 14px;
          margin-top: 24px;
        }

        /* --- Responsive --- */
        @media (max-width: 1024px) {
          .home-stats-row { grid-template-columns: repeat(2, 1fr); }
          .home-grid-three { grid-template-columns: 1fr; }
          .alerts-panel { flex-direction: column; align-items: flex-start; gap: 12px; }
        }
        
        @media (max-width: 768px) {
          .home-grid-top, .home-grid-bottom { grid-template-columns: 1fr; }
          .home-hero { padding: 32px 24px; }
          .home-hero h1 { font-size: 28px; }
          .home-quick-actions { flex-direction: column; }
          .btn-hero { justify-content: center; }
        }
      `}</style>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '100px', color: '#64748B' }}>
          Loading your dashboard...
        </div>
      ) : (
        <div className="home-container">
          
          {/* ========================================================= */}
          {/* ADMIN DASHBOARD                                           */}
          {/* ========================================================= */}
          {isAdmin ? (
            <>
              {/* 1. Hero Section & Quick Actions */}
              <section className="home-hero admin-hero">
                <div className="home-hero-content">
                  <h1>Welcome, Admin {firstName}</h1>
                  <p>Monitor and manage campus operations from your high-level overview.</p>
                  <div className="home-quick-actions">
                    <Link to="/resources" className="btn-hero btn-hero-primary">
                      <span>🏢</span> Manage Resources
                    </Link>
                    <Link to="/bookings" className="btn-hero btn-hero-secondary">
                      <span>📅</span> View Bookings
                    </Link>
                    <Link to="/tickets" className="btn-hero btn-hero-secondary">
                      <span>🛠️</span> View Tickets
                    </Link>
                  </div>
                </div>
              </section>

              {/* 6. Alerts Area (if any) */}
              {(adminPendingCount > 0 || adminHighPriorityTickets.length > 0) && (
                <div className="alerts-panel">
                  {adminPendingCount > 0 && (
                    <div className="alert-item">
                      <span className="alert-badge">{adminPendingCount}</span>
                      Pending Booking Approvals
                    </div>
                  )}
                  {adminHighPriorityTickets.length > 0 && (
                    <div className="alert-item danger">
                      <span className="alert-badge">{adminHighPriorityTickets.length}</span>
                      High Priority Tickets Need Attention
                    </div>
                  )}
                </div>
              )}

              {/* 2. About & 3. Role Description */}
              <section className="home-grid-top">
                <div className="home-card">
                  <div className="home-card-header">
                    <div className="home-card-icon is-gray">🛡️</div>
                    <h2>About Smart Campus Hub</h2>
                  </div>
                  <p>
                    Smart Campus Hub centralizes resource management, booking approvals, and maintenance tracking. Use this dashboard to oversee system health and ensure campus operations run smoothly.
                  </p>
                </div>

                <div className="home-card">
                  <div className="home-card-header">
                    <div className="home-card-icon is-gray">⚙️</div>
                    <h2>Admin Capabilities</h2>
                  </div>
                  <ul className="role-list">
                    <li>Approve/reject bookings</li>
                    <li>Manage resources</li>
                    <li>Monitor tickets</li>
                    <li>Oversee system usage</li>
                  </ul>
                </div>
              </section>

              {/* 4. System Summary Stats */}
              <section className="home-stats-row">
                <div className="stat-card">
                  <div className="stat-icon is-blue">📅</div>
                  <div className="stat-content">
                    <span className="stat-value">{adminTotalBookings}</span>
                    <span className="stat-label">Total Bookings</span>
                  </div>
                </div>
                
                <div className="stat-card">
                  <div className="stat-icon is-yellow">⏳</div>
                  <div className="stat-content">
                    <span className="stat-value">{adminPendingCount}</span>
                    <span className="stat-label">Pending Requests</span>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-icon is-green">🏢</div>
                  <div className="stat-content">
                    <span className="stat-value">{adminActiveResources}</span>
                    <span className="stat-label">Active Resources</span>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-icon is-purple">🎫</div>
                  <div className="stat-content">
                    <span className="stat-value">{adminOpenCount}</span>
                    <span className="stat-label">Open Tickets</span>
                  </div>
                </div>
              </section>

              {/* 5. Recent Activity */}
              <section className="home-grid-bottom">
                <div className="home-card">
                  <div className="home-card-header" style={{ marginBottom: 0 }}>
                    <h2>Recent Booking Requests</h2>
                  </div>
                  
                  {adminRecentBookings.length > 0 ? (
                    <div className="activity-list">
                      {adminRecentBookings.map(b => (
                        <Link to={`/bookings/${b.id}`} className="activity-item" key={b.id}>
                          <div className="activity-info">
                            <h4>{b.resourceName || "Resource"}</h4>
                            <p>{b.userName || "User"} • {formatDate(b.startTime)}</p>
                          </div>
                          <span className={`activity-status ${b.status === 'PENDING' ? 'status-badge-yellow' : b.status === 'APPROVED' ? 'status-badge-green' : 'status-badge-gray'}`}>
                            {b.status}
                          </span>
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <div className="empty-state">
                      No recent bookings.
                    </div>
                  )}
                </div>

                <div className="home-card">
                  <div className="home-card-header" style={{ marginBottom: 0 }}>
                    <h2>Recent Tickets</h2>
                  </div>
                  
                  {adminRecentTickets.length > 0 ? (
                    <div className="activity-list">
                      {adminRecentTickets.map(t => (
                        <Link to={`/tickets/${t.id}`} className="activity-item" key={t.id}>
                          <div className="activity-info">
                            <h4>{t.title}</h4>
                            <p>{t.reportedByName || "User"} • {formatDate(t.createdAt)}</p>
                          </div>
                          <span className={`activity-status ${t.status === 'OPEN' ? 'status-badge-yellow' : t.status === 'RESOLVED' ? 'status-badge-green' : 'status-badge-blue'}`}>
                            {t.status}
                          </span>
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <div className="empty-state">
                      No recent tickets.
                    </div>
                  )}
                </div>
              </section>
            </>
          ) : isTechnician ? (
          /* ========================================================= */
          /* TECHNICIAN DASHBOARD                                      */
          /* ========================================================= */
            <>
              {/* 1. Hero Section */}
              <section className="home-hero tech-hero">
                <div className="home-hero-content">
                  <h1>Welcome, Technician {firstName}</h1>
                  <p>Manage your assigned maintenance tasks efficiently from your personalized dashboard.</p>
                  <div className="home-quick-actions">
                    <Link to="/tickets/assigned" className="btn-hero btn-hero-primary">
                      <span>🛠️</span> View All Assigned Jobs
                    </Link>
                    <Link to="/profile" className="btn-hero btn-hero-secondary">
                      <span>🔔</span> Notifications ({unreadCount})
                    </Link>
                  </div>
                </div>
              </section>

              {/* 2. About & 3. Role Description */}
              <section className="home-grid-top">
                <div className="home-card">
                  <div className="home-card-header">
                    <div className="home-card-icon is-teal">🔧</div>
                    <h2>About Smart Campus Hub</h2>
                  </div>
                  <p>
                    Smart Campus Hub helps you track, update, and resolve maintenance tickets across campus. Keeping the university running smoothly depends on timely updates and efficient workflow.
                  </p>
                </div>

                <div className="home-card">
                  <div className="home-card-header">
                    <div className="home-card-icon is-teal">📋</div>
                    <h2>Your Responsibilities</h2>
                  </div>
                  <ul className="role-list">
                    <li>View assigned tickets</li>
                    <li>Update ticket status</li>
                    <li>Add resolution notes</li>
                    <li>Complete maintenance tasks</li>
                  </ul>
                </div>
              </section>

              {/* 4. Work Summary Stats */}
              <section className="home-stats-row">
                <div className="stat-card">
                  <div className="stat-icon is-teal">📥</div>
                  <div className="stat-content">
                    <span className="stat-value">{assignedTickets.length}</span>
                    <span className="stat-label">Assigned Jobs</span>
                  </div>
                </div>
                
                <div className="stat-card">
                  <div className="stat-icon is-yellow">⚙️</div>
                  <div className="stat-content">
                    <span className="stat-value">{techInProgress}</span>
                    <span className="stat-label">In Progress</span>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-icon is-green">✅</div>
                  <div className="stat-content">
                    <span className="stat-value">{techCompleted}</span>
                    <span className="stat-label">Completed Jobs</span>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-icon is-red">🚨</div>
                  <div className="stat-content">
                    <span className="stat-value">{techHighPriority}</span>
                    <span className="stat-label">High Priority Tasks</span>
                  </div>
                </div>
              </section>

              {/* 5. Recent Assigned & 6. Completed Jobs & 7. Notifications context */}
              <section className="home-grid-bottom">
                <div className="home-card">
                  <div className="home-card-header" style={{ marginBottom: 0 }}>
                    <h2>Recent Assigned Tasks</h2>
                  </div>
                  
                  {recentAssigned.length > 0 ? (
                    <div className="activity-list">
                      {recentAssigned.map(t => (
                        <Link to={`/tickets/${t.id}`} className="activity-item" key={t.id}>
                          <div className="activity-info">
                            <h4>{t.title}</h4>
                            <p>Priority: <strong style={{ color: t.priority === 'HIGH' || t.priority === 'CRITICAL' ? '#DC2626' : 'inherit' }}>{t.priority}</strong></p>
                          </div>
                          <span className={`activity-status ${t.status === 'ASSIGNED' ? 'status-badge-blue' : 'status-badge-yellow'}`}>
                            {t.status}
                          </span>
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <div className="empty-state">
                      No active assigned jobs right now.
                    </div>
                  )}
                </div>

                <div className="home-card">
                  <div className="home-card-header" style={{ marginBottom: 0 }}>
                    <h2>Completed Work Summary</h2>
                  </div>
                  
                  {recentCompleted.length > 0 ? (
                    <div className="activity-list">
                      {recentCompleted.map(t => (
                        <Link to={`/tickets/${t.id}`} className="activity-item" key={t.id}>
                          <div className="activity-info">
                            <h4>{t.title}</h4>
                            <p>Completed: {formatDate(t.updatedAt || t.createdAt)}</p>
                          </div>
                          <span className="activity-status status-badge-green">
                            {t.status}
                          </span>
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <div className="empty-state">
                      No completed jobs yet.
                    </div>
                  )}
                </div>
              </section>
            </>
          ) : (
          /* ========================================================= */
          /* NORMAL USER DASHBOARD                                     */
          /* ========================================================= */
            <>
              {/* 1. Hero Section & Quick Actions */}
              <section className="home-hero">
                <div className="home-hero-content">
                  <h1>Welcome back, {firstName}</h1>
                  <p>Manage your bookings and track your requests easily from your personal dashboard.</p>
                  <div className="home-quick-actions">
                    <Link to="/bookings/create" className="btn-hero btn-hero-primary">
                      <span>📅</span> Book Resource
                    </Link>
                    <Link to="/tickets/create" className="btn-hero btn-hero-secondary">
                      <span>🛠️</span> Create Ticket
                    </Link>
                  </div>
                </div>
              </section>

              {/* 2. About & 3. Role Description */}
              <section className="home-grid-top">
                <div className="home-card">
                  <div className="home-card-header">
                    <div className="home-card-icon">🎓</div>
                    <h2>About Smart Campus Hub</h2>
                  </div>
                  <p>
                    Smart Campus Hub is your unified platform to effortlessly book campus resources, report maintenance issues, and track your requests all in one place. Designed to make campus life seamless and efficient.
                  </p>
                </div>

                <div className="home-card">
                  <div className="home-card-header">
                    <div className="home-card-icon">🔑</div>
                    <h2>What you can do</h2>
                  </div>
                  <ul className="role-list">
                    <li>Book campus resources and study spaces</li>
                    <li>View and manage your active bookings</li>
                    <li>Create and submit maintenance tickets</li>
                    <li>Track ticket updates in real-time</li>
                  </ul>
                </div>
              </section>

              {/* 4. Activity Summary */}
              <section className="home-stats-row">
                <div className="stat-card">
                  <div className="stat-icon is-blue">📅</div>
                  <div className="stat-content">
                    <span className="stat-value">{bookings.length}</span>
                    <span className="stat-label">Total Bookings</span>
                  </div>
                </div>
                
                <div className="stat-card">
                  <div className="stat-icon is-yellow">⏳</div>
                  <div className="stat-content">
                    <span className="stat-value">{pendingBookings}</span>
                    <span className="stat-label">Pending Bookings</span>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-icon is-purple">🎫</div>
                  <div className="stat-content">
                    <span className="stat-value">{activeTickets}</span>
                    <span className="stat-label">Active Tickets</span>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-icon is-red">🔔</div>
                  <div className="stat-content">
                    <span className="stat-value">{unreadCount}</span>
                    <span className="stat-label">Unread Notifications</span>
                  </div>
                </div>
              </section>

              {/* 5. Recent Activity */}
              <section className="home-grid-bottom">
                <div className="home-card">
                  <div className="home-card-header" style={{ marginBottom: 0 }}>
                    <h2>Recent Bookings</h2>
                  </div>
                  
                  {recentBookings.length > 0 ? (
                    <div className="activity-list">
                      {recentBookings.map(b => (
                        <Link to={`/bookings/${b.id}`} className="activity-item" key={b.id}>
                          <div className="activity-info">
                            <h4>{b.resourceName || "Resource"}</h4>
                            <p>{formatDate(b.startTime)}</p>
                          </div>
                          <span className={`activity-status ${b.status === 'PENDING' ? 'status-badge-yellow' : b.status === 'APPROVED' ? 'status-badge-green' : 'status-badge-gray'}`}>
                            {b.status}
                          </span>
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <div className="empty-state">
                      You haven't made any bookings yet.
                    </div>
                  )}
                </div>

                <div className="home-card">
                  <div className="home-card-header" style={{ marginBottom: 0 }}>
                    <h2>Recent Tickets</h2>
                  </div>
                  
                  {recentTickets.length > 0 ? (
                    <div className="activity-list">
                      {recentTickets.map(t => (
                        <Link to={`/tickets/${t.id}`} className="activity-item" key={t.id}>
                          <div className="activity-info">
                            <h4>{t.title}</h4>
                            <p>{formatDate(t.createdAt)}</p>
                          </div>
                          <span className={`activity-status ${t.status === 'OPEN' ? 'status-badge-yellow' : t.status === 'RESOLVED' ? 'status-badge-green' : 'status-badge-blue'}`}>
                            {t.status}
                          </span>
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <div className="empty-state">
                      You don't have any recent tickets.
                    </div>
                  )}
                </div>
              </section>
            </>
          )}

        </div>
      )}
    </div>
  );
};

export default Home;
