// Tournament V2 owner input validation. Pure functions: no database writes.
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const FORMATS = new Set(["single_elimination"]);
const BEST_OF = new Set([1, 3, 5]);
const CAPACITIES = new Set([2, 4, 8, 16, 32, 64, 128]);
const FIELDS = new Set(["slug","title","game","format","best_of","capacity","timezone","registration_start","registration_end","starts_at"]);

function isoOrNull(value) {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value !== "string" || !/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d{1,3})?Z$/.test(value)) return undefined;
  const date = new Date(value);
  return Number.isFinite(date.valueOf()) ? date.toISOString() : undefined;
}

export function validateTournamentDraft(input) {
  if (!input || typeof input !== "object" || Array.isArray(input)) return { ok:false, error:"INVALID_BODY" };
  if (Object.keys(input).some((key) => !FIELDS.has(key))) return { ok:false, error:"UNKNOWN_FIELD" };

  const slug = typeof input.slug === "string" ? input.slug.trim() : "";
  const title = typeof input.title === "string" ? input.title.trim() : "";
  const game = input.game === undefined ? "CS2" : input.game;
  const format = input.format === undefined ? "single_elimination" : input.format;
  const best_of = input.best_of === undefined ? 3 : input.best_of;
  const capacity = input.capacity === undefined ? 8 : input.capacity;
  const timezone = input.timezone === undefined ? "Europe/Kyiv" : input.timezone;

  if (!SLUG.test(slug) || slug.length > 100) return { ok:false, error:"INVALID_SLUG" };
  if (title.length < 3 || title.length > 160) return { ok:false, error:"INVALID_TITLE" };
  if (game !== "CS2" || !FORMATS.has(format)) return { ok:false, error:"INVALID_FORMAT" };
  if (!BEST_OF.has(best_of) || !CAPACITIES.has(capacity)) return { ok:false, error:"INVALID_BRACKET" };
  if (timezone !== "Europe/Kyiv") return { ok:false, error:"INVALID_TIMEZONE" };

  const registration_start = isoOrNull(input.registration_start);
  const registration_end = isoOrNull(input.registration_end);
  const starts_at = isoOrNull(input.starts_at);
  if ([registration_start,registration_end,starts_at].some((x)=>x===undefined)) return { ok:false, error:"INVALID_DATE" };
  if (registration_start && registration_end && registration_start >= registration_end) return { ok:false, error:"INVALID_REGISTRATION_WINDOW" };
  if (registration_end && starts_at && registration_end > starts_at) return { ok:false, error:"REGISTRATION_AFTER_START" };

  return {
    ok: true,
    value: { slug,title,game,format,best_of,capacity,timezone,registration_start,registration_end,starts_at,status:"draft" },
  };
}
