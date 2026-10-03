import { randomBytes } from "node:crypto";

import { guardRequest } from "../api/lib/requestGuard.js";
import { readJsonBody } from "../api/lib/requestBody.js";
import { requireTacticsAccess } from "./lib/tacticsRequest.js";
import { getSupabaseAdminClient } from "./lib/supabaseAdmin.js";

const MAPS = new Set([
  "mirage",
  "ancient",
  "inferno",
  "nuke",
  "anubis",
  "dust2",
  "cache",
]);

const VISIBILITY = new Set([
  "private",
  "team",
]);

const COLUMNS = [
  "id",
  "author_id",
  "title",
  "map_id",
  "visibility",
  "board_state",
  "created_at",
  "updated_at",
].join(", ");

function sendError(
  response,
  status,
  error,
) {
  return response.status(status).json({
    ok: false,
    error,
  });
}

async function getAccess(
  request,
  response,
) {
  const access =
    await requireTacticsAccess(
      request,
      response,
    );

  if (!access.ok) {
    sendError(
      response,
      access.status,
      access.error,
    );

    return null;
  }

  return access;
}

const TACTICS_MANAGER_ROLES = new Set([
  "game_manager",
  "admin",
  "owner",
]);

function normalize(
  row,
  author = null,
) {
  return {
    id: row.id,
    authorId: row.author_id,
    author: author
      ? {
          id: author.id,
          username:
            author.username || "",
          displayName:
            author.display_name || "",
          avatarUrl:
            author.avatar_url || "",
        }
      : null,
    title: row.title,
    mapId: row.map_id,
    visibility: row.visibility,
    boardState:
      row.board_state &&
      typeof row.board_state === "object"
        ? row.board_state
        : {
            items: [],
            layer: "upper",
          },
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function canManage(
  access,
  tactic,
) {
  return (
    tactic.author_id === access.user.id ||
    TACTICS_MANAGER_ROLES.has(
      access.role,
    )
  );
}

function normalizeShare(row) {
  return {
    id: row.id,
    token: row.token,
    expiresAt: row.expires_at,
    revokedAt: row.revoked_at,
    createdAt: row.created_at,
  };
}

function readBodyId(request) {
  const body =
    readJsonBody(request);

  return {
    body,
    id:
      typeof body?.id === "string"
        ? body.id.trim()
        : "",
  };
}

async function getManageableTactic(
  supabase,
  access,
  id,
) {
  if (!id) {
    return {
      ok: false,
      status: 400,
      error: "TACTIC_ID_REQUIRED",
    };
  }

  const {
    data,
    error,
  } = await supabase
    .from("iste_tactics")
    .select(COLUMNS)
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;

  if (!data) {
    return {
      ok: false,
      status: 404,
      error: "TACTIC_NOT_FOUND",
    };
  }

  if (
    !canManage(
      access,
      data,
    )
  ) {
    return {
      ok: false,
      status: 403,
      error: "TACTIC_EDIT_FORBIDDEN",
    };
  }

  return {
    ok: true,
    tactic: data,
  };
}

function expiryFromPreset(value) {
  const preset =
    typeof value === "string"
      ? value.trim().toLowerCase()
      : "7d";

  if (preset === "never") {
    return null;
  }

  const durations = {
    "24h": 24 * 60 * 60 * 1000,
    "7d": 7 * 24 * 60 * 60 * 1000,
    "30d": 30 * 24 * 60 * 60 * 1000,
  };

  const duration =
    durations[preset] ||
    durations["7d"];

  return new Date(
    Date.now() + duration,
  ).toISOString();
}


async function handleList(
  request,
  response,
) {
  const guard = guardRequest(request, {
    methods: ["GET"],
    requireJson: false,
    requireOrigin: false,
  });

  if (!guard.ok) {
    return sendError(
      response,
      guard.status,
      guard.error,
    );
  }

  const access =
    await getAccess(
      request,
      response,
    );

  if (!access) return;

  try {
    const supabase =
      getSupabaseAdminClient();

    let query =
      supabase
        .from("iste_tactics")
        .select(COLUMNS);

    if (
      !TACTICS_MANAGER_ROLES.has(
        access.role,
      )
    ) {
      query = query.or(
        `visibility.eq.team,author_id.eq.${access.user.id}`,
      );
    }

    const { data, error } =
      await query
        .order(
          "updated_at",
          { ascending: false },
        )
        .limit(200);

    if (error) throw error;

    const rows =
      Array.isArray(data)
        ? data
        : [];

    const authorIds = [
      ...new Set(
        rows
          .map(
            (row) =>
              row.author_id,
          )
          .filter(Boolean),
      ),
    ];

    let authorById =
      new Map();

    if (authorIds.length) {
      const {
        data: authors,
        error: authorError,
      } = await supabase
        .from("profiles")
        .select(
          "id, username, display_name, avatar_url",
        )
        .in(
          "id",
          authorIds,
        );

      if (authorError) {
        throw authorError;
      }

      authorById =
        new Map(
          (authors || []).map(
            (author) => [
              author.id,
              author,
            ],
          ),
        );
    }

    return response
      .status(200)
      .json({
        ok: true,
        manager:
          TACTICS_MANAGER_ROLES.has(
            access.role,
          ),
        tactics:
          rows.map(
            (row) =>
              normalize(
                row,
                authorById.get(
                  row.author_id,
                ) || null,
              ),
          ),
      });
  } catch (error) {
    console.error(
      "Tactics list error:",
      error,
    );

    return sendError(
      response,
      500,
      "TACTICS_LOAD_FAILED",
    );
  }
}

function readPayload(body) {
  const id =
    typeof body?.id === "string"
      ? body.id.trim()
      : "";

  const title =
    typeof body?.title === "string"
      ? body.title.trim()
      : "";

  const mapId =
    typeof body?.mapId === "string"
      ? body.mapId.trim().toLowerCase()
      : "";

  const visibility =
    typeof body?.visibility === "string"
      ? body.visibility.trim().toLowerCase()
      : "";

  const boardState =
    body?.boardState &&
    typeof body.boardState === "object" &&
    !Array.isArray(body.boardState)
      ? body.boardState
      : null;

  if (
    !title ||
    title.length > 100
  ) {
    return {
      ok: false,
      error: "INVALID_TACTIC_TITLE",
    };
  }

  if (!MAPS.has(mapId)) {
    return {
      ok: false,
      error: "INVALID_TACTIC_MAP",
    };
  }

  if (!VISIBILITY.has(visibility)) {
    return {
      ok: false,
      error: "INVALID_TACTIC_VISIBILITY",
    };
  }

  if (
    !boardState ||
    !Array.isArray(boardState.items) ||
    boardState.items.length > 600
  ) {
    return {
      ok: false,
      error: "INVALID_BOARD_STATE",
    };
  }

  const serialized =
    JSON.stringify(boardState);

  if (serialized.length > 350000) {
    return {
      ok: false,
      error: "BOARD_STATE_TOO_LARGE",
    };
  }

  return {
    ok: true,
    value: {
      id,
      title,
      map_id: mapId,
      visibility,
      board_state: boardState,
    },
  };
}

async function handleSave(
  request,
  response,
) {
  const guard = guardRequest(request, {
    methods: ["POST"],
    requireJson: true,
    requireOrigin: true,
    maxBodyBytes: 400 * 1024,
  });

  if (!guard.ok) {
    return sendError(
      response,
      guard.status,
      guard.error,
    );
  }

  const access =
    await getAccess(
      request,
      response,
    );

  if (!access) return;

  const payload =
    readPayload(
      readJsonBody(request),
    );

  if (!payload.ok) {
    return sendError(
      response,
      400,
      payload.error,
    );
  }

  try {
    const supabase =
      getSupabaseAdminClient();

    const value = payload.value;

    if (value.id) {
      const {
        data: existing,
        error: findError,
      } = await supabase
        .from("iste_tactics")
        .select("id, author_id")
        .eq("id", value.id)
        .maybeSingle();

      if (findError) throw findError;

      if (!existing) {
        return sendError(
          response,
          404,
          "TACTIC_NOT_FOUND",
        );
      }

      if (
        !canManage(
          access,
          existing,
        )
      ) {
        return sendError(
          response,
          403,
          "TACTIC_EDIT_FORBIDDEN",
        );
      }

      const {
        id,
        ...changes
      } = value;

      const { data, error } =
        await supabase
          .from("iste_tactics")
          .update(changes)
          .eq("id", id)
          .select(COLUMNS)
          .single();

      if (error) throw error;

      return response
        .status(200)
        .json({
          ok: true,
          tactic: normalize(data),
        });
    }

    const {
      id,
      ...insert
    } = value;

    const { data, error } =
      await supabase
        .from("iste_tactics")
        .insert({
          ...insert,
          author_id:
            access.user.id,
        })
        .select(COLUMNS)
        .single();

    if (error) throw error;

    return response
      .status(200)
      .json({
        ok: true,
        tactic: normalize(data),
      });
  } catch (error) {
    console.error(
      "Tactics save error:",
      error,
    );

    return sendError(
      response,
      500,
      "TACTICS_SAVE_FAILED",
    );
  }
}

async function handleDelete(
  request,
  response,
) {
  const guard = guardRequest(request, {
    methods: ["POST"],
    requireJson: true,
    requireOrigin: true,
    maxBodyBytes: 8 * 1024,
  });

  if (!guard.ok) {
    return sendError(
      response,
      guard.status,
      guard.error,
    );
  }

  const access =
    await getAccess(
      request,
      response,
    );

  if (!access) return;

  const body =
    readJsonBody(request);

  const id =
    typeof body?.id === "string"
      ? body.id.trim()
      : "";

  if (!id) {
    return sendError(
      response,
      400,
      "TACTIC_ID_REQUIRED",
    );
  }

  try {
    const supabase =
      getSupabaseAdminClient();

    const {
      data: existing,
      error: findError,
    } = await supabase
      .from("iste_tactics")
      .select("id, author_id")
      .eq("id", id)
      .maybeSingle();

    if (findError) throw findError;

    if (!existing) {
      return sendError(
        response,
        404,
        "TACTIC_NOT_FOUND",
      );
    }

    if (
      !canManage(
        access,
        existing,
      )
    ) {
      return sendError(
        response,
        403,
        "TACTIC_EDIT_FORBIDDEN",
      );
    }

    const { error } =
      await supabase
        .from("iste_tactics")
        .delete()
        .eq("id", id);

    if (error) throw error;

    return response
      .status(200)
      .json({
        ok: true,
      });
  } catch (error) {
    console.error(
      "Tactics delete error:",
      error,
    );

    return sendError(
      response,
      500,
      "TACTICS_DELETE_FAILED",
    );
  }
}


async function handleShareList(
  request,
  response,
) {
  const guard = guardRequest(request, {
    methods: ["POST"],
    requireJson: true,
    requireOrigin: true,
    maxBodyBytes: 8 * 1024,
  });

  if (!guard.ok) {
    return sendError(
      response,
      guard.status,
      guard.error,
    );
  }

  const access =
    await getAccess(
      request,
      response,
    );

  if (!access) return;

  const {
    id,
  } = readBodyId(request);

  try {
    const supabase =
      getSupabaseAdminClient();

    const tactic =
      await getManageableTactic(
        supabase,
        access,
        id,
      );

    if (!tactic.ok) {
      return sendError(
        response,
        tactic.status,
        tactic.error,
      );
    }

    const { data, error } =
      await supabase
        .from("iste_tactic_shares")
        .select(
          "id, token, expires_at, revoked_at, created_at",
        )
        .eq("tactic_id", id)
        .is("revoked_at", null)
        .order(
          "created_at",
          { ascending: false },
        )
        .limit(20);

    if (error) throw error;

    return response
      .status(200)
      .json({
        ok: true,
        shares:
          Array.isArray(data)
            ? data.map(normalizeShare)
            : [],
      });
  } catch (error) {
    console.error(
      "Tactics share list error:",
      error,
    );

    return sendError(
      response,
      500,
      "TACTIC_SHARE_LIST_FAILED",
    );
  }
}

async function handleShareCreate(
  request,
  response,
) {
  const guard = guardRequest(request, {
    methods: ["POST"],
    requireJson: true,
    requireOrigin: true,
    maxBodyBytes: 8 * 1024,
  });

  if (!guard.ok) {
    return sendError(
      response,
      guard.status,
      guard.error,
    );
  }

  const access =
    await getAccess(
      request,
      response,
    );

  if (!access) return;

  const {
    body,
    id,
  } = readBodyId(request);

  try {
    const supabase =
      getSupabaseAdminClient();

    const tactic =
      await getManageableTactic(
        supabase,
        access,
        id,
      );

    if (!tactic.ok) {
      return sendError(
        response,
        tactic.status,
        tactic.error,
      );
    }

    if (
      tactic.tactic.board_state
        ?.isTemplate === true
    ) {
      return sendError(
        response,
        400,
        "TEMPLATE_SHARE_FORBIDDEN",
      );
    }

    const token =
      randomBytes(24)
        .toString("base64url");

    const expiresAt =
      expiryFromPreset(
        body?.expiresIn,
      );

    const { data, error } =
      await supabase
        .from("iste_tactic_shares")
        .insert({
          tactic_id: id,
          created_by:
            access.user.id,
          token,
          expires_at:
            expiresAt,
        })
        .select(
          "id, token, expires_at, revoked_at, created_at",
        )
        .single();

    if (error) throw error;

    return response
      .status(200)
      .json({
        ok: true,
        share:
          normalizeShare(data),
      });
  } catch (error) {
    console.error(
      "Tactics share create error:",
      error,
    );

    return sendError(
      response,
      500,
      "TACTIC_SHARE_CREATE_FAILED",
    );
  }
}

async function handleShareRevoke(
  request,
  response,
) {
  const guard = guardRequest(request, {
    methods: ["POST"],
    requireJson: true,
    requireOrigin: true,
    maxBodyBytes: 8 * 1024,
  });

  if (!guard.ok) {
    return sendError(
      response,
      guard.status,
      guard.error,
    );
  }

  const access =
    await getAccess(
      request,
      response,
    );

  if (!access) return;

  const body =
    readJsonBody(request);

  const shareId =
    typeof body?.shareId === "string"
      ? body.shareId.trim()
      : "";

  if (!shareId) {
    return sendError(
      response,
      400,
      "TACTIC_SHARE_ID_REQUIRED",
    );
  }

  try {
    const supabase =
      getSupabaseAdminClient();

    const {
      data: share,
      error: shareError,
    } = await supabase
      .from("iste_tactic_shares")
      .select(
        "id, tactic_id, revoked_at",
      )
      .eq("id", shareId)
      .maybeSingle();

    if (shareError) throw shareError;

    if (!share) {
      return sendError(
        response,
        404,
        "TACTIC_SHARE_NOT_FOUND",
      );
    }

    const tactic =
      await getManageableTactic(
        supabase,
        access,
        share.tactic_id,
      );

    if (!tactic.ok) {
      return sendError(
        response,
        tactic.status,
        tactic.error,
      );
    }

    const { error } =
      await supabase
        .from("iste_tactic_shares")
        .update({
          revoked_at:
            new Date()
              .toISOString(),
        })
        .eq(
          "id",
          shareId,
        );

    if (error) throw error;

    return response
      .status(200)
      .json({
        ok: true,
      });
  } catch (error) {
    console.error(
      "Tactics share revoke error:",
      error,
    );

    return sendError(
      response,
      500,
      "TACTIC_SHARE_REVOKE_FAILED",
    );
  }
}

export default async function tacticsHandler(
  request,
  response,
) {
  response.setHeader(
    "Cache-Control",
    "no-store, private",
  );

  const rawAction =
    Array.isArray(
      request.query?.action,
    )
      ? request.query.action[0]
      : request.query?.action;

  const action =
    typeof rawAction === "string"
      ? rawAction.trim().toLowerCase()
      : "list";

  if (action === "list") {
    return handleList(
      request,
      response,
    );
  }

  if (action === "save") {
    return handleSave(
      request,
      response,
    );
  }

  if (action === "delete") {
    return handleDelete(
      request,
      response,
    );
  }

  if (action === "share-list") {
    return handleShareList(
      request,
      response,
    );
  }

  if (action === "share-create") {
    return handleShareCreate(
      request,
      response,
    );
  }

  if (action === "share-revoke") {
    return handleShareRevoke(
      request,
      response,
    );
  }

  return sendError(
    response,
    404,
    "TACTICS_ACTION_NOT_FOUND",
  );
}
