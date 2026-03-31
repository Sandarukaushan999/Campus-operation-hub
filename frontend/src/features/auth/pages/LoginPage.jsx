import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { login as loginApi } from "../../../api/authApi";
import useAuth from "../../../hooks/useAuth";

const LoginPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      const authData = await loginApi({
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
        "Login failed",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-shell">
      <div className="card" style={{ maxWidth: 460, margin: "40px auto" }}>
        <h2>Welcome Back</h2>
        <p>Log in to manage your campus resources and bookings.</p>
        {error && <div className="alert alert-error">{error}</div>}
        <form className="grid" onSubmit={onSubmit}>
          <div className="form-field">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              className="input"
              value={form.email}
              onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
              type="email"
              required
            />
          </div>
          <div className="form-field">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              className="input"
              value={form.password}
              onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
              type="password"
              required
            />
          </div>
          <button className="btn btn-primary" type="submit" disabled={loading}>
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>
        <p>
          New user? <Link to="/register">Create an account</Link>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
