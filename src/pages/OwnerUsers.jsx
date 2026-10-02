import { useCallback, useEffect, useMemo, useState } from "react";

import { useAuth } from "../auth/AuthContext.jsx";
import { useLanguage } from "../i18n/LanguageContext.jsx";

import "./Auth.css";
import "./OwnerUsers.css";

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

function getErrorMessage(error, t) {
  const source = [
    error?.message,
    error?.details,
    error?.hint,
    error?.code,
  ]
    .filter(Boolean)
    .join(" ");

  const codes = [
    "AUTH_REQUIRED",
    "OWNER_REQUIRED",
    "ACCOUNT_BLOCKED",
    "ACCOUNT_CHECK_FAILED",
    "TARGET_REQUIRED",
    "CANNOT_CHANGE_OWN_ROLE",
    "CANNOT_CHANGE_OWNER",
    "INVALID_ROLE",
    "INVALID_BLOCK_STATE",
    "INVALID_REASON",
    "USER_ROLE_NOT_FOUND",
    "CANNOT_BLOCK_SELF",
    "CANNOT_BLOCK_OWNER",
    "OWNER_OPERATION_FAILED",
    "INTERNAL_SERVER_ERROR",
    "INVALID_SERVER_RESPONSE",
    "REQUEST_FAILED",
  ];

  const knownCode = codes.find((code) =>
    source.includes(code),
  );

  return knownCode
    ? t(`ownerUsers.errors.${knownCode}`)
    : error?.message ||
        t("ownerUsers.errors.OWNER_OPERATION_FAILED");
}

