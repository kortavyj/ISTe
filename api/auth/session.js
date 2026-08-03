import { randomUUID } from "node:crypto";

import { guardRequest } from "../lib/requestGuard.js";
import {
  clearAuthCookies,
  readAuthCookies,
  setAuthCookies,
} from "../lib/authCookies.js";
import { readJsonBody } from "../lib/requestBody.js";
import { getSupabaseServerClient } from "../lib/supabaseServer.js";

const PROFILE_COLUMNS =
  "id, username, display_name, avatar_url, bio, account_number, created_at, updated_at";

const LEGACY_PROFILE_COLUMNS =
  "id, username, display_name, avatar_url, bio, created_at, updated_at";

const NEWS_COLUMNS =
  "id, title, slug, excerpt, content, cover_url, category, status, is_featured, author_id, updated_by, published_at, created_at, updated_at";

const STAFF_ROLES = new Set([
  "editor",
  "admin",
  "owner",
]);

const MANAGER_ROLES = new Set([
  "admin",
  "owner",
]);

const NEWS_STATUSES = new Set([
  "draft",
  "published",
  "archived",
]);

const IMAGE_BUCKET = "news-images";

const ALLOWED_IMAGE_TYPES = new Map([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
  ["image/gif", "gif"],
]);

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

function sendGuardError(response, guard) {
  if (guard.allow) {
    response.setHeader("Allow", guard.allow);
  }

  return response.status(guard.status).json({
    ok: false,
    error: guard.error,
    message: "Запрос отклонён сервером.",
  });
}

function sendError(
  response,
  status,
  error,
  message,
) {
  return response.status(status).json({
    ok: false,
    error,
    message,
  });
}

function sendGuestSession(response) {
  clearAuthCookies(response);

  return response.status(200).json({
    ok: true,
    authenticated: false,
    user: null,
    profile: null,
    role: "user",
    isBlocked: false,
    blockedReason: "",
  });
}

function normalizeAction(value) {
  return typeof value === "string"
    ? value.trim().toLowerCase()
    : "";
}

function isUuid(value) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}

function getStoragePathFromPublicUrl(value) {
  if (!value) {
    return null;
  }

  const marker =
    `/storage/v1/object/public/${IMAGE_BUCKET}/`;

  const markerIndex = value.indexOf(marker);

  if (markerIndex === -1) {
    return null;
  }

  const encodedPath = value.slice(
    markerIndex + marker.length,
  );

  try {
    return decodeURIComponent(encodedPath);
  } catch {
    return encodedPath;
  }
}

function mapNewsError(error) {
  const source = [
    error?.message,
    error?.details,
    error?.hint,
    error?.code,
  ]
    .filter(Boolean)
    .join(" ");

  if (
    error?.code === "23505" ||
    /news_posts_slug_key|duplicate|unique/i.test(
      source,
    )
  ) {
    return {
      status: 409,
      error: "NEWS_SLUG_TAKEN",
      message:
        "Новость с таким URL адресом уже существует.",
    };
  }

  if (
    /row-level security|permission denied/i.test(
      source,
    )
  ) {
    return {
      status: 403,
      error: "NEWS_PERMISSION_DENIED",
      message:
        "У аккаунта недостаточно прав для этого действия.",
    };
  }

  return {
    status: 502,
    error: "NEWS_OPERATION_FAILED",
    message:
      "Не удалось выполнить операцию с новостью.",
  };
}

async function loadProfile(
  supabase,
  userId,
) {
  const profileQuery = await supabase
    .from("profiles")
    .select(PROFILE_COLUMNS)
    .eq("id", userId)
    .maybeSingle();

  if (!profileQuery.error) {
    return profileQuery.data;
  }

  const source = [
    profileQuery.error?.message,
    profileQuery.error?.details,
  ]
    .filter(Boolean)
    .join(" ");

  if (!source.includes("account_number")) {
    throw profileQuery.error;
  }

  const legacyQuery = await supabase
    .from("profiles")
    .select(LEGACY_PROFILE_COLUMNS)
    .eq("id", userId)
    .maybeSingle();

  if (legacyQuery.error) {
    throw legacyQuery.error;
  }

  return legacyQuery.data
    ? {
        ...legacyQuery.data,
        account_number: null,
      }
    : null;
}

