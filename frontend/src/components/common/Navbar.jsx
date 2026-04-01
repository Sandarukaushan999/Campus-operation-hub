import { Link, NavLink, useNavigate } from "react-router-dom";
import useAuth from "../../hooks/useAuth";
import systemLogo from "../../assets/images/system-logo.png";

const Navbar = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();

  const onLogout = () => {
    logout();
    navigate("/login");
  };

  const navItems = [
    { to: "/dashboard", label: "Dashboard" },
    { to: "/resources", label: "Resources" },
    { to: "/bookings/my", label: "My Bookings" },
  ];

  if (user?.role === "ADMIN") {
    navItems.push({ to: "/bookings", label: "All Bookings" });
  }

  return (
    <nav className="nav">
      <div className="nav-brand">
        <span className="nav-brand-mark">
          <img className="nav-brand-logo" src={systemLogo} alt="Smart Campus Hub logo" />
        </span>
        <div className="nav-brand-text">
          <strong>Smart Campus Hub</strong>
          <small>Operations Console</small>
        </div>
      </div>

      <div className="nav-links">
        {isAuthenticated &&
          navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `nav-link${isActive ? " is-active" : ""}`}
            >
              {item.label}
            </NavLink>
          ))}
      </div>

      <div className="nav-actions">
        {isAuthenticated ? (
          <>
            <div className="nav-user-chip">
              <span className="nav-user-name">{user?.fullName}</span>
              <span className="nav-user-role">{user?.role}</span>
            </div>
            <button className="btn btn-light nav-logout-btn" onClick={onLogout} type="button">
              Logout
            </button>
          </>
        ) : (
          <div className="row">
            <Link className="btn btn-light" to="/login">Login</Link>
            <Link className="btn btn-primary" to="/register">Register</Link>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
