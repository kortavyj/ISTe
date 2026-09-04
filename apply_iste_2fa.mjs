import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const transforms = {"api/lib/authCookies.js": {"marker": "__Host-iste_mfa_access", "replacements": [{"old": "const LEGACY_REFRESH_COOKIE_NAME = \"iste_refresh\";\n\nconst DEFAULT_ACCESS_AGE = 60 * 60;\nconst REFRESH_AGE = 60 * 60 * 24 * 30;\n", "new": "const LEGACY_REFRESH_COOKIE_NAME = \"iste_refresh\";\nconst PENDING_ACCESS_COOKIE_NAME = \"__Host-iste_mfa_access\";\nconst PENDING_REFRESH_COOKIE_NAME = \"__Host-iste_mfa_refresh\";\n\nconst DEFAULT_ACCESS_AGE = 60 * 60;\nconst REFRESH_AGE = 60 * 60 * 24 * 30;\nconst MFA_PENDING_AGE = 15 * 60;\n"}, {"old": "function clearCookie(name) {\n  return createCookie(name, \"\", 0);\n}\n\nexport function readAuthCookies(request) {\n", "new": "function clearCookie(name) {\n  return createCookie(name, \"\", 0);\n}\n\nfunction appendSetCookies(response, cookies) {\n  const current =\n    response.getHeader(\"Set-Cookie\");\n\n  const existing = Array.isArray(current)\n    ? current\n    : current\n      ? [current]\n      : [];\n\n  response.setHeader(\"Set-Cookie\", [\n    ...existing,\n    ...cookies,\n  ]);\n}\n\nexport function readAuthCookies(request) {\n"}, {"old": "export function setAuthCookies(response, session) {\n", "new": "export function readPendingMfaCookies(request) {\n  const cookies = parseCookies(\n    request.headers?.cookie || \"\",\n  );\n\n  return {\n    accessToken:\n      cookies[PENDING_ACCESS_COOKIE_NAME] || \"\",\n    refreshToken:\n      cookies[PENDING_REFRESH_COOKIE_NAME] || \"\",\n  };\n}\n\nexport function setAuthCookies(response, session) {\n"}, {"old": "  response.setHeader(\"Set-Cookie\", [\n    createCookie(ACCESS_COOKIE_NAME, accessToken, accessAge),\n    createCookie(REFRESH_COOKIE_NAME, refreshToken, REFRESH_AGE),\n    clearCookie(LEGACY_ACCESS_COOKIE_NAME),\n    clearCookie(LEGACY_REFRESH_COOKIE_NAME),\n  ]);\n\n  response.setHeader(\"Cache-Control\", \"no-store, private\");\n}\n\nexport function clearAuthCookies(response) {\n", "new": "  appendSetCookies(response, [\n    createCookie(ACCESS_COOKIE_NAME, accessToken, accessAge),\n    createCookie(REFRESH_COOKIE_NAME, refreshToken, REFRESH_AGE),\n    clearCookie(LEGACY_ACCESS_COOKIE_NAME),\n    clearCookie(LEGACY_REFRESH_COOKIE_NAME),\n    clearCookie(PENDING_ACCESS_COOKIE_NAME),\n    clearCookie(PENDING_REFRESH_COOKIE_NAME),\n  ]);\n\n  response.setHeader(\"Cache-Control\", \"no-store, private\");\n}\n\nexport function setPendingMfaCookies(\n  response,\n  session,\n) {\n  const accessToken =\n    typeof session?.access_token === \"string\"\n      ? session.access_token\n      : \"\";\n\n  const refreshToken =\n    typeof session?.refresh_token === \"string\"\n      ? session.refresh_token\n      : \"\";\n\n  if (!accessToken || !refreshToken) {\n    throw new Error(\n      \"Pending MFA session is incomplete.\",\n    );\n  }\n\n  const accessAge =\n    Number.isFinite(session.expires_in) &&\n    session.expires_in > 0\n      ? Math.min(\n          session.expires_in,\n          MFA_PENDING_AGE,\n        )\n      : MFA_PENDING_AGE;\n\n  appendSetCookies(response, [\n    createCookie(\n      PENDING_ACCESS_COOKIE_NAME,\n      accessToken,\n      accessAge,\n    ),\n    createCookie(\n      PENDING_REFRESH_COOKIE_NAME,\n      refreshToken,\n      MFA_PENDING_AGE,\n    ),\n    clearCookie(ACCESS_COOKIE_NAME),\n    clearCookie(REFRESH_COOKIE_NAME),\n    clearCookie(LEGACY_ACCESS_COOKIE_NAME),\n    clearCookie(LEGACY_REFRESH_COOKIE_NAME),\n  ]);\n\n  response.setHeader(\n    \"Cache-Control\",\n    \"no-store, private\",\n  );\n}\n\nexport function clearPendingMfaCookies(response) {\n  appendSetCookies(response, [\n    clearCookie(PENDING_ACCESS_COOKIE_NAME),\n    clearCookie(PENDING_REFRESH_COOKIE_NAME),\n  ]);\n\n  response.setHeader(\n    \"Cache-Control\",\n    \"no-store, private\",\n  );\n}\n\nexport function clearAuthCookies(response) {\n"}, {"old": "  response.setHeader(\"Set-Cookie\", [\n    clearCookie(ACCESS_COOKIE_NAME),\n    clearCookie(REFRESH_COOKIE_NAME),\n    clearCookie(LEGACY_ACCESS_COOKIE_NAME),\n    clearCookie(LEGACY_REFRESH_COOKIE_NAME),\n  ]);\n\n  response.setHeader(\"Cache-Control\", \"no-store, private\");\n}\n", "new": "  appendSetCookies(response, [\n    clearCookie(ACCESS_COOKIE_NAME),\n    clearCookie(REFRESH_COOKIE_NAME),\n    clearCookie(LEGACY_ACCESS_COOKIE_NAME),\n    clearCookie(LEGACY_REFRESH_COOKIE_NAME),\n    clearCookie(PENDING_ACCESS_COOKIE_NAME),\n    clearCookie(PENDING_REFRESH_COOKIE_NAME),\n  ]);\n\n  response.setHeader(\"Cache-Control\", \"no-store, private\");\n}\n"}]}, "server/lib/authSecurity.js": {"marker": "enforceMfaRateLimit", "replacements": [{"old": "export async function resetAuthRateLimitBucket(\n", "new": "export async function enforceMfaRateLimit(\n  request,\n  userId,\n) {\n  const context = getAuthSecurityContext(\n    request,\n    userId,\n  );\n\n  const pairHash = digest(\n    `mfa-pair:${context.clientHash}:${context.identityHash}`,\n  );\n\n  const pairBucket =\n    `auth:mfa:pair:${pairHash}`;\n\n  const clientBucket =\n    `auth:mfa:client:${context.clientHash}`;\n\n  const [pair, client] = await Promise.all([\n    consumeBucket(\n      pairBucket,\n      8,\n      10 * 60,\n      15 * 60,\n    ),\n    consumeBucket(\n      clientBucket,\n      30,\n      10 * 60,\n      30 * 60,\n    ),\n  ]);\n\n  return {\n    ...context,\n    pairBucket,\n    allowed:\n      pair.allowed &&\n      client.allowed,\n    retryAfterSeconds: Math.max(\n      pair.retryAfterSeconds,\n      client.retryAfterSeconds,\n    ),\n  };\n}\n\nexport async function resetAuthRateLimitBucket(\n"}]}, "api/auth/login.js": {"marker": "login_mfa_required", "replacements": [{"old": "import {\n  clearAuthCookies,\n  setAuthCookies,\n} from \"../lib/authCookies.js\";\n", "new": "import {\n  clearAuthCookies,\n  setAuthCookies,\n  setPendingMfaCookies,\n} from \"../lib/authCookies.js\";\n"}, {"old": "const emailPattern = /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/;\n", "new": "const emailPattern = /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/;\n\nconst MFA_REQUIRED_ROLES = new Set([\n  \"admin\",\n  \"owner\",\n]);\n"}, {"old": "setAuthCookies(response, data.session);\nawait resetAuthRateLimitBucket(security.pairBucket);\n\nawait recordAuthSecurityEvent({\n  eventType: \"login_success\",\n  userId: data.user.id,\n  identityHash: security.identityHash,\n  clientHash: security.clientHash,\n  metadata: { role: access?.role || \"user\" },\n});\n\nreturn response.status(200).json({\n  ok: true,\n  user: {\n    id: data.user.id,\n    email: data.user.email,\n  },\n  role: access?.role || \"user\",\n});\n", "new": "const role =\n  access?.role || \"user\";\n\nif (MFA_REQUIRED_ROLES.has(role)) {\n  const {\n    data: assurance,\n    error: assuranceError,\n  } =\n    await supabase.auth.mfa\n      .getAuthenticatorAssuranceLevel(\n        data.session.access_token,\n      );\n\n  if (\n    assuranceError ||\n    !assurance\n  ) {\n    clearAuthCookies(response);\n\n    console.error(\n      \"MFA assurance check error:\",\n      assuranceError,\n    );\n\n    await recordAuthSecurityEvent({\n      eventType:\n        \"login_mfa_check_failed\",\n      userId: data.user.id,\n      identityHash:\n        security.identityHash,\n      clientHash:\n        security.clientHash,\n      metadata: { role },\n    });\n\n    return response\n      .status(502)\n      .json({\n        ok: false,\n        error:\n          \"MFA_CHECK_FAILED\",\n        message:\n          \"Не удалось проверить двухфакторную аутентификацию.\",\n      });\n  }\n\n  if (\n    assurance.currentLevel !==\n    \"aal2\"\n  ) {\n    const setupRequired =\n      assurance.nextLevel !==\n      \"aal2\";\n\n    setPendingMfaCookies(\n      response,\n      data.session,\n    );\n\n    await resetAuthRateLimitBucket(\n      security.pairBucket,\n    );\n\n    await recordAuthSecurityEvent({\n      eventType:\n        \"login_mfa_required\",\n      userId: data.user.id,\n      identityHash:\n        security.identityHash,\n      clientHash:\n        security.clientHash,\n      metadata: {\n        role,\n        setupRequired,\n      },\n    });\n\n    return response\n      .status(200)\n      .json({\n        ok: true,\n        mfaRequired: true,\n        mfaSetupRequired:\n          setupRequired,\n        user: {\n          id: data.user.id,\n          email:\n            data.user.email,\n        },\n        role,\n      });\n  }\n}\n\nsetAuthCookies(\n  response,\n  data.session,\n);\n\nawait resetAuthRateLimitBucket(\n  security.pairBucket,\n);\n\nawait recordAuthSecurityEvent({\n  eventType: \"login_success\",\n  userId: data.user.id,\n  identityHash:\n    security.identityHash,\n  clientHash:\n    security.clientHash,\n  metadata: {\n    role,\n    mfa:\n      MFA_REQUIRED_ROLES.has(\n        role,\n      ),\n  },\n});\n\nreturn response.status(200).json({\n  ok: true,\n  mfaRequired: false,\n  user: {\n    id: data.user.id,\n    email: data.user.email,\n  },\n  role,\n});\n"}]}, "api/lib/ownerRequest.js": {"marker": "двухфакторной аутентификации", "replacements": [{"old": "OWNER_REQUIRED:\n  \"Эта операция доступна только владельцу.\",\nACCOUNT_BLOCKED:\n", "new": "OWNER_REQUIRED:\n  \"Эта операция доступна только владельцу.\",\nMFA_REQUIRED:\n  \"Для доступа владельца требуется подтверждение двухфакторной аутентификации.\",\nACCOUNT_BLOCKED:\n"}, {"old": "knownCode === \"OWNER_REQUIRED\" ||\n      knownCode === \"ACCOUNT_BLOCKED\"\n", "new": "knownCode === \"OWNER_REQUIRED\" ||\n      knownCode === \"MFA_REQUIRED\" ||\n      knownCode === \"ACCOUNT_BLOCKED\"\n"}, {"old": "if (access?.role !== \"owner\") {\n  return {\n    ok: false,\n    status: 403,\n    error: \"OWNER_REQUIRED\",\n    message:\n      ERROR_MESSAGES.OWNER_REQUIRED,\n  };\n}\n\nreturn {\n  ok: true,\n  supabase,\n  user,\n  role: \"owner\",\n};\n", "new": "if (access?.role !== \"owner\") {\n  return {\n    ok: false,\n    status: 403,\n    error: \"OWNER_REQUIRED\",\n    message:\n      ERROR_MESSAGES.OWNER_REQUIRED,\n  };\n}\n\nconst {\n  data: assurance,\n  error: assuranceError,\n} =\n  await supabase.auth.mfa\n    .getAuthenticatorAssuranceLevel(\n      sessionData.session\n        .access_token,\n    );\n\nif (\n  assuranceError ||\n  assurance?.currentLevel !==\n    \"aal2\"\n) {\n  clearAuthCookies(response);\n\n  if (assuranceError) {\n    console.error(\n      \"Owner MFA check error:\",\n      assuranceError,\n    );\n  }\n\n  return {\n    ok: false,\n    status:\n      assuranceError\n        ? 502\n        : 403,\n    error:\n      assuranceError\n        ? \"MFA_CHECK_FAILED\"\n        : \"MFA_REQUIRED\",\n    message:\n      assuranceError\n        ? \"Не удалось проверить двухфакторную аутентификацию.\"\n        : ERROR_MESSAGES.MFA_REQUIRED,\n  };\n}\n\nreturn {\n  ok: true,\n  supabase,\n  user,\n  role: \"owner\",\n};\n"}]}, "api/auth/session.js": {"marker": "handleMfaEnroll", "replacements": [{"old": "import {\n  clearAuthCookies,\n  readAuthCookies,\n  setAuthCookies,\n} from \"../lib/authCookies.js\";\n", "new": "import {\n  clearAuthCookies,\n  readAuthCookies,\n  readPendingMfaCookies,\n  setAuthCookies,\n  setPendingMfaCookies,\n} from \"../lib/authCookies.js\";\n"}, {"old": "import { getSupabaseServerClient } from \"../lib/supabaseServer.js\";\n", "new": "import { getSupabaseServerClient } from \"../lib/supabaseServer.js\";\nimport {\n  enforceMfaRateLimit,\n  recordAuthSecurityEvent,\n  resetAuthRateLimitBucket,\n} from \"../../server/lib/authSecurity.js\";\n"}, {"old": "const MANAGER_ROLES = new Set([\n  \"admin\",\n  \"owner\",\n]);\n\nconst NEWS_STATUSES = new Set([\n", "new": "const MANAGER_ROLES = new Set([\n  \"admin\",\n  \"owner\",\n]);\n\nconst MFA_REQUIRED_ROLES = new Set([\n  \"admin\",\n  \"owner\",\n]);\n\nconst NEWS_STATUSES = new Set([\n"}, {"old": "async function getAuthenticatedSession(\n", "new": "async function checkPrivilegedMfa(\n  supabase,\n  session,\n  role,\n) {\n  if (!MFA_REQUIRED_ROLES.has(role)) {\n    return { ok: true };\n  }\n\n  const {\n    data: assurance,\n    error: assuranceError,\n  } =\n    await supabase.auth.mfa\n      .getAuthenticatorAssuranceLevel(\n        session.access_token,\n      );\n\n  if (assuranceError) {\n    console.error(\n      \"MFA assurance check error:\",\n      assuranceError,\n    );\n\n    return {\n      ok: false,\n      status: 502,\n      error: \"MFA_CHECK_FAILED\",\n      message:\n        \"Не удалось проверить двухфакторную аутентификацию.\",\n    };\n  }\n\n  if (\n    assurance?.currentLevel !== \"aal2\"\n  ) {\n    return {\n      ok: false,\n      status: 403,\n      error: \"MFA_REQUIRED\",\n      message:\n        \"Для этого аккаунта требуется подтверждение двухфакторной аутентификации.\",\n    };\n  }\n\n  return { ok: true };\n}\n\nasync function getPendingMfaAccount(\n  request,\n  response,\n) {\n  const {\n    accessToken,\n    refreshToken,\n  } = readPendingMfaCookies(request);\n\n  if (!refreshToken) {\n    clearAuthCookies(response);\n\n    return {\n      ok: false,\n      status: 401,\n      error: \"MFA_SESSION_REQUIRED\",\n      message:\n        \"Сессия двухфакторной аутентификации истекла. Войдите снова.\",\n    };\n  }\n\n  const supabase =\n    getSupabaseServerClient();\n\n  const {\n    data: sessionData,\n    error: sessionError,\n  } = await establishSession(\n    supabase,\n    accessToken,\n    refreshToken,\n  );\n\n  if (\n    sessionError ||\n    !sessionData?.session ||\n    !sessionData?.user\n  ) {\n    clearAuthCookies(response);\n\n    return {\n      ok: false,\n      status: 401,\n      error: \"MFA_SESSION_REQUIRED\",\n      message:\n        \"Сессия двухфакторной аутентификации истекла. Войдите снова.\",\n    };\n  }\n\n  setPendingMfaCookies(\n    response,\n    sessionData.session,\n  );\n\n  const access =\n    await loadAccountAccess(\n      supabase,\n      sessionData.user.id,\n    );\n\n  if (access.isBlocked) {\n    clearAuthCookies(response);\n\n    return {\n      ok: false,\n      status: 403,\n      error: \"ACCOUNT_BLOCKED\",\n      message:\n        access.blockedReason ||\n        \"Аккаунт заблокирован.\",\n    };\n  }\n\n  if (\n    !MFA_REQUIRED_ROLES.has(\n      access.role,\n    )\n  ) {\n    clearAuthCookies(response);\n\n    return {\n      ok: false,\n      status: 403,\n      error: \"MFA_NOT_REQUIRED\",\n      message:\n        \"Для этого аккаунта обязательная двухфакторная аутентификация не требуется.\",\n    };\n  }\n\n  return {\n    ok: true,\n    supabase,\n    session: sessionData.session,\n    user: sessionData.user,\n    access,\n  };\n}\n\nasync function getAuthenticatedSession(\n"}, {"old": "if (\n  staff &&\n  !STAFF_ROLES.has(access.role)\n) {\n", "new": "const mfa =\n  await checkPrivilegedMfa(\n    auth.supabase,\n    auth.session,\n    access.role,\n  );\n\nif (!mfa.ok) {\n  clearAuthCookies(response);\n  return mfa;\n}\n\nif (\n  staff &&\n  !STAFF_ROLES.has(access.role)\n) {\n"}, {"old": "if (access.isBlocked) {\n  return response.status(200).json({\n    ok: true,\n    authenticated: true,\n    user: {\n      id: auth.user.id,\n      email: auth.user.email,\n    },\n    profile: null,\n    role: access.role,\n    isBlocked: true,\n    blockedReason:\n      access.blockedReason,\n  });\n}\n\nconst profile = await loadProfile(\n", "new": "if (access.isBlocked) {\n  return response.status(200).json({\n    ok: true,\n    authenticated: true,\n    user: {\n      id: auth.user.id,\n      email: auth.user.email,\n    },\n    profile: null,\n    role: access.role,\n    isBlocked: true,\n    blockedReason:\n      access.blockedReason,\n  });\n}\n\nconst mfa =\n  await checkPrivilegedMfa(\n    auth.supabase,\n    auth.session,\n    access.role,\n  );\n\nif (!mfa.ok) {\n  clearAuthCookies(response);\n\n  if (\n    mfa.error ===\n    \"MFA_REQUIRED\"\n  ) {\n    return sendGuestSession(\n      response,\n    );\n  }\n\n  return sendError(\n    response,\n    mfa.status,\n    mfa.error,\n    mfa.message,\n  );\n}\n\nconst profile = await loadProfile(\n"}, {"old": "async function handleProfileUpdate(\n", "new": "async function handleMfaEnroll(\n  request,\n  response,\n) {\n  try {\n    const account =\n      await getPendingMfaAccount(\n        request,\n        response,\n      );\n\n    if (!account.ok) {\n      return sendAccountError(\n        response,\n        account,\n      );\n    }\n\n    const {\n      data: assurance,\n      error: assuranceError,\n    } =\n      await account.supabase.auth.mfa\n        .getAuthenticatorAssuranceLevel(\n          account.session.access_token,\n        );\n\n    if (\n      assuranceError ||\n      !assurance\n    ) {\n      console.error(\n        \"MFA enrollment assurance error:\",\n        assuranceError,\n      );\n\n      return sendError(\n        response,\n        502,\n        \"MFA_CHECK_FAILED\",\n        \"Не удалось проверить состояние двухфакторной аутентификации.\",\n      );\n    }\n\n    if (\n      assurance.currentLevel === \"aal2\"\n    ) {\n      setAuthCookies(\n        response,\n        account.session,\n      );\n\n      return response.status(200).json({\n        ok: true,\n        authenticated: true,\n        enrollmentRequired: false,\n        role: account.access.role,\n      });\n    }\n\n    if (\n      assurance.nextLevel === \"aal2\"\n    ) {\n      return response.status(200).json({\n        ok: true,\n        authenticated: false,\n        enrollmentRequired: false,\n        role: account.access.role,\n      });\n    }\n\n    const {\n      data: factors,\n      error: factorsError,\n    } =\n      await account.supabase.auth.mfa\n        .listFactors();\n\n    if (factorsError) {\n      console.error(\n        \"MFA factor list error:\",\n        factorsError,\n      );\n\n      return sendError(\n        response,\n        502,\n        \"MFA_FACTORS_FAILED\",\n        \"Не удалось проверить факторы двухфакторной аутентификации.\",\n      );\n    }\n\n    const unverifiedTotpFactors =\n      Array.isArray(factors?.all)\n        ? factors.all.filter(\n            (factor) =>\n              factor?.factor_type ===\n                \"totp\" &&\n              factor?.status ===\n                \"unverified\",\n          )\n        : [];\n\n    for (\n      const factor of\n      unverifiedTotpFactors\n    ) {\n      const { error: removeError } =\n        await account.supabase.auth.mfa\n          .unenroll({\n            factorId: factor.id,\n          });\n\n      if (removeError) {\n        console.error(\n          \"MFA stale factor remove error:\",\n          removeError,\n        );\n\n        return sendError(\n          response,\n          502,\n          \"MFA_CLEANUP_FAILED\",\n          \"Не удалось подготовить новую настройку двухфакторной аутентификации.\",\n        );\n      }\n    }\n\n    const {\n      data: enrollment,\n      error: enrollmentError,\n    } =\n      await account.supabase.auth.mfa\n        .enroll({\n          factorType: \"totp\",\n          friendlyName:\n            \"ISTe Authenticator\",\n        });\n\n    if (\n      enrollmentError ||\n      !enrollment?.id ||\n      !enrollment?.totp?.qr_code ||\n      !enrollment?.totp?.secret\n    ) {\n      console.error(\n        \"MFA enrollment error:\",\n        enrollmentError ||\n          enrollment,\n      );\n\n      return sendError(\n        response,\n        502,\n        \"MFA_ENROLLMENT_FAILED\",\n        \"Не удалось начать настройку двухфакторной аутентификации.\",\n      );\n    }\n\n    await recordAuthSecurityEvent({\n      eventType:\n        \"mfa_enrollment_started\",\n      userId: account.user.id,\n      metadata: {\n        role: account.access.role,\n        factorType: \"totp\",\n      },\n    });\n\n    return response.status(200).json({\n      ok: true,\n      authenticated: false,\n      enrollmentRequired: true,\n      factorId: enrollment.id,\n      qrCode:\n        enrollment.totp.qr_code,\n      secret:\n        enrollment.totp.secret,\n      role: account.access.role,\n    });\n  } catch (error) {\n    console.error(\n      \"Unexpected MFA enrollment error:\",\n      error?.cause || error,\n    );\n\n    return sendError(\n      response,\n      error?.status || 500,\n      error?.code ||\n        \"INTERNAL_SERVER_ERROR\",\n      error?.message ||\n        \"Не удалось настроить двухфакторную аутентификацию.\",\n    );\n  }\n}\n\nasync function handleMfaVerify(\n  request,\n  response,\n  body,\n) {\n  const code =\n    typeof body.code === \"string\"\n      ? body.code\n          .replace(/\\D/g, \"\")\n          .slice(0, 10)\n      : \"\";\n\n  const requestedFactorId =\n    typeof body.factorId === \"string\"\n      ? body.factorId.trim()\n      : \"\";\n\n  if (\n    code.length < 6 ||\n    code.length > 10\n  ) {\n    return sendError(\n      response,\n      400,\n      \"INVALID_MFA_CODE\",\n      \"Введите код из приложения аутентификатора.\",\n    );\n  }\n\n  if (\n    requestedFactorId &&\n    !isUuid(requestedFactorId)\n  ) {\n    return sendError(\n      response,\n      400,\n      \"INVALID_MFA_FACTOR\",\n      \"Некорректный фактор двухфакторной аутентификации.\",\n    );\n  }\n\n  try {\n    const account =\n      await getPendingMfaAccount(\n        request,\n        response,\n      );\n\n    if (!account.ok) {\n      return sendAccountError(\n        response,\n        account,\n      );\n    }\n\n    let security;\n\n    try {\n      security =\n        await enforceMfaRateLimit(\n          request,\n          account.user.id,\n        );\n    } catch (error) {\n      console.error(\n        \"MFA rate limit error:\",\n        error,\n      );\n\n      clearAuthCookies(response);\n\n      return sendError(\n        response,\n        503,\n        error?.code ||\n          \"AUTH_SECURITY_UNAVAILABLE\",\n        \"Система защиты двухфакторного входа временно недоступна.\",\n      );\n    }\n\n    if (!security.allowed) {\n      const retryAfter = Math.max(\n        1,\n        Math.ceil(\n          security.retryAfterSeconds,\n        ),\n      );\n\n      response.setHeader(\n        \"Retry-After\",\n        String(retryAfter),\n      );\n\n      await recordAuthSecurityEvent({\n        eventType:\n          \"mfa_rate_limited\",\n        userId: account.user.id,\n        identityHash:\n          security.identityHash,\n        clientHash:\n          security.clientHash,\n        metadata: {\n          role: account.access.role,\n          retryAfterSeconds:\n            retryAfter,\n        },\n      });\n\n      return sendError(\n        response,\n        429,\n        \"TOO_MANY_MFA_ATTEMPTS\",\n        \"Слишком много попыток ввода кода. Подождите и повторите позже.\",\n      );\n    }\n\n    const {\n      data: factors,\n      error: factorsError,\n    } =\n      await account.supabase.auth.mfa\n        .listFactors();\n\n    if (factorsError) {\n      console.error(\n        \"MFA factor list error:\",\n        factorsError,\n      );\n\n      return sendError(\n        response,\n        502,\n        \"MFA_FACTORS_FAILED\",\n        \"Не удалось проверить фактор двухфакторной аутентификации.\",\n      );\n    }\n\n    const allFactors =\n      Array.isArray(factors?.all)\n        ? factors.all\n        : [];\n\n    const verifiedTotp =\n      Array.isArray(factors?.totp)\n        ? factors.totp\n        : [];\n\n    const factor =\n      requestedFactorId\n        ? allFactors.find(\n            (item) =>\n              item?.id ===\n                requestedFactorId &&\n              item?.factor_type ===\n                \"totp\",\n          )\n        : verifiedTotp[0];\n\n    if (!factor?.id) {\n      return sendError(\n        response,\n        400,\n        \"MFA_FACTOR_NOT_FOUND\",\n        \"Фактор двухфакторной аутентификации не найден. Выполните вход заново.\",\n      );\n    }\n\n    const {\n      data: verifiedSession,\n      error: verifyError,\n    } =\n      await account.supabase.auth.mfa\n        .challengeAndVerify({\n          factorId: factor.id,\n          code,\n        });\n\n    if (\n      verifyError ||\n      !verifiedSession?.access_token ||\n      !verifiedSession?.refresh_token\n    ) {\n      await recordAuthSecurityEvent({\n        eventType:\n          \"mfa_verify_failure\",\n        userId: account.user.id,\n        identityHash:\n          security.identityHash,\n        clientHash:\n          security.clientHash,\n        metadata: {\n          role: account.access.role,\n          reason:\n            String(\n              verifyError?.code ||\n                \"INVALID_MFA_CODE\",\n            ).slice(0, 64),\n        },\n      });\n\n      const source = [\n        verifyError?.message,\n        verifyError?.code,\n      ]\n        .filter(Boolean)\n        .join(\" \")\n        .toLowerCase();\n\n      if (\n        source.includes(\"rate\") &&\n        source.includes(\"limit\")\n      ) {\n        return sendError(\n          response,\n          429,\n          \"TOO_MANY_MFA_ATTEMPTS\",\n          \"Слишком много попыток ввода кода. Подождите и повторите позже.\",\n        );\n      }\n\n      return sendError(\n        response,\n        401,\n        \"INVALID_MFA_CODE\",\n        \"Код неверный или уже устарел. Введите новый код из приложения.\",\n      );\n    }\n\n    const {\n      data: assurance,\n      error: assuranceError,\n    } =\n      await account.supabase.auth.mfa\n        .getAuthenticatorAssuranceLevel(\n          verifiedSession.access_token,\n        );\n\n    if (\n      assuranceError ||\n      assurance?.currentLevel !==\n        \"aal2\"\n    ) {\n      console.error(\n        \"MFA post verify assurance error:\",\n        assuranceError ||\n          assurance,\n      );\n\n      clearAuthCookies(response);\n\n      return sendError(\n        response,\n        403,\n        \"MFA_NOT_CONFIRMED\",\n        \"Не удалось подтвердить второй фактор. Выполните вход заново.\",\n      );\n    }\n\n    setAuthCookies(\n      response,\n      verifiedSession,\n    );\n\n    await resetAuthRateLimitBucket(\n      security.pairBucket,\n    );\n\n    await recordAuthSecurityEvent({\n      eventType: \"mfa_verified\",\n      userId: account.user.id,\n      identityHash:\n        security.identityHash,\n      clientHash:\n        security.clientHash,\n      metadata: {\n        role: account.access.role,\n        factorType: \"totp\",\n      },\n    });\n\n    await recordAuthSecurityEvent({\n      eventType: \"login_success\",\n      userId: account.user.id,\n      identityHash:\n        security.identityHash,\n      clientHash:\n        security.clientHash,\n      metadata: {\n        role: account.access.role,\n        mfa: true,\n      },\n    });\n\n    return response.status(200).json({\n      ok: true,\n      authenticated: true,\n      user: {\n        id: account.user.id,\n        email: account.user.email,\n      },\n      role: account.access.role,\n    });\n  } catch (error) {\n    console.error(\n      \"Unexpected MFA verification error:\",\n      error?.cause || error,\n    );\n\n    return sendError(\n      response,\n      error?.status || 500,\n      error?.code ||\n        \"INTERNAL_SERVER_ERROR\",\n      error?.message ||\n        \"Не удалось подтвердить двухфакторную аутентификацию.\",\n    );\n  }\n}\n\nasync function handleMfaCancel(\n  response,\n) {\n  clearAuthCookies(response);\n\n  return response.status(200).json({\n    ok: true,\n    cancelled: true,\n  });\n}\n\nasync function handleProfileUpdate(\n"}, {"old": "const action =\n  normalizeAction(body.action);\n\nif (action === \"find-user\") {\n", "new": "const action =\n  normalizeAction(body.action);\n\nif (action === \"mfa-enroll\") {\n  return handleMfaEnroll(\n    request,\n    response,\n  );\n}\n\nif (action === \"mfa-verify\") {\n  return handleMfaVerify(\n    request,\n    response,\n    body,\n  );\n}\n\nif (action === \"mfa-cancel\") {\n  return handleMfaCancel(\n    response,\n  );\n}\n\nif (action === \"find-user\") {\n"}]}, "src/pages/Login.jsx": {"marker": "mfaStep", "replacements": [{"old": "import { useAuth } from \"../auth/AuthContext.jsx\";\n\nimport \"./Auth.css\";\n", "new": "import { useAuth } from \"../auth/AuthContext.jsx\";\nimport MfaChallenge from \"../auth/MfaChallenge.jsx\";\n\nimport \"./Auth.css\";\n"}, {"old": "const [password, setPassword] =\n  useState(\"\");\n\nconst [submitting, setSubmitting] =\n", "new": "const [password, setPassword] =\n  useState(\"\");\n\nconst [mfaStep, setMfaStep] =\n  useState(null);\n\nconst [submitting, setSubmitting] =\n"}, {"old": "await refreshSession();\n\nconst destination =\n  location.state?.from?.pathname ??\n  \"/account\";\n\nnavigate(destination, {\n  replace: true,\n});\n", "new": "if (\n  result.mfaRequired === true\n) {\n  setMfaStep({\n    setupRequired:\n      result.mfaSetupRequired ===\n      true,\n  });\n\n  setPassword(\"\");\n  return;\n}\n\nawait refreshSession();\n\nconst destination =\n  location.state?.from?.pathname ??\n  \"/account\";\n\nnavigate(destination, {\n  replace: true,\n});\n"}, {"old": "return (\n  <section className=\"auth-page\">\n", "new": "if (mfaStep) {\n  return (\n    <MfaChallenge\n      setupRequired={\n        mfaStep.setupRequired\n      }\n      onSuccess={async () => {\n        await refreshSession();\n\n        const destination =\n          location.state?.from\n            ?.pathname ??\n          \"/account\";\n\n        navigate(destination, {\n          replace: true,\n        });\n      }}\n      onCancel={() => {\n        setMfaStep(null);\n        setPassword(\"\");\n        setErrorMessage(\"\");\n        setMessage(\"\");\n      }}\n    />\n  );\n}\n\nreturn (\n  <section className=\"auth-page\">\n"}]}};
const newFiles = {"src/auth/MfaChallenge.jsx": "import {\n  useCallback,\n  useEffect,\n  useRef,\n  useState,\n} from \"react\";\n\nasync function readApiResponse(response) {\n  let result;\n\n  try {\n    result = await response.json();\n  } catch {\n    throw new Error(\n      \"Сервер вернул некорректный ответ.\",\n    );\n  }\n\n  if (\n    !response.ok ||\n    result?.ok !== true\n  ) {\n    const error = new Error(\n      result?.message ||\n        \"Не удалось выполнить запрос.\",\n    );\n\n    error.code =\n      result?.error || \"MFA_REQUEST_FAILED\";\n\n    throw error;\n  }\n\n  return result;\n}\n\nasync function postMfa(\n  action,\n  payload = {},\n) {\n  const response = await fetch(\n    \"/api/auth/session\",\n    {\n      method: \"POST\",\n      credentials: \"include\",\n\n      headers: {\n        Accept: \"application/json\",\n        \"Content-Type\":\n          \"application/json\",\n      },\n\n      body: JSON.stringify({\n        action,\n        ...payload,\n      }),\n    },\n  );\n\n  return readApiResponse(response);\n}\n\nexport default function MfaChallenge({\n  setupRequired,\n  onSuccess,\n  onCancel,\n}) {\n  const startedRef = useRef(false);\n\n  const [mode, setMode] = useState(\n    setupRequired ? \"setup\" : \"verify\",\n  );\n\n  const [factorId, setFactorId] =\n    useState(\"\");\n\n  const [qrCode, setQrCode] =\n    useState(\"\");\n\n  const [secret, setSecret] =\n    useState(\"\");\n\n  const [code, setCode] =\n    useState(\"\");\n\n  const [preparing, setPreparing] =\n    useState(setupRequired);\n\n  const [submitting, setSubmitting] =\n    useState(false);\n\n  const [cancelling, setCancelling] =\n    useState(false);\n\n  const [errorMessage, setErrorMessage] =\n    useState(\"\");\n\n  const [copyMessage, setCopyMessage] =\n    useState(\"\");\n\n  const startEnrollment =\n    useCallback(async () => {\n      setPreparing(true);\n      setErrorMessage(\"\");\n      setCopyMessage(\"\");\n\n      try {\n        const result = await postMfa(\n          \"mfa-enroll\",\n        );\n\n        if (\n          result.authenticated === true\n        ) {\n          await onSuccess?.();\n          return;\n        }\n\n        if (\n          result.enrollmentRequired !==\n          true\n        ) {\n          setMode(\"verify\");\n          setFactorId(\"\");\n          setQrCode(\"\");\n          setSecret(\"\");\n          return;\n        }\n\n        setMode(\"setup\");\n        setFactorId(\n          result.factorId || \"\",\n        );\n\n        setQrCode(\n          result.qrCode || \"\",\n        );\n\n        setSecret(\n          result.secret || \"\",\n        );\n      } catch (error) {\n        setErrorMessage(\n          error?.message ||\n            \"Не удалось подготовить 2FA.\",\n        );\n      } finally {\n        setPreparing(false);\n      }\n    }, [onSuccess]);\n\n  useEffect(() => {\n    if (\n      !setupRequired ||\n      startedRef.current\n    ) {\n      return;\n    }\n\n    startedRef.current = true;\n    void startEnrollment();\n  }, [\n    setupRequired,\n    startEnrollment,\n  ]);\n\n  async function handleSubmit(event) {\n    event.preventDefault();\n\n    const normalizedCode =\n      code.replace(/\\D/g, \"\");\n\n    if (\n      normalizedCode.length < 6 ||\n      normalizedCode.length > 10\n    ) {\n      setErrorMessage(\n        \"Введите код из приложения аутентификатора.\",\n      );\n      return;\n    }\n\n    setSubmitting(true);\n    setErrorMessage(\"\");\n\n    try {\n      await postMfa(\n        \"mfa-verify\",\n        {\n          code: normalizedCode,\n          factorId:\n            factorId || undefined,\n        },\n      );\n\n      setCode(\"\");\n      await onSuccess?.();\n    } catch (error) {\n      setErrorMessage(\n        error?.message ||\n          \"Не удалось подтвердить 2FA.\",\n      );\n    } finally {\n      setSubmitting(false);\n    }\n  }\n\n  async function handleCancel() {\n    setCancelling(true);\n    setErrorMessage(\"\");\n\n    try {\n      await postMfa(\"mfa-cancel\");\n    } catch {\n      // Локальный экран всё равно закрываем.\n      // Серверная pending cookie живёт не более 15 минут.\n    } finally {\n      setCancelling(false);\n      onCancel?.();\n    }\n  }\n\n  async function handleCopySecret() {\n    if (!secret) {\n      return;\n    }\n\n    try {\n      await navigator.clipboard.writeText(\n        secret,\n      );\n\n      setCopyMessage(\n        \"Резервный ключ скопирован.\",\n      );\n    } catch {\n      setCopyMessage(\n        \"Не удалось скопировать ключ.\",\n      );\n    }\n  }\n\n  const isSetup =\n    mode === \"setup\";\n\n  return (\n    <section className=\"auth-page\">\n      <div className=\"auth-shell\">\n        <header className=\"auth-heading\">\n          <p className=\"auth-kicker\">\n            ISTe security\n          </p>\n\n          <h1>\n            Двухфакторная\n            аутентификация\n          </h1>\n\n          <p>\n            {isSetup\n              ? \"Для административного аккаунта 2FA обязательна. Добавьте ISTe в приложение аутентификатора и подтвердите код.\"\n              : \"Пароль принят. Для завершения входа введите текущий код из приложения аутентификатора.\"}\n          </p>\n        </header>\n\n        <div className=\"auth-card auth-card-form mfa-login-panel\">\n          {errorMessage && (\n            <div\n              className=\"auth-message auth-message-error\"\n              role=\"alert\"\n            >\n              {errorMessage}\n            </div>\n          )}\n\n          {preparing && (\n            <div className=\"mfa-preparing\">\n              <div\n                className=\"auth-loader\"\n                aria-hidden=\"true\"\n              />\n\n              <p>\n                Подготавливаем защищённую\n                настройку 2FA…\n              </p>\n            </div>\n          )}\n\n          {isSetup &&\n            !preparing &&\n            qrCode && (\n              <>\n                <div className=\"mfa-setup-copy\">\n                  <h2>\n                    Сканируйте QR код\n                  </h2>\n\n                  <p>\n                    Откройте приложение\n                    аутентификатора,\n                    добавьте новый аккаунт\n                    и отсканируйте этот\n                    QR код.\n                  </p>\n                </div>\n\n                <div className=\"mfa-qr-wrap\">\n                  <img\n                    className=\"mfa-qr\"\n                    src={qrCode}\n                    alt=\"QR код для настройки двухфакторной аутентификации ISTe\"\n                  />\n                </div>\n\n                {secret && (\n                  <div className=\"mfa-secret\">\n                    <div>\n                      <strong>\n                        Резервный ключ\n                      </strong>\n\n                      <p>\n                        Сохраните его в\n                        надёжном менеджере\n                        паролей. Он позволит\n                        восстановить тот же\n                        TOTP генератор при\n                        потере телефона.\n                      </p>\n                    </div>\n\n                    <code>\n                      {secret}\n                    </code>\n\n                    <button\n                      className=\"auth-button auth-button-secondary\"\n                      type=\"button\"\n                      onClick={\n                        handleCopySecret\n                      }\n                      disabled={\n                        submitting ||\n                        cancelling\n                      }\n                    >\n                      Копировать ключ\n                    </button>\n\n                    {copyMessage && (\n                      <small className=\"auth-hint\">\n                        {copyMessage}\n                      </small>\n                    )}\n                  </div>\n                )}\n              </>\n            )}\n\n          {isSetup &&\n            !preparing &&\n            !qrCode && (\n              <button\n                className=\"auth-button\"\n                type=\"button\"\n                onClick={\n                  startEnrollment\n                }\n                disabled={\n                  submitting ||\n                  cancelling\n                }\n              >\n                Повторить подготовку\n              </button>\n            )}\n\n          {(!isSetup ||\n            (!preparing &&\n              qrCode)) && (\n            <form\n              className=\"auth-form\"\n              onSubmit={handleSubmit}\n            >\n              <label className=\"auth-field\">\n                <span>\n                  Код из приложения\n                </span>\n\n                <input\n                  className=\"auth-input mfa-code-input\"\n                  type=\"text\"\n                  inputMode=\"numeric\"\n                  autoComplete=\"one-time-code\"\n                  pattern=\"[0-9]*\"\n                  value={code}\n                  onChange={(event) =>\n                    setCode(\n                      event.target.value\n                        .replace(/\\D/g, \"\")\n                        .slice(0, 10),\n                    )\n                  }\n                  placeholder=\"000000\"\n                  minLength={6}\n                  maxLength={10}\n                  required\n                  autoFocus\n                  disabled={\n                    submitting ||\n                    cancelling\n                  }\n                />\n              </label>\n\n              <button\n                className=\"auth-button\"\n                type=\"submit\"\n                disabled={\n                  submitting ||\n                  cancelling\n                }\n              >\n                {submitting\n                  ? \"Проверяем...\"\n                  : isSetup\n                    ? \"Включить 2FA\"\n                    : \"Подтвердить вход\"}\n              </button>\n            </form>\n          )}\n\n          <button\n            className=\"auth-button auth-button-secondary\"\n            type=\"button\"\n            onClick={handleCancel}\n            disabled={\n              preparing ||\n              submitting ||\n              cancelling\n            }\n          >\n            {cancelling\n              ? \"Отменяем...\"\n              : \"Вернуться к входу\"}\n          </button>\n        </div>\n      </div>\n    </section>\n  );\n}\n", "supabase/20260904_mfa_aal2.sql": "begin;\n\n-- ISTe privileged MFA enforcement.\n-- Apply only after the application code that supports TOTP MFA is deployed.\n-- Admin and owner operations must originate from an aal2 JWT.\n\ndrop policy if exists audit_read_admin\n  on public.admin_audit_log;\n\ncreate policy audit_read_admin\n  on public.admin_audit_log\n  for select\n  to authenticated\n  using (\n    (select private.current_user_is_active())\n    and\n    (select private.current_user_role()) in (\n      'admin'::public.app_role,\n      'owner'::public.app_role\n    )\n    and\n    coalesce(\n      (select auth.jwt() ->> 'aal'),\n      'aal1'\n    ) = 'aal2'\n  );\n\ndrop policy if exists profiles_read_admin\n  on public.profiles;\n\ncreate policy profiles_read_admin\n  on public.profiles\n  for select\n  to authenticated\n  using (\n    (select private.current_user_is_active())\n    and\n    (select private.current_user_role()) in (\n      'admin'::public.app_role,\n      'owner'::public.app_role\n    )\n    and\n    coalesce(\n      (select auth.jwt() ->> 'aal'),\n      'aal1'\n    ) = 'aal2'\n  );\n\ndrop policy if exists settings_read_admin\n  on public.site_settings;\n\ncreate policy settings_read_admin\n  on public.site_settings\n  for select\n  to authenticated\n  using (\n    (select private.current_user_is_active())\n    and\n    (select private.current_user_role()) in (\n      'admin'::public.app_role,\n      'owner'::public.app_role\n    )\n    and\n    coalesce(\n      (select auth.jwt() ->> 'aal'),\n      'aal1'\n    ) = 'aal2'\n  );\n\ndrop policy if exists user_roles_read_admin\n  on public.user_roles;\n\ncreate policy user_roles_read_admin\n  on public.user_roles\n  for select\n  to authenticated\n  using (\n    (select private.current_user_is_active())\n    and\n    (select private.current_user_role()) in (\n      'admin'::public.app_role,\n      'owner'::public.app_role\n    )\n    and\n    coalesce(\n      (select auth.jwt() ->> 'aal'),\n      'aal1'\n    ) = 'aal2'\n  );\n\ndrop policy if exists news_staff_read_all\n  on public.news_posts;\n\ncreate policy news_staff_read_all\n  on public.news_posts\n  for select\n  to authenticated\n  using (\n    public.current_app_role() =\n      'editor'::public.app_role\n    or (\n      public.current_app_role() in (\n        'admin'::public.app_role,\n        'owner'::public.app_role\n      )\n      and\n      coalesce(\n        (select auth.jwt() ->> 'aal'),\n        'aal1'\n      ) = 'aal2'\n    )\n  );\n\ndrop policy if exists news_staff_create\n  on public.news_posts;\n\ncreate policy news_staff_create\n  on public.news_posts\n  for insert\n  to authenticated\n  with check (\n    author_id = auth.uid()\n    and (\n      (\n        public.current_app_role() =\n          'editor'::public.app_role\n        and\n        status =\n          'draft'::public.news_status\n        and\n        is_featured = false\n      )\n      or (\n        public.current_app_role() in (\n          'admin'::public.app_role,\n          'owner'::public.app_role\n        )\n        and\n        coalesce(\n          (select auth.jwt() ->> 'aal'),\n          'aal1'\n        ) = 'aal2'\n      )\n    )\n  );\n\ndrop policy if exists news_admin_update_all\n  on public.news_posts;\n\ncreate policy news_admin_update_all\n  on public.news_posts\n  for update\n  to authenticated\n  using (\n    public.current_app_role() in (\n      'admin'::public.app_role,\n      'owner'::public.app_role\n    )\n    and\n    coalesce(\n      (select auth.jwt() ->> 'aal'),\n      'aal1'\n    ) = 'aal2'\n  )\n  with check (\n    public.current_app_role() in (\n      'admin'::public.app_role,\n      'owner'::public.app_role\n    )\n    and\n    coalesce(\n      (select auth.jwt() ->> 'aal'),\n      'aal1'\n    ) = 'aal2'\n  );\n\ndrop policy if exists news_admin_delete\n  on public.news_posts;\n\ncreate policy news_admin_delete\n  on public.news_posts\n  for delete\n  to authenticated\n  using (\n    public.current_app_role() in (\n      'admin'::public.app_role,\n      'owner'::public.app_role\n    )\n    and\n    coalesce(\n      (select auth.jwt() ->> 'aal'),\n      'aal1'\n    ) = 'aal2'\n  );\n\ndrop policy if exists news_images_staff_select\n  on storage.objects;\n\ncreate policy news_images_staff_select\n  on storage.objects\n  for select\n  to authenticated\n  using (\n    bucket_id = 'news-images'\n    and (\n      public.current_app_role() =\n        'editor'::public.app_role\n      or (\n        public.current_app_role() in (\n          'admin'::public.app_role,\n          'owner'::public.app_role\n        )\n        and\n        coalesce(\n          (select auth.jwt() ->> 'aal'),\n          'aal1'\n        ) = 'aal2'\n      )\n    )\n  );\n\ndrop policy if exists news_images_staff_insert\n  on storage.objects;\n\ncreate policy news_images_staff_insert\n  on storage.objects\n  for insert\n  to authenticated\n  with check (\n    bucket_id = 'news-images'\n    and\n    (storage.foldername(name))[1] =\n      auth.uid()::text\n    and (\n      public.current_app_role() =\n        'editor'::public.app_role\n      or (\n        public.current_app_role() in (\n          'admin'::public.app_role,\n          'owner'::public.app_role\n        )\n        and\n        coalesce(\n          (select auth.jwt() ->> 'aal'),\n          'aal1'\n        ) = 'aal2'\n      )\n    )\n  );\n\ndrop policy if exists news_images_staff_update\n  on storage.objects;\n\ncreate policy news_images_staff_update\n  on storage.objects\n  for update\n  to authenticated\n  using (\n    bucket_id = 'news-images'\n    and\n    public.current_app_role() in (\n      'admin'::public.app_role,\n      'owner'::public.app_role\n    )\n    and\n    coalesce(\n      (select auth.jwt() ->> 'aal'),\n      'aal1'\n    ) = 'aal2'\n  )\n  with check (\n    bucket_id = 'news-images'\n    and\n    public.current_app_role() in (\n      'admin'::public.app_role,\n      'owner'::public.app_role\n    )\n    and\n    coalesce(\n      (select auth.jwt() ->> 'aal'),\n      'aal1'\n    ) = 'aal2'\n  );\n\ndrop policy if exists news_images_staff_delete\n  on storage.objects;\n\ncreate policy news_images_staff_delete\n  on storage.objects\n  for delete\n  to authenticated\n  using (\n    bucket_id = 'news-images'\n    and (\n      (\n        public.current_app_role() =\n          'editor'::public.app_role\n        and\n        (storage.foldername(name))[1] =\n          auth.uid()::text\n      )\n      or (\n        public.current_app_role() in (\n          'admin'::public.app_role,\n          'owner'::public.app_role\n        )\n        and\n        coalesce(\n          (select auth.jwt() ->> 'aal'),\n          'aal1'\n        ) = 'aal2'\n      )\n    )\n  );\n\ncreate or replace function public.owner_list_audit_log(\n  p_limit integer default 100,\n  p_offset integer default 0\n)\nreturns table(\n  id uuid,\n  actor_user_id uuid,\n  actor_email text,\n  actor_username text,\n  target_user_id uuid,\n  target_email text,\n  target_username text,\n  action text,\n  details jsonb,\n  created_at timestamptz\n)\nlanguage plpgsql\nsecurity definer\nset search_path to ''\nas $function$\ndeclare\n  v_actor_id uuid := auth.uid();\n  v_actor_role public.app_role;\n  v_limit integer :=\n    least(greatest(coalesce(p_limit, 100), 1), 200);\n  v_offset integer :=\n    greatest(coalesce(p_offset, 0), 0);\nbegin\n  if v_actor_id is null then\n    raise exception 'AUTH_REQUIRED';\n  end if;\n\n  if coalesce(auth.jwt() ->> 'aal', 'aal1') <> 'aal2' then\n    raise exception 'MFA_REQUIRED';\n  end if;\n\n  select access.role\n  into v_actor_role\n  from public.user_roles access\n  where access.user_id = v_actor_id\n    and access.is_blocked = false;\n\n  if v_actor_role not in (\n    'admin'::public.app_role,\n    'owner'::public.app_role\n  ) then\n    raise exception 'ADMIN_OR_OWNER_REQUIRED';\n  end if;\n\n  return query\n  select\n    audit.id,\n    audit.actor_id as actor_user_id,\n    actor_auth.email::text as actor_email,\n    actor_profile.username::text as actor_username,\n    audit.target_user_id,\n    target_auth.email::text as target_email,\n    target_profile.username::text as target_username,\n    audit.action::text,\n    audit.details,\n    audit.created_at\n  from public.admin_audit_log audit\n  left join auth.users actor_auth\n    on actor_auth.id = audit.actor_id\n  left join public.profiles actor_profile\n    on actor_profile.id = audit.actor_id\n  left join auth.users target_auth\n    on target_auth.id = audit.target_user_id\n  left join public.profiles target_profile\n    on target_profile.id = audit.target_user_id\n  where\n    v_actor_role = 'owner'::public.app_role\n    or audit.actor_id = v_actor_id\n  order by audit.created_at desc\n  limit v_limit\n  offset v_offset;\nend;\n$function$;\n\ncreate or replace function public.owner_list_users(\n  p_search text default '',\n  p_limit integer default 100,\n  p_offset integer default 0\n)\nreturns table(\n  user_id uuid,\n  email text,\n  username text,\n  display_name text,\n  avatar_url text,\n  role text,\n  is_blocked boolean,\n  blocked_reason text,\n  created_at timestamptz,\n  last_sign_in_at timestamptz\n)\nlanguage plpgsql\nsecurity definer\nset search_path to ''\nas $function$\ndeclare\n  v_actor_id uuid := auth.uid();\n  v_actor_role public.app_role;\n  v_search text :=\n    lower(trim(coalesce(p_search, '')));\n  v_limit integer :=\n    least(greatest(coalesce(p_limit, 100), 1), 200);\n  v_offset integer :=\n    greatest(coalesce(p_offset, 0), 0);\nbegin\n  if v_actor_id is null then\n    raise exception 'AUTH_REQUIRED';\n  end if;\n\n  if coalesce(auth.jwt() ->> 'aal', 'aal1') <> 'aal2' then\n    raise exception 'MFA_REQUIRED';\n  end if;\n\n  select access.role\n  into v_actor_role\n  from public.user_roles access\n  where access.user_id = v_actor_id\n    and access.is_blocked = false;\n\n  if v_actor_role not in (\n    'admin'::public.app_role,\n    'owner'::public.app_role\n  ) then\n    raise exception 'ADMIN_OR_OWNER_REQUIRED';\n  end if;\n\n  return query\n  select\n    auth_user.id as user_id,\n    auth_user.email::text,\n    profile.username::text,\n    profile.display_name::text,\n    profile.avatar_url::text,\n    coalesce(access.role::text, 'user') as role,\n    coalesce(access.is_blocked, false) as is_blocked,\n    coalesce(access.blocked_reason, '')::text\n      as blocked_reason,\n    auth_user.created_at,\n    auth_user.last_sign_in_at\n  from auth.users auth_user\n  left join public.profiles profile\n    on profile.id = auth_user.id\n  left join public.user_roles access\n    on access.user_id = auth_user.id\n  where\n    v_search = ''\n    or lower(coalesce(auth_user.email, ''))\n      like '%' || v_search || '%'\n    or lower(coalesce(profile.username, ''))\n      like '%' || v_search || '%'\n    or lower(coalesce(profile.display_name, ''))\n      like '%' || v_search || '%'\n  order by auth_user.created_at desc\n  limit v_limit\n  offset v_offset;\nend;\n$function$;\n\ncreate or replace function public.owner_set_user_blocked(\n  p_user_id uuid,\n  p_is_blocked boolean,\n  p_reason text default ''\n)\nreturns jsonb\nlanguage plpgsql\nsecurity definer\nset search_path to ''\nas $function$\ndeclare\n  v_actor_id uuid := auth.uid();\n  v_actor_role public.app_role;\n  v_target_role public.app_role;\n  v_reason text :=\n    left(trim(coalesce(p_reason, '')), 500);\nbegin\n  if v_actor_id is null then\n    raise exception 'AUTH_REQUIRED';\n  end if;\n\n  if coalesce(auth.jwt() ->> 'aal', 'aal1') <> 'aal2' then\n    raise exception 'MFA_REQUIRED';\n  end if;\n\n  select access.role\n  into v_actor_role\n  from public.user_roles access\n  where access.user_id = v_actor_id\n    and access.is_blocked = false;\n\n  if v_actor_role not in (\n    'admin'::public.app_role,\n    'owner'::public.app_role\n  ) then\n    raise exception 'ADMIN_OR_OWNER_REQUIRED';\n  end if;\n\n  if p_user_id is null then\n    raise exception 'TARGET_REQUIRED';\n  end if;\n\n  if p_user_id = v_actor_id then\n    raise exception 'CANNOT_BLOCK_SELF';\n  end if;\n\n  select target_access.role\n  into v_target_role\n  from public.user_roles target_access\n  where target_access.user_id = p_user_id\n  for update;\n\n  if not found then\n    raise exception 'USER_ROLE_NOT_FOUND';\n  end if;\n\n  if v_target_role = 'owner'::public.app_role then\n    raise exception 'CANNOT_BLOCK_OWNER';\n  end if;\n\n  if v_actor_role = 'admin'::public.app_role\n     and v_target_role in (\n       'admin'::public.app_role,\n       'owner'::public.app_role\n     ) then\n    raise exception 'ADMIN_CANNOT_MANAGE_PRIVILEGED';\n  end if;\n\n  update public.user_roles\n  set\n    is_blocked = coalesce(p_is_blocked, false),\n    blocked_reason = case\n      when coalesce(p_is_blocked, false)\n        then v_reason\n      else ''\n    end,\n    blocked_at = case\n      when coalesce(p_is_blocked, false)\n        then now()\n      else null\n    end,\n    blocked_by = case\n      when coalesce(p_is_blocked, false)\n        then v_actor_id\n      else null\n    end,\n    updated_at = now()\n  where user_id = p_user_id;\n\n  insert into public.admin_audit_log (\n    actor_id,\n    target_user_id,\n    action,\n    details,\n    success\n  )\n  values (\n    v_actor_id,\n    p_user_id,\n    case\n      when coalesce(p_is_blocked, false)\n        then 'user_blocked'\n      else 'user_unblocked'\n    end,\n    jsonb_build_object(\n      'actor_role', v_actor_role::text,\n      'reason',\n      case\n        when coalesce(p_is_blocked, false)\n          then v_reason\n        else ''\n      end\n    ),\n    true\n  );\n\n  return jsonb_build_object(\n    'success', true,\n    'user_id', p_user_id,\n    'is_blocked',\n    coalesce(p_is_blocked, false)\n  );\nend;\n$function$;\n\ncreate or replace function public.owner_update_user_role(\n  p_user_id uuid,\n  p_role text\n)\nreturns jsonb\nlanguage plpgsql\nsecurity definer\nset search_path to ''\nas $function$\ndeclare\n  v_actor_id uuid := auth.uid();\n  v_actor_role public.app_role;\n  v_old_role public.app_role;\n  v_new_role public.app_role;\nbegin\n  if v_actor_id is null then\n    raise exception 'AUTH_REQUIRED';\n  end if;\n\n  if coalesce(auth.jwt() ->> 'aal', 'aal1') <> 'aal2' then\n    raise exception 'MFA_REQUIRED';\n  end if;\n\n  select access.role\n  into v_actor_role\n  from public.user_roles access\n  where access.user_id = v_actor_id\n    and access.is_blocked = false;\n\n  if v_actor_role not in (\n    'admin'::public.app_role,\n    'owner'::public.app_role\n  ) then\n    raise exception 'ADMIN_OR_OWNER_REQUIRED';\n  end if;\n\n  if p_user_id is null then\n    raise exception 'TARGET_REQUIRED';\n  end if;\n\n  if p_user_id = v_actor_id then\n    raise exception 'CANNOT_CHANGE_OWN_ROLE';\n  end if;\n\n  select target_access.role\n  into v_old_role\n  from public.user_roles target_access\n  where target_access.user_id = p_user_id\n  for update;\n\n  if not found then\n    raise exception 'USER_ROLE_NOT_FOUND';\n  end if;\n\n  if v_old_role = 'owner'::public.app_role then\n    raise exception 'CANNOT_CHANGE_OWNER';\n  end if;\n\n  if v_actor_role = 'admin'::public.app_role then\n    if v_old_role in (\n      'admin'::public.app_role,\n      'owner'::public.app_role\n    ) then\n      raise exception 'ADMIN_CANNOT_MANAGE_PRIVILEGED';\n    end if;\n\n    if lower(trim(coalesce(p_role, '')))\n       not in ('user', 'editor') then\n      raise exception 'ADMIN_CANNOT_ASSIGN_ADMIN';\n    end if;\n  else\n    if lower(trim(coalesce(p_role, '')))\n       not in (\n         'user',\n         'editor',\n         'admin'\n       ) then\n      raise exception 'INVALID_ROLE';\n    end if;\n  end if;\n\n  v_new_role :=\n    lower(trim(p_role))::public.app_role;\n\n  update public.user_roles\n  set\n    role = v_new_role,\n    assigned_by = v_actor_id,\n    updated_at = now()\n  where user_id = p_user_id;\n\n  insert into public.admin_audit_log (\n    actor_id,\n    target_user_id,\n    action,\n    details,\n    success\n  )\n  values (\n    v_actor_id,\n    p_user_id,\n    'role_changed',\n    jsonb_build_object(\n      'actor_role', v_actor_role::text,\n      'old_role', v_old_role::text,\n      'new_role', v_new_role::text\n    ),\n    true\n  );\n\n  return jsonb_build_object(\n    'success', true,\n    'user_id', p_user_id,\n    'old_role', v_old_role::text,\n    'new_role', v_new_role::text\n  );\nend;\n$function$;\n\ncommit;\n"};
const appendBlocks = {"src/pages/Auth.css": {"marker": ".mfa-login-panel", "content": ".mfa-login-panel {\n  display: grid;\n  gap: 20px;\n}\n\n.mfa-preparing {\n  display: grid;\n  place-items: center;\n  gap: 14px;\n  padding: 16px 0;\n  color: rgba(255, 255, 255, 0.68);\n  text-align: center;\n}\n\n.mfa-preparing p,\n.mfa-setup-copy p,\n.mfa-secret p {\n  margin: 0;\n  color: rgba(255, 255, 255, 0.58);\n  line-height: 1.58;\n}\n\n.mfa-setup-copy {\n  display: grid;\n  gap: 8px;\n  text-align: center;\n}\n\n.mfa-setup-copy h2 {\n  margin: 0;\n  color: #fff;\n  font-size: 1.15rem;\n  text-transform: uppercase;\n}\n\n.mfa-qr-wrap {\n  display: grid;\n  place-items: center;\n}\n\n.mfa-qr {\n  width: min(270px, 100%);\n  aspect-ratio: 1;\n  padding: 12px;\n  border-radius: 18px;\n  background: #fff;\n}\n\n.mfa-secret {\n  display: grid;\n  gap: 12px;\n  padding: 16px;\n  border: 1px solid rgba(255, 255, 255, 0.1);\n  border-radius: 14px;\n  background: rgba(255, 255, 255, 0.025);\n}\n\n.mfa-secret strong {\n  display: block;\n  margin-bottom: 5px;\n  color: #fff;\n}\n\n.mfa-secret code {\n  padding: 12px;\n  border-radius: 10px;\n  background: #020202;\n  color: #fff;\n  font-size: 0.85rem;\n  line-height: 1.5;\n  overflow-wrap: anywhere;\n  user-select: all;\n}\n\n.mfa-code-input {\n  text-align: center;\n  font-size: 1.25rem;\n  font-weight: 900;\n  letter-spacing: 0.28em;\n}\n"}};

