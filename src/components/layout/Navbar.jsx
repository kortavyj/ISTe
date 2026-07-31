import { NavLink } from "react-router-dom";

import { useAuth } from "../../auth/AuthContext.jsx";

import "./Navbar.css";

const navigation = [
  { to: "/", label: "Главная", end: true },
  { to: "/team", label: "Команда" },
  { to: "/news", label: "Новости" },
  { to: "/partners", label: "Партнёры" },
];

export default function Navbar() {
  const { user, loading } = useAuth();

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

          <NavLink
            to={user ? "/account" : "/login"}
            className={({ isActive }) =>
              `navbar-account${isActive ? " navbar-account-active" : ""}`
            }
          >
            {loading ? "..." : user ? "Профиль" : "Войти"}
          </NavLink>
        </nav>
      </div>
    </header>
  );
}
