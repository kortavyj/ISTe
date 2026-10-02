import {
  Navigate,
  useLocation,
} from "react-router-dom";

import { useAuth } from "./AuthContext.jsx";

const ROSTER_MANAGER_ROLES = new Set([
  "game_manager",
  "owner",
]);

export default function RosterManagerRoute({
  children,
}) {
  const location = useLocation();

  const {
    user,
    role,
    loading,
    isBlocked,
  } = useAuth();

  if (loading) {
    return (
      <section className="auth-page">
        <div className="auth-card auth-card-status">
          <span
            className="auth-loader"
            aria-hidden="true"
          />

          <p>
            Проверяем доступ к Roster Manager...
          </p>
        </div>
      </section>
    );
  }

  if (!user) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location }}
      />
    );
  }

  if (isBlocked) {
    return (
      <Navigate
        to="/blocked"
        replace
      />
    );
  }

  if (!ROSTER_MANAGER_ROLES.has(role)) {
    return (
      <Navigate
        to="/account"
        replace
      />
    );
  }

  return children;
}
