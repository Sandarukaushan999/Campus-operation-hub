import { useEffect, useRef, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import useAuth from "../../hooks/useAuth";
import {
  deleteAllNotifications,
  deleteNotification,
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

  // First letter for the avatar circle.
  const initial = user?.fullName?.trim().charAt(0).toUpperCase() ?? "U";
  const bookingsPath = user?.role === "ADMIN" ? "/bookings" : "/bookings/my";
  const ticketsPath = user?.role === "ADMIN" ? "/tickets" : "/tickets/my";
  const getNotificationMeta = (notification) => {
    const type = notification?.type;
    const text = `${notification?.title || ""} ${notification?.message || ""}`.toLowerCase();
    if (type === "BOOKING") return { icon: "📅", label: "Booking", className: "is-booking" };
    if (type === "TICKET") return { icon: "🛠️", label: "Ticket", className: "is-ticket" };
    if (text.includes("resource")) return { icon: "🏛️", label: "Resource", className: "is-resource" };
    if (type === "SYSTEM") return { icon: "⚙️", label: "System", className: "is-system" };
    return { icon: "🔔", label: "General", className: "is-general" };
  };

  return (
    <div className="nav-wrap">
      <nav className="nav" ref={navRef}>
        <div className="nav-left">
          <Link to={isAuthenticated ? "/home" : "/login"} className="nav-brand">
            <span className="nav-brand-icon">🎓</span>
            <span>Smart Campus Hub</span>
          </Link>
        </div>

        {isAuthenticated && (
          <div className="nav-center">
            <div className="nav-links">

            {/* Top level - Home */}
            <NavLink to="/home" className={linkClass}>
              <span className="nav-link-icon">🏠</span>Home
            </NavLink>

            {/* Top level - Dashboard */}
            <NavLink to="/dashboard" className={linkClass}>
              <span className="nav-link-icon">📊</span>Dashboard
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

            <NavLink to={bookingsPath} className={linkClass}>
              <span className="nav-link-icon">📅</span>Bookings
            </NavLink>

            <NavLink to={ticketsPath} className={linkClass}>
              <span className="nav-link-icon">🎫</span>Tickets
            </NavLink>

            </div>
          </div>
        )}

        <div className="nav-right">
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
                    <div className="nav-notify-actions">
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
                      <button
                        type="button"
                        className="nav-notify-action is-danger"
                        onClick={async () => {
                          try {
                            await deleteAllNotifications();
                            setNotifications([]);
                            setUnreadCount(0);
                          } finally {
                            // keep panel open
                          }
                        }}
                      >
                        Delete all
                      </button>
                    </div>
                  </div>

                  {notifications.length === 0 ? (
                    <div className="nav-notify-empty">No notifications yet.</div>
                  ) : (
                    <div className="nav-notify-list">
                      {notifications.map((n) => {
                        const meta = getNotificationMeta(n);
                        return (
                        <div key={n.id} className={`nav-notify-item${n.read ? "" : " is-unread"}`}>
                          <button
                            type="button"
                            className="nav-notify-open"
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
                            <div className="nav-notify-item-top">
                              <span className={`nav-notify-tag ${meta.className}`}>
                                <span>{meta.icon}</span> {meta.label}
                              </span>
                            </div>
                            <div className="nav-notify-item-title">{n.title}</div>
                            <div className="nav-notify-item-message">{n.message}</div>
                          </button>
                          <button
                            type="button"
                            className="nav-notify-delete"
                            title="Delete notification"
                            onClick={async () => {
                              try {
                                await deleteNotification(n.id);
                                setNotifications((prev) => prev.filter((x) => x.id !== n.id));
                                if (!n.read) {
                                  setUnreadCount((c) => Math.max(0, (Number(c) || 0) - 1));
                                }
                              } catch {
                                // ignore
                              }
                            }}
                          >
                            🗑️
                          </button>
                        </div>
                      )})}
                    </div>
                  )}
                </div>
              )}
            </div>

            <Link to="/profile" className="nav-user-profile-link" title="View your profile">
              <div className="nav-user-info">
                <span className="nav-user-name">{user?.fullName}</span>
                <span className="nav-user-role">{user?.role}</span>
              </div>
              <div className="nav-avatar">{initial}</div>
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
        </div>

      </nav>
    </div>
  );
};

export default Navbar;
