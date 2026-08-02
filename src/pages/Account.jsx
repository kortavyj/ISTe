import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { getAuthErrorMessage } from "../auth/authErrors.js";
import { useAuth } from "../auth/AuthContext.jsx";
import { supabase } from "../lib/supabase.js";
import { formatAccountId } from "../utils/accountId.js";

import "./Auth.css";
import "./AccountId.css";

const roleNames = {
  user: "Пользователь",
  editor: "Редактор",
  admin: "Администратор",
  owner: "Владелец",
};

function formatDate(value) {
  if (!value) {
    return "Не указана";
  }

  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date(value));
}

export default function Account() {
  const navigate = useNavigate();
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
      setCopyMessage("ID скопирован.");
    } catch {
      setCopyMessage("Не удалось скопировать ID.");
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
        "Никнейм должен содержать от 3 до 32 латинских букв, цифр или символов подчёркивания.",
      );
      setSaving(false);
      return;
    }

    if (displayName.length < 2 || displayName.length > 60) {
      setErrorMessage("Имя должно содержать от 2 до 60 символов.");
      setSaving(false);
      return;
    }

    const { error } = await supabase
      .from("profiles")
      .update({
        username,
        display_name: displayName,
        bio: form.bio.trim() || null,
      })
      .eq("id", user.id);

    if (error) {
      setErrorMessage(getAuthErrorMessage(error));
      setSaving(false);
      return;
    }

    try {
      await refreshAccount();
      setSuccessMessage("Профиль сохранён.");
    } catch (error) {
      setErrorMessage(getAuthErrorMessage(error));
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
          <p className="auth-kicker">ISTe account</p>
          <h1>Личный кабинет</h1>
          <p>Основные данные аккаунта и настройки профиля.</p>
        </header>

        <div className="account-grid">
          <aside className="auth-card account-summary">
            <div className="account-avatar" aria-hidden="true">
              {initials}
            </div>

            <h2>{profile?.display_name || "Пользователь ISTe"}</h2>

            <dl className="account-details">
              <div className="account-detail account-id-detail">
                <dt>ID аккаунта</dt>
                <dd className="account-id-value">
                  <code>{accountId || "Не создан"}</code>
                  <button
                    className="account-id-copy"
                    type="button"
                    onClick={handleCopyAccountId}
                    disabled={!accountId}
                  >
                    Копировать
                  </button>
                </dd>
                <span className="account-id-help">
                  По этому ID вас могут найти другие зарегистрированные
                  пользователи. Электронная почта при поиске не показывается.
                </span>
                <span className="account-id-copy-message" aria-live="polite">
                  {copyMessage}
                </span>
              </div>

              <div className="account-detail">
                <dt>Электронная почта</dt>
                <dd>{user.email}</dd>
              </div>

              <div className="account-detail">
                <dt>Никнейм</dt>
                <dd>{profile?.username || "Не указан"}</dd>
              </div>

              <div className="account-detail">
                <dt>Роль</dt>
                <dd>
                  <span className="account-role">
                    {roleNames[role] ?? role}
                  </span>
                </dd>
              </div>

              <div className="account-detail">
                <dt>Дата регистрации</dt>
                <dd>{formatDate(profile?.created_at)}</dd>
              </div>
            </dl>

            <div className="account-summary-actions">
              <Link className="auth-button account-search-button" to="/users">
                Найти пользователя по ID
              </Link>

              <button
                className="auth-button auth-button-secondary"
                type="button"
                onClick={handleSignOut}
              >
                Выйти из аккаунта
              </button>
            </div>
          </aside>

          <div className="auth-card account-editor">
            <h2>Редактирование профиля</h2>

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
                <span>Никнейм</span>
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
                <span>Отображаемое имя</span>
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
                <span>О себе</span>
                <textarea
                  className="auth-textarea"
                  value={form.bio}
                  onChange={updateField("bio")}
                  maxLength={500}
                  disabled={saving}
                />
                <small className="auth-hint">
                  До 500 символов.
                </small>
              </label>

              <button
                className="auth-button"
                type="submit"
                disabled={saving}
              >
                {saving ? "Сохраняем..." : "Сохранить изменения"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}
