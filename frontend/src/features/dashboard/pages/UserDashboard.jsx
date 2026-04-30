import { Link } from "react-router-dom";
import useAuth from "../../../hooks/useAuth";
import AdminAnalyticsPage from "../../admin/pages/AdminAnalyticsPage";

const UserDashboard = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN";

  return (
    <section className="grid dashboard-shell">
      <div className="card dashboard-hero">
        <div className="dashboard-hero-header">
          <div>
            <p className="dashboard-eyebrow">Campus Operations Hub</p>
            <h1 className="dashboard-title">Welcome back, {user?.fullName?.split(" ")?.[0] ?? "User"}.</h1>
            <p className="dashboard-subtitle">
              Manage resources, monitor booking activity, and keep your campus operations running smoothly.
            </p>
          </div>
          <div className="dashboard-role-chip">
            <span className="dashboard-role-icon">✨</span>
            <span>{user?.role}</span>
          </div>
        </div>

        <div className="dashboard-kpi-grid">
          <article className="dashboard-kpi-card">
            <span className="dashboard-kpi-label">Quick Access</span>
            <strong className="dashboard-kpi-value">Resources</strong>
            <span className="dashboard-kpi-meta">Browse all bookable spaces and facilities.</span>
          </article>
          <article className="dashboard-kpi-card">
            <span className="dashboard-kpi-label">Actions</span>
            <strong className="dashboard-kpi-value">Bookings</strong>
            <span className="dashboard-kpi-meta">Create, approve, and track booking requests.</span>
          </article>
          <article className="dashboard-kpi-card">
            <span className="dashboard-kpi-label">Notifications</span>
            <strong className="dashboard-kpi-value">Live Updates</strong>
            <span className="dashboard-kpi-meta">Bell icon keeps users informed in real time.</span>
          </article>
        </div>
      </div>

      <div className="dashboard-card-grid">
        <article className="card dashboard-action-card">
          <div className="dashboard-action-head">
            <span className="dashboard-action-icon">🏛️</span>
            <h3>Resources</h3>
          </div>
          <p>Browse resources and availability for lecture halls, labs, and shared spaces.</p>
          <div className="row">
            <Link to="/resources" className="btn btn-primary">Open Resources</Link>
          </div>
        </article>

        <article className="card dashboard-action-card">
          <div className="dashboard-action-head">
            <span className="dashboard-action-icon">📅</span>
            <h3>Bookings</h3>
          </div>
          <p>Create a booking request quickly and keep track of status changes from one place.</p>
          <div className="row">
            <Link to="/bookings/create" className="btn btn-primary">Create Booking</Link>
            <Link to="/bookings/my" className="btn btn-light">My Bookings</Link>
          </div>
        </article>

        {isAdmin && (
          <article className="card dashboard-action-card">
            <div className="dashboard-action-head">
              <span className="dashboard-action-icon">👥</span>
              <h3>User Management</h3>
            </div>
            <p>Manage roles and access controls for students, staff, and administrators.</p>
            <div className="row">
              <Link to="/admin/users" className="btn btn-light">Manage Users</Link>
            </div>
          </article>
        )}
      </div>

      {/* Render Analytics directly in the dashboard for Admins */}
      {isAdmin && (
        <div className="dashboard-analytics-wrap">
          <AdminAnalyticsPage />
        </div>
      )}
    </section>
  );
};

export default UserDashboard;