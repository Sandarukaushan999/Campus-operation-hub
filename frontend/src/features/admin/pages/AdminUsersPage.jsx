import { useEffect, useMemo, useState } from "react";
import { getUsers, updateUserRole, createUser, deleteUser } from "../../../api/userApi";

const ROLE_OPTIONS = ["USER", "TECHNICIAN", "ADMIN"];

const parseServerError = (err, fallback) => {
  const details = err?.response?.data?.details;
  if (Array.isArray(details) && details.length > 0) return details[0];
  return err?.response?.data?.message ?? fallback;
};

const AdminUsersPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState("");
  const [error, setError] = useState("");
  const [roleDrafts, setRoleDrafts] = useState({});

  const [showAddForm, setShowAddForm] = useState(false);
  const [newUserData, setNewUserData] = useState({ fullName: "", email: "", password: "", role: "TECHNICIAN" });
  const [addingUser, setAddingUser] = useState(false);

  const roleById = useMemo(() => {
    const map = {};
    users.forEach((u) => { map[u.id] = u.role; });
    return map;
  }, [users]);

  const currentRole = (id) => roleDrafts[id] ?? roleById[id] ?? "USER";

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

  const handleDeleteUser = async (id) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;
    setBusyId(id);
    try {
      setError("");
      await deleteUser(id);
      setUsers((prev) => prev.filter((u) => u.id !== id));
    } catch (err) {
      setError(parseServerError(err, "Failed to delete user"));
    } finally {
      setBusyId("");
    }
  };

  return (
    <section className="grid">
      <div className="spread">
        <h2>User Management</h2>
        <div style={{ display: "flex", gap: "10px" }}>
          <button className="btn btn-primary" type="button" onClick={() => setShowAddForm(!showAddForm)}>
            {showAddForm ? "Cancel" : "Add User"}
          </button>
          <button className="btn btn-light" type="button" onClick={fetchUsers} disabled={loading}>
            Refresh
          </button>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {showAddForm && (
        <div className="card" style={{ marginBottom: "20px" }}>
          <h3>Add New User</h3>
          <form onSubmit={handleAddUser} style={{ display: "grid", gap: "10px", gridTemplateColumns: "1fr 1fr" }}>
            <div>
              <label>Full Name</label>
              <input required className="input" type="text" value={newUserData.fullName} onChange={(e) => setNewUserData({...newUserData, fullName: e.target.value})} />
            </div>
            <div>
              <label>Email</label>
              <input required className="input" type="email" value={newUserData.email} onChange={(e) => setNewUserData({...newUserData, email: e.target.value})} />
            </div>
            <div>
              <label>Password</label>
              <input required className="input" type="password" minLength={8} value={newUserData.password} onChange={(e) => setNewUserData({...newUserData, password: e.target.value})} />
            </div>
            <div>
              <label>Role</label>
              <select className="input" value={newUserData.role} onChange={(e) => setNewUserData({...newUserData, role: e.target.value})}>
                {ROLE_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
              </select>
            </div>
            <div style={{ gridColumn: "1 / -1", marginTop: "10px" }}>
              <button className="btn btn-primary" type="submit" disabled={addingUser}>
                {addingUser ? "Adding..." : "Add User"}
              </button>
            </div>
          </form>
        </div>
      )}
      {loading && <div className="card">Loading users...</div>}

      {!loading && (
        <div className="card" style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={{ textAlign: "left", padding: 10 }}>Name</th>
                <th style={{ textAlign: "left", padding: 10 }}>Email</th>
                <th style={{ textAlign: "left", padding: 10 }}>Role</th>
                <th style={{ textAlign: "left", padding: 10 }}>Status</th>
                <th style={{ textAlign: "left", padding: 10 }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => {
                const selected = currentRole(u.id);
                const dirty = selected !== (u.role ?? "USER");
                const busy = busyId === u.id;
                return (
                  <tr key={u.id} style={{ borderTop: "1px solid var(--border, #e6e6e6)" }}>
                    <td style={{ padding: 10 }}>{u.fullName || "—"}</td>
                    <td style={{ padding: 10 }}>{u.email}</td>
                    <td style={{ padding: 10 }}>
                      <select
                        className="input"
                        value={selected}
                        onChange={(e) => onChangeRole(u.id, e.target.value)}
                        disabled={busy}
                      >
                        {ROLE_OPTIONS.map((opt) => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    </td>
                    <td style={{ padding: 10 }}>
                      <span className={u.enabled ? "badge badge-approved" : "badge badge-rejected"}>
                        {u.enabled ? "Enabled" : "Disabled"}
                      </span>
                    </td>
                    <td style={{ padding: 10 }}>
                      <div style={{ display: "flex", gap: "5px" }}>
                        <button
                          className="btn btn-primary"
                          type="button"
                          disabled={!dirty || busy}
                          onClick={() => onSaveRole(u.id)}
                        >
                          {busy ? "Saving..." : "Save"}
                        </button>
                        <button
                          className="btn btn-danger"
                          type="button"
                          disabled={busy}
                          onClick={() => handleDeleteUser(u.id)}
                          style={{ padding: "4px 8px", backgroundColor: "#ef4444", color: "white", border: "none", borderRadius: "4px", cursor: "pointer" }}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {users.length === 0 && (
                <tr>
                  <td style={{ padding: 10 }} colSpan={5}>No users found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
};

export default AdminUsersPage;

