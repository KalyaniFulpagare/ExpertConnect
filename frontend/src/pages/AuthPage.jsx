import { useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { getApiError } from "../api/client";
import { useI18n } from "../i18n/I18nContext";

const emptyLoginForm = {
  email: "",
  password: ""
};

const emptySignupForm = {
  email: "",
  password: "",
  confirmPassword: ""
};

export function AuthPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, login, signup } = useAuth();
  const { t } = useI18n();
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
        email: signupForm.email,
        password: signupForm.password
      });
      navigate("/profile-setup", { replace: true });
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
            <h1>{mode === "login" ? t("authWelcome") : t("authCreate")}</h1>
            <p className="hero-copy">{t("authSubtitle")}</p>
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
            {t("login")}
          </button>
          <button
            type="button"
            className={mode === "signup" ? "tab-button active" : "tab-button"}
            onClick={() => {
              setMode("signup");
              setError("");
            }}
          >
            {t("signup")}
          </button>
        </div>

        {error ? <div className="inline-alert error">{error}</div> : null}

        {mode === "login" ? (
          <form className="auth-form" onSubmit={handleLogin}>
            <label className="field-block">
              <span>{t("email")}</span>
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
              <span>{t("password")}</span>
              <input
                type="password"
                value={loginForm.password}
                onChange={(event) =>
                  setLoginForm((current) => ({ ...current, password: event.target.value }))
                }
                placeholder={t("password")}
              />
            </label>

            <button type="submit" className="primary-button" disabled={submitting}>
              {submitting ? t("signingIn") : t("signInAction")}
            </button>
          </form>
        ) : (
          <form className="auth-form" onSubmit={handleSignup}>
            <label className="field-block">
              <span>{t("email")}</span>
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
              <span>{t("password")}</span>
              <input
                type="password"
                value={signupForm.password}
                onChange={(event) =>
                  setSignupForm((current) => ({ ...current, password: event.target.value }))
                }
                placeholder={t("password")}
              />
            </label>

            <label className="field-block">
              <span>{t("confirmPassword")}</span>
              <input
                type="password"
                value={signupForm.confirmPassword}
                onChange={(event) =>
                  setSignupForm((current) => ({ ...current, confirmPassword: event.target.value }))
                }
                placeholder={t("confirmPassword")}
              />
            </label>

            <button type="submit" className="primary-button" disabled={submitting}>
              {submitting ? t("creatingAccount") : t("signUpAction")}
            </button>
          </form>
        )}
      </section>
    </div>
  );
}
