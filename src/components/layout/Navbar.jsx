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

const NAVBAR_RELEASE = "2026-10-03-v4";

const TACTICS_ACCESS_ROLES = new Set([
  "player",
  "game_manager",
  "owner",
]);

const navigation = [
  {
    to: "/",
    labelKey: "navigation.home",
    end: true,
    icon: "home",
  },
  {
    to: "/team",
    labelKey: "navigation.team",
    icon: "team",
  },
  {
    to: "/news",
    labelKey: "navigation.news",
    icon: "news",
  },
  {
    to: "/discord",
    labelKey: "navigation.bot",
    icon: "bot",
  },
];

const founderCopy = {
  uk: {
    trigger: "Засновник",
    menuAria: "Меню засновника ISTe",
    dashboard: "Панель засновника",
    dashboardText: "Центр керування ISTe",
    roster: "Roster Manager",
    rosterText: "Керування офіційним складом",
    tactics: "Тактична дошка",
    tacticsText: "Плани, розстановки та гранати",
    users: "Користувачі",
    usersText: "Ролі, блокування та журнал",
    news: "Новини",
    newsText: "Чернетки та публікації",
    shop: "ISTe Wear",
    shopText: "Товари та передзамовлення",
    discord: "Discord Bot",
    discordText: "Сервери та slash-команди",
  },
  en: {
    trigger: "Founder",
    menuAria: "ISTe founder menu",
    dashboard: "Founder dashboard",
    dashboardText: "ISTe management center",
    roster: "Roster Manager",
    rosterText: "Manage the official roster",
    tactics: "Tactical Board",
    tacticsText: "Plans, setups and utility",
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

const navigationIcons = {
  home: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="m4 11 8-7 8 7v8a1 1 0 0 1-1 1h-4.5v-6h-5v6H5a1 1 0 0 1-1-1v-8Z"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.7"
      />
    </svg>
  ),
  team: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="9" cy="8" r="3" fill="none" stroke="currentColor" strokeWidth="1.7" />
      <circle cx="17" cy="9" r="2.5" fill="none" stroke="currentColor" strokeWidth="1.55" />
      <path d="M3.5 19c.7-3.2 2.5-5 5.5-5s4.8 1.8 5.5 5M14 15c2.8-.2 4.8 1.2 5.7 3.8"
        fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1.7" />
    </svg>
  ),
  news: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect x="4" y="5" width="16" height="14" rx="2.5" fill="none" stroke="currentColor" strokeWidth="1.7" />
      <path d="M8 9h4M8 13h8M8 16h6M15 9h1.5"
        fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1.6" />
    </svg>
  ),
  bot: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M8 8 5 5M16 8l3-3M9 7h6a4 4 0 0 1 4 4v5a3 3 0 0 1-3 3H8a3 3 0 0 1-3-3v-5a4 4 0 0 1 4-4Z"
        fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" />
      <circle cx="9.5" cy="13" r="1" fill="currentColor" />
      <circle cx="14.5" cy="13" r="1" fill="currentColor" />
    </svg>
  ),
  tactics: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect x="5" y="4" width="14" height="16" rx="2.5" fill="none" stroke="currentColor" strokeWidth="1.7" />
      <path d="M9 8h6M9 12h6M9 16h3M7 8h.01M7 12h.01M7 16h.01"
        fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1.7" />
    </svg>
  ),
};

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="10.5" cy="10.5" r="5.5" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <path d="m15 15 5 5" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
    </svg>
  );
}

function BellIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M7 10a5 5 0 0 1 10 0v3.4l1.5 2.6h-13L7 13.4V10Zm3.2 8a2 2 0 0 0 3.6 0"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.7"
      />
    </svg>
  );
}

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
    <div className="navbar-founder-inline" aria-label={c.menuAria}>
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
        to="/control/roster"
        className="navbar-founder-item"
        onClick={onNavigate}
      >
        <strong>{c.roster}</strong>
        <span>{c.rosterText}</span>
      </NavLink>

      <NavLink
        to="/player/tactics"
        className="navbar-founder-item"
        onClick={onNavigate}
      >
        <strong>{c.tactics}</strong>
        <span>{c.tacticsText}</span>
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
    isBlocked,
    signOut,
  } = useAuth();

  const [menuOpen, setMenuOpen] = useState(false);
  const accountMenuRef = useRef(null);

  const canManageNews = [
    "editor",
    "admin",
    "owner",
  ].includes(role);

  const canManageRoster = [
    "game_manager",
    "owner",
  ].includes(role);

  const canUseTactics =
    Boolean(user) &&
    !loading &&
    !isBlocked &&
    TACTICS_ACCESS_ROLES.has(
      role,
    );

  const isFounder = role === "owner";

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
    }

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        setMenuOpen(false);
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
  }, [user]);

  async function handleSignOut() {
    setMenuOpen(false);
    await signOut();
    navigate("/", { replace: true });
  }

  function closeAccountMenu() {
    setMenuOpen(false);
  }

  return (
    <header
      className="navbar"
      data-navbar-release={NAVBAR_RELEASE}
    >
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
          {navigation.map(({ to, labelKey, end, icon }) => (
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
              <span className="navbar-link-icon">
                {navigationIcons[icon]}
              </span>
              <span>{t(labelKey)}</span>
            </NavLink>
          ))}

          {canUseTactics ? (
            <NavLink
              to="/player/tactics"
              className={({ isActive }) =>
                `navbar-link${isActive ? " navbar-link-active" : ""}`
              }
            >
              <span className="navbar-link-icon">
                {navigationIcons.tactics}
              </span>
              <span>{t("navigation.tactics")}</span>
            </NavLink>
          ) : null}
        </nav>

        <div className="navbar-auth">
          <button
            type="button"
            className="navbar-utility-button"
            aria-label={t("navigation.searchUsers")}
            title={t("navigation.searchUsers")}
            onClick={() =>
              navigate("/users")
            }
          >
            <SearchIcon />
          </button>

          <span
            className="navbar-utility-button navbar-notification-indicator"
            role="img"
            aria-label={t("navigation.notifications")}
            title={t("navigation.notifications")}
          >
            <BellIcon />
            <i aria-hidden="true" />
          </span>

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

                {canUseTactics && !isFounder ? (
                  <ProfileAction
                    to="/player/tactics"
                    icon={icons.users}
                    title={t("account.manageTacticsTitle")}
                    description={t(
                      "account.manageTacticsDescription",
                    )}
                    menuOpen={menuOpen}
                    onClick={closeAccountMenu}
                  />
                ) : null}

                {canManageRoster && !isFounder ? (
                  <ProfileAction
                    to="/control/roster"
                    icon={icons.users}
                    title={t("account.manageRosterTitle")}
                    description={t(
                      "account.manageRosterDescription",
                    )}
                    menuOpen={menuOpen}
                    onClick={closeAccountMenu}
                  />
                ) : null}

                {isFounder ? (
                  <>
                    <div className="navbar-profile-divider" />
                    <FounderMenu
                      language={language}
                      onNavigate={closeAccountMenu}
                    />
                  </>
                ) : null}

                {canManageNews && !isFounder ? (
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
