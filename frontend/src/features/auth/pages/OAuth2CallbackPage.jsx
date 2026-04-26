import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import useAuth from "../../../hooks/useAuth";

// This page handles the redirect from the backend after a successful Google login.
//
// Flow:
//   1. User clicks "Sign in with Google" → browser goes to backend /oauth2/authorization/google
//   2. Google authenticates → backend generates JWT → redirects to:
//      http://localhost:5173/oauth2/callback?token=<JWT>
//   3. This page reads the token, stores it (same as a regular login), and
//      navigates to the dashboard.
const OAuth2CallbackPage = () => {
  const [params] = useSearchParams();
  const { login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const token = params.get("token");
    const error = params.get("error");

    if (error || !token) {
      navigate("/login?error=oauth_failed", { replace: true });
      return;
    }

    try {
      // Decode the JWT payload (base64 middle section) to get user info
      const payloadBase64 = token.split(".")[1];
      const payload = JSON.parse(atob(payloadBase64.replace(/-/g, "+").replace(/_/g, "/")));

      // Build the same shape as a regular login response so useAuth works identically
      login({
        token,
        userId: payload.sub,
        email: payload.email,
        role: payload.role,
        fullName: payload.name ?? payload.email,
      });

      navigate("/dashboard", { replace: true });
    } catch {
      navigate("/login?error=oauth_failed", { replace: true });
    }
  }, [params, login, navigate]);

  return (
    <div className="page-shell" style={{ textAlign: "center", paddingTop: "4rem" }}>
      <p>Completing Google sign-in…</p>
    </div>
  );
};

export default OAuth2CallbackPage;
