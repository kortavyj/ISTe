import {
  useEffect,
  useMemo,
  useState,
} from "react";

import { useLanguage } from "../i18n/LanguageContext.jsx";

import "./AdminBotSubscriptions.css";

const copy = {
  uk: {
    eyebrow: "ISTe BOT BILLING",
    title: "Підписки ISTe Bot",
    intro:
      "Активація, продовження та скасування місячних підписок. Один період дорівнює 30 дням.",
    search: "Пошук Discord або сайту",
    plan: "Тариф",
    status: "Статус",
    expires: "До",
    role: "Discord роль",
    synced: "Видана",
    pending: "Не видана",
    activate: "Активувати 30 днів",
    extend: "+30 днів",
    revoke: "Скасувати",
    protected: "INTERNAL захищено",
    empty: "Підписок не знайдено.",
    loading: "Завантаження…",
    updated: "Підписку оновлено.",
    failed: "Не вдалося змінити підписку.",
    confirmRevoke:
      "Скасувати підписку ISTe Bot для цього користувача?",
    requestsTitle: "Заявки з Discord",
    requestsIntro:
      "Користувач обирає тариф прямо в ISTe Bot. Підписка активується тільки після вашого підтвердження.",
    requestedPlan: "Запитаний тариф",
    currentPlan: "Поточний тариф",
    requestedAt: "Заявка",
    approveRequest: "Активувати",
    rejectRequest: "Відхилити",
    noRequests: "Нових заявок немає.",
    requestApproved: "Заявку схвалено, підписку активовано.",
    requestRejected: "Заявку відхилено.",
    confirmReject:
      "Відхилити цю заявку на підписку?",
  },
  en: {
    eyebrow: "ISTe BOT BILLING",
    title: "ISTe Bot subscriptions",
    intro:
      "Activate, extend and revoke monthly subscriptions. One period is 30 days.",
    search: "Search Discord or website",
    plan: "Plan",
    status: "Status",
    expires: "Until",
    role: "Discord role",
    synced: "Assigned",
    pending: "Not assigned",
    activate: "Activate 30 days",
    extend: "+30 days",
    revoke: "Revoke",
    protected: "INTERNAL protected",
    empty: "No subscriptions found.",
    loading: "Loading…",
    updated: "Subscription updated.",
    failed: "Could not update subscription.",
    confirmRevoke:
      "Revoke this user's ISTe Bot subscription?",
    requestsTitle: "Discord requests",
    requestsIntro:
      "Users choose a plan directly in ISTe Bot. The subscription activates only after your approval.",
    requestedPlan: "Requested plan",
    currentPlan: "Current plan",
    requestedAt: "Requested",
    approveRequest: "Activate",
    rejectRequest: "Reject",
    noRequests: "No new requests.",
    requestApproved: "Request approved and subscription activated.",
    requestRejected: "Request rejected.",
    confirmReject:
      "Reject this subscription request?",
  },
};

async function api(
  action,
  {
    method = "GET",
    body = null,
    search = "",
  } = {},
) {
  const params =
    new URLSearchParams({
      module: "bot-portal",
      action,
    });

  if (search) {
    params.set(
      "search",
      search,
    );
  }

  const options = {
    method,
    credentials: "include",
    cache: "no-store",
    headers: {
      Accept: "application/json",
    },
  };

  if (body) {
    options.headers["Content-Type"] =
      "application/json";
    options.body =
      JSON.stringify(body);
  }

  const response =
    await fetch(
      "/api/owner?" +
        params.toString(),
      options,
    );

  const result =
    await response
      .json()
      .catch(
        () => null,
      );

  if (
    !response.ok ||
    result?.ok !== true
  ) {
    throw new Error(
      result?.message ||
        "REQUEST_FAILED",
    );
  }

  return result;
}

function formatDate(
  value,
  language,
) {
  if (!value) return "—";

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return "—";
  }

  return new Intl.DateTimeFormat(
    language === "en"
      ? "en-GB"
      : "uk-UA",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    },
  ).format(date);
}

