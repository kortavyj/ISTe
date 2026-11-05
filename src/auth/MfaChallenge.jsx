import { useLanguage } from "../i18n/LanguageContext.jsx";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

async function readApiResponse(response) {
  let result;

  try {
    result = await response.json();
  } catch {
    throw new Error(
      "Сервер вернул некорректный ответ.",
    );
  }

  if (
    !response.ok ||
    result?.ok !== true
  ) {
    const error = new Error(
      result?.message ||
        "Не удалось выполнить запрос.",
    );

    error.code =
      result?.error || "MFA_REQUEST_FAILED";

    throw error;
  }

  return result;
}

async function postMfa(
  action,
  payload = {},
) {
  const response = await fetch(
    "/api/auth/session",
    {
      method: "POST",
      credentials: "include",

      headers: {
        Accept: "application/json",
        "Content-Type":
          "application/json",
      },

      body: JSON.stringify({
        action,
        ...payload,
      }),
    },
  );

  return readApiResponse(response);
}

export default function MfaChallenge({
  setupRequired,
  onSuccess,
  onCancel,
}) {
  const { t } = useLanguage();
  const startedRef = useRef(false);

  const [mode, setMode] = useState(
    setupRequired ? "setup" : "verify",
  );

  const [factorId, setFactorId] =
    useState("");

  const [qrCode, setQrCode] =
    useState("");

  const [secret, setSecret] =
    useState("");

  const [code, setCode] =
    useState("");

  const [preparing, setPreparing] =
    useState(setupRequired);

  const [submitting, setSubmitting] =
    useState(false);

  const [cancelling, setCancelling] =
    useState(false);

  const [errorMessage, setErrorMessage] =
    useState("");

  const [copyMessage, setCopyMessage] =
    useState("");

  const startEnrollment =
    useCallback(async () => {
      setPreparing(true);
      setErrorMessage("");
      setCopyMessage("");

      try {
        const result = await postMfa(
          "mfa-enroll",
        );

        if (
          result.authenticated === true
        ) {
          await onSuccess?.();
          return;
        }

        if (
          result.enrollmentRequired !==
          true
        ) {
          setMode("verify");
          setFactorId("");
          setQrCode("");
          setSecret("");
          return;
        }

        setMode("setup");
        setFactorId(
          result.factorId || "",
        );

        setQrCode(
          result.qrCode || "",
        );

        setSecret(
          result.secret || "",
        );
      } catch (error) {
        setErrorMessage(
          t("authMfa.setupFailed"),
        );
      } finally {
        setPreparing(false);
      }
    }, [onSuccess]);

  useEffect(() => {
    if (
      !setupRequired ||
      startedRef.current
    ) {
      return;
    }

    startedRef.current = true;
    void startEnrollment();
  }, [
    setupRequired,
    startEnrollment,
  ]);

  async function handleSubmit(event) {
    event.preventDefault();

    const normalizedCode =
      code.replace(/\D/g, "");

    if (
      normalizedCode.length < 6 ||
      normalizedCode.length > 10
    ) {
      setErrorMessage(
        t("authMfa.codeRequired"),
      );
      return;
    }

    setSubmitting(true);
    setErrorMessage("");

    try {
      await postMfa(
        "mfa-verify",
        {
          code: normalizedCode,
          factorId:
            factorId || undefined,
        },
      );

      setCode("");
      await onSuccess?.();
    } catch (error) {
      setErrorMessage(
        error?.code === "TOO_MANY_ATTEMPTS" ? t("authMfa.rateLimited") : error?.code === "INVALID_MFA_CODE" ? t("authMfa.invalidCode") : t("authMfa.verifyFailed"),
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handleCancel() {
    setCancelling(true);
    setErrorMessage("");

    try {
      await postMfa("mfa-cancel");
    } catch {
      // Локальный экран всё равно закрываем.
      // Серверная pending cookie живёт не более 15 минут.
    } finally {
      setCancelling(false);
      onCancel?.();
    }
  }

  async function handleCopySecret() {
    if (!secret) {
      return;
    }

    try {
      await navigator.clipboard.writeText(
        secret,
      );

      setCopyMessage(
        t("authMfa.copied"),
      );
    } catch {
      setCopyMessage(
        t("authMfa.copyFailed"),
      );
    }
  }

  const isSetup =
    mode === "setup";

  return (
    <section className="auth-page auth-page-mfa">
      <div className="auth-shell auth-shell-mfa">
        <header className="auth-heading auth-heading-mfa">
          <p className="auth-kicker">
            {t("authMfa.kicker")}
          </p>

          <h1>
            {t("authMfa.title")}
          </h1>

          <p>
            {isSetup
              ? t("authMfa.setupDescription")
              : t("authMfa.verifyDescription")}
          </p>
        </header>

        <div className="auth-card auth-card-form mfa-login-panel">
          {errorMessage && (
            <div
              className="auth-message auth-message-error"
              role="alert"
            >
              {errorMessage}
            </div>
          )}

          {preparing && (
            <div className="mfa-preparing">
              <div
                className="auth-loader"
                aria-hidden="true"
              />

              <p>
                {t("authMfa.preparing")}
              </p>
            </div>
          )}

          {isSetup &&
            !preparing &&
            qrCode && (
              <>
                <div className="mfa-setup-copy">
                  <h2>
                    {t("authMfa.scanTitle")}
                  </h2>

                  <p>
                    {t("authMfa.scanDescription")}
                  </p>
                </div>

                <div className="mfa-qr-wrap">
                  <img
                    className="mfa-qr"
                    src={qrCode}
                    alt={t("authMfa.qrAlt")}
                  />
                </div>

                {secret && (
                  <div className="mfa-secret">
                    <div>
                      <strong>
                        {t("authMfa.backupKey")}
                      </strong>

                      <p>
                        {t("authMfa.backupDescription")}
                      </p>
                    </div>

                    <code>
                      {secret}
                    </code>

                    <button
                      className="auth-button auth-button-secondary"
                      type="button"
                      onClick={
                        handleCopySecret
                      }
                      disabled={
                        submitting ||
                        cancelling
                      }
                    >
                      {t("authMfa.copyKey")}
                    </button>

                    {copyMessage && (
                      <small className="auth-hint">
                        {copyMessage}
                      </small>
                    )}
                  </div>
                )}
              </>
            )}

          {isSetup &&
            !preparing &&
            !qrCode && (
              <button
                className="auth-button"
                type="button"
                onClick={
                  startEnrollment
                }
                disabled={
                  submitting ||
                  cancelling
                }
              >
                {t("authMfa.retry")}
              </button>
            )}

          {(!isSetup ||
            (!preparing &&
              qrCode)) && (
            <form
              className="auth-form"
              onSubmit={handleSubmit}
            >
              <label className="auth-field">
                <span>
                  {t("authMfa.codeLabel")}
                </span>

                <input
                  className="auth-input mfa-code-input"
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  pattern="[0-9]*"
                  value={code}
                  onChange={(event) =>
                    setCode(
                      event.target.value
                        .replace(/\D/g, "")
                        .slice(0, 10),
                    )
                  }
                  placeholder="000000"
                  minLength={6}
                  maxLength={10}
                  required
                  autoFocus
                  disabled={
                    submitting ||
                    cancelling
                  }
                />
              </label>

              <button
                className="auth-button"
                type="submit"
                disabled={
                  submitting ||
                  cancelling
                }
              >
                {submitting
                  ? t("authMfa.checking")
                  : isSetup
                    ? t("authMfa.enable")
                    : t("authMfa.confirm")}
              </button>
            </form>
          )}

          <button
            className="auth-button auth-button-secondary"
            type="button"
            onClick={handleCancel}
            disabled={
              preparing ||
              submitting ||
              cancelling
            }
          >
            {cancelling
              ? t("authMfa.cancelling")
              : t("authMfa.back")}
          </button>
        </div>
      </div>
    </section>
  );
}
