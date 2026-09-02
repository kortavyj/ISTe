import { useEffect, useState } from "react";
import {
  Link,
  useNavigate,
} from "react-router-dom";

import {
  getAuthErrorMessage,
} from "../auth/authErrors.js";
import {
  useAuth,
} from "../auth/AuthContext.jsx";
import {
  recoverySupabase,
} from "../lib/supabaseRecovery.js";

import "./Auth.css";

function clearRecoveryParameters() {
  window.history.replaceState(
    {},
    document.title,
    "/reset-password",
  );
}

async function clearRecoverySession() {
  try {
    await recoverySupabase.auth
      .signOut({
        scope: "local",
      });
  } catch {
    // Recovery session may already be gone.
  }

  try {
    window.sessionStorage
      .removeItem(
        "iste-recovery-auth",
      );
  } catch {
    // Storage may be unavailable in a hardened browser mode.
  }
}

export default function ResetPassword() {
  const navigate =
    useNavigate();

  const {
    signOut,
  } = useAuth();

  const [
    linkStatus,
    setLinkStatus,
  ] = useState("checking");

  const [
    password,
    setPassword,
  ] = useState("");

  const [
    passwordRepeat,
    setPasswordRepeat,
  ] = useState("");

  const [
    submitting,
    setSubmitting,
  ] = useState(false);

  const [
    errorMessage,
    setErrorMessage,
  ] = useState("");

  useEffect(() => {
    let active = true;
    let retryTimer = null;

    function acceptSession(
      session,
    ) {
      if (
        !active ||
        !session?.user
      ) {
        return false;
      }

      setLinkStatus("ready");
      clearRecoveryParameters();

      return true;
    }

    const {
      data: {
        subscription,
      },
    } =
      recoverySupabase.auth
        .onAuthStateChange(
          (
            event,
            session,
          ) => {
            if (
              event ===
                "PASSWORD_RECOVERY" ||
              event ===
                "SIGNED_IN"
            ) {
              acceptSession(
                session,
              );
            }
          },
        );

    async function verifyRecoveryLink() {
      try {
        const {
          data,
          error,
        } =
          await recoverySupabase
            .auth
            .getSession();

        if (error) {
          throw error;
        }

        if (
          acceptSession(
            data.session,
          )
        ) {
          return;
        }

        retryTimer =
          window.setTimeout(
            async () => {
              try {
                const {
                  data:
                    retryData,
                  error:
                    retryError,
                } =
                  await recoverySupabase
                    .auth
                    .getSession();

                if (
                  retryError
                ) {
                  throw retryError;
                }

                if (
                  !acceptSession(
                    retryData
                      .session,
                  ) &&
                  active
                ) {
                  setLinkStatus(
                    "invalid",
                  );
                }
              } catch {
                if (active) {
                  setLinkStatus(
                    "invalid",
                  );
                }
              }
            },
            1200,
          );
      } catch {
        if (active) {
          setLinkStatus(
            "invalid",
          );
        }
      }
    }

    void verifyRecoveryLink();

    return () => {
      active = false;

      if (retryTimer) {
        window.clearTimeout(
          retryTimer,
        );
      }

      subscription
        .unsubscribe();
    };
  }, []);

  async function handleSubmit(
    event,
  ) {
    event.preventDefault();
    setErrorMessage("");

    if (
      password.length < 10
    ) {
      setErrorMessage(
        "Пароль должен содержать минимум 10 символов.",
      );
      return;
    }

    if (
      password !==
      passwordRepeat
    ) {
      setErrorMessage(
        "Введённые пароли не совпадают.",
      );
      return;
    }

    setSubmitting(true);

    try {
      const {
        error,
      } =
        await recoverySupabase
          .auth
          .updateUser({
            password,
          });

      if (error) {
        throw error;
      }

      await clearRecoverySession();

      /*
       * Main ISTe cookies normally do not exist during password recovery,
       * but if the user had another server session open, invalidate it too.
       */
      try {
        await signOut();
      } catch {
        // Backend cookies may be absent during recovery.
      }

      navigate(
        "/login",
        {
          replace: true,
          state: {
            message:
              "Пароль изменён. Теперь войдите с новым паролем.",
          },
        },
      );
    } catch (error) {
      setErrorMessage(
        getAuthErrorMessage(
          error,
        ),
      );
      setSubmitting(false);
    }
  }

  if (
    linkStatus ===
    "checking"
  ) {
    return (
      <section className="auth-page">
        <div className="auth-card auth-card-status">
          <span
            className="auth-loader"
            aria-hidden="true"
          />

          <p>
            Проверяем ссылку
            восстановления...
          </p>
        </div>
      </section>
    );
  }

  if (
    linkStatus ===
    "invalid"
  ) {
    return (
      <section className="auth-page">
        <div className="auth-shell">
          <div className="auth-card blocked-card">
            <h1>
              Ссылка
              недействительна
            </h1>

            <p>
              Ссылка могла
              истечь, уже
              использоваться или
              быть открыта в
              другом браузере.
              Запросите новое
              письмо и откройте
              его в том же
              браузере, где
              выполнялся запрос.
            </p>

            <Link
              className="auth-button"
              to="/forgot-password"
            >
              Запросить новую
              ссылку
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
          <p className="auth-kicker">
            ISTe account
          </p>

          <h1>
            Новый пароль
          </h1>

          <p>
            Создайте новый
            пароль для аккаунта.
          </p>
        </header>

        <div className="auth-card auth-card-form">
          <form
            className="auth-form"
            onSubmit={
              handleSubmit
            }
          >
            {errorMessage && (
              <div className="auth-message auth-message-error">
                {
                  errorMessage
                }
              </div>
            )}

            <label className="auth-field">
              <span>
                Новый пароль
              </span>

              <input
                className="auth-input"
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(
                  event,
                ) =>
                  setPassword(
                    event
                      .target
                      .value,
                  )
                }
                minLength={10}
                maxLength={128}
                required
                disabled={
                  submitting
                }
              />
            </label>

            <label className="auth-field">
              <span>
                Повтор нового
                пароля
              </span>

              <input
                className="auth-input"
                type="password"
                autoComplete="new-password"
                value={
                  passwordRepeat
                }
                onChange={(
                  event,
                ) =>
                  setPasswordRepeat(
                    event
                      .target
                      .value,
                  )
                }
                minLength={10}
                maxLength={128}
                required
                disabled={
                  submitting
                }
              />
            </label>

            <button
              className="auth-button"
              type="submit"
              disabled={
                submitting
              }
            >
              {submitting
                ? "Сохраняем..."
                : "Сохранить пароль"}
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}
