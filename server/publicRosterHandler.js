import { getSupabaseAdminClient } from "./lib/supabaseAdmin.js";

const PUBLIC_COLUMNS = [
  "faceit_player_id",
  "nickname",
  "display_name",
  "real_name",
  "real_name_uk",
  "real_name_en",
  "roster_status",
  "player_role",
  "is_captain",
  "sort_order",
  "country",
  "faceit_url",
  "portrait_url",
  "socials",
  "faceit_level_override",
  "faceit_elo_override",
  "faceit_win_rate_override",
  "faceit_kd_override",
  "strengths",
  "public_visible",
  "updated_at",
].join(", ");

function isMissingRosterTable(error) {
  const source = [
    error?.code,
    error?.message,
    error?.details,
    error?.hint,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return (
    source.includes("42p01") ||
    source.includes("pgrst205") ||
    (source.includes("iste_roster") &&
      source.includes("not found"))
  );
}

function normalize(row) {
  return {
    faceitPlayerId:
      row.faceit_player_id || "",
    nickname:
      row.nickname || "",
    displayName:
      row.display_name ||
      row.nickname ||
      "",
    realName:
      row.real_name || "",
    realNameUk:
      row.real_name_uk || "",
    realNameEn:
      row.real_name_en || "",
    status:
      row.roster_status || "trial",
    role:
      row.player_role || "RIFLER",
    isCaptain:
      row.is_captain === true,
    sortOrder:
      Number(row.sort_order) || 0,
    country:
      row.country || "",
    faceitUrl:
      row.faceit_url || "",
    portraitUrl:
      row.portrait_url || "",
    socials:
      Array.isArray(row.socials)
        ? row.socials
        : [],
    faceitLevelOverride:
      Number.isFinite(row.faceit_level_override)
        ? Number(row.faceit_level_override)
        : null,
    faceitEloOverride:
      Number.isFinite(row.faceit_elo_override)
        ? Number(row.faceit_elo_override)
        : null,
    faceitWinRateOverride:
      Number.isFinite(row.faceit_win_rate_override)
        ? Number(row.faceit_win_rate_override)
        : null,
    faceitKdOverride:
      Number.isFinite(row.faceit_kd_override)
        ? Number(row.faceit_kd_override)
        : null,
    strengths:
      Array.isArray(row.strengths)
        ? row.strengths
        : [],
    updatedAt:
      row.updated_at || null,
  };
}

export default async function publicRosterHandler(
  request,
  response,
) {
  response.setHeader(
    "Cache-Control",
    "public, max-age=30, stale-while-revalidate=120",
  );

  if (request.method !== "GET") {
    response.setHeader("Allow", "GET");

    return response.status(405).json({
      ok: false,
      error: "METHOD_NOT_ALLOWED",
      message: "Метод не поддерживается.",
    });
  }

  try {
    const supabase =
      getSupabaseAdminClient();

    const { data, error } =
      await supabase
        .from("iste_roster")
        .select(PUBLIC_COLUMNS)
        .eq("public_visible", true)
        .in(
          "roster_status",
          ["main", "substitute"],
        )
        .order(
          "sort_order",
          { ascending: true },
        )
        .order(
          "nickname",
          { ascending: true },
        );

    if (error) {
      if (
        isMissingRosterTable(error)
      ) {
        return response
          .status(200)
          .json({
            ok: true,
            setupRequired: true,
            players: [],
          });
      }

      throw error;
    }

    return response
      .status(200)
      .json({
        ok: true,
        setupRequired: false,
        players:
          Array.isArray(data)
            ? data.map(normalize)
            : [],
      });
  } catch (error) {
    console.error(
      "Public roster error:",
      error,
    );

    return response
      .status(500)
      .json({
        ok: false,
        error:
          "PUBLIC_ROSTER_LOAD_FAILED",
        message:
          "Не удалось загрузить официальный состав ISTe.",
      });
  }
}
