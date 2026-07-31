import { Navigate, useNavigate } from "react-router-dom";

import { useAuth } from "../auth/AuthContext.jsx";

import "./Auth.css";

export default function BlockedAccount() {
  const navigate = useNavigate();
  const {
    user,
    loading,
    isBlocked,
    blockedReason,
    signOut,
  } = useAuth();

  if (loading) {
    return (
      <section className="auth-page">
        <div className="auth-card auth-card-status">
          <span className="auth-loader" aria-hidden="true" />
          <p>Проверяем статус аккаунта...</p>
        </div>
      </section>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!isBlocked) {
    return <Navigate to="/account" replace />;
  }

  async function handleSignOut() {
    await signOut();
    navigate("/", { replace: true });
  }

  return (
    <section className="auth-page">
      <div className="auth-shell">
        <div className="auth-card blocked-card">
          <p className="auth-kicker">Доступ ограничен</p>
          <h1>Аккаунт заблокирован</h1>
          <p>
            {blockedReason ||
              "Доступ к аккаунту временно ограничен администратором ISTe."}
          </p>

          <button
            className="auth-button auth-button-secondary"
            type="button"
            onClick={handleSignOut}
          >
            Выйти
          </button>
        </div>
      </div>
    </section>
  );
}
