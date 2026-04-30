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
  const [showPassword, setShowPassword] = useState(false);

  const [validationErrors, setValidationErrors] = useState({});

  const validate = () => {
    const errs = {};
    if (!form.fullName.trim()) errs.fullName = "Full Name is required";
    if (!form.email.trim()) {
      errs.email = "Email is required";
    } else if (!/^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/.test(form.email)) {
      errs.email = "Invalid email format";
    }
    if (!form.password) {
      errs.password = "Password is required";
    } else if (form.password.length < 8) {
      errs.password = "Password must be at least 8 characters";
    }
    if (!form.confirmPassword) {
      errs.confirmPassword = "Confirm password is required";
    } else if (form.password !== form.confirmPassword) {
      errs.confirmPassword = "Passwords do not match";
    }
    setValidationErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const onSubmit = async (event) => {
    event.preventDefault();
    if (!validate()) return;
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

  const handleChange = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
    if (validationErrors[field]) {
      setValidationErrors((prev) => ({ ...prev, [field]: null }));
    }
  };

  return (
    <div className="modern-auth-page">
      <style>{`
        .modern-auth-page {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #F1F5F9;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          padding: 32px;
        }

        .auth-split-wrapper {
          display: flex;
          width: 100%;
          max-width: 1120px;
          min-height: 700px;
          background: #ffffff;
          border-radius: 28px;
          box-shadow: 0 25px 50px -12px rgba(15, 23, 42, 0.15), 0 0 0 1px rgba(15, 23, 42, 0.05);
          overflow: hidden;
        }

        /* --- Left Panel --- */
        .auth-left-panel {
          flex: 1.1;
          background: linear-gradient(145deg, #0F172A 0%, #1E3A8A 100%);
          color: #ffffff;
          padding: 64px;
          display: flex;
          flex-direction: column;
          position: relative;
          overflow: hidden;
        }

        /* Decorative shapes for premium feel */
        .auth-left-panel::before {
          content: "";
          position: absolute;
          top: -20%;
          left: -10%;
          width: 500px;
          height: 500px;
          background: radial-gradient(circle, rgba(56, 189, 248, 0.1) 0%, transparent 70%);
          border-radius: 50%;
        }
        .auth-left-panel::after {
          content: "";
          position: absolute;
          bottom: -10%;
          right: -20%;
          width: 600px;
          height: 600px;
          background: radial-gradient(circle, rgba(37, 99, 235, 0.15) 0%, transparent 60%);
          border-radius: 50%;
        }

        .auth-left-content {
          position: relative;
          z-index: 1;
          display: flex;
          flex-direction: column;
          height: 100%;
          justify-content: space-between;
        }

        .auth-logo {
          display: flex;
          align-items: center;
          gap: 14px;
          font-size: 22px;
          font-weight: 800;
          color: #ffffff;
          letter-spacing: -0.01em;
        }
        .auth-logo-icon {
          font-size: 24px;
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
          padding: 10px;
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          backdrop-filter: blur(8px);
        }

        .auth-welcome-text {
          margin: auto 0;
        }

        .auth-heading {
          font-size: 44px;
          font-weight: 800;
          line-height: 1.15;
          margin: 0 0 20px 0;
          letter-spacing: -0.03em;
          background: linear-gradient(to right, #ffffff, #93C5FD);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .auth-description {
          font-size: 18px;
          color: #94A3B8;
          line-height: 1.6;
          margin: 0 0 40px 0;
          max-width: 90%;
        }

        .auth-features {
          list-style: none;
          padding: 0;
          margin: 0;
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .auth-features li {
          display: flex;
          align-items: center;
          gap: 16px;
          font-size: 16px;
          font-weight: 500;
          color: #F8FAFC;
        }

        .check-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 28px;
          height: 28px;
          background: rgba(37, 99, 235, 0.2);
          color: #60A5FA;
          border-radius: 50%;
          font-size: 14px;
          font-weight: 800;
          border: 1px solid rgba(59, 130, 246, 0.3);
        }

        .auth-copyright {
          font-size: 14px;
          color: #64748B;
          font-weight: 500;
        }

        /* --- Right Panel --- */
        .auth-right-panel {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 48px;
          background: #ffffff;
          overflow-y: auto;
        }

        .auth-form-card {
          width: 100%;
          max-width: 400px;
        }

        .auth-form-header {
          margin-bottom: 32px;
          text-align: left;
        }

        .auth-form-header h2 {
          font-size: 32px;
          font-weight: 800;
          color: #0F172A;
          margin: 0 0 10px 0;
          letter-spacing: -0.03em;
        }

        .auth-form-header p {
          font-size: 16px;
          color: #64748B;
          margin: 0;
        }

        .auth-field {
          display: flex;
          flex-direction: column;
          gap: 8px;
          margin-bottom: 20px;
        }

        .auth-label {
          font-size: 14px;
          font-weight: 600;
          color: #334155;
        }

        .auth-input {
          width: 100%;
          height: 52px;
          padding: 0 16px;
          border-radius: 14px;
          border: 1px solid #E2E8F0;
          background: #F8FAFC;
          font-size: 16px;
          color: #0F172A;
          transition: all 0.2s ease;
          font-family: inherit;
        }

        .auth-input::placeholder {
          color: #94A3B8;
        }

        .auth-input:hover:not(.has-error) {
          border-color: #CBD5E1;
        }

        .auth-input:focus {
          outline: none;
          background: #ffffff;
          border-color: #2563EB;
          box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.1);
        }

        .auth-input.has-error {
          border-color: #EF4444;
          background-color: #FEF2F2;
        }
        .auth-input.has-error:focus {
          box-shadow: 0 0 0 4px rgba(239, 68, 68, 0.15);
        }

        .password-wrapper {
          position: relative;
          display: flex;
          align-items: center;
        }

        .password-toggle {
          position: absolute;
          right: 12px;
          background: none;
          border: none;
          padding: 6px;
          cursor: pointer;
          color: #94A3B8;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 8px;
          transition: all 0.2s ease;
        }
        .password-toggle:hover {
          color: #0F172A;
          background: #E2E8F0;
        }

        .auth-error-text {
          color: #DC2626;
          font-size: 13px;
          font-weight: 500;
          margin-top: 2px;
        }

        .auth-submit-btn {
          width: 100%;
          height: 52px;
          background: #2563EB;
          color: #ffffff;
          border: none;
          border-radius: 14px;
          font-size: 16px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 12px rgba(37, 99, 235, 0.2);
          margin-top: 12px;
        }

        .auth-submit-btn:hover:not(:disabled) {
          background: #1D4ED8;
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(37, 99, 235, 0.25);
        }

        .auth-submit-btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
          transform: none;
        }

        .auth-divider {
          display: flex;
          align-items: center;
          gap: 16px;
          margin: 24px 0;
        }
        .auth-divider-line {
          flex: 1;
          height: 1px;
          background: #E2E8F0;
        }
        .auth-divider-text {
          font-size: 13px;
          font-weight: 700;
          color: #94A3B8;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .auth-google-btn {
          width: 100%;
          height: 52px;
          background: #ffffff;
          border: 1px solid #E2E8F0;
          border-radius: 14px;
          font-size: 16px;
          font-weight: 600;
          color: #334155;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          cursor: pointer;
          transition: all 0.2s ease;
          text-decoration: none;
          box-shadow: 0 1px 2px rgba(0,0,0,0.02);
        }
        .auth-google-btn:hover {
          background: #F8FAFC;
          border-color: #CBD5E1;
        }

        .auth-footer {
          margin-top: 32px;
          text-align: center;
          font-size: 15px;
          color: #64748B;
        }
        .auth-footer a {
          color: #2563EB;
          font-weight: 700;
          text-decoration: none;
          margin-left: 4px;
        }
        .auth-footer a:hover {
          text-decoration: underline;
        }

        .auth-alert {
          background-color: #FEF2F2;
          border: 1px solid #FCA5A5;
          color: #991B1B;
          padding: 14px 16px;
          border-radius: 14px;
          margin-bottom: 24px;
          font-size: 14px;
          font-weight: 500;
          display: flex;
          align-items: center;
          gap: 12px;
        }

        /* --- Responsive --- */
        @media (max-width: 960px) {
          .auth-split-wrapper {
            flex-direction: column;
            border-radius: 24px;
            min-height: auto;
          }
          .auth-left-panel {
            padding: 48px 32px;
            flex: none;
          }
          .auth-welcome-text {
            margin: 0;
          }
          .auth-heading {
            font-size: 36px;
          }
          .auth-description {
            margin-bottom: 32px;
          }
          .auth-features {
            display: none;
          }
          .auth-right-panel {
            padding: 48px 32px;
          }
          .auth-logo {
            margin-bottom: 40px;
          }
          .auth-copyright {
            display: none;
          }
        }

        @media (max-width: 480px) {
          .modern-auth-page {
            padding: 16px;
          }
          .auth-left-panel, .auth-right-panel {
            padding: 40px 24px;
          }
          .auth-heading {
            font-size: 32px;
          }
        }
      `}</style>

      <div className="auth-split-wrapper">
        {/* Left Panel */}
        <div className="auth-left-panel">
          <div className="auth-left-content">
            <div className="auth-logo">
              <span className="auth-logo-icon">🎓</span>
              Smart Campus Hub
            </div>
            
            <div className="auth-welcome-text">
              <h1 className="auth-heading">Join the<br />Smart Campus Hub</h1>
              <p className="auth-description">
                Create an account to manage campus resources, book rooms, and streamline your operations effortlessly.
              </p>
              
              <ul className="auth-features">
                <li><span className="check-icon">✓</span> Book resources easily</li>
                <li><span className="check-icon">✓</span> Track maintenance requests</li>
                <li><span className="check-icon">✓</span> Manage campus efficiently</li>
              </ul>
            </div>
            
            <div className="auth-copyright">
              © 2026 Smart Campus Hub. All rights reserved.
            </div>
          </div>
        </div>

        {/* Right Panel */}
        <div className="auth-right-panel">
          <div className="auth-form-card">
            <div className="auth-form-header">
              <h2>Create Account</h2>
              <p>Set up your Smart Campus Hub access.</p>
            </div>

            {error && (
              <div className="auth-alert">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="12" y1="8" x2="12" y2="12"></line>
                  <line x1="12" y1="16" x2="12.01" y2="16"></line>
                </svg>
                {error}
              </div>
            )}

            <form onSubmit={onSubmit} noValidate>
              <div className="auth-field">
                <label className="auth-label" htmlFor="fullName">Full Name</label>
                <input
                  id="fullName"
                  className={`auth-input ${validationErrors.fullName ? "has-error" : ""}`}
                  placeholder="John Doe"
                  value={form.fullName}
                  onChange={handleChange("fullName")}
                />
                {validationErrors.fullName && <span className="auth-error-text">{validationErrors.fullName}</span>}
              </div>

              <div className="auth-field">
                <label className="auth-label" htmlFor="email">Email address</label>
                <input
                  id="email"
                  className={`auth-input ${validationErrors.email ? "has-error" : ""}`}
                  type="email"
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={handleChange("email")}
                />
                {validationErrors.email && <span className="auth-error-text">{validationErrors.email}</span>}
              </div>

              <div className="auth-field">
                <label className="auth-label" htmlFor="password">Password</label>
                <div className="password-wrapper">
                  <input
                    id="password"
                    className={`auth-input ${validationErrors.password ? "has-error" : ""}`}
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={form.password}
                    onChange={handleChange("password")}
                    style={{ paddingRight: "44px" }}
                  />
                  <button 
                    type="button" 
                    className="password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex="-1"
                    title={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                        <line x1="1" y1="1" x2="23" y2="23"></line>
                      </svg>
                    ) : (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                        <circle cx="12" cy="12" r="3"></circle>
                      </svg>
                    )}
                  </button>
                </div>
                {validationErrors.password && <span className="auth-error-text">{validationErrors.password}</span>}
              </div>

              <div className="auth-field">
                <label className="auth-label" htmlFor="confirmPassword">Confirm Password</label>
                <div className="password-wrapper">
                  <input
                    id="confirmPassword"
                    className={`auth-input ${validationErrors.confirmPassword ? "has-error" : ""}`}
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={form.confirmPassword}
                    onChange={handleChange("confirmPassword")}
                    style={{ paddingRight: "44px" }}
                  />
                </div>
                {validationErrors.confirmPassword && <span className="auth-error-text">{validationErrors.confirmPassword}</span>}
              </div>

              <button className="auth-submit-btn" type="submit" disabled={loading}>
                {loading ? "Creating Account..." : "Create Account"}
              </button>
            </form>

            <div className="auth-divider">
              <div className="auth-divider-line"></div>
              <span className="auth-divider-text">OR</span>
              <div className="auth-divider-line"></div>
            </div>

            <a
              href="http://localhost:8080/oauth2/authorization/google"
              className="auth-google-btn"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                <path d="M1 1h22v22H1z" fill="none"/>
              </svg>
              Sign up with Google
            </a>

            <div className="auth-footer">
              Already have an account? <Link to="/login">Sign in</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