async function establishSession(
  supabase,
  accessToken,
  refreshToken,
) {
  if (accessToken && refreshToken) {
    const sessionResult =
      await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });

    if (
      !sessionResult.error &&
      sessionResult.data?.session &&
      sessionResult.data?.user
    ) {
      return sessionResult;
    }
  }

  if (refreshToken) {
    return supabase.auth.refreshSession({
      refresh_token: refreshToken,
    });
  }

  return {
    data: null,
    error: new Error("AUTH_REQUIRED"),
  };
}

async function getAuthenticatedSession(
  request,
  response,
) {
  const {
    accessToken,
    refreshToken,
  } = readAuthCookies(request);

  if (!refreshToken) {
    clearAuthCookies(response);

    return {
      ok: false,
      status: 401,
      error: "AUTH_REQUIRED",
      message:
        "Нужно повторно войти в аккаунт.",
    };
  }

  const supabase =
    getSupabaseServerClient();

  const {
    data: sessionData,
    error: sessionError,
  } = await establishSession(
    supabase,
    accessToken,
    refreshToken,
  );

  if (
    sessionError ||
    !sessionData?.session ||
    !sessionData?.user
  ) {
    clearAuthCookies(response);

    return {
      ok: false,
      status: 401,
      error: "AUTH_REQUIRED",
      message:
        "Нужно повторно войти в аккаунт.",
    };
  }

  setAuthCookies(
    response,
    sessionData.session,
  );

  return {
    ok: true,
    supabase,
    session: sessionData.session,
    user: sessionData.user,
  };
}

async function loadAccountAccess(
  supabase,
  userId,
) {
  const {
    data: access,
    error: accessError,
  } = await supabase
    .from("user_roles")
    .select(
      "role, is_blocked, blocked_reason",
    )
    .eq("user_id", userId)
    .maybeSingle();

  if (accessError) {
    throw Object.assign(
      new Error(
        "Не удалось проверить состояние аккаунта.",
      ),
      {
        code: "ACCOUNT_CHECK_FAILED",
        status: 502,
        cause: accessError,
      },
    );
  }

  return {
    role: access?.role || "user",
    isBlocked:
      access?.is_blocked === true,
    blockedReason:
      access?.blocked_reason?.trim() || "",
  };
}

async function requireAccount(
  request,
  response,
  {
    staff = false,
    manager = false,
  } = {},
) {
  const auth =
    await getAuthenticatedSession(
      request,
      response,
    );

  if (!auth.ok) {
    return auth;
  }

  const access = await loadAccountAccess(
    auth.supabase,
    auth.user.id,
  );

  if (access.isBlocked) {
    return {
      ok: false,
      status: 403,
      error: "ACCOUNT_BLOCKED",
      message:
        access.blockedReason ||
        "Аккаунт заблокирован.",
    };
  }

  if (
    staff &&
    !STAFF_ROLES.has(access.role)
  ) {
    return {
      ok: false,
      status: 403,
      error: "STAFF_REQUIRED",
      message:
        "Эта операция доступна только редактору, администратору или владельцу.",
    };
  }

  if (
    manager &&
    !MANAGER_ROLES.has(access.role)
  ) {
    return {
      ok: false,
      status: 403,
      error: "ADMIN_REQUIRED",
      message:
        "Эта операция доступна только администратору или владельцу.",
    };
  }

  return {
    ...auth,
    access,
  };
}

function sendAccountError(
  response,
  account,
) {
  return sendError(
    response,
    account.status,
    account.error,
    account.message,
  );
}

function readProfileInput(body) {
  const username =
    typeof body.username === "string"
      ? body.username.trim()
      : "";

  const displayName =
    typeof body.displayName === "string"
      ? body.displayName.trim()
      : "";

  const bio =
    typeof body.bio === "string"
      ? body.bio.trim()
      : "";

  if (
    !/^[A-Za-z0-9_]{3,32}$/.test(
      username,
    )
  ) {
    return {
      ok: false,
      status: 400,
      error: "INVALID_USERNAME",
      message:
        "Никнейм должен содержать от 3 до 32 латинских букв, цифр или символов подчёркивания.",
    };
  }

  if (
    displayName.length < 2 ||
    displayName.length > 60
  ) {
    return {
      ok: false,
      status: 400,
      error: "INVALID_DISPLAY_NAME",
      message:
        "Имя должно содержать от 2 до 60 символов.",
    };
  }

  if (bio.length > 500) {
    return {
      ok: false,
      status: 400,
      error: "BIO_TOO_LONG",
      message:
        "Описание не должно превышать 500 символов.",
    };
  }

  return {
    ok: true,
    username,
    displayName,
    bio,
  };
}