const root = path.resolve(
  process.argv[2] || process.cwd(),
);

const packagePath =
  path.join(root, "package.json");

function normalize(text) {
  return String(text)
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n");
}

function readText(filePath) {
  return normalize(
    fs.readFileSync(filePath, "utf8"),
  );
}

function writeText(filePath, content) {
  fs.mkdirSync(
    path.dirname(filePath),
    { recursive: true },
  );

  fs.writeFileSync(
    filePath,
    normalize(content),
    "utf8",
  );
}

function escapeRegExp(value) {
  return value.replace(
    /[.*+?^${}()|[\]\\]/g,
    "\\$&",
  );
}

function createFlexiblePattern(value) {
  const tokens = normalize(value)
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map(escapeRegExp);

  if (tokens.length === 0) {
    throw new Error(
      "Empty patch context is not allowed.",
    );
  }

  return new RegExp(
    tokens.join("\\s+"),
    "g",
  );
}

function replaceOnce(
  content,
  oldText,
  newText,
  label,
) {
  const source = normalize(content);
  const newValue = normalize(newText);
  const pattern =
    createFlexiblePattern(oldText);

  const matches =
    [...source.matchAll(pattern)];

  if (matches.length === 0) {
    throw new Error(
      `Patch context not found: ${label}`,
    );
  }

  if (matches.length > 1) {
    throw new Error(
      `Patch context is not unique: ${label}`,
    );
  }

  const match = matches[0];
  const first = match.index;
  const length = match[0].length;

  return (
    source.slice(0, first) +
    newValue +
    source.slice(first + length)
  );
}

