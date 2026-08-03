import { useCallback, useEffect, useMemo, useState } from "react";

import { useAuth } from "../auth/AuthContext.jsx";

import "./Auth.css";
import "./OwnerUsers.css";

const ROLE_NAMES = Object.freeze({
  user: "Пользователь",
  editor: "Редактор",
  admin: "Администратор",
  owner: "Владелец",
});

const ROLE_OPTIONS = Object.freeze([
  { value: "user", label: "Пользователь" },
  { value: "editor", label: "Редактор" },
  { value: "admin", label: "Администратор" },
]);

const ACTION_NAMES = Object.freeze({
  role_changed: "Изменение роли",
  user_blocked: "Блокировка пользователя",
  user_unblocked: "Разблокировка пользователя",
  assign_owner: "Назначение владельца",
});

const ERROR_MESSAGES = Object.freeze({
  AUTH_REQUIRED: "Нужно повторно войти в аккаунт.",
  OWNER_REQUIRED: "Эта операция доступна только владельцу.",
  ACCOUNT_BLOCKED: "Этот аккаунт заблокирован.",
  ACCOUNT_CHECK_FAILED: "Не удалось проверить права аккаунта.",
  TARGET_REQUIRED: "Пользователь не выбран.",
  CANNOT_CHANGE_OWN_ROLE: "Нельзя изменить собственную роль.",
  CANNOT_CHANGE_OWNER: "Нельзя изменить роль владельца.",
  INVALID_ROLE: "Выбрана недопустимая роль.",
  INVALID_BLOCK_STATE: "Некорректное состояние блокировки.",
  INVALID_REASON: "Причина блокировки слишком длинная.",
  USER_ROLE_NOT_FOUND: "Роль пользователя не найдена.",
  CANNOT_BLOCK_SELF: "Нельзя заблокировать собственный аккаунт.",
  CANNOT_BLOCK_OWNER: "Нельзя заблокировать владельца.",
  OWNER_OPERATION_FAILED: "Не удалось выполнить операцию.",
  INTERNAL_SERVER_ERROR: "Произошла серверная ошибка.",
  INVALID_SERVER_RESPONSE: "Сервер вернул некорректный ответ.",
});

function createApiError(result, fallbackMessage) {
  const error = new Error(
    result?.message || fallbackMessage,
  );

  error.code =
    result?.error || "REQUEST_FAILED";

  error.details =
    result?.details || "";

  return error;
}

async function apiRequest(
  url,
  {
    method = "GET",
    body,
  } = {},
) {
  const hasBody = body !== undefined;

  const response = await fetch(url, {
    method,
    credentials: "include",
    cache: "no-store",

    headers: {
      Accept: "application/json",
      ...(hasBody
        ? {
            "Content-Type":
              "application/json",
          }
        : {}),
    },

    ...(hasBody
      ? {
          body: JSON.stringify(body),
        }
      : {}),
  });

  let result;

  try {
    result = await response.json();
  } catch {
    throw createApiError(
      {
        error: "INVALID_SERVER_RESPONSE",
        message:
          "Сервер вернул некорректный ответ.",
      },
      "Сервер вернул некорректный ответ.",
    );
  }

  if (
    !response.ok ||
    result?.ok !== true
  ) {
    throw createApiError(
      result,
      "Не удалось выполнить запрос.",
    );
  }

  return result;
}

function getErrorMessage(error) {
  const source = [
    error?.message,
    error?.details,
    error?.hint,
    error?.code,
  ]
    .filter(Boolean)
    .join(" ");

  const knownCode = Object.keys(
    ERROR_MESSAGES,
  ).find((code) =>
    source.includes(code),
  );

  return knownCode
    ? ERROR_MESSAGES[knownCode]
    : error?.message ||
        "Не удалось выполнить операцию.";
}

function formatDate(value, withTime = false) {
  if (!value) {
    return "Нет данных";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Нет данных";
  }

  return new Intl.DateTimeFormat(
    "ru-RU",
    {
      day: "2-digit",
      month: "long",
      year: "numeric",

      ...(withTime
        ? {
            hour: "2-digit",
            minute: "2-digit",
          }
        : {}),
    },
  ).format(date);
}

function getInitials(user) {
  const source =
    user?.display_name ||
    user?.username ||
    user?.email ||
    "ISTe";

  return source
    .trim()
    .slice(0, 2)
    .toUpperCase();
}

function getUserTitle(user) {
  return (
    user?.display_name ||
    user?.username ||
    "Пользователь ISTe"
  );
}

