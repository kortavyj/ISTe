import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";

import { getAuthErrorMessage } from "../auth/authErrors.js";
import { useAuth } from "../auth/AuthContext.jsx";
import { getAuthRedirectUrl } from "../lib/siteUrl.js";
import { supabase } from "../lib/supabase.js";

import "./Auth.css";

const usernamePattern = /^[A-Za-z0-9_]{3,32}$/;
const gmailPattern = /^[^\s@]+@gmail\.com$/i;

export default function Register() {
  const navigate = useNavigate();
  const { user, loading, isBlocked } = useAuth();

  const [form, setForm] = useState({
    username: "",
    displayName: "",
    email: "",
    password: "",
    passwordRepeat: "",
  });

  const [submitting, setSubmitting] = useState(false);
  const [registrationComplete, setRegistrationComplete] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  if (!loading && user) {
    return <Navigate to={isBlocked ? "/blocked" : "/account"} replace />;
  }

  function updateField(field) {
    return (event) => {
      const value = event.target.value;

      setForm((current) => ({
        ...current,
        [field]: value,
      }));

      if (errorMessage) {
        setErrorMessage("");
      }
    };
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setErrorMessage("");

    const username = form.username.trim();
    const displayName = form.displayName.trim();
    const email = form.email.trim().toLowerCase();

    if (!usernamePattern.test(username)) {
      setErrorMessage(
        "Никнейм должен содержать от 3 до 32 латинских букв, цифр или символов подчёркивания.",
      );
      return;
    }

    if (displayName.length < 2 || displayName.length > 60) {
      setErrorMessage("Имя должно содержать от 2 до 60 символов.");
      return;
    }

    if (!gmailPattern.test(email)) {
      setErrorMessage(
        "Регистрация доступна только с почтой Gmail. Адрес должен оканчиваться на @gmail.com.",
      );
      return;
    }

    if (form.password.length < 10) {
      setErrorMessage("Пароль должен содержать минимум 10 символов.");
      return;
    }

    if (form.password !== form.passwordRepeat) {
      setErrorMessage("Введённые пароли не совпадают.");
      return;
    }

    setSubmitting(true);

    try {
      const {
        data: usernameAvailable,
        error: usernameCheckError,
      } = await supabase.rpc("is_username_available", {
        candidate_username: username,
      });

      if (usernameCheckError) {
        console.error("Ошибка проверки никнейма:", usernameCheckError);

        setErrorMessage(
          "Не удалось проверить никнейм. Повторите попытку через несколько секунд.",
        );
        return;
      }

      if (usernameAvailable !== true) {
        setErrorMessage("Этот никнейм уже занят. Выберите другой.");
        return;
      }

      const { data, error } = await supabase.auth.signUp({
        email,
        password: form.password,
        options: {
          emailRedirectTo: getAuthRedirectUrl("/account"),
          data: {
            username,
            display_name: displayName,
          },
        },
      });

      if (error) {
        setErrorMessage(getAuthErrorMessage(error));
        return;
      }

      if (data.session) {
        navigate("/account", { replace: true });
        return;
      }

      setRegistrationComplete(true);
    } catch (error) {
      console.error("Неожиданная ошибка регистрации:", error);
      setErrorMessage("Произошла ошибка. Повторите попытку.");
    } finally {
      setSubmitting(false);
    }
  }

  if (registrationComplete) {
    return (
      <section className="auth-page">
        <div className="auth-shell">
          <header className="auth-heading">
            <p className="auth-kicker">ISTe account</p>
            <h1>Проверьте почту</h1>
          </header>

          <div className="auth-card auth-card-status">
            <div className="auth-message auth-message-success">
              Мы отправили письмо подтверждения на указанную электронную почту.
              После подтверждения аккаунт будет активирован.
            </div>

            <Link className="auth-button auth-button-secondary" to="/login">
              Перейти ко входу
            </Link>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="auth-page">
      <div className="auth-shell auth-shell-register">
        <header className="auth-heading">
          <p className="auth-kicker">ISTe account</p>
          <h1>Регистрация</h1>

          <p>
            Создайте аккаунт. После регистрации потребуется подтвердить
            электронную почту.
          </p>
        </header>

        <div className="auth-card auth-card-form">
          <form className="auth-form" onSubmit={handleSubmit}>
            {errorMessage && (
              <div className="auth-message auth-message-error" role="alert">
                {errorMessage}
              </div>
            )}

            <div className="auth-form-row">
              <label className="auth-field">
                <span>Никнейм</span>

                <input
                  className="auth-input"
                  type="text"
                  autoComplete="username"
                  autoCapitalize="none"
                  spellCheck={false}
                  inputMode="text"
                  value={form.username}
                  onChange={updateField("username")}
                  placeholder="user_nik"
                  pattern="[A-Za-z0-9_]{3,32}"
                  minLength={3}
                  maxLength={32}
                  aria-describedby="username-hint"
                  required
                  disabled={submitting}
                />

                <small className="auth-hint" id="username-hint">
                  Латинские буквы, цифры и символ подчёркивания. Никнейм должен
                  быть уникальным.
                </small>
              </label>

              <label className="auth-field">
                <span>Отображаемое имя</span>

                <input
                  className="auth-input"
                  type="text"
                  autoComplete="name"
                  value={form.displayName}
                  onChange={updateField("displayName")}
                  placeholder="Например, Евгений"
                  minLength={2}
                  maxLength={60}
                  aria-describedby="display-name-hint"
                  required
                  disabled={submitting}
                />

                <small className="auth-hint" id="display-name-hint">
                  Это имя будут видеть другие участники сообщества ISTe.
                </small>
              </label>
            </div>

            <label className="auth-field">
              <span>Электронная почта</span>

              <input
                className="auth-input"
                type="email"
                autoComplete="email"
                autoCapitalize="none"
                spellCheck={false}
                inputMode="email"
                value={form.email}
                onChange={updateField("email")}
                placeholder="name@gmail.com"
                aria-describedby="email-hint"
                required
                disabled={submitting}
              />

              <small className="auth-hint" id="email-hint">
                Разрешена только почта Gmail, например name@gmail.com.
              </small>
            </label>

            <div className="auth-form-row">
              <label className="auth-field">
                <span>Пароль</span>

                <input
                  className="auth-input"
                  type="password"
                  autoComplete="new-password"
                  value={form.password}
                  onChange={updateField("password")}
                  placeholder="Минимум 10 символов"
                  minLength={10}
                  aria-describedby="password-hint"
                  required
                  disabled={submitting}
                />

                <small className="auth-hint" id="password-hint">
                  Используйте не менее 10 символов.
                </small>
              </label>

              <label className="auth-field">
                <span>Повтор пароля</span>

                <input
                  className="auth-input"
                  type="password"
                  autoComplete="new-password"
                  value={form.passwordRepeat}
                  onChange={updateField("passwordRepeat")}
                  placeholder="Повторите пароль"
                  minLength={10}
                  aria-describedby="password-repeat-hint"
                  required
                  disabled={submitting}
                />

                <small className="auth-hint" id="password-repeat-hint">
                  Введите тот же пароль ещё раз.
                </small>
              </label>
            </div>

            <button
              className="auth-button"
              type="submit"
              disabled={submitting}
            >
              {submitting ? "Создаём аккаунт..." : "Зарегистрироваться"}
            </button>
          </form>

          <div className="auth-links">
            <span>Уже есть аккаунт?</span>
            <Link to="/login">Войти</Link>
          </div>
        </div>
      </div>
    </section>
  );
}
