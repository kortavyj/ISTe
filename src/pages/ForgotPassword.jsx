import { useState } from "react";
import { Link } from "react-router-dom";

import { getAuthErrorMessage } from "../auth/authErrors.js";
import { getAuthRedirectUrl } from "../lib/siteUrl.js";
import { supabase } from "../lib/supabase.js";

import "./Auth.css";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitting(true);
    setErrorMessage("");

    const { error } = await supabase.auth.resetPasswordForEmail(
      email.trim(),
      {
        redirectTo: getAuthRedirectUrl("/reset-password"),
      },
    );

    if (error) {
      setErrorMessage(getAuthErrorMessage(error));
      setSubmitting(false);
      return;
    }

    setSent(true);
    setSubmitting(false);
  }

  return (
    <section className="auth-page">
      <div className="auth-shell">
        <header className="auth-heading">
          <p className="auth-kicker">ISTe account</p>
          <h1>Восстановление</h1>
          <p>
            Укажите электронную почту, связанную с аккаунтом.
          </p>
        </header>

        <div className="auth-card auth-card-form">
          {sent ? (
            <div className="auth-form">
              <div className="auth-message auth-message-success">
                Если аккаунт с такой почтой существует, на неё отправлено письмо
                для смены пароля.
              </div>

              <Link className="auth-button auth-button-secondary" to="/login">
                Вернуться ко входу
              </Link>
            </div>
          ) : (
            <form className="auth-form" onSubmit={handleSubmit}>
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

              <button
                className="auth-button"
                type="submit"
                disabled={submitting}
              >
                {submitting ? "Отправляем..." : "Отправить письмо"}
              </button>
            </form>
          )}

          <div className="auth-links">
            <Link to="/login">Вернуться ко входу</Link>
          </div>
        </div>
      </div>
    </section>
  );
}
