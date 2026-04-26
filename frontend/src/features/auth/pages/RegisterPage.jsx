import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { register as registerApi } from "../../../api/authApi";
import useAuth from "../../../hooks/useAuth";

const RegisterPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (event) => {
    event.preventDefault();
    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const authData = await registerApi({
        fullName: form.fullName.trim(),
        email: form.email.trim().toLowerCase(),
        password: form.password,
      });
      login(authData);
      navigate("/dashboard");
    } catch (err) {
      const details = err?.response?.data?.details;
      setError(
        (Array.isArray(details) && details.length > 0 && details[0]) ||
        err?.response?.data?.message ||
        "Registration failed",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-shell">
      <div className="card" style={{ maxWidth: 500, margin: "40px auto" }}>
        <h2>Create Account</h2>
        <p>Set up your Smart Campus Hub access.</p>
        {error && <div className="alert alert-error">{error}</div>}
        <form className="grid" onSubmit={onSubmit}>
          <div className="form-field">
            <label htmlFor="fullName">Full Name</label>
            <input
              id="fullName"
              className="input"
              value={form.fullName}
              onChange={(e) => setForm((prev) => ({ ...prev, fullName: e.target.value }))}
              required
            />
          </div>
          <div className="form-field">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              className="input"
              type="email"
              value={form.email}
              onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
              required
            />
          </div>
          <div className="form-field">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              className="input"
              type="password"
              value={form.password}
              onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
              required
              minLength={8}
            />
          </div>
          <div className="form-field">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <input
              id="confirmPassword"
              className="input"
              type="password"
              value={form.confirmPassword}
              onChange={(e) => setForm((prev) => ({ ...prev, confirmPassword: e.target.value }))}
              required
              minLength={8}
            />
          </div>
          <button className="btn btn-primary" type="submit" disabled={loading}>
            {loading ? "Creating Account..." : "Create Account"}
          </button>
        </form>

        <div style={{ margin: "1.5rem 0", display: "flex", alignItems: "center", gap: "1rem" }}>
          <div style={{ flex: 1, height: 1, background: "var(--border-color, #e2e8f0)" }} />
          <span style={{ fontSize: "0.85rem", color: "var(--text-muted, #64748b)" }}>OR</span>
          <div style={{ flex: 1, height: 1, background: "var(--border-color, #e2e8f0)" }} />
        </div>

        <a
          href="http://localhost:8080/oauth2/authorization/google"
          className="btn"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "0.5rem",
            width: "100%",
            background: "#fff",
            color: "#333",
            border: "1px solid var(--border-color, #e2e8f0)",
            textDecoration: "none",
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            <path d="M1 1h22v22H1z" fill="none"/>
          </svg>
          Sign in with Google
        </a>
        <p>
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
};

export default RegisterPage;
