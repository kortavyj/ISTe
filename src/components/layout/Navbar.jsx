import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  NavLink,
  useNavigate,
} from "react-router-dom";

import { useAuth } from "../../auth/AuthContext.jsx";
import { useLanguage } from "../../i18n/LanguageContext.jsx";
import LanguageSwitcher from "../ui/LanguageSwitcher.jsx";

import "./Navbar.css";
import "./NavbarLanguage.css";

const navigation = [
  { to: "/", labelKey: "navigation.home", end: true },
  { to: "/team", labelKey: "navigation.team" },
  { to: "/news", labelKey: "navigation.news" },
  { to: "/partners", labelKey: "navigation.partners" },
  { to: "/discord", label: "ISTe Bot" },
];

const founderCopy = {
  uk: {
    trigger: "Засновник",
    menuAria: "Меню засновника ISTe",
    dashboard: "Панель засновника",
    dashboardText: "Центр керування ISTe",
    users: "Користувачі",
    usersText: "Ролі, блокування та журнал",
    news: "Новини",
    newsText: "Чернетки та публікації",
    shop: "ISTe Wear",
    shopText: "Товари та передзамовлення",
    discord: "Discord Bot",
    discordText: "Сервери та slash-команди",
  },
  ru: {
    trigger: "Основатель",
    menuAria: "Меню основателя ISTe",
    dashboard: "Панель основателя",
    dashboardText: "Центр управления ISTe",
    users: "Пользователи",
    usersText: "Роли, блокировки и журнал",
    news: "Новости",
    newsText: "Черновики и публикации",
    shop: "ISTe Wear",
    shopText: "Товары и предзаказы",
    discord: "Discord Bot",
    discordText: "Серверы и slash-команды",
  },
  en: {
    trigger: "Founder",
    menuAria: "ISTe founder menu",
    dashboard: "Founder dashboard",
    dashboardText: "ISTe management center",
    users: "Users",
    usersText: "Roles, bans and audit log",
    news: "News",
    newsText: "Drafts and publications",
    shop: "ISTe Wear",
    shopText: "Products and pre-orders",
    discord: "Discord Bot",
    discordText: "Servers and slash commands",
  },
};

const icons = {
  profile: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm7 8a7 7 0 0 0-14 0"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.8"
      />
    </svg>
  ),
  search: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle
        cx="10.5"
        cy="10.5"
        r="5.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        d="m15 15 5 5M10.5 8v5M8 10.5h5"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.8"
      />
    </svg>
  ),
  news: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M6 4h12v16H6zM9 8h6M9 12h6M9 16h4"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  ),
  users: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M12 3 5 6v5c0 4.5 2.8 8.4 7 10 4.2-1.6 7-5.5 7-10V6l-7-3Zm-3 9 2 2 4-5"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  ),
  logout: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M10 5H5v14h5M14 8l4 4-4 4m4-4H9"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  ),
};

function getInitials(profile, user) {
  const source =
    profile?.display_name ||
    profile?.username ||
    user?.email ||
    "ISTe";

  return source.trim().slice(0, 2).toUpperCase();
}

function ProfileAction({
  to,
  icon,
  title,
  description,
  menuOpen,
  onClick,
  logout = false,
}) {
  const content = (
    <>
      {icon}
      <span>
        <strong>{title}</strong>
        <small>{description}</small>
      </span>
    </>
  );

  const className = `navbar-profile-action${
    logout ? " navbar-profile-logout" : ""
  }`;

  if (to) {
    return (
      <NavLink
        className={className}
        to={to}
        role="menuitem"
        tabIndex={menuOpen ? 0 : -1}
        onClick={onClick}
      >
        {content}
      </NavLink>
    );
  }

  return (
    <button
      className={className}
      type="button"
      role="menuitem"
      tabIndex={menuOpen ? 0 : -1}
      onClick={onClick}
    >
      {content}
    </button>
  );
}