function readSearchInput(body) {
  const digits = String(
    body.accountId ?? "",
  )
    .replace(/\D/g, "")
    .replace(/^0+(?=\d)/, "")
    .slice(0, 18);

  if (!digits || digits === "0") {
    return {
      ok: false,
      status: 400,
      error: "INVALID_ACCOUNT_ID",
      message:
        "Введите корректный ID пользователя.",
    };
  }

  return {
    ok: true,
    accountId: digits,
  };
}

function readNewsInput(body) {
  const postId =
    typeof body.postId === "string"
      ? body.postId.trim()
      : "";

  const title =
    typeof body.title === "string"
      ? body.title.trim()
      : "";

  const slug =
    typeof body.slug === "string"
      ? body.slug
          .trim()
          .toLowerCase()
      : "";

  const excerpt =
    typeof body.excerpt === "string"
      ? body.excerpt.trim()
      : "";

  const content =
    typeof body.content === "string"
      ? body.content.trim()
      : "";

  const category =
    typeof body.category === "string"
      ? body.category.trim()
      : "";

  const coverUrl =
    typeof body.coverUrl === "string"
      ? body.coverUrl.trim()
      : "";

  const originalCoverUrl =
    typeof body.originalCoverUrl ===
    "string"
      ? body.originalCoverUrl.trim()
      : "";

  const status =
    typeof body.status === "string"
      ? body.status
          .trim()
          .toLowerCase()
      : "draft";

  const isFeatured =
    body.isFeatured === true;

  if (postId && !isUuid(postId)) {
    return {
      ok: false,
      status: 400,
      error: "INVALID_NEWS_ID",
      message:
        "Некорректный идентификатор новости.",
    };
  }

  if (
    title.length < 5 ||
    title.length > 160
  ) {
    return {
      ok: false,
      status: 400,
      error: "INVALID_NEWS_TITLE",
      message:
        "Название должно содержать от 5 до 160 символов.",
    };
  }

  if (
    slug.length < 3 ||
    slug.length > 180 ||
    !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(
      slug,
    )
  ) {
    return {
      ok: false,
      status: 400,
      error: "INVALID_NEWS_SLUG",
      message:
        "URL адрес должен содержать латинские буквы, цифры и дефисы.",
    };
  }

  if (
    content.length < 20 ||
    content.length > 100000
  ) {
    return {
      ok: false,
      status: 400,
      error: "INVALID_NEWS_CONTENT",
      message:
        "Полный текст должен содержать от 20 до 100000 символов.",
    };
  }

  if (
    category.length < 2 ||
    category.length > 60
  ) {
    return {
      ok: false,
      status: 400,
      error: "INVALID_NEWS_CATEGORY",
      message:
        "Категория должна содержать от 2 до 60 символов.",
    };
  }

  if (excerpt.length > 320) {
    return {
      ok: false,
      status: 400,
      error: "INVALID_NEWS_EXCERPT",
      message:
        "Краткое описание не должно превышать 320 символов.",
    };
  }

  if (
    coverUrl.length > 1000 ||
    originalCoverUrl.length > 1000
  ) {
    return {
      ok: false,
      status: 400,
      error: "INVALID_COVER_URL",
      message:
        "Ссылка на обложку слишком длинная.",
    };
  }

  for (const value of [
    coverUrl,
    originalCoverUrl,
  ]) {
    if (
      value &&
      !/^https?:\/\//i.test(value)
    ) {
      return {
        ok: false,
        status: 400,
        error: "INVALID_COVER_URL",
        message:
          "Ссылка на обложку должна начинаться с http:// или https://.",
      };
    }
  }

  if (!NEWS_STATUSES.has(status)) {
    return {
      ok: false,
      status: 400,
      error: "INVALID_NEWS_STATUS",
      message:
        "Выбран некорректный статус новости.",
    };
  }

  return {
    ok: true,
    postId,
    title,
    slug,
    excerpt,
    content,
    category,
    coverUrl,
    originalCoverUrl,
    status,
    isFeatured,
  };
}

