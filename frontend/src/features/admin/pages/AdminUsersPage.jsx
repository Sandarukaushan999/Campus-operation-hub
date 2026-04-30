import { useEffect, useMemo, useState, useRef } from "react";
import { getUsers, updateUserRole, createUser, deleteUser } from "../../../api/userApi";
import CustomSelect from "../../../components/common/CustomSelect";

const ROLE_OPTIONS = ["USER", "TECHNICIAN", "ADMIN"];

const parseServerError = (err, fallback) => {
  const details = err?.response?.data?.details;
  if (Array.isArray(details) && details.length > 0) return details[0];
  return err?.response?.data?.message ?? fallback;
};

const CustomRoleSelect = ({ selected, onChange, disabled }) => {
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setOpen(false);
      }
    };
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  return (
    <div ref={containerRef} style={{ position: 'relative', display: 'inline-block' }}>
      <button
        type="button"
        className={`admin-users-role-select is-${selected?.toLowerCase()}`}
        onClick={() => !disabled && setOpen(!open)}
        style={{ opacity: disabled ? 0.6 : 1, width: '130px', textAlign: 'left' }}
      >
        {selected}
      </button>
      {open && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          marginTop: '6px',
          background: '#ffffff',
          borderRadius: '10px',
          boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1), 0 4px 6px -4px rgba(0,0,0,0.05)',
          border: '1px solid #e2e8f0',
          zIndex: 50,
          padding: '6px',
          display: 'flex',
          flexDirection: 'column',
          gap: '4px',
          minWidth: '140px'
        }}>
          {ROLE_OPTIONS.map((opt) => (
            <button
              key={opt}
              type="button"
              className={`admin-users-role-select is-${opt.toLowerCase()}`}
              style={{
                width: '100%',
                textAlign: 'left',
                border: '1px solid transparent',
                padding: '6px 12px',
                backgroundImage: 'none',
                boxShadow: 'none',
                opacity: selected === opt ? 1 : 0.7
              }}
              onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
              onMouseLeave={(e) => e.currentTarget.style.opacity = selected === opt ? '1' : '0.7'}
              onClick={() => {
                onChange(opt);
                setOpen(false);
              }}
            >
              {opt}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

const AdminUsersPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState("");
  const [error, setError] = useState("");
  const [roleDrafts, setRoleDrafts] = useState({});
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [showAddForm, setShowAddForm] = useState(false);
  const [newUserData, setNewUserData] = useState({ fullName: "", email: "", password: "", role: "TECHNICIAN" });
  const [addingUser, setAddingUser] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);

  const roleById = useMemo(() => {
    const map = {};
    users.forEach((u) => { map[u.id] = u.role; });
    return map;
  }, [users]);

  const currentRole = (id) => roleDrafts[id] ?? roleById[id] ?? "USER";
  const initialsOf = (fullName, email) => {
    const source = (fullName || email || "").trim();
    if (!source) return "U";
    const parts = source.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return source.slice(0, 2).toUpperCase();
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      setError("");
      const data = await getUsers();
      setUsers(data);
    } catch (err) {
      setError(parseServerError(err, "Failed to load users"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleAddUser = async (e) => {
    e.preventDefault();
    setAddingUser(true);
    try {
      setError("");
      await createUser(newUserData);
      setNewUserData({ fullName: "", email: "", password: "", role: "TECHNICIAN" });
      setShowAddForm(false);
      fetchUsers();
    } catch (err) {
      setError(parseServerError(err, "Failed to create user"));
    } finally {
      setAddingUser(false);
    }
  };

  const onChangeRole = (id, nextRole) => {
    setRoleDrafts((prev) => ({ ...prev, [id]: nextRole }));
  };

  const onSaveRole = async (id) => {
    const role = currentRole(id);
    setBusyId(id);
    try {
      setError("");
      const updated = await updateUserRole(id, role);
      setUsers((prev) => prev.map((u) => (u.id === id ? updated : u)));
      setRoleDrafts((prev) => {
        const copy = { ...prev };
        delete copy[id];
        return copy;
      });
    } catch (err) {
      setError(parseServerError(err, "Failed to update role"));
    } finally {
      setBusyId("");
    }
  };

  const visibleUsers = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return users.filter((u) => {
      if (roleFilter !== "ALL" && u.role !== roleFilter) return false;
      if (statusFilter === "ENABLED" && !u.enabled) return false;
      if (statusFilter === "DISABLED" && u.enabled) return false;
      if (!q) return true;
      return `${u.fullName ?? ""} ${u.email ?? ""}`.toLowerCase().includes(q);
    });
  }, [users, searchTerm, roleFilter, statusFilter]);

  const handleDeleteUser = async (id) => {
    setBusyId(id);
    try {
      setError("");
      await deleteUser(id);
      setUsers((prev) => prev.filter((u) => u.id !== id));
      setUserToDelete(null);
    } catch (err) {
      setError(parseServerError(err, "Failed to delete user"));
    } finally {
      setBusyId("");
    }
  };

  return (
    <section className="grid dashboard-shell">
      <div className="card page-hero admin-users-hero">
        <div className="spread">
          <div>
            <h2>User Management</h2>
            <p className="muted">Manage users, roles, and access controls from one secure admin surface.</p>
          </div>
          <div className="row">
            <button className="btn btn-primary" type="button" onClick={() => setShowAddForm(!showAddForm)}>
              {showAddForm ? "Cancel" : "Add User"}
            </button>
            <button className="btn btn-light" type="button" onClick={fetchUsers} disabled={loading}>
              Refresh
            </button>
          </div>
        </div>
      </div>

      <div className="card admin-users-toolbar">
        <input
          className="input"
          placeholder="Search by user name or email"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <CustomSelect 
          className="input" 
          value={roleFilter} 
          onChange={(val) => setRoleFilter(val)}
          options={[
            { value: "ALL", label: "All Roles" },
            ...ROLE_OPTIONS.map(opt => ({ value: opt, label: opt }))
          ]}
        />
        <CustomSelect 
          className="input" 
          value={statusFilter} 
          onChange={(val) => setStatusFilter(val)}
          options={[
            { value: "ALL", label: "All Statuses" },
            { value: "ENABLED", label: "Enabled" },
            { value: "DISABLED", label: "Disabled" }
          ]}
        />
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {showAddForm && (
        <div className="card admin-users-add-card">
          <h3>Add New User</h3>
          <form onSubmit={handleAddUser} className="admin-users-add-grid">
            <div className="form-field">
              <label>Full Name</label>
              <input required className="input" type="text" value={newUserData.fullName} onChange={(e) => setNewUserData({ ...newUserData, fullName: e.target.value })} />
            </div>
            <div className="form-field">
              <label>Email</label>
              <input required className="input" type="email" value={newUserData.email} onChange={(e) => setNewUserData({ ...newUserData, email: e.target.value })} />
            </div>
            <div className="form-field">
              <label>Password</label>
              <input required className="input" type="password" minLength={8} value={newUserData.password} onChange={(e) => setNewUserData({ ...newUserData, password: e.target.value })} />
            </div>
            <div className="form-field">
              <label>Role</label>
              <CustomSelect 
                className="input" 
                value={newUserData.role} 
                onChange={(val) => setNewUserData({ ...newUserData, role: val })}
                options={ROLE_OPTIONS.map(opt => ({ value: opt, label: opt }))}
              />
            </div>
            <div className="admin-users-add-actions">
              <button className="btn btn-primary" type="submit" disabled={addingUser}>
                {addingUser ? "Adding..." : "Add User"}
              </button>
            </div>
          </form>
        </div>
      )}

      {loading && <div className="card">Loading users...</div>}

      {!loading && (
        <div className="card admin-users-table-card">
          <div className="admin-users-table-wrap">
            <table className="admin-users-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {visibleUsers.map((u) => {
                  const selected = currentRole(u.id);
                  const dirty = selected !== (u.role ?? "USER");
                  const busy = busyId === u.id;
                  return (
                    <tr key={u.id}>
                      <td>
                        <div className="admin-users-name-cell">
                          <div className="admin-users-avatar">{initialsOf(u.fullName, u.email)}</div>
                          <div>
                            <div className="admin-users-name">{u.fullName || "—"}</div>
                            <div className="admin-users-id">ID: {u.id?.slice(0, 8)}</div>
                          </div>
                        </div>
                      </td>
                      <td className="admin-users-email">{u.email}</td>
                      <td>
                        <div className="admin-users-role-cell">
                          <CustomRoleSelect
                            selected={selected}
                            onChange={(val) => onChangeRole(u.id, val)}
                            disabled={busy}
                          />
                        </div>
                      </td>
                      <td>
                        <span className={u.enabled ? "badge badge-approved" : "badge badge-rejected"}>
                          {u.enabled ? "Enabled" : "Disabled"}
                        </span>
                      </td>
                      <td>
                        <div className="admin-users-actions">
                          <button
                            className="admin-icon-btn is-save"
                            type="button"
                            disabled={!dirty || busy}
                            onClick={() => onSaveRole(u.id)}
                            title={busy ? "Saving..." : "Save role"}
                          >
                            {busy ? "…" : "✓"}
                          </button>
                          <button
                            className="admin-icon-btn is-delete"
                            type="button"
                            disabled={busy}
                            onClick={() => setUserToDelete(u)}
                            title="Delete user"
                          >
                            🗑
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {visibleUsers.length === 0 && (
                  <tr>
                    <td colSpan={5} className="admin-users-empty">No users found for current filters.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {userToDelete && (
        <div className="modal-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="modal-content" style={{ background: '#fff', borderRadius: '16px', padding: '32px', maxWidth: '440px', width: '90%', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', border: '1px solid #e2e8f0', animation: 'tk-fadeDown 0.2s ease-out' }}>
            <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#FEF2F2', color: '#DC2626', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', flexShrink: 0 }}>
                🚨
              </div>
              <div>
                <h3 style={{ margin: '0 0 8px 0', color: '#0F172A', fontSize: '20px', fontWeight: '800' }}>Delete User</h3>
                <p style={{ margin: '0 0 24px 0', color: '#64748B', fontSize: '15px', lineHeight: '1.5' }}>
                  Are you sure you want to delete <strong>{userToDelete.fullName || userToDelete.email}</strong>? This action cannot be undone and will permanently remove their access to the platform.
                </p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button 
                className="btn btn-light" 
                onClick={() => setUserToDelete(null)}
                disabled={busyId === userToDelete.id}
                style={{ padding: '10px 20px' }}
              >
                Cancel
              </button>
              <button 
                className="btn btn-danger" 
                onClick={() => handleDeleteUser(userToDelete.id)}
                disabled={busyId === userToDelete.id}
                style={{ padding: '10px 20px', background: '#DC2626' }}
              >
                {busyId === userToDelete.id ? "Deleting..." : "Yes, delete user"}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default AdminUsersPage;

