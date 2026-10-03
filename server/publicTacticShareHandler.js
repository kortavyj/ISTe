import { guardRequest } from "../api/lib/requestGuard.js";
import { getSupabaseAdminClient } from "./lib/supabaseAdmin.js";

function sendError(
  response,
  status,
  error,
) {
  return response
    .status(status)
    .json({
      ok: false,
      error,
    });
}

function readToken(request) {
  const raw =
    Array.isArray(
      request.query?.token,
    )
      ? request.query.token[0]
      : request.query?.token;

  const token =
    typeof raw === "string"
      ? raw.trim()
      : "";

  return /^[A-Za-z0-9_-]{20,80}$/.test(
    token,
  )
    ? token
    : "";
}

export default async function publicTacticShareHandler(
  request,
  response,
) {
  response.setHeader(
    "Cache-Control",
    "no-store, private",
  );

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

  const token =
    readToken(request);

  if (!token) {
    return sendError(
      response,
      400,
      "TACTIC_SHARE_TOKEN_INVALID",
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
        "id, tactic_id, expires_at, revoked_at",
      )
      .eq("token", token)
      .maybeSingle();

    if (shareError) throw shareError;

    if (
      !share ||
      share.revoked_at
    ) {
      return sendError(
        response,
        404,
        "TACTIC_SHARE_NOT_FOUND",
      );
    }

    if (
      share.expires_at &&
      new Date(
        share.expires_at,
      ).getTime() <= Date.now()
    ) {
      return sendError(
        response,
        410,
        "TACTIC_SHARE_EXPIRED",
      );
    }

    const {
      data: tactic,
      error: tacticError,
    } = await supabase
      .from("iste_tactics")
      .select(
        "id, title, map_id, board_state, updated_at",
      )
      .eq(
        "id",
        share.tactic_id,
      )
      .maybeSingle();

    if (tacticError) throw tacticError;

    if (
      !tactic ||
      tactic.board_state
        ?.isTemplate === true
    ) {
      return sendError(
        response,
        404,
        "TACTIC_SHARE_NOT_FOUND",
      );
    }

    return response
      .status(200)
      .json({
        ok: true,
        tactic: {
          id:
            tactic.id,
          title:
            tactic.title,
          mapId:
            tactic.map_id,
          boardState:
            tactic.board_state &&
            typeof tactic.board_state === "object"
              ? tactic.board_state
              : {
                  items: [],
                  layer: "upper",
                },
          updatedAt:
            tactic.updated_at,
          expiresAt:
            share.expires_at,
        },
      });
  } catch (error) {
    console.error(
      "Public tactic share error:",
      error,
    );

    return sendError(
      response,
      500,
      "TACTIC_SHARE_LOAD_FAILED",
    );
  }
}