async function removeStoredImage(
  supabase,
  url,
) {
  const path =
    getStoragePathFromPublicUrl(url);

  if (!path) {
    return;
  }

  const { error } = await supabase.storage
    .from(IMAGE_BUCKET)
    .remove([path]);

  if (error) {
    console.error(
      "News image remove error:",
      error,
    );
  }
}

async function handleGetSession(
  request,
  response,
) {
  const guard = guardRequest(request, {
    methods: ["GET"],
    requireJson: false,
    requireOrigin: false,
  });

  if (!guard.ok) {
    return sendGuardError(
      response,
      guard,
    );
  }

  const { refreshToken } =
    readAuthCookies(request);

  if (!refreshToken) {
    return sendGuestSession(response);
  }

  try {
    const auth =
      await getAuthenticatedSession(
        request,
        response,
      );

    if (!auth.ok) {
      return sendGuestSession(response);
    }

    const access =
      await loadAccountAccess(
        auth.supabase,
        auth.user.id,
      );

    if (access.isBlocked) {
      return response.status(200).json({
        ok: true,
        authenticated: true,
        user: {
          id: auth.user.id,
          email: auth.user.email,
        },
        profile: null,
        role: access.role,
        isBlocked: true,
        blockedReason:
          access.blockedReason,
      });
    }

    const profile = await loadProfile(
      auth.supabase,
      auth.user.id,
    );

    return response.status(200).json({
      ok: true,
      authenticated: true,
      user: {
        id: auth.user.id,
        email: auth.user.email,
      },
      profile,
      role: access.role,
      isBlocked: false,
      blockedReason: "",
    });
  } catch (error) {
    console.error(
      "Unexpected session error:",
      error?.cause || error,
    );

    return sendError(
      response,
      error?.status || 500,
      error?.code ||
        "INTERNAL_SERVER_ERROR",
      error?.message ||
        "Не удалось проверить сессию пользователя.",
    );
  }
}

async function handleProfileUpdate(
  request,
  response,
  body,
) {
  const input =
    readProfileInput(body);

  if (!input.ok) {
    return sendError(
      response,
      input.status,
      input.error,
      input.message,
    );
  }

  try {
    const account =
      await requireAccount(
        request,
        response,
      );

    if (!account.ok) {
      return sendAccountError(
        response,
        account,
      );
    }

    const { error: updateError } =
      await account.supabase
        .from("profiles")
        .update({
          username: input.username,
          display_name:
            input.displayName,
          bio: input.bio || null,
        })
        .eq("id", account.user.id);

    if (updateError) {
      const source = [
        updateError.message,
        updateError.details,
        updateError.hint,
        updateError.code,
      ]
        .filter(Boolean)
        .join(" ");

      if (
        updateError.code === "23505" ||
        /duplicate|unique|username/i.test(
          source,
        )
      ) {
        return sendError(
          response,
          409,
          "USERNAME_TAKEN",
          "Этот никнейм уже занят.",
        );
      }

      console.error(
        "Profile update error:",
        updateError,
      );

      return sendError(
        response,
        502,
        "PROFILE_UPDATE_FAILED",
        "Не удалось сохранить профиль.",
      );
    }

    const profile = await loadProfile(
      account.supabase,
      account.user.id,
    );

    if (!profile) {
      return sendError(
        response,
        404,
        "PROFILE_NOT_FOUND",
        "Профиль пользователя не найден.",
      );
    }

    return response.status(200).json({
      ok: true,
      profile,
    });
  } catch (error) {
    console.error(
      "Unexpected profile update error:",
      error?.cause || error,
    );

    return sendError(
      response,
      error?.status || 500,
      error?.code ||
        "INTERNAL_SERVER_ERROR",
      error?.message ||
        "Произошла серверная ошибка.",
    );
  }
}

