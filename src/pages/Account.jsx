import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { getAuthErrorMessage } from "../auth/authErrors.js";
import { useAuth } from "../auth/AuthContext.jsx";
import { formatAccountId } from "../utils/accountId.js";
import { useLanguage } from "../i18n/LanguageContext.jsx";
import { supabase } from "../lib/supabase.js";

import "./Auth.css";
import "./AccountId.css";
import "./AccountDashboard.css";

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
  const [activeTab, setActiveTab] = useState("profile");
  const [avatarSaving,setAvatarSaving] = useState(false);
  const [avatarMessage,setAvatarMessage] = useState("");

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
  const isDirty = form.username.trim() !== (profile?.username ?? "") || form.displayName.trim() !== (profile?.display_name ?? "") || form.bio.trim() !== (profile?.bio ?? "");
  const completeness = [profile?.username, profile?.display_name, profile?.bio].filter(Boolean).length;
  const ui = language === "en"
    ? { overview:"Overview", edit:"Edit profile", welcome:"YOUR ISTe SPACE", subtitle:"Manage your identity, profile and access in one place.", profile:"PROFILE", identity:"ACCOUNT", shortcuts:"QUICK ACCESS", completeness:"Profile completion", view:"Public preview", unsaved:"You have unsaved changes", bioEmpty:"Add a bio to tell the community about yourself.", security:"Account information", join:"Member since", back:"Back to profile", explore:"Explore the team", news:"Team news" }
    : language === "ru"
      ? { overview:"Обзор", edit:"Редактировать", welcome:"ТВОЁ ПРОСТРАНСТВО ISTe", subtitle:"Профиль, данные аккаунта и быстрый доступ к возможностям клуба.", profile:"ПРОФИЛЬ", identity:"АККАУНТ", shortcuts:"БЫСТРЫЙ ДОСТУП", completeness:"Заполнение профиля", view:"Предпросмотр профиля", unsaved:"Есть несохранённые изменения", bioEmpty:"Добавь описание, чтобы участники сообщества узнали тебя лучше.", security:"Информация аккаунта", join:"Участник с", back:"Вернуться к профилю", explore:"Состав команды", news:"Новости команды" }
      : { overview:"Огляд", edit:"Редагувати", welcome:"ТВІЙ ПРОСТІР ISTe", subtitle:"Профіль, дані акаунта та швидкий доступ до можливостей клубу.", profile:"ПРОФІЛЬ", identity:"АКАУНТ", shortcuts:"ШВИДКИЙ ДОСТУП", completeness:"Заповнення профілю", view:"Попередній перегляд профілю", unsaved:"Є незбережені зміни", bioEmpty:"Додай опис, щоб учасники спільноти дізналися про тебе більше.", security:"Інформація акаунта", join:"Учасник з", back:"Повернутися до профілю", explore:"Склад команди", news:"Новини команди" };

  function updateField(field) {
    return (event) => {
      setForm((current) => ({
        ...current,
        [field]: event.target.value,
      }));
    };
  }

  async function handleAvatarChange(event) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setAvatarMessage("");
    if (!["image/jpeg","image/png","image/webp"].includes(file.type) || file.size > 8 * 1024 * 1024) {
      setAvatarMessage(language === "uk" ? "Оберіть JPG, PNG або WebP до 8 МБ." : "Выберите JPG, PNG или WebP до 8 МБ.");
      return;
    }
    setAvatarSaving(true);
    try {
      const bitmap = await createImageBitmap(file);
      const canvas = document.createElement("canvas");
      canvas.width = canvas.height = 440;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvas is unavailable");
      const scale = Math.max(440 / bitmap.width,440 / bitmap.height);
      const width = bitmap.width * scale, height = bitmap.height * scale;
      ctx.drawImage(bitmap,(440-width)/2,(440-height)/2,width,height);
      bitmap.close();
      const blob = await new Promise((resolve) => canvas.toBlob(resolve,"image/jpeg",0.82));
      if (!blob || blob.size > 650000) throw new Error("Изображение слишком большое.");
      const prep = await fetch("/api/auth/session",{
        method:"POST",credentials:"include",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({action:"avatar-create-upload",fileSize:blob.size,fileType:"image/jpeg"})
      });
      const uploadInfo = await readApiResponse(prep,t);
      const {error:uploadError} = await supabase.storage.from("iste-roster").uploadToSignedUrl(uploadInfo.path,uploadInfo.token,blob,{contentType:"image/jpeg"});
      if(uploadError) throw uploadError;
      const confirmation = await fetch("/api/auth/session",{
        method:"POST",credentials:"include",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({action:"avatar-confirm",path:uploadInfo.path})
      });
      await readApiResponse(confirmation,t);
      await refreshAccount();
      setAvatarMessage(language === "uk" ? "Аватар оновлено!" : "Аватар обновлён!");
    } catch(error) {
      setAvatarMessage(error?.message || "Не удалось загрузить аватар.");
    } finally {
      setAvatarSaving(false);
    }
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
    <section className="auth-page iste-account-page">
      <div className="auth-shell auth-shell-wide">
        <header className="auth-heading iste-account-heading">
          <span className="iste-account-heading__eyebrow">{ui.welcome}</span>
          <p className="auth-kicker">{t("accountPage.kicker")}</p>
          <h1>{t("accountPage.title")}</h1>
          <p>{ui.subtitle}</p>
        </header>

        <nav className="iste-account-tabs" aria-label={ui.profile}>
          <button type="button" className={activeTab === "profile" ? "is-active" : ""} onClick={() => setActiveTab("profile")}>{ui.overview}</button>
          <button type="button" className={activeTab === "edit" ? "is-active" : ""} onClick={() => setActiveTab("edit")}>{ui.edit}{isDirty ? <span className="iste-account-dirty-dot" /> : null}</button>
        </nav>
        <div className="account-grid">
          <aside className="auth-card account-summary">
            <div className="iste-account-summary-top"><span className="iste-account-section-label">{ui.identity}</span><span className="iste-account-live-dot">ISTe MEMBER</span></div>
            <label className="iste-avatar-upload" title={language === "uk" ? "Змінити аватар" : "Изменить аватар"}>
              <span className="account-avatar">{profile?.avatar_url ? <img src={profile.avatar_url} alt="" /> : initials}</span>
              <span className="iste-avatar-edit-icon" aria-hidden="true">✎</span>
              <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleAvatarChange} disabled={avatarSaving} aria-label={language === "uk" ? "Завантажити аватар" : "Загрузить аватар"} />
            </label>
            <p className="iste-avatar-help">{avatarSaving ? (language === "uk" ? "Завантаження..." : "Загрузка...") : (language === "uk" ? "Натисни на фото, щоб змінити аватар" : "Нажми на фото, чтобы сменить аватар")}</p>
            {avatarMessage ? <p className="iste-avatar-message" role="status">{avatarMessage}</p> : null}

            <h2>{profile?.display_name || t("accountPage.memberFallback")}</h2>
            <p className="iste-account-handle">@{profile?.username || "iste"}</p>
            <div className="iste-account-progress"><div className="iste-account-progress__heading"><span>{ui.completeness}</span><strong>{Math.round(completeness / 3 * 100)}%</strong></div><div className="iste-account-progress__bar"><span style={{ width: `${completeness / 3 * 100}%` }} /></div></div>

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

          <div className="iste-account-main-column">
          {activeTab === "profile" ? (
            <>
            <div className="auth-card iste-account-preview">
              <div className="iste-account-preview__heading"><span className="iste-account-section-label">{ui.view}</span><span className="iste-account-preview__star">✦ ISTe</span></div>
              <div className="iste-account-preview__identity"><div className="iste-account-preview__avatar">{profile?.avatar_url ? <img src={profile.avatar_url} alt="" /> : initials}</div><div><h2>{profile?.display_name || t("accountPage.memberFallback")}</h2><p>@{profile?.username || "iste"}</p><span className="account-role">{KNOWN_ROLES.has(role) ? t(`roles.${role}`) : role}</span></div></div>
              <p className="iste-account-preview__bio">{profile?.bio || ui.bioEmpty}</p>
              <button type="button" className="iste-account-outline-button" onClick={() => setActiveTab("edit")}>{ui.edit} <span aria-hidden="true">↗</span></button>
            </div>
            <div className="auth-card iste-account-quick"><span className="iste-account-section-label">{ui.shortcuts}</span><div className="iste-account-quick__grid"><Link to="/team" className="iste-account-quick__item"><span aria-hidden="true">◈</span>{ui.explore}<b aria-hidden="true">↗</b></Link><Link to="/news" className="iste-account-quick__item"><span aria-hidden="true">✦</span>{ui.news}<b aria-hidden="true">↗</b></Link><Link to="/users" className="iste-account-quick__item"><span aria-hidden="true">◎</span>{t("accountPage.findUser")}<b aria-hidden="true">↗</b></Link></div></div>
            </>
          ) : null}
          <div className={`auth-card account-editor ${activeTab === "profile" ? "iste-account-editor-hidden" : ""}`}>
            <div className="iste-account-editor-head"><div><span className="iste-account-section-label">{ui.profile}</span><h2>{t("accountPage.editProfile")}</h2></div><button type="button" className="iste-account-back" onClick={() => setActiveTab("profile")}>{ui.back}</button></div>
            {isDirty ? <p className="iste-account-unsaved">{ui.unsaved}</p> : null}
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
                  {t("accountPage.bioHint")} ({form.bio.length}/500)
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
      </div>
    </section>
  );
}
