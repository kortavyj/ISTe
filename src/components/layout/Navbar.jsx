import { useEffect, useMemo, useRef, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";

import { useAuth } from "../../auth/AuthContext.jsx";

import "./Navbar.css";

const navigation = [
  { to: "/", label: "Главная", end: true },
  { to: "/team", label: "Команда" },
  { to: "/news", label: "Новости" },
  { to: "/partners", label: "Партнёры" },
];

const roleNames = {
  user: "Пользователь",
  editor: "Редактор",
  admin: "Администратор",
  owner: "Владелец",
};

function getInitials(profile, user) {
  const source =
    profile?.display_name ||
    profile?.username ||
    user?.email ||
    "ISTe";

  return source.trim().slice(0, 2).toUpperCase();
}

export default function Navbar() {
  const navigate = useNavigate();
  const {
    user,
    profile,
    role,
    loading,
    signOut,
  } = useAuth();

  const [menuOpen, setMenuOpen] = useState(false);
  const accountMenuRef = useRef(null);

  const initials = useMemo(
    () => getInitials(profile, user),
    [profile, user],
  );

  const accountName =
    profile?.display_name ||
    profile?.username ||
    "Участник ISTe";

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

  return (
    <header className="navbar">
      <div className="navbar-container">
        <NavLink className="navbar-logo" to="/" aria-label="ISTe, главная">
          ISTe
        </NavLink>

        <nav className="navbar-links" aria-label="Основная навигация">
          {navigation.map(({ to, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `navbar-link${isActive ? " navbar-link-active" : ""}`
              }
            >
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="navbar-auth">
          {loading ? (
            <div className="navbar-auth-loading" aria-label="Загрузка аккаунта">
              <span />
            </div>
          ) : !user ? (
            <NavLink
              to="/login"
              className={({ isActive }) =>
                `navbar-login-button${
                  isActive ? " navbar-login-button-active" : ""
                }`
              }
            >
              Войти
            </NavLink>
          ) : (
            <div className="navbar-account-menu" ref={accountMenuRef}>
              <button
                className={`navbar-account-trigger${
                  menuOpen ? " navbar-account-trigger-open" : ""
                }`}
                type="button"
                aria-haspopup="menu"
                aria-expanded={menuOpen}
                aria-label="Открыть меню личного кабинета"
                onClick={() => setMenuOpen((current) => !current)}
              >
                <span className="navbar-account-avatar" aria-hidden="true">
                  {initials}
                </span>

                <span className="navbar-account-copy">
                  <span className="navbar-account-title">
                    Личный кабинет
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
                  menuOpen ? " navbar-profile-dropdown-open" : ""
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
                  {roleNames[role] ?? role}
                </div>

                <div className="navbar-profile-divider" />

                <NavLink
                  className="navbar-profile-action"
                  to="/account"
                  role="menuitem"
                  tabIndex={menuOpen ? 0 : -1}
                  onClick={() => setMenuOpen(false)}
                >
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path
                      d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm7 8a7 7 0 0 0-14 0"
                      fill="none"
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeWidth="1.8"
                    />
                  </svg>
                  <span>
                    <strong>Личный кабинет</strong>
                    <small>Профиль и настройки</small>
                  </span>
                </NavLink>

                {role === "owner" ? (
                  <NavLink
                    className="navbar-profile-action"
                    to="/owner/users"
                    role="menuitem"
                    tabIndex={menuOpen ? 0 : -1}
                    onClick={() => setMenuOpen(false)}
                  >
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
                    <span>
                      <strong>Управление пользователями</strong>
                      <small>Роли, блокировки и журнал</small>
                    </span>
                  </NavLink>
                ) : null}

                <button
                  className="navbar-profile-action navbar-profile-logout"
                  type="button"
                  role="menuitem"
                  tabIndex={menuOpen ? 0 : -1}
                  onClick={handleSignOut}
                >
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
                  <span>
                    <strong>Выйти</strong>
                    <small>Завершить текущую сессию</small>
                  </span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
