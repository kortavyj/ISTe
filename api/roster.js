import { getSupabaseAdminClient } from "../server/lib/supabaseAdmin.js";

const PUBLIC_COLUMNS = [
  "faceit_player_id",
  "nickname",
  "display_name",
  "real_name",
  "roster_status",
  "player_role",
  "is_captain",
  "sort_order",
  "country",
  "faceit_url",
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
    (source.includes("iste_roster") && source.includes("not found"))
  );
}

function normalize(row) {
  return {
    faceitPlayerId: row.faceit_player_id || "",
    nickname: row.nickname || "",
    displayName: row.display_name || row.nickname || "",
    realName: row.real_name || "",
    status: row.roster_status || "trial",
    role: row.player_role || "RIFLER",
    isCaptain: row.is_captain === true,
    sortOrder: Number(row.sort_order) || 0,
    country: row.country || "",
    faceitUrl: row.faceit_url || "",
    strengths: Array.isArray(row.strengths) ? row.strengths : [],
    updatedAt: row.updated_at || null,
  };
}

export default async function handler(request, response) {
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
    const supabase = getSupabaseAdminClient();

    const { data, error } = await supabase
      .from("iste_roster")
      .select(PUBLIC_COLUMNS)
      .eq("public_visible", true)
      .in("roster_status", ["main", "substitute"])
      .order("sort_order", { ascending: true })
      .order("nickname", { ascending: true });

    if (error) {
      if (isMissingRosterTable(error)) {
        return response.status(200).json({
          ok: true,
          setupRequired: true,
          players: [],
        });
      }

      throw error;
    }

    return response.status(200).json({
      ok: true,
      setupRequired: false,
      players: Array.isArray(data) ? data.map(normalize) : [],
    });
  } catch (error) {
    console.error("Public roster error:", error);

    return response.status(500).json({
      ok: false,
      error: "PUBLIC_ROSTER_LOAD_FAILED",
      message: "Не удалось загрузить официальный состав ISTe.",
    });
  }
}
