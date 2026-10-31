import { guardRequest } from "../server/apiLib/requestGuard.js";
import { readJsonBody } from "../server/apiLib/requestBody.js";
import { getSupabaseServerClient } from "../server/apiLib/supabaseServer.js";

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  const guard = guardRequest(req, { methods: ["POST"], maxBodyBytes: 8000 });
  if (!guard.ok) return res.status(guard.status).json({ ok: false, message: "Запит відхилено." });
  const body = readJsonBody(req);
  if (!body || typeof body !== "object") return res.status(400).json({ ok: false, message: "Некоректний запит." });
  // Hidden honeypot field is deliberately not presented to real visitors.
  if (body.website) return res.status(200).json({ ok: true });
  const clean = (value) => typeof value === "string" ? value.trim() : "";
  const kind = clean(body.kind);
  const organization = clean(body.name);
  const contact = clean(body.contact);
  const message = clean(body.message);
  if (!["partner", "tournament"].includes(kind) || organization.length < 2 || organization.length > 120 || contact.length < 3 || contact.length > 180 || message.length < 10 || message.length > 2500 || body.accepted !== true) {
    return res.status(400).json({ ok: false, message: "Перевірте обов'язкові поля." });
  }
  try {
    const db = getSupabaseServerClient();
    const { error } = await db.from("collaboration_requests").insert({ kind, organization, contact, message });
    if (error) { console.error("Collaboration insert failed", error.code); return res.status(503).json({ ok: false, message: "Не вдалося зберегти заявку. Спробуйте пізніше." }); }
    return res.status(201).json({ ok: true });
  } catch (error) {
    console.error("Collaboration API unavailable", error?.message);
    return res.status(503).json({ ok: false, message: "Сервіс тимчасово недоступний." });
  }
}
