import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";


import { getAuthErrorMessage } from "../auth/authErrors.js";
import { useAuth } from "../auth/AuthContext.jsx";
import { formatAccountId } from "../utils/accountId.js";
import { useLanguage } from "../i18n/LanguageContext.jsx";
import { supabase } from "../lib/supabase.js";
import MemberShowcase from "../components/MemberShowcase.jsx";
import MemberAwards from "../components/MemberAwards.jsx";
import VerifiedBadge from "../components/VerifiedBadge.jsx";

import "./Auth.css";
import "./AccountId.css";
import "./AccountDashboard.css";
import "./AccountSocial.css";

function DashboardIcon({ name, size = 23, ...props }) {
  const common = { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round", ...props };
  const paths = {
    users: <><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></>,
    news: <><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M7 8h6M7 12h6M7 16h10M16 8h2v4h-2z"/></>,
    shop: <><path d="M5 8h14l1 13H4L5 8Z"/><path d="M9 9V6a3 3 0 0 1 6 0v3"/></>,
    search: <><circle cx="10" cy="8" r="4"/><path d="M3 20v-2a6 6 0 0 1 11.5-2.4"/><circle cx="17" cy="17" r="4"/><path d="m20 20 2 2"/></>,
    arrow: <><path d="M7 17 17 7M8 7h9v9"/></>,
  };
  return <svg {...common}>{paths[name]}</svg>;
}

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
  const [bannerSaving, setBannerSaving] = useState(false);
  const [bannerMessage, setBannerMessage] = useState("");
  const [frameSaving, setFrameSaving] = useState(false);
  const [framePickerOpen, setFramePickerOpen] = useState(false);
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

  const avatarText = {
    uk: {
      upload: "Завантажити аватар", change: "Змінити аватар",
      help: "Натисніть на фото, щоб змінити аватар", uploading: "Завантаження фото…",
      invalid: "Оберіть JPG, PNG або WebP розміром до 8 МБ.",
      saved: "Фото профілю оновлено.", failed: "Не вдалося завантажити фото.",
      processing: "Не вдалося обробити фото. Спробуйте інше зображення.",
    },
    en: {
      upload: "Upload avatar", change: "Change avatar",
      help: "Click the picture to change your avatar", uploading: "Uploading photo…",
      invalid: "Choose a JPG, PNG or WebP image under 8 MB.",
      saved: "Profile picture updated.", failed: "Could not upload the photo.",
      processing: "Could not process the photo. Try another image.",
    },
  }[language] || {};

  async function handleAvatarChange(event) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || avatarSaving) return;
    setAvatarMessage("");
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size > 8 * 1024 * 1024) {
      setAvatarMessage(avatarText.invalid);
      return;
    }
    setAvatarSaving(true);
    try {
      const bitmap = await createImageBitmap(file);
      let blob;
      try {
        const canvas = document.createElement("canvas");
        canvas.width = canvas.height = 440;
        const ctx = canvas.getContext("2d");
        if (!ctx) throw new Error("CANVAS_UNAVAILABLE");
        const scale = Math.max(440 / bitmap.width, 440 / bitmap.height);
        ctx.drawImage(bitmap,
          (440 - bitmap.width * scale) / 2,
          (440 - bitmap.height * scale) / 2,
          bitmap.width * scale,
          bitmap.height * scale);
        blob = await new Promise(resolve => canvas.toBlob(resolve, "image/jpeg", 0.82));
      } finally {
        bitmap.close();
      }
      if (!blob || blob.size > 650000) throw new Error("INVALID_IMAGE");
      const prep = await fetch("/api/auth/session", {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "avatar-create-upload", fileSize: blob.size, fileType: "image/jpeg" }),
      });
      const uploadInfo = await readApiResponse(prep, t);
      const { error: uploadError } = await supabase.storage.from("iste-roster")
        .uploadToSignedUrl(uploadInfo.path, uploadInfo.token, blob, { contentType: "image/jpeg" });
      if (uploadError) throw new Error("AVATAR_UPLOAD_FAILED");
      const confirmation = await fetch("/api/auth/session", {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "avatar-confirm", path: uploadInfo.path }),
      });
      await readApiResponse(confirmation, t);
      await refreshAccount();
      setAvatarMessage(avatarText.saved);
    } catch (error) {
      setAvatarMessage(error?.message === "INVALID_IMAGE" || error?.message === "CANVAS_UNAVAILABLE"
        ? avatarText.processing : avatarText.failed);
    } finally {
      setAvatarSaving(false);
    }
  }

  const profileAppearance = (language === "en"
    ? {
        banner: "Change cover", bannerUploading: "Uploading cover…",
        bannerSaved: "Cover updated.", bannerFailed: "Could not upload the cover.",
        imageInvalid: "Choose JPG, PNG or WebP up to 8 MB.",
        frame: "Choose avatar frame", frameSaved: "Frame updated.",
        frameFailed: "Could not save the frame.", framePicker: "Avatar frames",
        close: "Close", names: {
          prism: "Prism", crimson: "Crimson", cyan: "Cyan",
          violet: "Violet", gold: "Gold", minimal: "Minimal",
        },
      }
    : {
        banner: "Змінити обкладинку", bannerUploading: "Завантажуємо обкладинку…",
        bannerSaved: "Обкладинку оновлено.", bannerFailed: "Не вдалося завантажити обкладинку.",
        imageInvalid: "Оберіть JPG, PNG або WebP до 8 МБ.",
        frame: "Вибрати рамку аватара", frameSaved: "Рамку змінено.",
        frameFailed: "Не вдалося зберегти рамку.", framePicker: "Рамки аватара",
        close: "Закрити", names: {
          prism: "Призма", crimson: "Багряна", cyan: "Бірюзова",
          violet: "Фіолетова", gold: "Золота", minimal: "Мінімальна",
        },
      });
  const frameNames = ["prism", "crimson", "cyan", "violet", "gold", "minimal"];
  const currentFrame = frameNames.includes(profile?.avatar_frame) ? profile.avatar_frame : "prism";

  async function handleBannerChange(event) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || bannerSaving) return;
    setBannerMessage("");
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size > 8 * 1024 * 1024) {
      setBannerMessage(profileAppearance.imageInvalid);
      return;
    }
    setBannerSaving(true);
    try {
      const bitmap = await createImageBitmap(file);
      let blob;
      try {
        const canvas = document.createElement("canvas");
        const w = 1600, h = 430;
        canvas.width = w;
        canvas.height = h;
        const context = canvas.getContext("2d");
        if (!context) throw new Error("CANVAS_UNAVAILABLE");
        const scale = Math.max(w / bitmap.width, h / bitmap.height);
        context.drawImage(bitmap,
          (w - bitmap.width * scale) / 2,
          (h - bitmap.height * scale) / 2,
          bitmap.width * scale,
          bitmap.height * scale);
        blob = await new Promise(resolve => canvas.toBlob(resolve, "image/jpeg", 0.78));
      } finally {
        bitmap.close();
      }
      if (!blob || blob.size > 1_400_000) throw new Error("BANNER_TOO_LARGE");
      const prep = await fetch("/api/auth/session", {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "banner-create-upload", fileType: "image/jpeg", fileSize: blob.size,
        }),
      });
      const upload = await readApiResponse(prep, t);
      const { error: uploadError } = await supabase.storage.from("iste-roster")
        .uploadToSignedUrl(upload.path, upload.token, blob, { contentType: "image/jpeg" });
      if (uploadError) throw uploadError;
      const confirmation = await fetch("/api/auth/session", {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "banner-confirm", path: upload.path }),
      });
      await readApiResponse(confirmation, t);
      await refreshAccount();
      setBannerMessage(profileAppearance.bannerSaved);
    } catch (error) {
      console.error("Banner update failed:", error);
      setBannerMessage(profileAppearance.bannerFailed);
    } finally {
      setBannerSaving(false);
    }
  }

  async function selectAvatarFrame(frame) {
    if (!frameNames.includes(frame) || frameSaving) return;
    setFrameSaving(true);
    setAvatarMessage("");
    try {
      const response = await fetch("/api/auth/session", {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "avatar-frame-select", frame }),
      });
      await readApiResponse(response, t);
      await refreshAccount();
      setAvatarMessage(profileAppearance.frameSaved);
      setFramePickerOpen(false);
    } catch {
      setAvatarMessage(profileAppearance.frameFailed);
    } finally {
      setFrameSaving(false);
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

  const social = language === "en"
    ? { overview: "Overview", community: "Community", about: "About", settings: "Edit profile", posts: "Posts", emptyTitle: "Your story starts here", emptyText: "Member posts are coming later. For now, explore ISTe news and the community.", news: "Explore news", actions: "Quick links", team: "Team", shop: "Shop", people: "Find members", stats: "Member details", joined: "Joined ISTe", profile: "Profile", copyId: "Copy ID", confirmed: "Verified by ISTe", member: "ISTe member", noBio: "Tell the community about yourself in your profile settings.", details: "Account details", progress: "Profile completion", security: "Account management" }
    : { overview: "Огляд", community: "Спільнота", about: "Про мене", settings: "Редагувати", posts: "Публікації", emptyTitle: "Твоя історія починається тут", emptyText: "Публікації учасників з'являться пізніше. Поки можеш переглянути новини ISTe та спільноту.", news: "Переглянути новини", actions: "Швидкий доступ", team: "Команда", shop: "Магазин", people: "Знайти учасників", stats: "Дані учасника", joined: "В ISTe з", profile: "Профіль", copyId: "Копіювати ID", confirmed: "Підтверджено ISTe", member: "Учасник ISTe", noBio: "Розкажи про себе у налаштуваннях профілю.", details: "Дані акаунта", progress: "Заповнення профілю", security: "Керування акаунтом" };

  return (
    <section className="auth-page iste-account-page iste-social-page">
      <div className="auth-shell auth-shell-wide iste-social-shell">
        <header className="iste-social-header">
          <div className="iste-social-cover" style={profile?.banner_url ? { backgroundImage: `url("${profile.banner_url}")` } : undefined}>
            <span className="iste-social-cover-brand">ISTe <small>COMMUNITY</small></span>
            <label className="iste-social-cover-edit" title={profileAppearance.banner}>
              <span className="iste-social-cover-edit-icon" aria-hidden="true">✎</span>
              <span>{bannerSaving ? profileAppearance.bannerUploading : profileAppearance.banner}</span>
              <input type="file" accept="image/jpeg,image/png,image/webp"
                aria-label={profileAppearance.banner} disabled={bannerSaving} onChange={handleBannerChange} />
            </label>
          </div>
          <div className="iste-social-identity">
            <div className="iste-social-avatar-controls">
            <label className="iste-social-avatar-upload" data-frame={currentFrame} title={avatarText.change}>
              <span className="iste-social-avatar-inner">
                {profile?.avatar_url ? <img src={profile.avatar_url} alt="" /> : <span>{initials}</span>}
              </span>
              <span className="iste-social-avatar-pencil" aria-hidden="true">✎</span>
              <input type="file" accept="image/jpeg,image/png,image/webp" disabled={avatarSaving} onChange={handleAvatarChange} aria-label={avatarText.upload} />
            </label>
            <button className="iste-social-frame-trigger" type="button" title={profileAppearance.frame}
              aria-label={profileAppearance.frame} aria-expanded={framePickerOpen}
              onClick={() => setFramePickerOpen(value => !value)}>
              <span aria-hidden="true">◇</span> {profileAppearance.frame}
            </button>
            </div>
            <div className="iste-social-identity-details">
              <div className="iste-social-name-row">
                <h1>{profile?.display_name || t("accountPage.memberFallback")}</h1>
                {profile?.is_verified === true && <VerifiedBadge size={16} type={profile?.verification_type || "silver"} />}
              </div>
              <p className="iste-social-handle">@{profile?.username || "iste"}</p>
              <div className="iste-social-member-state"><span aria-hidden="true" /> {social.member}</div>
              <div className="iste-social-badges">
                <span>{KNOWN_ROLES.has(role) ? t("roles." + role) : role}</span>
                {accountId && <span>{accountId}</span>}
              </div>
            </div>
          </div>
          <div className="iste-social-avatar-feedback" role="status">
            {avatarSaving ? avatarText.uploading : avatarMessage || bannerMessage || ""}
          </div>
          {framePickerOpen && (
            <div className="iste-social-frame-picker" role="group" aria-label={profileAppearance.framePicker}>
              <div className="iste-social-frame-picker-header">
                <strong>{profileAppearance.framePicker}</strong>
                <button type="button" onClick={() => setFramePickerOpen(false)} aria-label={profileAppearance.close}>×</button>
              </div>
              <div className="iste-social-frame-options">
                {frameNames.map(frame => (
                  <button key={frame} type="button" className={currentFrame === frame ? "is-selected" : ""}
                    disabled={frameSaving} onClick={() => selectAvatarFrame(frame)}
                    aria-pressed={currentFrame === frame}>
                    <span className="iste-social-frame-sample" data-frame={frame}>
                      <span>{initials}</span>
                    </span>
                    <span>{profileAppearance.names[frame]}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </header>

        <nav className="iste-social-tabs" aria-label={social.profile}>
          {[
            ["profile",social.overview],
            ["community",social.community],
            ["about",social.about],
            ["edit",social.settings],
          ].map(([key,label]) => (
            <button key={key} type="button" className={activeTab === key ? "is-active" : ""}
              aria-current={activeTab === key ? "page" : undefined}
              onClick={() => setActiveTab(key)}>{label}</button>
          ))}
        </nav>

        <div className="iste-social-layout">
          <main className="iste-social-main">
            {activeTab === "profile" && (
              <>
                <MemberShowcase targetAccountNumber={profile?.account_number} ownerView />
              </>
            )}

            {activeTab === "community" && (
              <section className="iste-social-panel iste-social-shortcuts">
                <div className="iste-social-section-head"><h2>{social.community}</h2></div>
                <div className="iste-social-shortcut-grid">
                  <Link to="/team"><DashboardIcon name="users"/><span>{social.team}</span><DashboardIcon name="arrow" size={15}/></Link>
                  <Link to="/news"><DashboardIcon name="news"/><span>{social.news}</span><DashboardIcon name="arrow" size={15}/></Link>
                  <Link to="/shop"><DashboardIcon name="shop"/><span>{social.shop}</span><DashboardIcon name="arrow" size={15}/></Link>
                  <Link to="/users"><DashboardIcon name="search"/><span>{social.people}</span><DashboardIcon name="arrow" size={15}/></Link>
                </div>
              </section>
            )}

            {activeTab === "about" && (
              <section className="iste-social-panel iste-social-about">
                <div className="iste-social-section-head"><h2>{social.about}</h2></div>
                <p>{profile?.bio || social.noBio}</p>
                <button className="iste-social-outline-btn" type="button" onClick={() => setActiveTab("edit")}>{social.settings}</button>
              </section>
            )}

            {activeTab === "edit" && (
              <section className="iste-social-panel iste-social-editor">
                <div className="iste-social-section-head"><h2>{t("accountPage.editProfile")}</h2></div>
                {isDirty && <p className="iste-account-unsaved">{ui.unsaved}</p>}
                <form className="auth-form" onSubmit={handleSave}>
                  {(errorMessage || accountError) && <div className="auth-message auth-message-error" role="alert">{errorMessage || accountError}</div>}
                  {successMessage && <div className="auth-message auth-message-success" role="status">{successMessage}</div>}
                  <label className="auth-field">
                    <span>{t("accountPage.nickname")}</span>
                    <input className="auth-input" type="text" autoComplete="username"
                      value={form.username} onChange={updateField("username")}
                      minLength={3} maxLength={32} required disabled={saving} />
                  </label>
                  <label className="auth-field">
                    <span>{t("accountPage.displayName")}</span>
                    <input className="auth-input" type="text" autoComplete="name"
                      value={form.displayName} onChange={updateField("displayName")}
                      minLength={2} maxLength={60} required disabled={saving} />
                  </label>
                  <label className="auth-field">
                    <span>{t("accountPage.about")}</span>
                    <textarea className="auth-textarea" value={form.bio}
                      onChange={updateField("bio")} maxLength={500} disabled={saving}/>
                    <small className="auth-hint">{t("accountPage.bioHint")} ({form.bio.length}/500)</small>
                  </label>
                  <button className="auth-button" type="submit" disabled={saving}>
                    {saving ? t("accountPage.saving") : t("accountPage.saveChanges")}
                  </button>
                </form>
              </section>
            )}
          </main>

          <aside className="iste-social-sidebar">
            {profile?.account_number ? (
              <MemberAwards
                accountNumber={profile.account_number}
                canManage={role === "owner"}
              />
            ) : null}
            <section className="iste-social-panel iste-social-member-facts" aria-label={social.stats}>
              <div className="iste-social-section-head"><h2>{social.stats}</h2></div>
              <dl>
                <div><dt>{t("accountPage.role")}</dt><dd>{KNOWN_ROLES.has(role) ? t("roles." + role) : role}</dd></div>
                <div><dt>{social.joined}</dt><dd>{formatDate(profile?.created_at, language, t("accountPage.notSpecified"))}</dd></div>
                {profile?.is_verified === true && <div><dt>{social.confirmed}</dt><dd className="iste-social-member-verified"><span aria-hidden="true">✓</span> {social.confirmed}</dd></div>}
              </dl>
            </section>

            <section className="iste-social-panel iste-social-side-card">
              <div className="iste-social-section-head"><h2>{social.about}</h2><span>✦</span></div>
              <p className="iste-social-side-bio">{profile?.bio || social.noBio}</p>
              <button className="iste-social-outline-btn" type="button" onClick={() => setActiveTab("about")}>{social.about}</button>
            </section>

            <section className="iste-social-panel iste-social-side-card">
              <div className="iste-social-section-head"><h2>{social.details}</h2></div>
              <dl className="iste-social-details">
                <div><dt>{t("accountPage.accountId")}</dt><dd><code>{accountId || t("accountPage.notCreated")}</code>
                <button type="button" onClick={handleCopyAccountId} disabled={!accountId}>{t("accountPage.copy")}</button></dd></div>
                <div><dt>{t("accountPage.email")}</dt><dd>{user?.email}</dd></div>
                <div><dt>{t("accountPage.nickname")}</dt><dd>@{profile?.username || "iste"}</dd></div>
              </dl>
              <span className="iste-social-copied" aria-live="polite">{copyMessage}</span>
            </section>

            {activeTab === "edit" && (
            <section className="iste-social-panel iste-social-side-card">
              <div className="iste-social-section-head"><h2>{social.security}</h2></div>
              <div className="iste-social-side-actions">
                {(role === "game_manager" || role === "owner") && <Link to="/control/roster">{t("accountPage.rosterManager")}</Link>}
                {role === "owner" && <Link to="/owner/users">{language === "en" ? "Manage members" : "Керування учасниками"}</Link>}
                <Link to="/users">{t("accountPage.findUser")}</Link>
                <button type="button" onClick={handleSignOut}>{t("accountPage.signOut")}</button>
              </div>
            </section>
            )}
          </aside>
        </div>
      </div>
    </section>
  );
}