async function handleUserSearch(
  request,
  response,
  body,
) {
  const input =
    readSearchInput(body);

  if (!input.ok) {
    return sendError(
      response,
      input.status,
      input.error,
      input.message,
    );
  }

  try {
    const account =
      await requireAccount(
        request,
        response,
      );

    if (!account.ok) {
      return sendAccountError(
        response,
        account,
      );
    }

    const {
      data,
      error,
    } = await account.supabase.rpc(
      "find_profile_by_account_id",
      {
        p_account_id:
          input.accountId,
      },
    );

    if (error) {
      const source = [
        error.message,
        error.details,
        error.hint,
        error.code,
      ]
        .filter(Boolean)
        .join(" ");

      if (
        /find_profile_by_account_id/i.test(
          source,
        ) &&
        /function|schema cache|could not find/i.test(
          source,
        )
      ) {
        return sendError(
          response,
          503,
          "SEARCH_FUNCTION_MISSING",
          "Функция поиска не подключена к базе данных.",
        );
      }

      console.error(
        "User search error:",
        error,
      );

      return sendError(
        response,
        502,
        "USER_SEARCH_FAILED",
        "Не удалось выполнить поиск пользователя.",
      );
    }

    const profile =
      Array.isArray(data)
        ? data[0] ?? null
        : data ?? null;

    return response.status(200).json({
      ok: true,
      profile,
    });
  } catch (error) {
    console.error(
      "Unexpected user search error:",
      error?.cause || error,
    );

    return sendError(
      response,
      error?.status || 500,
      error?.code ||
        "INTERNAL_SERVER_ERROR",
      error?.message ||
        "Произошла серверная ошибка.",
    );
  }
}

async function handleNewsList(
  request,
  response,
) {
  try {
    const account =
      await requireAccount(
        request,
        response,
        { staff: true },
      );

    if (!account.ok) {
      return sendAccountError(
        response,
        account,
      );
    }

    const {
      data,
      error,
    } = await account.supabase
      .from("news_posts")
      .select(NEWS_COLUMNS)
      .order("updated_at", {
        ascending: false,
      });

    if (error) {
      console.error(
        "News list error:",
        error,
      );

      const mapped =
        mapNewsError(error);

      return sendError(
        response,
        mapped.status,
        mapped.error,
        mapped.message,
      );
    }

    return response.status(200).json({
      ok: true,
      posts: Array.isArray(data)
        ? data
        : [],
    });
  } catch (error) {
    console.error(
      "Unexpected news list error:",
      error?.cause || error,
    );

    return sendError(
      response,
      error?.status || 500,
      error?.code ||
        "INTERNAL_SERVER_ERROR",
      error?.message ||
        "Не удалось загрузить новости.",
    );
  }
}

async function handleNewsSave(
  request,
  response,
  body,
) {
  const input = readNewsInput(body);

  if (!input.ok) {
    return sendError(
      response,
      input.status,
      input.error,
      input.message,
    );
  }

  try {
    const account =
      await requireAccount(
        request,
        response,
        { staff: true },
      );

    if (!account.ok) {
      return sendAccountError(
        response,
        account,
      );
    }

    const canManageAll =
      MANAGER_ROLES.has(
        account.access.role,
      );

    const payload = {
      title: input.title,
      slug: input.slug,
      excerpt: input.excerpt,
      content: input.content,
      cover_url:
        input.coverUrl || null,
      category: input.category,
      status: canManageAll
        ? input.status
        : "draft",
      is_featured: canManageAll
        ? input.isFeatured
        : false,
      updated_by: account.user.id,
    };

    let result;

    if (input.postId) {
      const {
        data: existing,
        error: existingError,
      } = await account.supabase
        .from("news_posts")
        .select(
          "id, author_id, status, cover_url",
        )
        .eq("id", input.postId)
        .maybeSingle();

      if (existingError) {
        const mapped =
          mapNewsError(existingError);

        return sendError(
          response,
          mapped.status,
          mapped.error,
          mapped.message,
        );
      }

      if (!existing) {
        return sendError(
          response,
          404,
          "NEWS_NOT_FOUND",
          "Новость не найдена.",
        );
      }

      if (
        !canManageAll &&
        (
          existing.author_id !==
            account.user.id ||
          existing.status !== "draft"
        )
      ) {
        return sendError(
          response,
          403,
          "NEWS_EDIT_FORBIDDEN",
          "Редактор может изменять только собственные черновики.",
        );
      }

      let updateQuery =
        account.supabase
          .from("news_posts")
          .update(payload)
          .eq("id", input.postId);

      if (!canManageAll) {
        updateQuery = updateQuery
          .eq(
            "author_id",
            account.user.id,
          )
          .eq("status", "draft");
      }

      result = await updateQuery
        .select(NEWS_COLUMNS)
        .maybeSingle();
    } else {
      result = await account.supabase
        .from("news_posts")
        .insert({
          ...payload,
          author_id:
            account.user.id,
        })
        .select(NEWS_COLUMNS)
        .maybeSingle();
    }

    if (result.error) {
      console.error(
        "News save error:",
        result.error,
      );

      const mapped =
        mapNewsError(result.error);

      return sendError(
        response,
        mapped.status,
        mapped.error,
        mapped.message,
      );
    }

    if (!result.data) {
      return sendError(
        response,
        502,
        "NEWS_SAVE_FAILED",
        "Новость не была сохранена.",
      );
    }

    if (
      input.originalCoverUrl &&
      input.originalCoverUrl !==
        input.coverUrl
    ) {
      await removeStoredImage(
        account.supabase,
        input.originalCoverUrl,
      );
    }

    return response.status(200).json({
      ok: true,
      post: result.data,
    });
  } catch (error) {
    console.error(
      "Unexpected news save error:",
      error?.cause || error,
    );

    return sendError(
      response,
      error?.status || 500,
      error?.code ||
        "INTERNAL_SERVER_ERROR",
      error?.message ||
        "Не удалось сохранить новость.",
    );
  }
}

