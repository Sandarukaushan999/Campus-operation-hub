import { Link, useNavigate } from "react-router-dom";
import useAuth from "../../hooks/useAuth";

const Navbar = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();

  const onLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <nav className="nav spread">
      <div className="row">
        <strong>Smart Campus Hub</strong>
        {isAuthenticated && <Link to="/dashboard">Dashboard</Link>}
        {isAuthenticated && <Link to="/resources">Resources</Link>}
        {isAuthenticated && <Link to="/bookings/my">My Bookings</Link>}
        {isAuthenticated && user?.role === "ADMIN" && <Link to="/bookings">All Bookings</Link>}
      </div>
      <div className="row">
        {isAuthenticated ? (
          <>
            <span>{user?.fullName} ({user?.role})</span>
            <button className="btn btn-light" onClick={onLogout} type="button">
              Logout
            </button>
          </>
        ) : (
          <>
            <Link to="/login">Login</Link>
            <Link to="/register">Register</Link>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;