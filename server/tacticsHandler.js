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

function normalize(row) {
  return {
    id: row.id,
    authorId: row.author_id,
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
    access.role === "owner" ||
    access.role === "game_manager"
  );
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

    const { data, error } =
      await supabase
        .from("iste_tactics")
        .select(COLUMNS)
        .or(
          \`visibility.eq.team,author_id.eq.\${access.user.id}\`,
        )
        .order(
          "updated_at",
          { ascending: false },
        )
        .limit(100);

    if (error) throw error;

    return response
      .status(200)
      .json({
        ok: true,
        tactics:
          Array.isArray(data)
            ? data.map(normalize)
            : [],
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

  return sendError(
    response,
    404,
    "TACTICS_ACTION_NOT_FOUND",
  );
}
