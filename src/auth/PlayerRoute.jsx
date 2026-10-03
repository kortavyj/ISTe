import {
  Navigate,
  useLocation,
} from "react-router-dom";

import { useAuth } from "./AuthContext.jsx";
import { useLanguage } from "../i18n/LanguageContext.jsx";

const ACCESS_ROLES = new Set([
  "player",
  "game_manager",
  "admin",
  "owner",
]);

const copy = {
  uk: "Перевіряємо доступ до тактичної дошки...",
  en: "Checking Tactical Board access...",
};

export default function PlayerRoute({
  children,
}) {
  const location = useLocation();
  const { language } = useLanguage();

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
            {copy[language] || copy.uk}
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

  if (!ACCESS_ROLES.has(role)) {
    return (
      <Navigate
        to="/account"
        replace
      />
    );
  }

  return children;
}