async function handleNewsDelete(
  request,
  response,
  body,
) {
  const postId =
    typeof body.postId === "string"
      ? body.postId.trim()
      : "";

  if (!isUuid(postId)) {
    return sendError(
      response,
      400,
      "INVALID_NEWS_ID",
      "Некорректный идентификатор новости.",
    );
  }

  try {
    const account =
      await requireAccount(
        request,
        response,
        { manager: true },
      );

    if (!account.ok) {
      return sendAccountError(
        response,
        account,
      );
    }

    const {
      data: post,
      error: loadError,
    } = await account.supabase
      .from("news_posts")
      .select("id, cover_url")
      .eq("id", postId)
      .maybeSingle();

    if (loadError) {
      const mapped =
        mapNewsError(loadError);

      return sendError(
        response,
        mapped.status,
        mapped.error,
        mapped.message,
      );
    }

    if (!post) {
      return sendError(
        response,
        404,
        "NEWS_NOT_FOUND",
        "Новость не найдена.",
      );
    }

    const { error: deleteError } =
      await account.supabase
        .from("news_posts")
        .delete()
        .eq("id", postId);

    if (deleteError) {
      console.error(
        "News delete error:",
        deleteError,
      );

      const mapped =
        mapNewsError(deleteError);

      return sendError(
        response,
        mapped.status,
        mapped.error,
        mapped.message,
      );
    }

    await removeStoredImage(
      account.supabase,
      post.cover_url,
    );

    return response.status(200).json({
      ok: true,
      deleted: true,
    });
  } catch (error) {
    console.error(
      "Unexpected news delete error:",
      error?.cause || error,
    );

    return sendError(
      response,
      error?.status || 500,
      error?.code ||
        "INTERNAL_SERVER_ERROR",
      error?.message ||
        "Не удалось удалить новость.",
    );
  }
}

async function handleNewsCreateUpload(
  request,
  response,
  body,
) {
  const fileType =
    typeof body.fileType === "string"
      ? body.fileType.trim().toLowerCase()
      : "";

  const fileSize =
    Number.isFinite(body.fileSize)
      ? body.fileSize
      : Number(body.fileSize);

  const extension =
    ALLOWED_IMAGE_TYPES.get(fileType);

  if (!extension) {
    return sendError(
      response,
      400,
      "INVALID_IMAGE_TYPE",
      "Выбери изображение JPEG, PNG, WEBP или GIF.",
    );
  }

  if (
    !Number.isFinite(fileSize) ||
    fileSize <= 0 ||
    fileSize > MAX_IMAGE_SIZE
  ) {
    return sendError(
      response,
      400,
      "INVALID_IMAGE_SIZE",
      "Размер изображения не должен превышать 5 МБ.",
    );
  }

  try {
    const account =
      await requireAccount(
        request,
        response,
        { staff: true },
      );

    if (!account.ok) {
      return sendAccountError(
        response,
        account,
      );
    }

    const path =
      `${account.user.id}/${randomUUID()}.${extension}`;

    const {
      data,
      error,
    } = await account.supabase.storage
      .from(IMAGE_BUCKET)
      .createSignedUploadUrl(path);

    if (
      error ||
      !data?.token
    ) {
      console.error(
        "News signed upload error:",
        error || data,
      );

      return sendError(
        response,
        502,
        "NEWS_UPLOAD_URL_FAILED",
        "Не удалось подготовить загрузку изображения.",
      );
    }

    const {
      data: publicData,
    } = account.supabase.storage
      .from(IMAGE_BUCKET)
      .getPublicUrl(path);

    if (!publicData?.publicUrl) {
      return sendError(
        response,
        502,
        "NEWS_PUBLIC_URL_FAILED",
        "Не удалось получить адрес изображения.",
      );
    }

    return response.status(200).json({
      ok: true,
      path,
      token: data.token,
      publicUrl: publicData.publicUrl,
    });
  } catch (error) {
    console.error(
      "Unexpected news upload URL error:",
      error?.cause || error,
    );

    return sendError(
      response,
      error?.status || 500,
      error?.code ||
        "INTERNAL_SERVER_ERROR",
      error?.message ||
        "Не удалось подготовить загрузку изображения.",
    );
  }
}

