import { useEffect, useState } from "react";
import { getProfile, updateProfile, changePassword } from "../../../api/userApi";

const ProfilePage = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Edit profile form state
  const [editForm, setEditForm] = useState({ fullName: "", phone: "" });
  const [editSuccess, setEditSuccess] = useState("");
  const [editError, setEditError] = useState("");
  const [editLoading, setEditLoading] = useState(false);

  // Change password form state
  const [pwForm, setPwForm] = useState({ oldPassword: "", newPassword: "", confirmPassword: "" });
  const [pwSuccess, setPwSuccess] = useState("");
  const [pwError, setPwError] = useState("");
  const [pwLoading, setPwLoading] = useState(false);

  useEffect(() => {
    getProfile()
      .then((data) => {
        setProfile(data);
        setEditForm({ fullName: data.fullName ?? "", phone: data.phone ?? "" });
      })
      .catch(() => setError("Failed to load profile."))
      .finally(() => setLoading(false));
  }, []);

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setEditError("");
    setEditSuccess("");
    setEditLoading(true);
    try {
      const updated = await updateProfile(editForm);
      setProfile((prev) => ({ ...prev, ...updated }));
      setEditSuccess("Profile updated successfully.");
    } catch (err) {
      const msg =
        err?.response?.data?.details?.[0] ||
        err?.response?.data?.message ||
        "Failed to update profile.";
      setEditError(msg);
    } finally {
      setEditLoading(false);
    }
  };

  const handlePwSubmit = async (e) => {
    e.preventDefault();
    setPwError("");
    setPwSuccess("");
    if (pwForm.newPassword !== pwForm.confirmPassword) {
      setPwError("New passwords do not match.");
      return;
    }
    setPwLoading(true);
    try {
      await changePassword({ oldPassword: pwForm.oldPassword, newPassword: pwForm.newPassword });
      setPwSuccess("Password changed successfully.");
      setPwForm({ oldPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err) {
      const msg =
        err?.response?.data?.details?.[0] ||
        err?.response?.data?.message ||
        "Failed to change password.";
      setPwError(msg);
    } finally {
      setPwLoading(false);
    }
  };

  if (loading) return <div className="page-shell"><p>Loading profile…</p></div>;
  if (error)   return <div className="page-shell"><div className="alert alert-error">{error}</div></div>;

  const initial = profile?.fullName?.trim().charAt(0).toUpperCase() ?? "U";

  return (
    <div className="page-shell" style={{ maxWidth: 640, margin: "0 auto" }}>

      {/* ── Header card ── */}
      <div className="card" style={{ display: "flex", alignItems: "center", gap: "1.25rem", marginBottom: "1.5rem" }}>
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: "50%",
            background: "var(--color-primary, #1d4ed8)",
            color: "#fff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "1.75rem",
            fontWeight: 700,
            flexShrink: 0,
          }}
        >
          {initial}
        </div>
        <div>
          <h2 style={{ margin: 0 }}>{profile.fullName}</h2>
          <p style={{ margin: "0.2rem 0 0", opacity: 0.65 }}>
            {profile.email} &nbsp;·&nbsp;
            <span
              style={{
                background: "var(--color-primary, #1d4ed8)",
                color: "#fff",
                borderRadius: 4,
                padding: "1px 8px",
                fontSize: "0.72rem",
                fontWeight: 600,
                letterSpacing: "0.05em",
              }}
            >
              {profile.role}
            </span>
          </p>
          {profile.phone && (
            <p style={{ margin: "0.2rem 0 0", opacity: 0.65, fontSize: "0.875rem" }}>
              📞 {profile.phone}
            </p>
          )}
        </div>
      </div>

      {/* ── Edit profile ── */}
      <div className="card" style={{ marginBottom: "1.5rem" }}>
        <h3 style={{ marginTop: 0 }}>Edit Profile</h3>
        {editError   && <div className="alert alert-error">{editError}</div>}
        {editSuccess && <div className="alert alert-success">{editSuccess}</div>}
        <form className="grid" onSubmit={handleEditSubmit}>
          <div className="form-field">
            <label htmlFor="profile-fullName">Full Name</label>
            <input
              id="profile-fullName"
              className="input"
              value={editForm.fullName}
              onChange={(e) => setEditForm((p) => ({ ...p, fullName: e.target.value }))}
              required
            />
          </div>
          <div className="form-field">
            <label htmlFor="profile-phone">Phone Number</label>
            <input
              id="profile-phone"
              className="input"
              type="tel"
              placeholder="e.g. +94 77 123 4567"
              value={editForm.phone}
              onChange={(e) => setEditForm((p) => ({ ...p, phone: e.target.value }))}
            />
          </div>
          <button className="btn btn-primary" type="submit" disabled={editLoading}>
            {editLoading ? "Saving…" : "Save Changes"}
          </button>
        </form>
      </div>

      {/* ── Change password ── */}
      <div className="card">
        <h3 style={{ marginTop: 0 }}>Change Password</h3>
        {pwError   && <div className="alert alert-error">{pwError}</div>}
        {pwSuccess && <div className="alert alert-success">{pwSuccess}</div>}
        <form className="grid" onSubmit={handlePwSubmit}>
          <div className="form-field">
            <label htmlFor="pw-old">Current Password</label>
            <input
              id="pw-old"
              className="input"
              type="password"
              value={pwForm.oldPassword}
              onChange={(e) => setPwForm((p) => ({ ...p, oldPassword: e.target.value }))}
              required
            />
          </div>
          <div className="form-field">
            <label htmlFor="pw-new">New Password</label>
            <input
              id="pw-new"
              className="input"
              type="password"
              value={pwForm.newPassword}
              onChange={(e) => setPwForm((p) => ({ ...p, newPassword: e.target.value }))}
              required
              minLength={8}
            />
          </div>
          <div className="form-field">
            <label htmlFor="pw-confirm">Confirm New Password</label>
            <input
              id="pw-confirm"
              className="input"
              type="password"
              value={pwForm.confirmPassword}
              onChange={(e) => setPwForm((p) => ({ ...p, confirmPassword: e.target.value }))}
              required
              minLength={8}
            />
          </div>
          <button className="btn btn-primary" type="submit" disabled={pwLoading}>
            {pwLoading ? "Changing…" : "Change Password"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ProfilePage;