function runGit(args, allowOne = false) {
  const result = spawnSync(
    "git",
    ["-C", root, ...args],
    {
      encoding: "utf8",
      shell: false,
    },
  );

  if (
    result.error ||
    (
      result.status !== 0 &&
      !(allowOne && result.status === 1)
    )
  ) {
    throw new Error(
      result.error?.message ||
      result.stderr ||
      `git ${args.join(" ")} failed`,
    );
  }

  return result;
}

if (!fs.existsSync(packagePath)) {
  throw new Error(
    "package.json was not found. Run this script from the ISTe repository root.",
  );
}

const packageJson = JSON.parse(
  fs.readFileSync(packagePath, "utf8"),
);

if (
  packageJson.name !== "iste-website"
) {
  throw new Error(
    `Unexpected project: ${packageJson.name || "unknown"}`,
  );
}

const worktreeDiff =
  runGit(["diff", "--quiet"], true);

const indexDiff =
  runGit(
    ["diff", "--cached", "--quiet"],
    true,
  );

if (
  worktreeDiff.status === 1 ||
  indexDiff.status === 1
) {
  throw new Error(
    "Tracked local changes detected. Commit or stash them before applying the MFA patch.",
  );
}

const timestamp = new Date()
  .toISOString()
  .replace(/[:.]/g, "")
  .replace("T", "_")
  .replace("Z", "");

