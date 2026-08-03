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
];

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

export default function Navbar() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const {
    user,
    profile,
    role,
    loading,
    signOut,
  } = useAuth();

  const [menuOpen, setMenuOpen] = useState(false);
  const accountMenuRef = useRef(null);

  const canManageNews = [
    "editor",
    "admin",
    "owner",
  ].includes(role);
  const canManageUsers = role === "owner";

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

  function closeMenu() {
    setMenuOpen(false);
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
          {navigation.map(({ to, labelKey, end }) => (
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
              {t(labelKey)}
            </NavLink>
          ))}
        </nav>

        <div className="navbar-auth">
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
                onClick={() =>
                  setMenuOpen((current) => !current)
                }
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
                  onClick={closeMenu}
                />

                <ProfileAction
                  to="/users"
                  icon={icons.search}
                  title={t("account.findUserTitle")}
                  description={t("account.findUserDescription")}
                  menuOpen={menuOpen}
                  onClick={closeMenu}
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
                    onClick={closeMenu}
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
                    onClick={closeMenu}
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
