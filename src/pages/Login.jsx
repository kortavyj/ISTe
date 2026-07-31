import { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";

import { getAuthErrorMessage } from "../auth/authErrors.js";
import { useAuth } from "../auth/AuthContext.jsx";
import { supabase } from "../lib/supabase.js";

import "./Auth.css";

export default function Login() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, loading, isBlocked } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState(
    location.state?.message ?? "",
  );
  const [errorMessage, setErrorMessage] = useState("");

  if (!loading && user) {
    return <Navigate to={isBlocked ? "/blocked" : "/account"} replace />;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitting(true);
    setMessage("");
    setErrorMessage("");

    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (error) {
      setErrorMessage(getAuthErrorMessage(error));
      setSubmitting(false);
      return;
    }

    const destination = location.state?.from?.pathname ?? "/account";
    navigate(destination, { replace: true });
  }

  return (
    <section className="auth-page">
      <div className="auth-shell">
        <header className="auth-heading">
          <p className="auth-kicker">ISTe account</p>
          <h1>Вход</h1>
          <p>Войдите в аккаунт участника сообщества ISTe.</p>
        </header>

        <div className="auth-card auth-card-form">
          <form className="auth-form" onSubmit={handleSubmit}>
            {message && (
              <div className="auth-message auth-message-success">
                {message}
              </div>
            )}

            {errorMessage && (
              <div className="auth-message auth-message-error">
                {errorMessage}
              </div>
            )}

            <label className="auth-field">
              <span>Электронная почта</span>
              <input
                className="auth-input"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
                disabled={submitting}
              />
            </label>

            <label className="auth-field">
              <span>Пароль</span>
              <input
                className="auth-input"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
                disabled={submitting}
              />
            </label>

            <button
              className="auth-button"
              type="submit"
              disabled={submitting}
            >
              {submitting ? "Входим..." : "Войти"}
            </button>
          </form>

          <div className="auth-links">
            <Link to="/forgot-password">Забыли пароль?</Link>
            <Link to="/register">Создать аккаунт</Link>
          </div>
        </div>
      </div>
    </section>
  );
}
