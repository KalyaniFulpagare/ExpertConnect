import { useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { getApiError } from "../api/client";

const emptyLoginForm = {
  email: "",
  password: ""
};

const emptySignupForm = {
  name: "",
  email: "",
  phone: "",
  password: "",
  confirmPassword: ""
};

export function AuthPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, login, signup } = useAuth();
  const [mode, setMode] = useState("login");
  const [loginForm, setLoginForm] = useState(emptyLoginForm);
  const [signupForm, setSignupForm] = useState(emptySignupForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const redirectTo = location.state?.from || "/";

  if (isAuthenticated) {
    return <Navigate to={redirectTo} replace />;
  }

  const handleLogin = async (event) => {
    event.preventDefault();

    try {
      setSubmitting(true);
      setError("");
      await login(loginForm);
      navigate(redirectTo, { replace: true });
    } catch (requestError) {
      setError(getApiError(requestError, "Login failed. Please try again."));
    } finally {
      setSubmitting(false);
    }
  };

  const handleSignup = async (event) => {
    event.preventDefault();

    if (signupForm.password !== signupForm.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      setSubmitting(true);
      setError("");
      await signup({
        name: signupForm.name,
        email: signupForm.email,
        phone: signupForm.phone,
        password: signupForm.password
      });
      navigate(redirectTo, { replace: true });
    } catch (requestError) {
      setError(getApiError(requestError, "Sign up failed. Please try again."));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-shell">
      <section className="surface-panel auth-panel">
        <div className="section-header">
          <div>
            <p className="eyebrow">Account access</p>
            <h1>{mode === "login" ? "Welcome back" : "Create your account"}</h1>
            <p className="hero-copy">
              Sign in to save experts, book sessions, and manage your schedule in one place.
            </p>
          </div>
        </div>

        <div className="tab-row">
          <button
            type="button"
            className={mode === "login" ? "tab-button active" : "tab-button"}
            onClick={() => {
              setMode("login");
              setError("");
            }}
          >
            Login
          </button>
          <button
            type="button"
            className={mode === "signup" ? "tab-button active" : "tab-button"}
            onClick={() => {
              setMode("signup");
              setError("");
            }}
          >
            Sign up
          </button>
        </div>

        {error ? <div className="inline-alert error">{error}</div> : null}

        {mode === "login" ? (
          <form className="auth-form" onSubmit={handleLogin}>
            <label className="field-block">
              <span>Email</span>
              <input
                type="email"
                value={loginForm.email}
                onChange={(event) =>
                  setLoginForm((current) => ({ ...current, email: event.target.value }))
                }
                placeholder="you@example.com"
              />
            </label>

            <label className="field-block">
              <span>Password</span>
              <input
                type="password"
                value={loginForm.password}
                onChange={(event) =>
                  setLoginForm((current) => ({ ...current, password: event.target.value }))
                }
                placeholder="Enter your password"
              />
            </label>

            <button type="submit" className="primary-button" disabled={submitting}>
              {submitting ? "Signing in..." : "Login"}
            </button>
          </form>
        ) : (
          <form className="auth-form" onSubmit={handleSignup}>
            <label className="field-block">
              <span>Full name</span>
              <input
                type="text"
                value={signupForm.name}
                onChange={(event) =>
                  setSignupForm((current) => ({ ...current, name: event.target.value }))
                }
                placeholder="Your full name"
              />
            </label>

            <label className="field-block">
              <span>Email</span>
              <input
                type="email"
                value={signupForm.email}
                onChange={(event) =>
                  setSignupForm((current) => ({ ...current, email: event.target.value }))
                }
                placeholder="you@example.com"
              />
            </label>

            <label className="field-block">
              <span>Phone</span>
              <input
                type="tel"
                value={signupForm.phone}
                onChange={(event) =>
                  setSignupForm((current) => ({ ...current, phone: event.target.value }))
                }
                placeholder="+91 98765 43210"
              />
            </label>

            <label className="field-block">
              <span>Password</span>
              <input
                type="password"
                value={signupForm.password}
                onChange={(event) =>
                  setSignupForm((current) => ({ ...current, password: event.target.value }))
                }
                placeholder="Minimum 6 characters"
              />
            </label>

            <label className="field-block">
              <span>Confirm password</span>
              <input
                type="password"
                value={signupForm.confirmPassword}
                onChange={(event) =>
                  setSignupForm((current) => ({ ...current, confirmPassword: event.target.value }))
                }
                placeholder="Re-enter your password"
              />
            </label>

            <button type="submit" className="primary-button" disabled={submitting}>
              {submitting ? "Creating account..." : "Sign up"}
            </button>
          </form>
        )}
      </section>
    </div>
  );
}