const backupRoot = path.join(
  root,
  `.iste_mfa_backup_${timestamp}`,
);

const touchedExisting =
  new Set([
    ...Object.keys(transforms),
    ...Object.keys(appendBlocks),
  ]);

const createdPaths = [];

fs.mkdirSync(
  backupRoot,
  { recursive: true },
);

for (
  const relative of touchedExisting
) {
  const sourcePath =
    path.join(root, relative);

  if (!fs.existsSync(sourcePath)) {
    throw new Error(
      `Required file is missing: ${relative}`,
    );
  }

  const backupPath =
    path.join(backupRoot, relative);

  fs.mkdirSync(
    path.dirname(backupPath),
    { recursive: true },
  );

  fs.copyFileSync(
    sourcePath,
    backupPath,
  );
}

function restore() {
  for (
    const relative of touchedExisting
  ) {
    const backupPath =
      path.join(backupRoot, relative);

    const targetPath =
      path.join(root, relative);

    if (fs.existsSync(backupPath)) {
      fs.mkdirSync(
        path.dirname(targetPath),
        { recursive: true },
      );

      fs.copyFileSync(
        backupPath,
        targetPath,
      );
    }
  }

  for (const relative of createdPaths) {
    const targetPath =
      path.join(root, relative);

    if (fs.existsSync(targetPath)) {
      fs.rmSync(
        targetPath,
        { force: true },
      );
    }
  }
}

