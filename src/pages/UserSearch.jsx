import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import MemberShowcase from "../components/MemberShowcase.jsx";
import VerifiedBadge from "../components/VerifiedBadge.jsx";

import { useAuth } from "../auth/AuthContext.jsx";
import {
  formatAccountId,
  isValidAccountId,
  normalizeAccountId,
} from "../utils/accountId.js";

import "./UserSearch.css";

function formatDate(value) {
  if (!value) {
    return "Дату не вказано";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Дату не вказано";
  }

  return new Intl.DateTimeFormat("uk-UA", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(date);
}

function getInitials(profile) {
  const source =
    profile?.display_name || profile?.username || profile?.account_id || "ISTe";

  return source.trim().slice(0, 2).toUpperCase();
}

async function readApiResponse(response) {
  let result;

  try {
    result = await response.json();
  } catch {
    throw new Error(
      "Сервер повернув некоректну відповідь.",
    );
  }

  if (
    !response.ok ||
    result?.ok !== true
  ) {
    throw new Error(
      result?.message ||
        "Не вдалося виконати пошук.",
    );
  }

  return result;
}

export default function UserSearch() {
  const { profile: currentProfile, role } = useAuth();

  const [query, setQuery] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [verificationState, setVerificationState] = useState(null);
  const [verificationBusy, setVerificationBusy] = useState(false);
  const [verificationMessage, setVerificationMessage] = useState("");
  const canVerify = role === "owner" || role === "admin";

  const ownAccountId = formatAccountId(currentProfile?.account_number);

  const resultIsCurrentUser = useMemo(() => {
    if (!result?.account_number || !currentProfile?.account_number) {
      return false;
    }

    return (
      String(result.account_number) === String(currentProfile.account_number)
    );
  }, [result, currentProfile]);

  async function handleSearch(event) {
    event.preventDefault();

    setErrorMessage("");
    setResult(null);
    setHasSearched(false);
    setVerificationState(null);
    setVerificationMessage("");

    if (!isValidAccountId(query)) {
      setErrorMessage("Введіть коректний ID, наприклад ISTE 000001.");
      return;
    }

    setLoading(true);

    try {
      const normalized =
        normalizeAccountId(query);

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
            action: "find-user",
            accountId: normalized,
          }),
        },
      );

      const data =
        await readApiResponse(response);

      const foundProfile = data.profile ?? null;
      setResult(foundProfile);
      setHasSearched(true);

      if (foundProfile?.account_number && canVerify) {
        setVerificationState(foundProfile.is_verified === true);
      }
    } catch (error) {
      setErrorMessage(
        error?.message ||
          "Не удалось выполнить поиск.",
      );
    } finally {
      setLoading(false);
    }
  }

  async function changeVerification() {
    if (!canVerify || !result?.account_number || verificationState === null || verificationBusy) return;
    const nextVerified = !verificationState;
    const displayName = result.display_name || result.username || result.account_id;
    if (!window.confirm(nextVerified
      ? `Видати верифікацію профілю «${displayName}»?`
      : `Зняти верифікацію з профілю «${displayName}»?`)) return;

    setVerificationBusy(true);
    setVerificationMessage("");
    try {
      const response = await fetch("/api/owner/set-verified", {
        method: "POST",
        credentials: "include",
        headers: { Accept: "application/json", "Content-Type": "application/json" },
        body: JSON.stringify({ accountNumber: result.account_number, verified: nextVerified }),
      });
      await readApiResponse(response);
      setVerificationState(nextVerified);
      setResult(current => current ? { ...current, is_verified: nextVerified } : current);
      setVerificationMessage(nextVerified
        ? "Верифікацію успішно видано."
        : "Верифікацію успішно знято.");
    } catch (error) {
      const failureMessage = error?.message || "Не вдалося змінити верифікацію.";
      setVerificationMessage(
        /two.factor|mfa|двофактор|двухфактор/i.test(failureMessage)
          ? "Для видачі верифікації потрібна активна двофакторна автентифікація. Увійдіть із підтвердженням 2FA."
          : failureMessage,
      );
    } finally {
      setVerificationBusy(false);
    }
  }

  function handleInput(event) {
    setQuery(event.target.value.toUpperCase().slice(0, 32));
    setErrorMessage("");
  }

  function fillOwnId() {
    if (!ownAccountId) {
      return;
    }

    setQuery(ownAccountId);
    setErrorMessage("");
  }

  return (
    <section className="user-search-page">
      <div className="user-search-glow" aria-hidden="true" />

      <div className="user-search-shell">
        <header className="user-search-header">
          <div className="user-search-eyebrow"><span />ПОШУК УЧАСНИКА ISTe<span /></div>
          <h1>Пошук <span>користувача</span></h1>
          <p>Знайдіть учасника спільноти ISTe за його ID. Відображаються лише публічні дані профілю.</p>
        </header>

        <form className="user-search-form" onSubmit={handleSearch}>
          <div className="user-search-form-label">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><circle cx="10" cy="8" r="4"/><path d="M3 20v-2a6 6 0 0 1 11-3.3"/><circle cx="18" cy="17" r="3"/><path d="m20 19 2 2"/></svg>
            <label htmlFor="account-search">ID користувача</label>
          </div>
          <div className="user-search-controls">
            <input
              id="account-search"
              type="text"
              value={query}
              onChange={handleInput}
              placeholder="000001"
              autoComplete="off"
              spellCheck="false"
              aria-describedby="account-search-help"
              disabled={loading}
            />
            <button type="submit" disabled={loading}>
              <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/></svg>
              {loading ? "Шукаємо..." : "Знайти"}
            </button>
          </div>
          <div className="user-search-form-footer">
            <small id="account-search-help">Можна вводити ID з префіксом ISTE або лише цифри.</small>
            {ownAccountId ? (
              <button type="button" onClick={fillOwnId}>Підставити мій ID</button>
            ) : null}
          </div>
        </form>

        {errorMessage ? (
          <div className="user-search-message user-search-message-error" role="alert">
            {errorMessage}
          </div>
        ) : null}

        {hasSearched && !result ? (
          <div className="user-search-empty">
            <span aria-hidden="true">?</span>
            <h2>Користувача не знайдено</h2>
            <p>
              Проверьте цифры ID. Заблокированные аккаунты в поиске не
              отображаются.
            </p>
          </div>
        ) : null}

        {result ? (
          <>
          <div className="user-search-results-title"><span />Результат пошуку</div>
          <article className="user-result">
            <div className="user-result-avatar" aria-hidden="true">
              <span>{getInitials(result)}</span>
              {result.avatar_url ? (
                <img src={result.avatar_url} alt="" referrerPolicy="no-referrer"
                  onError={(event) => { event.currentTarget.hidden = true; }} />
              ) : null}
            </div>
            <div className="user-result-copy">
              <div className="user-result-heading">
                <div>
                  <p>{result.account_id}</p>
                  <h2><span>{result.display_name || "Учасник ISTe"}</span>{result.is_verified === true && <VerifiedBadge size={15} />}</h2>
                  <span>@{result.username || "без_ніка"}</span>
                </div>
                {resultIsCurrentUser ? <span className="user-result-self">Це ви</span> : null}
              </div>
              <p className="user-result-bio">{result.bio || "Користувач поки нічого не розповів про себе."}</p>
            </div>
            <div className="user-result-side">
              <div className="user-result-meta">
                <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4m10-4v4M3 10h18"/></svg>
                <div><span>Дата приєднання</span><strong>{formatDate(result.created_at)}</strong></div>
              </div>
              {resultIsCurrentUser ? (
                <Link className="user-result-account-link" to="/account">Відкрити мій профіль <span aria-hidden="true">↗</span></Link>
              ) : null}
              {canVerify ? (
                <div className="user-result-verification-controls">
                  <div className="user-result-verification-status">
                    {verificationState === true ? <VerifiedBadge size={15} /> : <span aria-hidden="true" className="user-result-verification-dot" />}
                    <span>{verificationState === null ? "Перевірка статусу" : verificationState ? "Профіль верифіковано" : "Профіль не верифіковано"}</span>
                  </div>
                  <button type="button" onClick={changeVerification}
                    disabled={verificationBusy || verificationState === null}
                    className={verificationState ? "user-result-verify-button is-revoke" : "user-result-verify-button"}>
                    {verificationBusy ? "Зберігаємо..." : verificationState ? "Зняти верифікацію" : "Видати верифікацію"}
                  </button>
                  {verificationMessage && <p role="status" className="user-result-verification-message">{verificationMessage}</p>}
                </div>
              ) : null}
            </div>
          </article>
          <MemberShowcase targetAccountNumber={result.account_number} />
          </>
        ) : null}

        <aside className="user-search-privacy">
          <strong>Приватність</strong>
          <p>
            Поиск работает только для авторизованных пользователей и только по
            точному ID. Почта, пароль, роль, статус доступа и внутренний UUID не
            передаются.
          </p>
        </aside>
      </div>
    </section>
  );
}