function formatDate(
  value,
  language,
  emptyLabel,
  withTime = false,
) {
  if (!value) {
    return emptyLabel;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return emptyLabel;
  }

  return new Intl.DateTimeFormat(
    language === "en" ? "en-US" : "uk-UA",
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

function getUserTitle(user, fallback) {
  return (
    user?.display_name ||
    user?.username ||
    fallback
  );
}

function getAuditPerson(
  email,
  username,
  fallback,
) {
  return (
    username ||
    email ||
    fallback
  );
}

export default function OwnerUsers() {
  const { user: currentUser } =
    useAuth();
  const { language, t } = useLanguage();

  const roleNames = {
    user: t("roles.user"),
    editor: t("roles.editor"),
    game_manager: t("roles.game_manager"),
    admin: t("roles.admin"),
    owner: t("roles.owner"),
  };

  const roleOptions = [
    { value: "user", label: roleNames.user },
    { value: "editor", label: roleNames.editor },
    {
      value: "game_manager",
      label: roleNames.game_manager,
    },
    { value: "admin", label: roleNames.admin },
  ];

  const actionNames = {
    role_changed: t("ownerUsers.actions.role_changed"),
    user_blocked: t("ownerUsers.actions.user_blocked"),
    user_unblocked: t("ownerUsers.actions.user_unblocked"),
    assign_owner: t("ownerUsers.actions.assign_owner"),
  };

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
          getErrorMessage(error, t),
        );
      } finally {
        setLoadingUsers(false);
      }
    },
    [t],
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
          getErrorMessage(error, t),
        );
      } finally {
        setLoadingAudit(false);
      }
    },
    [t],
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

      gameManagers: users.filter(
        (item) =>
          item.role === "game_manager",
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
        t("ownerUsers.selectNewRole"),
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
          t("ownerUsers.roleAssigned", {
            name: getUserTitle(
              targetUser,
              t("accountPage.memberFallback"),
            ),
            role: roleNames[dialog.nextRole] || dialog.nextRole,
          }),
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
            ? t("ownerUsers.accountBlocked", {
              name: getUserTitle(
                targetUser,
                t("accountPage.memberFallback"),
              ),
            })
            : t("ownerUsers.accountUnblocked", {
              name: getUserTitle(
                targetUser,
                t("accountPage.memberFallback"),
              ),
            }),
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
        getErrorMessage(error, t),
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
          <p className="auth-kicker">{t("ownerUsers.kicker")}</p>

          <h1>{t("ownerUsers.title")}</h1>

          <p>{t("ownerUsers.description")}</p>
        </header>

        <div
          className="owner-tabs"
          role="tablist"
          aria-label={t("ownerUsers.tabsAria")}
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
          >\n            {t("ownerUsers.usersTab")}\n          </button>

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
          >\n            {t("ownerUsers.auditTab")}\n          </button>
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
              aria-label={t("ownerUsers.summaryAria")}
            >
              <div>
                <strong>
                  {summary.total}
                </strong>

                <span>{t("ownerUsers.found")}</span>
              </div>

              <div>
                <strong>
                  {summary.admins}
                </strong>

                <span>{t("ownerUsers.admins")}</span>
              </div>

              <div>
                <strong>
                  {summary.editors}
                </strong>

                <span>{t("ownerUsers.editors")}</span>
              </div>

              <div>
                <strong>
                  {summary.gameManagers}
                </strong>

                <span>{t("ownerUsers.gameManagers")}</span>
              </div>

              <div>
                <strong>
                  {summary.blocked}
                </strong>

                <span>{t("ownerUsers.blocked")}</span>
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
                  placeholder={t("ownerUsers.searchPlaceholder")}
                  aria-label={t("ownerUsers.searchAria")}
                />
              </label>

              <button
                className="owner-button owner-button-primary"
                type="submit"
              >\n                {t("ownerUsers.search")}\n              </button>

              {search ? (
                <button
                  className="owner-button owner-button-secondary"
                  type="button"
                  onClick={resetSearch}
                >\n                  {t("ownerUsers.reset")}\n                </button>
              ) : null}
            </form>

            {loadingUsers ? (
              <div className="auth-card auth-card-status owner-loading-card">
                <span
                  className="auth-loader"
                  aria-hidden="true"
                />

                <p>{t("ownerUsers.loadingUsers")}</p>
              </div>
            ) : null}

            {!loadingUsers &&
            users.length === 0 ? (
              <div className="auth-card owner-empty">
                <h2>{t("ownerUsers.noUsersTitle")}</h2>

                <p>{t("ownerUsers.noUsersText")}</p>
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
                                t("accountPage.memberFallback"),
                              )}
                            </h2>

                            {isSelf ? (
                              <span className="owner-chip">\n                                {t("ownerUsers.you")}\n                              </span>
                            ) : null}

                            {item.is_blocked ? (
                              <span className="owner-chip owner-chip-danger">\n                                {t("ownerUsers.blockedChip")}\n                              </span>
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
                              {roleNames[
                                item.role
                              ] ||
                                item.role}
                            </span>

                            <span>
                              Регистрация:{" "}
                              {formatDate(
                                item.created_at,
                                language,
                                t("ownerUsers.noData"),
                              )}
                            </span>

                            <span>
                              Последний вход:{" "}
                              {formatDate(
                                item.last_sign_in_at,
                                language,
                                t("ownerUsers.noData"),
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
                          <span>{t("ownerUsers.role")}</span>

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
                              roleOptions.map(
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
                            ? t("ownerUsers.saving")\n                            : t("ownerUsers.saveRole")}
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
                            ? t("ownerUsers.unblock")\n                            : t("ownerUsers.block")}
                        </button>

                        {controlsDisabled ? (
                          <small>
                            {isSelf
                              ? "{t("ownerUsers.selfProtected")}"
                              : "{t("ownerUsers.ownerProtected")}"}
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
                <h2>{t("ownerUsers.auditTitle")}</h2>

                <p>{t("ownerUsers.auditDescription")}</p>
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
                  ? t("ownerUsers.refreshing")\n                  : t("ownerUsers.refresh")}
              </button>
            </div>

            {loadingAudit ? (
              <div className="auth-card auth-card-status owner-loading-card">
                <span
                  className="auth-loader"
                  aria-hidden="true"
                />

                <p>{t("ownerUsers.loadingAudit")}</p>
              </div>
            ) : null}

            {!loadingAudit &&
            auditLog.length === 0 ? (
              <div className="auth-card owner-empty">
                <h2>{t("ownerUsers.emptyAuditTitle")}</h2>

                <p>{t("ownerUsers.emptyAuditText")}</p>
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
                            {actionNames[
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
                              language,
                              t("ownerUsers.noData"),
                              true,
                            )}
                          </time>
                        </div>

                        <p>
                          <b>
                            {getAuditPerson(
                              item.actor_email,
                              item.actor_username,
                              t("ownerUsers.unknownUser"),
                            )}
                          </b>

                          <span>
                            {" "}
                            {language === "en"
                              ? "changed account"
                              : "змінив акаунт"}
                            {" "}
                          </span>

                          <b>
                            {getAuditPerson(
                              item.target_email,
                              item.target_username,
                              t("ownerUsers.unknownUser"),
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
            <p className="auth-kicker">{t("ownerUsers.confirmation")}</p>

            <h2 id="owner-dialog-title">
              {dialog.type === "role"
                ? t("ownerUsers.changeRoleTitle")
                : dialog.type ===
                    "block"
                  ? t("ownerUsers.blockTitle")
                  : t("ownerUsers.unblockTitle")}
            </h2>

            <p>
              {t("accountPage.memberFallback")}:{" "}
              <strong>
                {getUserTitle(
                  dialog.user,
                  t("accountPage.memberFallback"),
                )}
              </strong>
            </p>

            {dialog.type ===
            "role" ? (
              <p>
                {t("ownerUsers.newRole")}{" "}

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
                <span>{t("ownerUsers.blockReason")}</span>

                <textarea
                  value={blockReason}
                  onChange={(event) =>
                    setBlockReason(
                      event.target.value,
                    )
                  }
                  maxLength={500}
                  placeholder={t("ownerUsers.blockReasonPlaceholder")}
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
              >\n                {t("ownerUsers.cancel")}\n              </button>

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
                  ? t("ownerUsers.processing")\n                  : t("ownerUsers.confirm")}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