export default function AdminBotSubscriptions() {
  const {
    language,
  } = useLanguage();

  const c =
    copy[language] ||
    copy.uk;

  const [
    subscriptions,
    setSubscriptions,
  ] = useState([]);

  const [
    requests,
    setRequests,
  ] = useState([]);

  const [
    plans,
    setPlans,
  ] = useState([]);

  const [
    selectedPlans,
    setSelectedPlans,
  ] = useState({});

  const [
    search,
    setSearch,
  ] = useState("");

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    busy,
    setBusy,
  ] = useState("");

  const [
    notice,
    setNotice,
  ] = useState("");

  const [
    error,
    setError,
  ] = useState("");

  async function load(
    query = search,
  ) {
    setLoading(true);
    setError("");

    try {
      const result =
        await api(
          "admin-subscriptions",
          {
            search:
              query.trim(),
          },
        );

      setSubscriptions(
        Array.isArray(
          result.subscriptions,
        )
          ? result.subscriptions
          : [],
      );

      setRequests(
        Array.isArray(
          result.requests,
        )
          ? result.requests
          : [],
      );

      setPlans(
        Array.isArray(
          result.plans,
        )
          ? result.plans
          : [],
      );

      setSelectedPlans(
        (current) => {
          const next = {
            ...current,
          };

          for (
            const row
            of result.subscriptions || []
          ) {
            if (!next[row.userId]) {
              next[row.userId] =
                [
                  "starter",
                  "pro",
                  "max",
                ].includes(
                  row.plan,
                )
                  ? row.plan
                  : "starter";
            }
          }

          return next;
        },
      );
    } catch (
      loadError
    ) {
      setError(
        loadError?.message ||
        c.failed,
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load("");
  }, []);

  useEffect(() => {
    const timer =
      window.setTimeout(
        () => {
          void load(search);
        },
        350,
      );

    return () =>
      window.clearTimeout(
        timer,
      );
  }, [search]);

  const planMap =
    useMemo(
      () =>
        new Map(
          plans.map(
            (plan) => [
              plan.plan,
              plan,
            ],
          ),
        ),
      [plans],
    );

  async function change(
    row,
    mode,
  ) {
    if (
      mode === "revoke" &&
      !window.confirm(
        c.confirmRevoke,
      )
    ) {
      return;
    }

    setBusy(
      mode +
        ":" +
        row.userId,
    );
    setError("");
    setNotice("");

    try {
      await api(
        "admin-set-subscription",
        {
          method: "POST",
          body: {
            userId:
              row.userId,
            mode,
            plan:
              selectedPlans[
                row.userId
              ] ||
              "starter",
          },
        },
      );

      setNotice(
        c.updated,
      );

      await load(search);
    } catch (
      actionError
    ) {
      setError(
        actionError?.message ||
        c.failed,
      );
    } finally {
      setBusy("");
    }
  }

  async function approveRequest(
    requestRow,
  ) {
    const activePaid =
      [
        "starter",
        "pro",
        "max",
      ].includes(
        requestRow.currentPlan,
      ) &&
      requestRow.currentStatus ===
        "active" &&
      (
        !requestRow
          .currentExpiresAt ||
        new Date(
          requestRow
            .currentExpiresAt,
        ).getTime() >
          Date.now()
      );

    setBusy(
      "request-approve:" +
        requestRow.id,
    );
    setError("");
    setNotice("");

    try {
      await api(
        "admin-set-subscription",
        {
          method: "POST",
          body: {
            userId:
              requestRow.userId,
            requestId:
              requestRow.id,
            mode:
              activePaid
                ? "extend"
                : "activate",
            plan:
              requestRow.plan,
          },
        },
      );

      setNotice(
        c.requestApproved,
      );
      await load(search);
    } catch (
      actionError
    ) {
      setError(
        actionError?.message ||
          c.failed,
      );
    } finally {
      setBusy("");
    }
  }

  async function rejectRequest(
    requestRow,
  ) {
    if (
      !window.confirm(
        c.confirmReject,
      )
    ) {
      return;
    }

    setBusy(
      "request-reject:" +
        requestRow.id,
    );
    setError("");
    setNotice("");

    try {
      await api(
        "admin-reject-subscription-request",
        {
          method: "POST",
          body: {
            requestId:
              requestRow.id,
          },
        },
      );

      setNotice(
        c.requestRejected,
      );
      await load(search);
    } catch (
      actionError
    ) {
      setError(
        actionError?.message ||
          c.failed,
      );
    } finally {
      setBusy("");
    }
  }

  return (
    <section className="admin-bot-subscriptions-page">
      <div className="admin-bot-subscriptions-shell">
        <header className="admin-bot-subscriptions-header">
          <div>
            <span>
              {c.eyebrow}
            </span>
            <h1>
              {c.title}
            </h1>
            <p>
              {c.intro}
            </p>
          </div>
        </header>

        {notice ? (
          <div className="admin-bot-subscriptions-message success">
            {notice}
          </div>
        ) : null}

        {error ? (
          <div className="admin-bot-subscriptions-message error">
            {error}
          </div>
        ) : null}

        <label className="admin-bot-subscriptions-search">
          <span>⌕</span>
          <input
            value={search}
            onChange={(event) =>
              setSearch(
                event.target.value,
              )
            }
            placeholder={
              c.search
            }
          />
        </label>

        <section className="admin-bot-subscription-requests">
          <header>
            <div>
              <span>
                DISCORD BILLING
              </span>
              <h2>
                {c.requestsTitle}
              </h2>
              <p>
                {c.requestsIntro}
              </p>
            </div>
            <strong>
              {requests.length}
            </strong>
          </header>

          {loading ? (
            <div className="admin-bot-subscriptions-empty">
              {c.loading}
            </div>
          ) : requests.length ? (
            <div className="admin-bot-subscription-request-list">
              {requests.map(
                (requestRow) => (
                  <article
                    key={
                      requestRow.id
                    }
                  >
                    <div className="admin-bot-subscriptions-user">
                      <div className="admin-bot-subscriptions-avatar">
                        {requestRow.discordAvatar ? (
                          <img
                            src={
                              requestRow.discordAvatar
                            }
                            alt=""
                          />
                        ) : (
                          <span>
                            {(requestRow.discordGlobalName ||
                              requestRow.discordUsername ||
                              "?")
                              .slice(0, 2)
                              .toUpperCase()}
                          </span>
                        )}
                      </div>

                      <div>
                        <strong>
                          {requestRow.discordGlobalName ||
                            requestRow.discordUsername ||
                            requestRow.displayName ||
                            "Discord user"}
                        </strong>
                        <small>
                          {"@" +
                            (requestRow.discordUsername ||
                              requestRow.discordUserId)}
                        </small>
                      </div>
                    </div>

                    <div className="admin-bot-subscription-request-plans">
                      <span>
                        {c.requestedPlan}
                        <b>
                          {String(
                            requestRow.plan,
                          ).toUpperCase()}
                        </b>
                      </span>
                      <span>
                        {c.currentPlan}
                        <b>
                          {String(
                            requestRow.currentPlan ||
                              "free",
                          ).toUpperCase()}
                        </b>
                      </span>
                      <span>
                        {c.requestedAt}
                        <b>
                          {formatDate(
                            requestRow.requestedAt,
                            language,
                          )}
                        </b>
                      </span>
                    </div>

                    <div className="admin-bot-subscription-request-actions">
                      <button
                        type="button"
                        onClick={() =>
                          approveRequest(
                            requestRow,
                          )
                        }
                        disabled={
                          Boolean(busy)
                        }
                      >
                        {c.approveRequest}
                      </button>

                      <button
                        type="button"
                        className="danger"
                        onClick={() =>
                          rejectRequest(
                            requestRow,
                          )
                        }
                        disabled={
                          Boolean(busy)
                        }
                      >
                        {c.rejectRequest}
                      </button>
                    </div>
                  </article>
                ),
              )}
            </div>
          ) : (
            <div className="admin-bot-subscriptions-empty">
              {c.noRequests}
            </div>
          )}
        </section>

        {loading ? (
          <div className="admin-bot-subscriptions-empty">
            {c.loading}
          </div>
        ) : subscriptions.length ? (
          <div className="admin-bot-subscriptions-list">
            {subscriptions.map(
              (row) => {
                const internal =
                  row.plan ===
                    "internal" ||
                  row.siteRole ===
                    "owner";

                const activePaid =
                  [
                    "starter",
                    "pro",
                    "max",
                  ].includes(
                    row.plan,
                  ) &&
                  row.status ===
                    "active";

                const selectedPlan =
                  selectedPlans[
                    row.userId
                  ] ||
                  "starter";

                const selectedInfo =
                  planMap.get(
                    selectedPlan,
                  );

                return (
                  <article
                    key={
                      row.userId
                    }
                  >
                    <div className="admin-bot-subscriptions-user">
                      <div className="admin-bot-subscriptions-avatar">
                        {row.discordAvatar ? (
                          <img
                            src={
                              row.discordAvatar
                            }
                            alt=""
                          />
                        ) : (
                          <span>
                            {(row.discordGlobalName ||
                              row.discordUsername ||
                              "?")
                              .slice(
                                0,
                                2,
                              )
                              .toUpperCase()}
                          </span>
                        )}
                      </div>

                      <div>
                        <strong>
                          {row.discordGlobalName ||
                            row.discordUsername}
                        </strong>
                        <small>
                          {"@" +
                            row.discordUsername}
                          {row.displayName
                            ? " · " +
                              row.displayName
                            : ""}
                        </small>
                      </div>
                    </div>

                    <div className="admin-bot-subscriptions-state">
                      <span>
                        {c.plan}:{" "}
                        <b>
                          {row.plan.toUpperCase()}
                        </b>
                      </span>

                      <span>
                        {c.status}:{" "}
                        <b>
                          {row.status}
                        </b>
                      </span>

                      <span>
                        {c.expires}:{" "}
                        <b>
                          {internal
                            ? "∞"
                            : formatDate(
                                row.expiresAt,
                                language,
                              )}
                        </b>
                      </span>

                      <span>
                        {c.role}:{" "}
                        <b>
                          {row.subscriberRoleSynced
                            ? c.synced
                            : c.pending}
                        </b>
                      </span>
                    </div>

                    {internal ? (
                      <div className="admin-bot-subscriptions-protected">
                        {c.protected}
                      </div>
                    ) : (
                      <div className="admin-bot-subscriptions-actions">
                        <select
                          value={
                            selectedPlan
                          }
                          onChange={(event) =>
                            setSelectedPlans(
                              (current) => ({
                                ...current,
                                [row.userId]:
                                  event.target.value,
                              }),
                            )
                          }
                        >
                          {plans.map(
                            (plan) => (
                              <option
                                key={
                                  plan.plan
                                }
                                value={
                                  plan.plan
                                }
                              >
                                {plan.plan.toUpperCase()}
                                {" · $"}
                                {Number(
                                  plan.priceUsd,
                                ).toFixed(2)}
                              </option>
                            ),
                          )}
                        </select>

                        <span className="admin-bot-subscriptions-limit">
                          {selectedInfo
                            ? String(
                                selectedInfo.maxGuilds,
                              ) +
                              " server" +
                              (selectedInfo.maxGuilds === 1
                                ? ""
                                : "s")
                            : ""}
                        </span>

                        <button
                          type="button"
                          onClick={() =>
                            change(
                              row,
                              "activate",
                            )
                          }
                          disabled={
                            Boolean(
                              busy,
                            )
                          }
                        >
                          {c.activate}
                        </button>

                        {activePaid ? (
                          <button
                            type="button"
                            className="secondary"
                            onClick={() =>
                              change(
                                row,
                                "extend",
                              )
                            }
                            disabled={
                              Boolean(
                                busy,
                              )
                            }
                          >
                            {c.extend}
                          </button>
                        ) : null}

                        {activePaid ? (
                          <button
                            type="button"
                            className="danger"
                            onClick={() =>
                              change(
                                row,
                                "revoke",
                              )
                            }
                            disabled={
                              Boolean(
                                busy,
                              )
                            }
                          >
                            {c.revoke}
                          </button>
                        ) : null}
                      </div>
                    )}
                  </article>
                );
              },
            )}
          </div>
        ) : (
          <div className="admin-bot-subscriptions-empty">
            {c.empty}
          </div>
        )}
      </div>
    </section>
  );
}