async function handleNewsRemoveUpload(
  request,
  response,
  body,
) {
  const path =
    typeof body.path === "string"
      ? body.path.trim()
      : "";

  try {
    const account =
      await requireAccount(
        request,
        response,
        { staff: true },
      );

    if (!account.ok) {
      return sendAccountError(
        response,
        account,
      );
    }

    if (
      !path ||
      path.length > 500 ||
      !path.startsWith(
        `${account.user.id}/`,
      )
    ) {
      return sendError(
        response,
        400,
        "INVALID_UPLOAD_PATH",
        "Некорректный путь изображения.",
      );
    }

    const { error } =
      await account.supabase.storage
        .from(IMAGE_BUCKET)
        .remove([path]);

    if (error) {
      console.error(
        "News temporary upload remove error:",
        error,
      );

      return sendError(
        response,
        502,
        "NEWS_UPLOAD_REMOVE_FAILED",
        "Не удалось удалить временное изображение.",
      );
    }

    return response.status(200).json({
      ok: true,
      removed: true,
    });
  } catch (error) {
    console.error(
      "Unexpected upload remove error:",
      error?.cause || error,
    );

    return sendError(
      response,
      error?.status || 500,
      error?.code ||
        "INTERNAL_SERVER_ERROR",
      error?.message ||
        "Не удалось удалить временное изображение.",
    );
  }
}

export default async function handler(
  request,
  response,
) {
  response.setHeader(
    "Cache-Control",
    "no-store, private",
  );

  const method = String(
    request.method || "",
  ).toUpperCase();

  if (method === "GET") {
    return handleGetSession(
      request,
      response,
    );
  }

  if (method !== "POST") {
    response.setHeader(
      "Allow",
      "GET, POST",
    );

    return sendError(
      response,
      405,
      "METHOD_NOT_ALLOWED",
      "Этот метод запроса не поддерживается.",
    );
  }

  const guard = guardRequest(request, {
    methods: ["POST"],
    requireJson: true,
    requireOrigin: true,
    maxBodyBytes: 512 * 1024,
  });

  if (!guard.ok) {
    return sendGuardError(
      response,
      guard,
    );
  }

  const body = readJsonBody(request);

  if (!body) {
    return sendError(
      response,
      400,
      "INVALID_JSON",
      "Не удалось прочитать данные запроса.",
    );
  }

  const action =
    normalizeAction(body.action);

  if (action === "find-user") {
    return handleUserSearch(
      request,
      response,
      body,
    );
  }

  if (action === "news-list") {
    return handleNewsList(
      request,
      response,
    );
  }

  if (action === "news-save") {
    return handleNewsSave(
      request,
      response,
      body,
    );
  }

  if (action === "news-delete") {
    return handleNewsDelete(
      request,
      response,
      body,
    );
  }

  if (
    action ===
    "news-create-upload"
  ) {
    return handleNewsCreateUpload(
      request,
      response,
      body,
    );
  }

  if (
    action ===
    "news-remove-upload"
  ) {
    return handleNewsRemoveUpload(
      request,
      response,
      body,
    );
  }

  return handleProfileUpdate(
    request,
    response,
    body,
  );
}
