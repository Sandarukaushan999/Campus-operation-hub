import { useEffect, useMemo, useState } from "react";
import { getUsers, updateUserRole } from "../../../api/userApi";

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

  return (
    <section className="grid">
      <div className="spread">
        <h2>User Management</h2>
        <button className="btn btn-light" type="button" onClick={fetchUsers} disabled={loading}>
          Refresh
        </button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
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
                      <button
                        className="btn btn-primary"
                        type="button"
                        disabled={!dirty || busy}
                        onClick={() => onSaveRole(u.id)}
                      >
                        {busy ? "Saving..." : "Save"}
                      </button>
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

