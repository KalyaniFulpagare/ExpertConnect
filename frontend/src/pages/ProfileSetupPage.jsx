import { useEffect, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { getApiError } from "../api/client";
import { GamificationPanel } from "../components/GamificationPanel";
import { useI18n } from "../i18n/I18nContext";
import { buildJourney } from "../utils/gamification";

export function ProfileSetupPage() {
  const navigate = useNavigate();
  const { currentUser, isAuthenticated, updateProfile } = useAuth();
  const { language, languageOptions, setLanguage, t } = useI18n();
  const [form, setForm] = useState({
    name: "",
    phone: "",
    preferredLanguage: language
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!currentUser) {
      return;
    }

    setForm({
      name: currentUser.name || "",
      phone: currentUser.phone || "",
      preferredLanguage: currentUser.preferredLanguage || language
    });
  }, [currentUser, language]);

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  if (currentUser?.profileCompleted) {
    return <Navigate to="/" replace />;
  }

  const journey = buildJourney({
    profileCompleted: false,
    favoritesCount: 0,
    recentCount: 0,
    bookingsCount: 0,
    waitlistCount: 0,
    reviewsCount: 0
  });

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      setSaving(true);
      setError("");
      await updateProfile({
        name: form.name,
        phone: form.phone,
        preferredLanguage: form.preferredLanguage
      });
      await setLanguage(form.preferredLanguage);
      navigate("/", { replace: true });
    } catch (requestError) {
      setError(getApiError(requestError, "We could not save your profile."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="page-stack profile-shell">
      <section className="surface-panel auth-panel">
        <div>
          <p className="eyebrow">{t("profile")}</p>
          <h1>{t("profileTitle")}</h1>
          <p className="hero-copy">{t("profileSubtitle")}</p>
          <p className="helper-label">{t("profileReward")}</p>
        </div>

        {error ? <div className="inline-alert error">{error}</div> : null}

        <form className="auth-form" onSubmit={handleSubmit}>
          <label className="field-block">
            <span>{t("fullName")}</span>
            <input
              type="text"
              value={form.name}
              onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
              placeholder={t("fullName")}
            />
          </label>

          <label className="field-block">
            <span>{t("phone")}</span>
            <input
              type="tel"
              value={form.phone}
              onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))}
              placeholder="+91 98765 43210"
            />
          </label>

          <label className="field-block">
            <span>{t("preferredLanguage")}</span>
            <select
              value={form.preferredLanguage}
              onChange={(event) =>
                setForm((current) => ({ ...current, preferredLanguage: event.target.value }))
              }
            >
              {languageOptions.map((option) => (
                <option key={option.code} value={option.code}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <button type="submit" className="primary-button" disabled={saving}>
            {saving ? t("savingProfile") : t("saveProfile")}
          </button>
        </form>
      </section>

      <GamificationPanel journey={journey} />
    </div>
  );
}