function FounderMenu({ language, onNavigate }) {
  const c = founderCopy[language] || founderCopy.uk;

  return (
    <div className="navbar-founder-dropdown" role="menu">
      <div className="navbar-founder-head">
        <span className="navbar-founder-crown" aria-hidden="true">
          ♛
        </span>
        <div>
          <strong>{c.dashboard}</strong>
          <span>ISTe</span>
        </div>
      </div>

      <NavLink to="/founder" className="navbar-founder-item" onClick={onNavigate}>
        <strong>{c.dashboard}</strong>
        <span>{c.dashboardText}</span>
      </NavLink>

      <NavLink
        to="/owner/users"
        className="navbar-founder-item"
        onClick={onNavigate}
      >
        <strong>{c.users}</strong>
        <span>{c.usersText}</span>
      </NavLink>

      <NavLink
        to="/admin/news"
        className="navbar-founder-item"
        onClick={onNavigate}
      >
        <strong>{c.news}</strong>
        <span>{c.newsText}</span>
      </NavLink>

      <NavLink
        to="/owner/shop"
        className="navbar-founder-item"
        onClick={onNavigate}
      >
        <strong>{c.shop}</strong>
        <span>{c.shopText}</span>
      </NavLink>

      <NavLink
        to="/owner/discord"
        className="navbar-founder-item"
        onClick={onNavigate}
      >
        <strong>{c.discord}</strong>
        <span>{c.discordText}</span>
      </NavLink>
    </div>
  );
}