function getAuditPerson(
  email,
  username,
) {
  return (
    username ||
    email ||
    "Неизвестный пользователь"
  );
}

export default function OwnerUsers() {
  const { user: currentUser } =
    useAuth();

  const [activeTab, setActiveTab] =
    useState("users");

  const [
    searchInput,
    setSearchInput,
  ] = useState("");

  const [search, setSearch] =
    useState("");

  const [users, setUsers] =
    useState([]);

  const [auditLog, setAuditLog] =
    useState([]);

  const [
    roleDrafts,
    setRoleDrafts,
  ] = useState({});

  const [
    loadingUsers,
    setLoadingUsers,
  ] = useState(true);

  const [
    loadingAudit,
    setLoadingAudit,
  ] = useState(false);

  const [
    actionUserId,
    setActionUserId,
  ] = useState("");

  const [
    errorMessage,
    setErrorMessage,
  ] = useState("");

  const [
    successMessage,
    setSuccessMessage,
  ] = useState("");

  const [dialog, setDialog] =
    useState(null);

  const [
    blockReason,
    setBlockReason,
  ] = useState("");

  const loadUsers = useCallback(
    async (query = "") => {
      setLoadingUsers(true);
      setErrorMessage("");

      try {
        const result =
          await apiRequest(
            `/api/owner/users?search=${encodeURIComponent(
              query,
            )}`,
          );

        const nextUsers =
          Array.isArray(result.users)
            ? result.users
            : [];

        setUsers(nextUsers);

        setRoleDrafts(
          Object.fromEntries(
            nextUsers.map((item) => [
              item.user_id,
              item.role,
            ]),
          ),
        );
      } catch (error) {
        setUsers([]);
        setRoleDrafts({});
        setErrorMessage(
          getErrorMessage(error),
        );
      } finally {
        setLoadingUsers(false);
      }
    },
    [],
  );

  const loadAudit = useCallback(
    async () => {
      setLoadingAudit(true);
      setErrorMessage("");

      try {
        const result =
          await apiRequest(
            "/api/owner/audit",
          );

        setAuditLog(
          Array.isArray(result.audit)
            ? result.audit
            : [],
        );
      } catch (error) {
        setAuditLog([]);
        setErrorMessage(
          getErrorMessage(error),
        );
      } finally {
        setLoadingAudit(false);
      }
    },
    [],
  );

  useEffect(() => {
    void loadUsers("");
  }, [loadUsers]);

  useEffect(() => {
    if (
      activeTab === "audit" &&
      auditLog.length === 0
    ) {
      void loadAudit();
    }
  }, [
    activeTab,
    auditLog.length,
    loadAudit,
  ]);

  const summary = useMemo(() => {
    return {
      total: users.length,

      admins: users.filter(
        (item) =>
          item.role === "admin",
      ).length,

      editors: users.filter(
        (item) =>
          item.role === "editor",
      ).length,

      blocked: users.filter(
        (item) => item.is_blocked,
      ).length,
    };
  }, [users]);

  function clearMessages() {
    setErrorMessage("");
    setSuccessMessage("");
  }

  function handleSearch(event) {
    event.preventDefault();

    const nextSearch =
      searchInput.trim();

    clearMessages();
    setSearch(nextSearch);

    void loadUsers(nextSearch);
  }

  function resetSearch() {
    setSearchInput("");
    setSearch("");

    clearMessages();
    void loadUsers("");
  }

  function changeRoleDraft(
    userId,
    role,
  ) {
    setRoleDrafts((current) => ({
      ...current,
      [userId]: role,
    }));
  }

  function openRoleDialog(
    targetUser,
  ) {
    const nextRole =
      roleDrafts[
        targetUser.user_id
      ];

    if (
      !nextRole ||
      nextRole === targetUser.role
    ) {
      setErrorMessage(
        "Сначала выбери новую роль.",
      );

      setSuccessMessage("");
      return;
    }

    setBlockReason("");

    setDialog({
      type: "role",
      user: targetUser,
      nextRole,
    });
  }

  function openBlockDialog(
    targetUser,
  ) {
    setBlockReason("");

    setDialog({
      type: targetUser.is_blocked
        ? "unblock"
        : "block",

      user: targetUser,
    });
  }

  function closeDialog() {
    if (actionUserId) {
      return;
    }

    setDialog(null);
    setBlockReason("");
  }

  async function confirmDialog() {
    if (!dialog?.user) {
      return;
    }

    const targetUser = dialog.user;

    setActionUserId(
      targetUser.user_id,
    );

    clearMessages();

    try {
      if (dialog.type === "role") {
        await apiRequest(
          "/api/owner/update-role",
          {
            method: "POST",

            body: {
              userId:
                targetUser.user_id,

              role:
                dialog.nextRole,
            },
          },
        );

        setSuccessMessage(
          `${getUserTitle(
            targetUser,
          )}: назначена роль «${
            ROLE_NAMES[
              dialog.nextRole
            ]
          }».`,
        );
      } else {
        const nextBlocked =
          dialog.type === "block";

        await apiRequest(
          "/api/owner/set-blocked",
          {
            method: "POST",

            body: {
              userId:
                targetUser.user_id,

              isBlocked:
                nextBlocked,

              reason:
                nextBlocked
                  ? blockReason.trim()
                  : "",
            },
          },
        );

        setSuccessMessage(
          nextBlocked
            ? `${getUserTitle(
                targetUser,
              )}: аккаунт заблокирован.`
            : `${getUserTitle(
                targetUser,
              )}: аккаунт разблокирован.`,
        );
      }

      setDialog(null);
      setBlockReason("");

      await loadUsers(search);

      if (activeTab === "audit") {
        await loadAudit();
      } else {
        setAuditLog([]);
      }
    } catch (error) {
      setErrorMessage(
        getErrorMessage(error),
      );
    } finally {
      setActionUserId("");
    }
  }

  function switchTab(nextTab) {
    setActiveTab(nextTab);
    clearMessages();
  }

  return (
    <section className="auth-page owner-page">
      <div className="auth-shell owner-shell">
        <header className="auth-heading owner-heading">
          <p className="auth-kicker">
            ISTe control center
          </p>

          <h1>
            Управление пользователями
          </h1>

          <p>
            Назначение администраторов и
            редакторов, блокировка
            аккаунтов и журнал действий
            владельца.
          </p>
        </header>

        <div
          className="owner-tabs"
          role="tablist"
          aria-label="Разделы панели владельца"
        >
          <button
            className={
              activeTab === "users"
                ? "owner-tab owner-tab-active"
                : "owner-tab"
            }
            type="button"
            role="tab"
            aria-selected={
              activeTab === "users"
            }
            onClick={() =>
              switchTab("users")
            }
          >
            Пользователи
          </button>

          <button
            className={
              activeTab === "audit"
                ? "owner-tab owner-tab-active"
                : "owner-tab"
            }
            type="button"
            role="tab"
            aria-selected={
              activeTab === "audit"
            }
            onClick={() =>
              switchTab("audit")
            }
          >
            Журнал действий
          </button>
        </div>

        {(
          errorMessage ||
          successMessage
        ) && (
          <div
            className={`auth-message ${
              errorMessage
                ? "auth-message-error"
                : "auth-message-success"
            } owner-message`}
            role="status"
          >
            {errorMessage ||
              successMessage}
          </div>
        )}

        {activeTab === "users" ? (
          <>
            <div
              className="owner-summary"
              aria-label="Сводка по пользователям"
            >
              <div>
                <strong>
                  {summary.total}
                </strong>

                <span>Найдено</span>
              </div>

              <div>
                <strong>
                  {summary.admins}
                </strong>

                <span>
                  Администраторов
                </span>
              </div>

              <div>
                <strong>
                  {summary.editors}
                </strong>

                <span>
                  Редакторов
                </span>
              </div>

              <div>
                <strong>
                  {summary.blocked}
                </strong>

                <span>
                  Заблокировано
                </span>
              </div>
            </div>

            <form
              className="owner-search"
              onSubmit={handleSearch}
            >
              <label className="owner-search-field">
                <span
                  className="owner-search-icon"
                  aria-hidden="true"
                >
                  ⌕
                </span>

                <input
                  type="search"
                  value={searchInput}
                  onChange={(event) =>
                    setSearchInput(
                      event.target.value,
                    )
                  }
                  placeholder="Поиск по нику, имени или почте"
                  aria-label="Поиск пользователей"
                />
              </label>

              <button
                className="owner-button owner-button-primary"
                type="submit"
              >
                Найти
              </button>

              {search ? (
                <button
                  className="owner-button owner-button-secondary"
                  type="button"
                  onClick={resetSearch}
                >
                  Сбросить
                </button>
              ) : null}
            </form>

            {loadingUsers ? (
              <div className="auth-card auth-card-status owner-loading-card">
                <span
                  className="auth-loader"
                  aria-hidden="true"
                />

                <p>
                  Загружаем
                  пользователей...
                </p>
              </div>
            ) : null}

            {!loadingUsers &&
            users.length === 0 ? (
              <div className="auth-card owner-empty">
                <h2>
                  Пользователи не
                  найдены
                </h2>

                <p>
                  Измени запрос или
                  сбрось поиск.
                </p>
              </div>
            ) : null}

            {!loadingUsers &&
            users.length > 0 ? (
              <div className="owner-user-list">
                {users.map((item) => {
                  const isSelf =
                    item.user_id ===
                    currentUser?.id;

                  const isOwner =
                    item.role ===
                    "owner";

                  const controlsDisabled =
                    isSelf || isOwner;

                  const busy =
                    actionUserId ===
                    item.user_id;

                  return (
                    <article
                      className={`auth-card owner-user-card${
                        item.is_blocked
                          ? " owner-user-card-blocked"
                          : ""
                      }`}
                      key={
                        item.user_id
                      }
                    >
                      <div className="owner-user-main">
                        <div
                          className="owner-user-avatar"
                          aria-hidden="true"
                        >
                          {getInitials(
                            item,
                          )}
                        </div>

                        <div className="owner-user-identity">
                          <div className="owner-user-title-row">
                            <h2>
                              {getUserTitle(
                                item,
                              )}
                            </h2>

                            {isSelf ? (
                              <span className="owner-chip">
                                Вы
                              </span>
                            ) : null}

                            {item.is_blocked ? (
                              <span className="owner-chip owner-chip-danger">
                                Заблокирован
                              </span>
                            ) : null}
                          </div>

                          <p>
                            @
                            {item.username ||
                              "без_ника"}

                            <span aria-hidden="true">
                              •
                            </span>

                            {item.email}
                          </p>

                          <div className="owner-user-meta">
                            <span
                              className={`owner-role owner-role-${item.role}`}
                            >
                              {ROLE_NAMES[
                                item.role
                              ] ||
                                item.role}
                            </span>

                            <span>
                              Регистрация:{" "}
                              {formatDate(
                                item.created_at,
                              )}
                            </span>

                            <span>
                              Последний вход:{" "}
                              {formatDate(
                                item.last_sign_in_at,
                                true,
                              )}
                            </span>
                          </div>

                          {item.is_blocked &&
                          item.blocked_reason ? (
                            <p className="owner-block-reason">
                              Причина:{" "}
                              {
                                item.blocked_reason
                              }
                            </p>
                          ) : null}
                        </div>
                      </div>

                      <div className="owner-user-controls">
                        <label>
                          <span>
                            Роль
                          </span>

                          <select
                            value={
                              roleDrafts[
                                item
                                  .user_id
                              ] ||
                              item.role
                            }
                            onChange={(
                              event,
                            ) =>
                              changeRoleDraft(
                                item.user_id,
                                event.target
                                  .value,
                              )
                            }
                            disabled={
                              controlsDisabled ||
                              busy
                            }
                          >
                            {isOwner ? (
                              <option value="owner">
                                Владелец
                              </option>
                            ) : (
                              ROLE_OPTIONS.map(
                                (
                                  option,
                                ) => (
                                  <option
                                    key={
                                      option.value
                                    }
                                    value={
                                      option.value
                                    }
                                  >
                                    {
                                      option.label
                                    }
                                  </option>
                                ),
                              )
                            )}
                          </select>
                        </label>

                        <button
                          className="owner-button owner-button-primary"
                          type="button"
                          disabled={
                            controlsDisabled ||
                            busy ||
                            roleDrafts[
                              item.user_id
                            ] ===
                              item.role
                          }
                          onClick={() =>
                            openRoleDialog(
                              item,
                            )
                          }
                        >
                          {busy
                            ? "Сохраняем..."
                            : "Сохранить роль"}
                        </button>

                        <button
                          className={`owner-button ${
                            item.is_blocked
                              ? "owner-button-success"
                              : "owner-button-danger"
                          }`}
                          type="button"
                          disabled={
                            controlsDisabled ||
                            busy
                          }
                          onClick={() =>
                            openBlockDialog(
                              item,
                            )
                          }
                        >
                          {item.is_blocked
                            ? "Разблокировать"
                            : "Заблокировать"}
                        </button>

                        {controlsDisabled ? (
                          <small>
                            {isSelf
                              ? "Свою роль и блокировку менять нельзя."
                              : "Аккаунт владельца защищён."}
                          </small>
                        ) : null}
                      </div>
                    </article>
                  );
                })}
              </div>
            ) : null}
          </>
        ) : (
          <div className="owner-audit-section">
            <div className="owner-audit-toolbar">
              <div>
                <h2>
                  Журнал действий
                </h2>

                <p>
                  Последние 100
                  административных
                  операций.
                </p>
              </div>

              <button
                className="owner-button owner-button-secondary"
                type="button"
                onClick={() =>
                  void loadAudit()
                }
                disabled={
                  loadingAudit
                }
              >
                {loadingAudit
                  ? "Обновляем..."
                  : "Обновить"}
              </button>
            </div>

            {loadingAudit ? (
              <div className="auth-card auth-card-status owner-loading-card">
                <span
                  className="auth-loader"
                  aria-hidden="true"
                />

                <p>
                  Загружаем журнал...
                </p>
              </div>
            ) : null}

            {!loadingAudit &&
            auditLog.length === 0 ? (
              <div className="auth-card owner-empty">
                <h2>
                  Журнал пока пуст
                </h2>

                <p>
                  Здесь появятся
                  изменения ролей и
                  блокировки аккаунтов.
                </p>
              </div>
            ) : null}

            {!loadingAudit &&
            auditLog.length > 0 ? (
              <div className="owner-audit-list">
                {auditLog.map(
                  (item) => (
                    <article
                      className="auth-card owner-audit-card"
                      key={item.id}
                    >
                      <div
                        className="owner-audit-icon"
                        aria-hidden="true"
                      >
                        ◆
                      </div>

                      <div>
                        <div className="owner-audit-title">
                          <strong>
                            {ACTION_NAMES[
                              item.action
                            ] ||
                              item.action}
                          </strong>

                          <time
                            dateTime={
                              item.created_at
                            }
                          >
                            {formatDate(
                              item.created_at,
                              true,
                            )}
                          </time>
                        </div>

                        <p>
                          <b>
                            {getAuditPerson(
                              item.actor_email,
                              item.actor_username,
                            )}
                          </b>

                          <span>
                            {" "}
                            изменил аккаунт{" "}
                          </span>

                          <b>
                            {getAuditPerson(
                              item.target_email,
                              item.target_username,
                            )}
                          </b>
                        </p>

                        {item.details &&
                        Object.keys(
                          item.details,
                        ).length > 0 ? (
                          <code>
                            {JSON.stringify(
                              item.details,
                            )}
                          </code>
                        ) : null}
                      </div>
                    </article>
                  ),
                )}
              </div>
            ) : null}
          </div>
        )}
      </div>

      {dialog ? (
        <div
          className="owner-dialog-backdrop"
          role="presentation"
          onMouseDown={closeDialog}
        >
          <div
            className="owner-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="owner-dialog-title"
            onMouseDown={(event) =>
              event.stopPropagation()
            }
          >
            <p className="auth-kicker">
              Подтверждение
            </p>

            <h2 id="owner-dialog-title">
              {dialog.type === "role"
                ? "Изменить роль?"
                : dialog.type ===
                    "block"
                  ? "Заблокировать аккаунт?"
                  : "Разблокировать аккаунт?"}
            </h2>

            <p>
              Пользователь:{" "}
              <strong>
                {getUserTitle(
                  dialog.user,
                )}
              </strong>
            </p>

            {dialog.type ===
            "role" ? (
              <p>
                Новая роль:{" "}

                <strong>
                  {
                    ROLE_NAMES[
                      dialog.nextRole
                    ]
                  }
                </strong>
              </p>
            ) : null}

            {dialog.type ===
            "block" ? (
              <label className="owner-dialog-reason">
                <span>
                  Причина блокировки
                </span>

                <textarea
                  value={blockReason}
                  onChange={(event) =>
                    setBlockReason(
                      event.target.value,
                    )
                  }
                  maxLength={500}
                  placeholder="Например: нарушение правил сообщества"
                  disabled={Boolean(
                    actionUserId,
                  )}
                />

                <small>
                  {blockReason.length}
                  /500
                </small>
              </label>
            ) : null}

            <div className="owner-dialog-actions">
              <button
                className="owner-button owner-button-secondary"
                type="button"
                onClick={closeDialog}
                disabled={Boolean(
                  actionUserId,
                )}
              >
                Отмена
              </button>

              <button
                className={`owner-button ${
                  dialog.type ===
                  "block"
                    ? "owner-button-danger"
                    : "owner-button-primary"
                }`}
                type="button"
                onClick={() =>
                  void confirmDialog()
                }
                disabled={Boolean(
                  actionUserId,
                )}
              >
                {actionUserId
                  ? "Выполняем..."
                  : "Подтвердить"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
