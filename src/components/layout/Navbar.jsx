import { Navigate, useLocation } from "react-router-dom";

import { useAuth } from "./AuthContext.jsx";

const MANAGEMENT_ROLES = new Set(["admin", "owner"]);

export default function OwnerRoute({ children }) {
  const location = useLocation();
  const { user, role, loading, isBlocked } = useAuth();

  if (loading) {
    return (
      <section className="auth-page">
        <div className="auth-card auth-card-status">
          <span className="auth-loader" aria-hidden="true" />
          <p>Проверяем права управления...</p>
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
    return <Navigate to="/blocked" replace />;
  }

  if (!MANAGEMENT_ROLES.has(role)) {
    return <Navigate to="/account" replace />;
  }

  return children;
}
