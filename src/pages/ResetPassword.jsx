import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { getAuthErrorMessage } from "../auth/authErrors.js";
import { useAuth } from "../auth/AuthContext.jsx";
import { supabase } from "../lib/supabase.js";

import "./Auth.css";

export default function ResetPassword() {
  const navigate = useNavigate();
  const { user, loading, signOut } = useAuth();
  const [password, setPassword] = useState("");
  const [passwordRepeat, setPasswordRepeat] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    setErrorMessage("");

    if (password.length < 10) {
      setErrorMessage("Пароль должен содержать минимум 10 символов.");
      return;
    }

    if (password !== passwordRepeat) {
      setErrorMessage("Введённые пароли не совпадают.");
      return;
    }

    setSubmitting(true);

    const { error } = await supabase.auth.updateUser({
      password,
    });

    if (error) {
      setErrorMessage(getAuthErrorMessage(error));
      setSubmitting(false);
      return;
    }

    try {
      await signOut();
    } catch {
      // Пароль уже изменён. Переход ко входу остаётся безопасным.
    }

    navigate("/login", {
      replace: true,
      state: {
        message: "Пароль изменён. Теперь войдите с новым паролем.",
      },
    });
  }

  if (loading) {
    return (
      <section className="auth-page">
        <div className="auth-card auth-card-status">
          <span className="auth-loader" aria-hidden="true" />
          <p>Проверяем ссылку восстановления...</p>
        </div>
      </section>
    );
  }

  if (!user) {
    return (
      <section className="auth-page">
        <div className="auth-shell">
          <div className="auth-card blocked-card">
            <h1>Ссылка недействительна</h1>
            <p>
              Ссылка могла истечь или уже использоваться. Запросите новое письмо
              для восстановления пароля.
            </p>
            <Link className="auth-button" to="/forgot-password">
              Запросить новую ссылку
            </Link>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="auth-page">
      <div className="auth-shell">
        <header className="auth-heading">
          <p className="auth-kicker">ISTe account</p>
          <h1>Новый пароль</h1>
          <p>Создайте новый пароль для аккаунта.</p>
        </header>

        <div className="auth-card auth-card-form">
          <form className="auth-form" onSubmit={handleSubmit}>
            {errorMessage && (
              <div className="auth-message auth-message-error">
                {errorMessage}
              </div>
            )}

            <label className="auth-field">
              <span>Новый пароль</span>
              <input
                className="auth-input"
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                minLength={10}
                required
                disabled={submitting}
              />
            </label>

            <label className="auth-field">
              <span>Повтор нового пароля</span>
              <input
                className="auth-input"
                type="password"
                autoComplete="new-password"
                value={passwordRepeat}
                onChange={(event) => setPasswordRepeat(event.target.value)}
                minLength={10}
                required
                disabled={submitting}
              />
            </label>

            <button
              className="auth-button"
              type="submit"
              disabled={submitting}
            >
              {submitting ? "Сохраняем..." : "Сохранить пароль"}
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}