export default function Navbar() {
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const {
    user,
    profile,
    role,
    loading,
    signOut,
  } = useAuth();

  const [menuOpen, setMenuOpen] = useState(false);
  const [founderMenuOpen, setFounderMenuOpen] = useState(false);

  const accountMenuRef = useRef(null);
  const founderMenuRef = useRef(null);

  const canManageNews = [
    "editor",
    "admin",
    "owner",
  ].includes(role);

  const canManageUsers = role === "owner";
  const isFounder = role === "owner";

  const founderText =
    founderCopy[language] || founderCopy.uk;

  const initials = useMemo(
    () => getInitials(profile, user),
    [profile, user],
  );

  const accountName =
    profile?.display_name ||
    profile?.username ||
    t("account.memberFallback");

  useEffect(() => {
    function handlePointerDown(event) {
      if (
        accountMenuRef.current &&
        !accountMenuRef.current.contains(event.target)
      ) {
        setMenuOpen(false);
      }

      if (
        founderMenuRef.current &&
        !founderMenuRef.current.contains(event.target)
      ) {
        setFounderMenuOpen(false);
      }
    }

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        setMenuOpen(false);
        setFounderMenuOpen(false);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  useEffect(() => {
    setMenuOpen(false);
    setFounderMenuOpen(false);
  }, [user]);

  async function handleSignOut() {
    setMenuOpen(false);
    setFounderMenuOpen(false);
    await signOut();
    navigate("/", { replace: true });
  }

  function closeAccountMenu() {
    setMenuOpen(false);
  }

  function closeFounderMenu() {
    setFounderMenuOpen(false);
  }

  return (
    <header className="navbar">
      <div className="navbar-container">
        <NavLink
          className="navbar-logo"
          to="/"
          aria-label={t("common.siteHomeAria")}
        >
          ISTe
        </NavLink>

        <nav
          className="navbar-links"
          aria-label={t("navigation.ariaLabel")}
        >
          {navigation.map(({ to, labelKey, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `navbar-link${
                  isActive ? " navbar-link-active" : ""
                }`
              }
            >
              {label || t(labelKey)}
            </NavLink>
          ))}
        </nav>

        <div className="navbar-auth">
          {isFounder ? (
            <div
              className="navbar-founder-menu"
              ref={founderMenuRef}
            >
              <button
                className={`navbar-founder-trigger${
                  founderMenuOpen
                    ? " navbar-founder-trigger-open"
                    : ""
                }`}
                type="button"
                aria-haspopup="menu"
                aria-expanded={founderMenuOpen}
                aria-label={founderText.menuAria}
                onClick={() => {
                  setFounderMenuOpen((current) => !current);
                  setMenuOpen(false);
                }}
              >
                <span aria-hidden="true">♛</span>
                <strong>{founderText.trigger}</strong>
              </button>

              {founderMenuOpen ? (
                <FounderMenu
                  language={language}
                  onNavigate={closeFounderMenu}
                />
              ) : null}
            </div>
          ) : null}

          <LanguageSwitcher />

          {loading ? (
            <div
              className="navbar-auth-loading"
              aria-label={t("auth.loading")}
            >
              <span />
            </div>
          ) : !user ? (
            <NavLink
              to="/login"
              className={({ isActive }) =>
                `navbar-login-button${
                  isActive
                    ? " navbar-login-button-active"
                    : ""
                }`
              }
            >
              {t("auth.signIn")}
            </NavLink>
          ) : (
            <div
              className="navbar-account-menu"
              ref={accountMenuRef}
            >
              <button
                className={`navbar-account-trigger${
                  menuOpen
                    ? " navbar-account-trigger-open"
                    : ""
                }`}
                type="button"
                aria-haspopup="menu"
                aria-expanded={menuOpen}
                aria-label={t("account.openMenu")}
                onClick={() => {
                  setMenuOpen((current) => !current);
                  setFounderMenuOpen(false);
                }}
              >
                <span
                  className="navbar-account-avatar"
                  aria-hidden="true"
                >
                  {initials}
                </span>

                <span className="navbar-account-copy">
                  <span className="navbar-account-title">
                    {t("account.title")}
                  </span>
                  <span className="navbar-account-name">
                    {profile?.username || accountName}
                  </span>
                </span>

                <svg
                  className="navbar-account-chevron"
                  viewBox="0 0 20 20"
                  aria-hidden="true"
                >
                  <path
                    d="m5.5 7.5 4.5 4.5 4.5-4.5"
                    fill="none"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="1.8"
                  />
                </svg>
              </button>

              <div
                className={`navbar-profile-dropdown${
                  menuOpen
                    ? " navbar-profile-dropdown-open"
                    : ""
                }`}
                role="menu"
                aria-hidden={!menuOpen}
              >
                <div className="navbar-profile-head">
                  <span
                    className="navbar-profile-avatar"
                    aria-hidden="true"
                  >
                    {initials}
                  </span>

                  <div className="navbar-profile-identity">
                    <strong>{accountName}</strong>
                    <span>{user.email}</span>
                  </div>
                </div>

                <div className="navbar-profile-role">
                  {t(`roles.${role}`)}
                </div>

                <div className="navbar-profile-divider" />

                <ProfileAction
                  to="/account"
                  icon={icons.profile}
                  title={t("account.profileTitle")}
                  description={t("account.profileDescription")}
                  menuOpen={menuOpen}
                  onClick={closeAccountMenu}
                />

                <ProfileAction
                  to="/users"
                  icon={icons.search}
                  title={t("account.findUserTitle")}
                  description={t("account.findUserDescription")}
                  menuOpen={menuOpen}
                  onClick={closeAccountMenu}
                />

                {canManageNews ? (
                  <ProfileAction
                    to="/admin/news"
                    icon={icons.news}
                    title={t("account.manageNewsTitle")}
                    description={t(
                      "account.manageNewsDescription",
                    )}
                    menuOpen={menuOpen}
                    onClick={closeAccountMenu}
                  />
                ) : null}

                {canManageUsers ? (
                  <ProfileAction
                    to="/owner/users"
                    icon={icons.users}
                    title={t("account.manageUsersTitle")}
                    description={t(
                      "account.manageUsersDescription",
                    )}
                    menuOpen={menuOpen}
                    onClick={closeAccountMenu}
                  />
                ) : null}

                <ProfileAction
                  icon={icons.logout}
                  title={t("account.logoutTitle")}
                  description={t("account.logoutDescription")}
                  menuOpen={menuOpen}
                  onClick={handleSignOut}
                  logout
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
