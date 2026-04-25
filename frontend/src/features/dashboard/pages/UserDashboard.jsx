import { Link } from "react-router-dom";
import useAuth from "../../../hooks/useAuth";

const UserDashboard = () => {
  const { user } = useAuth();

  return (
    <section className="grid">
      <div className="card">
        <h2>Dashboard</h2>
        <p>
          Welcome, <strong>{user?.fullName}</strong>. You are logged in as <strong>{user?.role}</strong>.
        </p>
      </div>

      <div className="grid grid-2">
        <div className="card">
          <h3>Resources</h3>
          <p>Browse all bookable resources.</p>
          <Link to="/resources" className="btn btn-light">Open Resources</Link>
        </div>
        <div className="card">
          <h3>Bookings</h3>
          <p>Create and track your booking requests.</p>
          <div className="row">
            <Link to="/bookings/create" className="btn btn-primary">Create Booking</Link>
            <Link to="/bookings/my" className="btn btn-light">My Bookings</Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default UserDashboard;