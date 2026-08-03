async function readJson(response) {
  try {
    return await response.json();
  } catch {
    return {
      ok: false,
      error: "INVALID_SERVER_RESPONSE",
      message:
        "Сервер вернул некорректный ответ.",
    };
  }
}

async function request(
  action,
  options = {},
  queryParameters = {},
) {
  const query = new URLSearchParams({
    action,
    ...queryParameters,
  });

  const response = await fetch(
    `/api/owner?${query.toString()}`,
    {
      credentials: "include",
      cache: "no-store",
      ...options,

      headers: {
        Accept: "application/json",

        ...(options.body
          ? {
              "Content-Type":
                "application/json",
            }
          : {}),

        ...(options.headers || {}),
      },
    },
  );

  const result =
    await readJson(response);

  if (
    !response.ok ||
    result?.ok !== true
  ) {
    const error = new Error(
      result?.message ||
        "Не удалось выполнить операцию.",
    );

    error.code =
      result?.error ||
      "REQUEST_FAILED";

    throw error;
  }

  return result;
}

export async function loadOwnerUsers(
  search = "",
) {
  const result = await request(
    "users",
    {},
    {
      search,
    },
  );

  return Array.isArray(result.users)
    ? result.users
    : [];
}

export async function loadOwnerAudit() {
  const result = await request("audit");

  return Array.isArray(result.audit)
    ? result.audit
    : [];
}

export async function updateOwnerUserRole(
  userId,
  role,
) {
  return request("update-role", {
    method: "POST",

    body: JSON.stringify({
      userId,
      role,
    }),
  });
}

export async function setOwnerUserBlocked(
  userId,
  isBlocked,
  reason = "",
) {
  return request("set-blocked", {
    method: "POST",

    body: JSON.stringify({
      userId,
      isBlocked,
      reason,
    }),
  });
}
