async function readJson(response) {
  try {
    return await response.json();
  } catch {
    return {
      ok: false,
      error: "INVALID_SERVER_RESPONSE",
      message: "Сервер вернул некорректный ответ.",
    };
  }
}

async function request(path, options = {}) {
  const response = await fetch(path, {
    credentials: "include",
    cache: "no-store",
    ...options,
    headers: {
      Accept: "application/json",
      ...(options.body
        ? { "Content-Type": "application/json" }
        : {}),
      ...(options.headers || {}),
    },
  });

  const result = await readJson(response);

  if (!response.ok || result?.ok !== true) {
    const error = new Error(
      result?.message ||
        "Не удалось выполнить операцию.",
    );

    error.code =
      result?.error || "REQUEST_FAILED";

    throw error;
  }

  return result;
}

export async function loadOwnerUsers(
  search = "",
) {
  const query = new URLSearchParams({
    search,
    limit: "100",
    offset: "0",
  });

  const result = await request(
    `/api/owner/users?${query.toString()}`,
  );

  return Array.isArray(result.users)
    ? result.users
    : [];
}

export async function loadOwnerAudit() {
  const query = new URLSearchParams({
    limit: "100",
    offset: "0",
  });

  const result = await request(
    `/api/owner/audit?${query.toString()}`,
  );

  return Array.isArray(result.items)
    ? result.items
    : [];
}

export async function updateOwnerUserRole(
  userId,
  role,
) {
  return request("/api/owner/update-role", {
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
  return request("/api/owner/set-blocked", {
    method: "POST",
    body: JSON.stringify({
      userId,
      isBlocked,
      reason,
    }),
  });
}
