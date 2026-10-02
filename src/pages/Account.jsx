import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { getAuthErrorMessage } from "../auth/authErrors.js";
import { useAuth } from "../auth/AuthContext.jsx";
import { formatAccountId } from "../utils/accountId.js";
import { useLanguage } from "../i18n/LanguageContext.jsx";

import "./Auth.css";
import "./AccountId.css";

const KNOWN_ROLES = new Set([
  "user",
  "player",
  "editor",
  "game_manager",
  "admin",
  "owner",
]);

async function readApiResponse(response, t) {
  let result;

  try {
    result = await response.json();
  } catch {
    throw new Error(
      t("accountPage.invalidServerResponse"),
    );
  }

  if (
    !response.ok ||
    result?.ok !== true
  ) {
    throw new Error(
      result?.message ||
        t("accountPage.requestFailed"),
    );
  }

  return result;
}

function formatDate(value, language, emptyLabel) {
  if (!value) {
    return emptyLabel;
  }

  return new Intl.DateTimeFormat(
    language === "en" ? "en-US" : "uk-UA",
    {
    day: "2-digit",
    month: "long",
    year: "numeric",
    },
  ).format(new Date(value));
}

export default function Account() {
  const navigate = useNavigate();
  const { language, t } = useLanguage();
  const {
    user,
    profile,
    role,
    accountError,
    refreshAccount,
    signOut,
  } = useAuth();

  const [form, setForm] = useState({
    username: "",
    displayName: "",
    bio: "",
  });
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [copyMessage, setCopyMessage] = useState("");

  useEffect(() => {
    setForm({
      username: profile?.username ?? "",
      displayName: profile?.display_name ?? "",
      bio: profile?.bio ?? "",
    });
  }, [profile]);

  const initials = useMemo(() => {
    const source =
      profile?.display_name || profile?.username || user?.email || "ISTe";

    return source.trim().slice(0, 2).toUpperCase();
  }, [profile, user]);

  const accountId = formatAccountId(profile?.account_number);

  function updateField(field) {
    return (event) => {
      setForm((current) => ({
        ...current,
        [field]: event.target.value,
      }));
    };
  }

  async function handleCopyAccountId() {
    if (!accountId) {
      return;
    }

    try {
      await navigator.clipboard.writeText(accountId);
      setCopyMessage(t("accountPage.idCopied"));
    } catch {
      setCopyMessage(t("accountPage.idCopyFailed"));
    }
  }

  async function handleSave(event) {
    event.preventDefault();
    setSaving(true);
    setSuccessMessage("");
    setErrorMessage("");

    const username = form.username.trim();
    const displayName = form.displayName.trim();

    if (!/^[A-Za-z0-9_]{3,32}$/.test(username)) {
      setErrorMessage(
        t("accountPage.usernameInvalid"),
      );
      setSaving(false);
      return;
    }

    if (displayName.length < 2 || displayName.length > 60) {
      setErrorMessage(t("accountPage.displayNameInvalid"));
      setSaving(false);
      return;
    }

    try {
      const response = await fetch(
        "/api/auth/session",
        {
          method: "POST",
          credentials: "include",

          headers: {
            Accept: "application/json",
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            username,
            displayName,
            bio: form.bio.trim(),
          }),
        },
      );

      await readApiResponse(response, t);
      await refreshAccount();

      setSuccessMessage(
        t("accountPage.profileSaved"),
      );
    } catch (error) {
      setErrorMessage(
        error?.message ||
          getAuthErrorMessage(error),
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleSignOut() {
    try {
      await signOut();
      navigate("/", { replace: true });
    } catch (error) {
      setErrorMessage(getAuthErrorMessage(error));
    }
  }

  return (
    <section className="auth-page">
      <div className="auth-shell auth-shell-wide">
        <header className="auth-heading">
          <p className="auth-kicker">{t("accountPage.kicker")}</p>
          <h1>{t("accountPage.title")}</h1>
          <p>{t("accountPage.description")}</p>
        </header>

        <div className="account-grid">
          <aside className="auth-card account-summary">
            <div className="account-avatar" aria-hidden="true">
              {initials}
            </div>

            <h2>{profile?.display_name || t("accountPage.memberFallback")}</h2>

            <dl className="account-details">
              <div className="account-detail account-id-detail">
                <dt>{t("accountPage.accountId")}</dt>
                <dd className="account-id-value">
                  <code>{accountId || t("accountPage.notCreated")}</code>
                  <button
                    className="account-id-copy"
                    type="button"
                    onClick={handleCopyAccountId}
                    disabled={!accountId}
                  >
                    {t("accountPage.copy")}
                  </button>
                </dd>
                <span className="account-id-help">
                  {t("accountPage.accountIdHelp")}
                </span>
                <span className="account-id-copy-message" aria-live="polite">
                  {copyMessage}
                </span>
              </div>

              <div className="account-detail">
                <dt>{t("accountPage.email")}</dt>
                <dd>{user.email}</dd>
              </div>

              <div className="account-detail">
                <dt>{t("accountPage.nickname")}</dt>
                <dd>{profile?.username || t("accountPage.notSpecified")}</dd>
              </div>

              <div className="account-detail">
                <dt>{t("accountPage.role")}</dt>
                <dd>
                  <span className="account-role">
                    {KNOWN_ROLES.has(role) ? t(`roles.${role}`) : role}
                  </span>
                </dd>
              </div>

              <div className="account-detail">
                <dt>{t("accountPage.registeredAt")}</dt>
                <dd>
                  {formatDate(
                    profile?.created_at,
                    language,
                    t("accountPage.notSpecified"),
                  )}
                </dd>
              </div>
            </dl>

            <div className="account-summary-actions">
              {role === "game_manager" || role === "owner" ? (
                <Link
                  className="auth-button"
                  to="/control/roster"
                >
                  {t("accountPage.rosterManager")}
                </Link>
              ) : null}

              <Link className="auth-button account-search-button" to="/users">
                {t("accountPage.findUser")}
              </Link>

              <button
                className="auth-button auth-button-secondary"
                type="button"
                onClick={handleSignOut}
              >
                {t("accountPage.signOut")}
              </button>
            </div>
          </aside>

          <div className="auth-card account-editor">
            <h2>{t("accountPage.editProfile")}</h2>

            <form className="auth-form" onSubmit={handleSave}>
              {(errorMessage || accountError) && (
                <div className="auth-message auth-message-error">
                  {errorMessage || accountError}
                </div>
              )}

              {successMessage && (
                <div className="auth-message auth-message-success">
                  {successMessage}
                </div>
              )}

              <label className="auth-field">
                <span>{t("accountPage.nickname")}</span>
                <input
                  className="auth-input"
                  type="text"
                  autoComplete="username"
                  value={form.username}
                  onChange={updateField("username")}
                  minLength={3}
                  maxLength={32}
                  required
                  disabled={saving}
                />
              </label>

              <label className="auth-field">
                <span>{t("accountPage.displayName")}</span>
                <input
                  className="auth-input"
                  type="text"
                  autoComplete="name"
                  value={form.displayName}
                  onChange={updateField("displayName")}
                  minLength={2}
                  maxLength={60}
                  required
                  disabled={saving}
                />
              </label>

              <label className="auth-field">
                <span>{t("accountPage.about")}</span>
                <textarea
                  className="auth-textarea"
                  value={form.bio}
                  onChange={updateField("bio")}
                  maxLength={500}
                  disabled={saving}
                />
                <small className="auth-hint">
                  {t("accountPage.bioHint")}
                </small>
              </label>

              <button
                className="auth-button"
                type="submit"
                disabled={saving}
              >
                {saving
                  ? t("accountPage.saving")
                  : t("accountPage.saveChanges")}
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}
