import { useState } from "react";
import {
  Link,
  Navigate,
  useLocation,
  useNavigate,
} from "react-router-dom";

import { useAuth } from "../auth/AuthContext.jsx";

import "./Auth.css";

async function readApiResponse(response) {
  try {
    return await response.json();
  } catch {
    return {
      ok: false,
      message:
        "Сервер вернул некорректный ответ.",
    };
  }
}

export default function Login() {
  const location = useLocation();
  const navigate = useNavigate();

  const {
    user,
    loading,
    isBlocked,
    refreshSession,
  } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] =
    useState("");

  const [submitting, setSubmitting] =
    useState(false);

  const [message, setMessage] = useState(
    location.state?.message ?? "",
  );

  const [errorMessage, setErrorMessage] =
    useState("");

  if (!loading && user) {
    return (
      <Navigate
        to={
          isBlocked
            ? "/blocked"
            : "/account"
        }
        replace
      />
    );
  }

  async function handleSubmit(event) {
    event.preventDefault();

    setSubmitting(true);
    setMessage("");
    setErrorMessage("");

    try {
      const response = await fetch(
        "/api/auth/login",
        {
          method: "POST",
          credentials: "include",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            email: email
              .trim()
              .toLowerCase(),

            password,
          }),
        },
      );

      const result =
        await readApiResponse(response);

      if (
        !response.ok ||
        result.ok !== true
      ) {
        setErrorMessage(
          result.message ||
            "Не удалось выполнить вход.",
        );

        return;
      }

      await refreshSession();

      const destination =
        location.state?.from?.pathname ??
        "/account";

      navigate(destination, {
        replace: true,
      });
    } catch (error) {
      console.error(
        "Ошибка входа:",
        error,
      );

      setErrorMessage(
        "Не удалось связаться с сервером. Повторите попытку.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="auth-page">
      <div className="auth-shell">
        <header className="auth-heading">
          <p className="auth-kicker">
            ISTe account
          </p>

          <h1>Вход</h1>

          <p>
            Войдите в аккаунт участника
            сообщества ISTe.
          </p>
        </header>

        <div className="auth-card auth-card-form">
          <form
            className="auth-form"
            onSubmit={handleSubmit}
          >
            {message && (
              <div className="auth-message auth-message-success">
                {message}
              </div>
            )}

            {errorMessage && (
              <div
                className="auth-message auth-message-error"
                role="alert"
              >
                {errorMessage}
              </div>
            )}

            <label className="auth-field">
              <span>
                Электронная почта
              </span>

              <input
                className="auth-input"
                type="email"
                autoComplete="email"
                autoCapitalize="none"
                spellCheck={false}
                inputMode="email"
                value={email}
                onChange={(event) =>
                  setEmail(
                    event.target.value,
                  )
                }
                placeholder="name@gmail.com"
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
                onChange={(event) =>
                  setPassword(
                    event.target.value,
                  )
                }
                placeholder="Введите пароль"
                maxLength={128}
                required
                disabled={submitting}
              />
            </label>

            <button
              className="auth-button"
              type="submit"
              disabled={submitting}
            >
              {submitting
                ? "Входим..."
                : "Войти"}
            </button>
          </form>

          <div className="auth-links">
            <Link to="/forgot-password">
              Забыли пароль?
            </Link>

            <Link to="/register">
              Создать аккаунт
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
