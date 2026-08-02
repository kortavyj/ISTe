import { useMemo, useState } from "react";
import { Link } from "react-router-dom";

import { useAuth } from "../auth/AuthContext.jsx";
import { supabase } from "../lib/supabase.js";
import {
  formatAccountId,
  isValidAccountId,
  normalizeAccountId,
} from "../utils/accountId.js";

import "./UserSearch.css";

function formatDate(value) {
  if (!value) {
    return "Дата не указана";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Дата не указана";
  }

  return new Intl.DateTimeFormat("ru-RU", {
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

function getSearchErrorMessage(error) {
  const source = [
    error?.message,
    error?.details,
    error?.hint,
    error?.code,
  ]
    .filter(Boolean)
    .join(" ");

  if (source.includes("AUTH_REQUIRED")) {
    return "Для поиска необходимо войти в аккаунт.";
  }

  if (source.includes("ACCOUNT_BLOCKED")) {
    return "Поиск недоступен для заблокированного аккаунта.";
  }

  if (
    source.includes("find_profile_by_account_id") &&
    source.toLowerCase().includes("function")
  ) {
    return "Поиск ещё не подключён к базе данных. Выполните SQL файл из архива.";
  }

  return error?.message || "Не удалось выполнить поиск.";
}

export default function UserSearch() {
  const { profile: currentProfile } = useAuth();

  const [query, setQuery] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

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

    if (!isValidAccountId(query)) {
      setErrorMessage("Введите корректный ID, например ISTE 000001.");
      return;
    }

    setLoading(true);

    const normalized = normalizeAccountId(query);

    const { data, error } = await supabase.rpc(
      "find_profile_by_account_id",
      {
        p_account_id: normalized,
      },
    );

    if (error) {
      setErrorMessage(getSearchErrorMessage(error));
      setLoading(false);
      return;
    }

    const foundProfile = Array.isArray(data) ? data[0] ?? null : data ?? null;

    setResult(foundProfile);
    setHasSearched(true);
    setLoading(false);
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
          <p className="auth-kicker">ISTe member search</p>
          <h1>Поиск пользователя</h1>
          <p>
            Введите точный ID аккаунта. Сайт покажет только публичные данные
            профиля. Электронная почта и системный UUID остаются скрытыми.
          </p>
        </header>

        <form className="user-search-form" onSubmit={handleSearch}>
          <label htmlFor="account-search">
            ID пользователя
          </label>

          <div className="user-search-controls">
            <input
              id="account-search"
              type="text"
              value={query}
              onChange={handleInput}
              placeholder="ISTE 000001"
              autoComplete="off"
              spellCheck="false"
              aria-describedby="account-search-help"
              disabled={loading}
            />

            <button type="submit" disabled={loading}>
              {loading ? "Ищем..." : "Найти"}
            </button>
          </div>

          <div className="user-search-form-footer">
            <small id="account-search-help">
              Можно вводить ID с префиксом ISTE или только цифры.
            </small>

            {ownAccountId ? (
              <button type="button" onClick={fillOwnId}>
                Подставить мой ID
              </button>
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
            <h2>Пользователь не найден</h2>
            <p>
              Проверьте цифры ID. Заблокированные аккаунты в поиске не
              отображаются.
            </p>
          </div>
        ) : null}

        {result ? (
          <article className="user-result">
            <div className="user-result-avatar" aria-hidden="true">
              <span>{getInitials(result)}</span>
              {result.avatar_url ? (
                <img
                  src={result.avatar_url}
                  alt=""
                  referrerPolicy="no-referrer"
                  onError={(event) => {
                    event.currentTarget.hidden = true;
                  }}
                />
              ) : null}
            </div>

            <div className="user-result-copy">
              <div className="user-result-heading">
                <div>
                  <p>{result.account_id}</p>
                  <h2>{result.display_name || "Пользователь ISTe"}</h2>
                  <span>@{result.username || "без_ника"}</span>
                </div>

                {resultIsCurrentUser ? (
                  <span className="user-result-self">Это вы</span>
                ) : null}
              </div>

              <p className="user-result-bio">
                {result.bio || "Пользователь пока ничего не рассказал о себе."}
              </p>

              <div className="user-result-meta">
                <span>Участник с {formatDate(result.created_at)}</span>
              </div>

              {resultIsCurrentUser ? (
                <Link className="user-result-account-link" to="/account">
                  Открыть личный кабинет
                </Link>
              ) : null}
            </div>
          </article>
        ) : null}

        <aside className="user-search-privacy">
          <strong>Приватность</strong>
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
