import { useState } from "react";
import {
  Link,
  Navigate,
  useLocation,
  useNavigate,
} from "react-router-dom";

import { useAuth } from "../auth/AuthContext.jsx";
import MfaChallenge from "../auth/MfaChallenge.jsx";
import { useLanguage } from "../i18n/LanguageContext.jsx";

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


function localizedLoginError(result, status, t) {
  const code = String(result?.error || result?.code || "").toUpperCase();
  const source = String(result?.message || "").toLowerCase();
  if (status === 429 || /RATE_LIMIT|TOO_MANY|BRUTE_FORCE/.test(code)) return t("authLogin.rateLimited");
  if (/BLOCKED|BANNED/.test(code) || /заблокирован|заблокован/.test(source)) return t("authLogin.blocked");
  if (/EMAIL_NOT_CONFIRMED|EMAIL_UNCONFIRMED/.test(code) || /подтверд.*почт|підтверд.*пошт/.test(source)) return t("authLogin.confirmEmail");
  if (status === 401 || /INVALID_CREDENTIAL|INVALID_LOGIN|LOGIN_FAILED|AUTH_FAILED/.test(code) || /неверн.*(?:почт|парол)|невірн.*(?:пошт|парол)|invalid login credentials|incorrect email/.test(source)) return t("authLogin.invalidCredentials");
  return t("authLogin.serverError");
}

export default function Login() {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useLanguage();

  const {
    user,
    loading,
    isBlocked,
    refreshSession,
  } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] =
  useState("");

const [mfaStep, setMfaStep] =
  useState(null);

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
        setErrorMessage(localizedLoginError(result, response.status, t));

        return;
      }

      if (
  result.mfaRequired === true
) {
  setMfaStep({
    setupRequired:
      result.mfaSetupRequired ===
      true,
  });

  setPassword("");
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

      setErrorMessage(t("authLogin.networkError"));
    } finally {
      setSubmitting(false);
    }
  }

  if (mfaStep) {
  return (
    <MfaChallenge
      setupRequired={
        mfaStep.setupRequired
      }
      onSuccess={async () => {
        await refreshSession();

        const destination =
          location.state?.from
            ?.pathname ??
          "/account";

        navigate(destination, {
          replace: true,
        });
      }}
      onCancel={() => {
        setMfaStep(null);
        setPassword("");
        setErrorMessage("");
        setMessage("");
      }}
    />
  );
}

return (
  <section className="auth-page">

      <div className="auth-shell">
        <header className="auth-heading">
          <p className="auth-kicker">
            ISTe account
          </p>

          <h1>{t("authLogin.title")}</h1>

          <p>
            {t("authLogin.description")}
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
                {t("authLogin.email")}
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
              <span>{t("authLogin.password")}</span>

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
                placeholder={t("authLogin.passwordPlaceholder")}
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
              {submitting ? t("authLogin.loading") : t("authLogin.submit")}
            </button>
          </form>

          <div className="auth-links">
            <Link to="/forgot-password">
              {t("authLogin.forgot")}
            </Link>

            <Link to="/register">
              {t("authLogin.register")}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
