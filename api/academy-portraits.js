import { getSupabaseAdminClient } from "../server/lib/supabaseAdmin.js";

const ALLOWED = ["ivan1love", "s1zapooo", "dett3n", "agregat", "syro_s"];

export default async function handler(request, response) {
  response.setHeader("Cache-Control", "public, s-maxage=60, stale-while-revalidate=120");
  if (request.method !== "GET") {
    response.setHeader("Allow", "GET");
    return response.status(405).json({ ok: false });
  }
  try {
    const storage = getSupabaseAdminClient().storage.from("iste-roster");
    const { data, error } = await storage.list("academy", { limit: 1000, sortBy: { column: "created_at", order: "desc" } });
    if (error) throw error;
    const portraits = {};
    for (const file of data || []) {
      const match = /^([a-z0-9_]+)-\d+-[a-f0-9]{10}\.jpg$/.exec(file.name);
      if (!match || !ALLOWED.includes(match[1]) || portraits[match[1]]) continue;
      portraits[match[1]] = storage.getPublicUrl("academy/" + file.name).data.publicUrl;
    }
    return response.status(200).json({ ok: true, portraits });
  } catch (error) {
    console.error("Academy portrait lookup failed:", error);
    return response.status(503).json({ ok: false, portraits: {} });
  }
}
