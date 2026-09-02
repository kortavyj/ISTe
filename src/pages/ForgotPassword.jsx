import { useState } from "react";
import { Link } from "react-router-dom";

import "./Auth.css";

async function readApiResponse(response) {
  try {
    return await response.json();
  } catch {
    return {
      ok: false,
      message: "Сервер вернул некорректный ответ.",
    };
  }
}

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitting(true);
    setErrorMessage("");

    try {
      const response = await fetch("/api/auth/recover", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
        }),
      });

      const result = await readApiResponse(response);

      if (!response.ok || result?.ok !== true) {
        setErrorMessage(
          result?.message || "Не удалось отправить запрос восстановления.",
        );
        return;
      }

      setSent(true);
    } catch {
      setErrorMessage(
        "Не удалось связаться с сервером. Повторите попытку позже.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="auth-page">
      <div className="auth-shell">
        <header className="auth-heading">
          <p className="auth-kicker">ISTe account</p>
          <h1>Восстановление</h1>
          <p>Укажите электронную почту, связанную с аккаунтом.</p>
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
              {errorMessage ? (
                <div className="auth-message auth-message-error" role="alert">
                  {errorMessage}
                </div>
              ) : null}

              <label className="auth-field">
                <span>Электронная почта</span>
                <input
                  className="auth-input"
                  type="email"
                  autoComplete="email"
                  autoCapitalize="none"
                  spellCheck={false}
                  inputMode="email"
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