try {
  for (
    const [relative, spec]
    of Object.entries(transforms)
  ) {
    const targetPath =
      path.join(root, relative);

    let content =
      readText(targetPath);

    if (content.includes(spec.marker)) {
      console.log(
        `Already patched: ${relative}`,
      );
      continue;
    }

    for (
      let index = 0;
      index < spec.replacements.length;
      index += 1
    ) {
      const replacement =
        spec.replacements[index];

      content = replaceOnce(
        content,
        replacement.old,
        replacement.new,
        `${relative} replacement ${index + 1}`,
      );
    }

    writeText(
      targetPath,
      content,
    );

    console.log(
      `Patched: ${relative}`,
    );
  }

  for (
    const [relative, block]
    of Object.entries(appendBlocks)
  ) {
    const targetPath =
      path.join(root, relative);

    let content =
      readText(targetPath);

    if (
      content.includes(
        block.marker,
      )
    ) {
      console.log(
        `Already patched: ${relative}`,
      );
      continue;
    }

    content =
      `${content.trimEnd()}\n\n${normalize(block.content).trim()}\n`;

    writeText(
      targetPath,
      content,
    );

    console.log(
      `Patched: ${relative}`,
    );
  }

  for (
    const [relative, content]
    of Object.entries(newFiles)
  ) {
    const targetPath =
      path.join(root, relative);

    if (fs.existsSync(targetPath)) {
      const existing =
        readText(targetPath);

      if (
        existing ===
        normalize(content)
      ) {
        console.log(
          `Already present: ${relative}`,
        );
        continue;
      }

      throw new Error(
        `New file already exists with different content: ${relative}`,
      );
    }

    writeText(
      targetPath,
      content,
    );

    createdPaths.push(relative);

    console.log(
      `Created: ${relative}`,
    );
  }

  const syntaxFiles = [
    "api/auth/login.js",
    "api/auth/session.js",
    "api/lib/authCookies.js",
    "api/lib/ownerRequest.js",
    "server/lib/authSecurity.js",
  ];

  for (const relative of syntaxFiles) {
    const result = spawnSync(
      process.execPath,
      [
        "--check",
        path.join(root, relative),
      ],
      {
        encoding: "utf8",
        shell: false,
      },
    );

    if (result.status !== 0) {
      throw new Error(
        result.stderr ||
        `Syntax check failed: ${relative}`,
      );
    }
  }

  const nodeModules =
    path.join(root, "node_modules");

  if (fs.existsSync(nodeModules)) {
    const build = spawnSync(
      "npm",
      ["run", "build"],
      {
        cwd: root,
        encoding: "utf8",
        shell:
          process.platform === "win32",
      },
    );

    if (build.status !== 0) {
      throw new Error(
        build.stderr ||
        build.stdout ||
        "npm run build failed",
      );
    }

    const lint = spawnSync(
      "npm",
      ["run", "lint"],
      {
        cwd: root,
        encoding: "utf8",
        shell:
          process.platform === "win32",
      },
    );

    if (lint.status !== 0) {
      throw new Error(
        lint.stderr ||
        lint.stdout ||
        "npm run lint failed",
      );
    }

    console.log(
      "Build and lint passed.",
    );
  } else {
    console.log(
      "node_modules is absent, so build and lint were skipped.",
    );
  }

  console.log("");
  console.log(
    "ISTe TOTP MFA source patch applied successfully.",
  );

  console.log(
    `Backup: ${backupRoot}`,
  );

  console.log(
    "Review git diff, then commit and deploy the source code.",
  );

  console.log(
    "Do not apply the Supabase aal2 migration until the new source deployment is live.",
  );
} catch (error) {
  restore();

  console.error("");
  console.error(
    "Patch failed. Original files were restored.",
  );

  console.error(
    error?.stack || error,
  );

  process.exitCode = 1;
}
