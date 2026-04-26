import { useEffect, useRef, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import useAuth from "../../hooks/useAuth";
import {
  getMyNotifications,
  getMyUnreadNotificationCount,
  markAllNotificationsRead,
  markNotificationRead,
} from "../../api/notificationApi";
import "./Navbar.css";

// =====================================================================
// Top navigation bar.
//
// Layout:
//   [ Logo ]   Dashboard · Resources · Users · Bookings ▾ · Tickets ▾   [ User · Logout ]
//
// "Bookings" and "Tickets" are dropdown buttons. Clicking opens a panel
// listing the sub-items. The dropdown closes when:
//   - the user clicks outside the navbar
//   - the user presses Escape
//   - the user navigates to a new page
//
// The dropdown button itself shows the "active" state if ANY of its
// child links is the current route.
// =====================================================================
const Navbar = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Which dropdown is open right now ("bookings", "tickets", or null).
  const [openMenu, setOpenMenu] = useState(null);

  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);

  // Ref to the nav element so we can detect clicks outside it.
  const navRef = useRef(null);

  // Close any open dropdown whenever the route changes.
  useEffect(() => {
    setOpenMenu(null);
  }, [location.pathname]);

  // Poll unread count so the bell updates.
  useEffect(() => {
    if (!isAuthenticated) {
      setUnreadCount(0);
      setNotifications([]);
      return;
    }

    let alive = true;
    const tick = async () => {
      try {
        const count = await getMyUnreadNotificationCount();
        if (alive) setUnreadCount(Number(count) || 0);
      } catch {
        // ignore; navbar should not break if notifications fail
      }
    };

    tick();
    const id = window.setInterval(tick, 5000);
    return () => {
      alive = false;
      window.clearInterval(id);
    };
  }, [isAuthenticated]);

  const loadNotifications = async () => {
    try {
      const list = await getMyNotifications(8);
      setNotifications(Array.isArray(list) ? list : []);
    } catch {
      setNotifications([]);
    }
  };

  // Close on click outside or Escape key.
  useEffect(() => {
    if (!openMenu) return;

    const onDown = (event) => {
      if (navRef.current && !navRef.current.contains(event.target)) {
        setOpenMenu(null);
      }
    };
    const onKey = (event) => {
      if (event.key === "Escape") setOpenMenu(null);
    };

    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [openMenu]);

  const onLogout = () => {
    logout();
    navigate("/login");
  };

  // Active class helper for top-level links.
  const linkClass = ({ isActive }) =>
    isActive ? "nav-link is-active" : "nav-link";

  // Helper: is the current path inside one of the URLs in the list?
  // Used to highlight the parent dropdown button when any child route is active.
  const isPathActive = (paths) =>
    paths.some((path) => location.pathname === path || location.pathname.startsWith(path + "/"));

  // First letter for the avatar circle.
  const initial = user?.fullName?.trim().charAt(0).toUpperCase() ?? "U";

  // ----- The dropdown items per group -----
  // We build them as data so the JSX stays clean.
  const bookingItems = [
    { to: "/bookings/my", label: "My Bookings",  icon: "📅", show: true },
    { to: "/bookings",    label: "All Bookings", icon: "📋", show: user?.role === "ADMIN", end: true },
  ].filter((item) => item.show);

  const ticketItems = [
    { to: "/tickets/my",       label: "My Tickets", icon: "🎫", show: true },
    { to: "/tickets/assigned", label: "Assigned",   icon: "🛠", show: user?.role === "TECHNICIAN" || user?.role === "ADMIN" },
    { to: "/tickets",          label: "All Tickets", icon: "📊", show: user?.role === "ADMIN", end: true },
  ].filter((item) => item.show);

  return (
    <div className="nav-wrap">
      <nav className="nav" ref={navRef}>

        {/* Brand */}
        <Link to={isAuthenticated ? "/dashboard" : "/login"} className="nav-brand">
          <span className="nav-brand-icon">🎓</span>
          <span>Smart Campus Hub</span>
        </Link>

        {/* Authenticated navigation links */}
        {isAuthenticated && (
          <div className="nav-links">

            {/* Top level - Dashboard */}
            <NavLink to="/dashboard" className={linkClass}>
              <span className="nav-link-icon">🏠</span>Dashboard
            </NavLink>

            {/* Top level - Resources */}
            <NavLink to="/resources" className={linkClass}>
              <span className="nav-link-icon">🏛</span>Resources
            </NavLink>

            {/* Top level - Users (admin only) */}
            {user?.role === "ADMIN" && (
              <NavLink to="/admin/users" className={linkClass}>
                <span className="nav-link-icon">👥</span>Users
              </NavLink>
            )}

            {/* Dropdown - Bookings */}
            <div className="nav-dropdown">
              <button
                type="button"
                className={`nav-link nav-dropdown-btn${
                  isPathActive(["/bookings"]) ? " is-active" : ""
                }${openMenu === "bookings" ? " is-open" : ""}`}
                onClick={() => setOpenMenu(openMenu === "bookings" ? null : "bookings")}
                aria-haspopup="true"
                aria-expanded={openMenu === "bookings"}
              >
                <span className="nav-link-icon">📅</span>
                Bookings
                <span className="nav-chevron">▾</span>
              </button>

              {openMenu === "bookings" && (
                <div className="nav-dropdown-panel" role="menu">
                  {bookingItems.map((item) => (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      end={item.end}
                      className={({ isActive }) =>
                        isActive
                          ? "nav-dropdown-item is-active"
                          : "nav-dropdown-item"
                      }
                    >
                      <span className="nav-link-icon">{item.icon}</span>
                      {item.label}
                    </NavLink>
                  ))}
                </div>
              )}
            </div>

            {/* Dropdown - Tickets */}
            <div className="nav-dropdown">
              <button
                type="button"
                className={`nav-link nav-dropdown-btn${
                  isPathActive(["/tickets"]) ? " is-active" : ""
                }${openMenu === "tickets" ? " is-open" : ""}`}
                onClick={() => setOpenMenu(openMenu === "tickets" ? null : "tickets")}
                aria-haspopup="true"
                aria-expanded={openMenu === "tickets"}
              >
                <span className="nav-link-icon">🎫</span>
                Tickets
                <span className="nav-chevron">▾</span>
              </button>

              {openMenu === "tickets" && (
                <div className="nav-dropdown-panel" role="menu">
                  {ticketItems.map((item) => (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      end={item.end}
                      className={({ isActive }) =>
                        isActive
                          ? "nav-dropdown-item is-active"
                          : "nav-dropdown-item"
                      }
                    >
                      <span className="nav-link-icon">{item.icon}</span>
                      {item.label}
                    </NavLink>
                  ))}
                </div>
              )}
            </div>

          </div>
        )}

        {/* Right side - user info or login links */}
        {isAuthenticated ? (
          <div className="nav-user">
            {/* Notifications bell */}
            <div className="nav-dropdown">
              <button
                type="button"
                className={`nav-link nav-notify-btn${openMenu === "notifications" ? " is-open" : ""}`}
                onClick={async () => {
                  const next = openMenu === "notifications" ? null : "notifications";
                  setOpenMenu(next);
                  if (next === "notifications") {
                    await loadNotifications();
                  }
                }}
                aria-haspopup="true"
                aria-expanded={openMenu === "notifications"}
                title="Notifications"
              >
                <span className="nav-link-icon">🔔</span>
                {unreadCount > 0 && <span className="nav-notify-badge">{unreadCount > 99 ? "99+" : unreadCount}</span>}
              </button>

              {openMenu === "notifications" && (
                <div className="nav-dropdown-panel nav-notify-panel" role="menu">
                  <div className="nav-notify-header">
                    <span className="nav-notify-title">Notifications</span>
                    <button
                      type="button"
                      className="nav-notify-action"
                      onClick={async () => {
                        try {
                          await markAllNotificationsRead();
                          setUnreadCount(0);
                          setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
                        } finally {
                          // keep panel open
                        }
                      }}
                    >
                      Mark all read
                    </button>
                  </div>

                  {notifications.length === 0 ? (
                    <div className="nav-notify-empty">No notifications yet.</div>
                  ) : (
                    <div className="nav-notify-list">
                      {notifications.map((n) => (
                        <button
                          key={n.id}
                          type="button"
                          className={`nav-notify-item${n.read ? "" : " is-unread"}`}
                          onClick={async () => {
                            if (!n.read) {
                              try {
                                await markNotificationRead(n.id);
                                setNotifications((prev) =>
                                  prev.map((x) => (x.id === n.id ? { ...x, read: true } : x)),
                                );
                                setUnreadCount((c) => Math.max(0, (Number(c) || 0) - 1));
                              } catch {
                                // ignore
                              }
                            }
                          }}
                        >
                          <div className="nav-notify-item-title">{n.title}</div>
                          <div className="nav-notify-item-message">{n.message}</div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            <Link
              to="/profile"
              className="nav-user-profile-link"
              title="View your profile"
              style={{ display: "flex", alignItems: "center", gap: "0.5rem", textDecoration: "none", color: "inherit" }}
            >
              <div className="nav-user-info">
                <span className="nav-user-name">{user?.fullName}</span>
                <span className="nav-user-role">{user?.role}</span>
              </div>
              <div className="nav-avatar" style={{ cursor: "pointer" }}>{initial}</div>
            </Link>
            <button className="nav-logout-btn" onClick={onLogout} type="button">
              Logout
            </button>
          </div>
        ) : (
          <div className="nav-public-links">
            <Link to="/login" className="nav-public-link">Login</Link>
            <Link to="/register" className="nav-public-link is-primary">Register</Link>
          </div>
        )}

      </nav>
    </div>
  );
};

export default Navbar;
