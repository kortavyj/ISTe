import { createClient } from "@supabase/supabase-js";
import { verifyCs2EventSignature, validateCs2Event, MAX_RAW_BODY_BYTES } from "./serverEventSecurity.js";

export default async function cs2Ingest(request, response) {
 response.setHeader("Cache-Control", "no-store");
 if (request.method !== "POST") return response.status(405).json({ok:false,error:"METHOD_NOT_ALLOWED"});
 const secret = process.env.ISTE_CS2_WEBHOOK_SECRET;
 const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
 const url = process.env.SUPABASE_URL;
 const allowedServers = (process.env.ISTE_CS2_ALLOWED_SERVER_IDS || "").split(",").map(id=>id.trim().toLowerCase()).filter(Boolean);
 if (!secret || secret.length < 32 || !key || !url)
  return response.status(503).json({ok:false,error:"WEBHOOK_NOT_CONFIGURED"});
 const raw = Buffer.isBuffer(request.rawCs2Body) ? request.rawCs2Body : null;
 if (!raw || raw.length > MAX_RAW_BODY_BYTES)
  return response.status(400).json({ok:false,error:"INVALID_RAW_BODY"});
 const timestamp = request.headers["x-iste-timestamp"];
 const signature = request.headers["x-iste-signature"];
 if (!verifyCs2EventSignature({rawBody:raw,timestamp,signature,secret}))
  return response.status(401).json({ok:false,error:"SIGNATURE_INVALID"});
 let data;
 try { data = JSON.parse(new TextDecoder("utf-8",{fatal:true}).decode(raw)); } catch { return response.status(400).json({ok:false,error:"INVALID_JSON"}); }
 if (!validateCs2Event(data)) return response.status(400).json({ok:false,error:"INVALID_EVENT"});
 if (!allowedServers.includes(data.serverId.toLowerCase()))
  return response.status(403).json({ok:false,error:"SERVER_NOT_ALLOWED"});
 try {
  const supabase = createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
  const {error} = await supabase.rpc("iste_ingest_cs2_event", {
    p_server_id:data.serverId,p_match_id:data.matchId,p_event_id:data.eventId,
    p_sequence:data.sequence,p_event_type:data.type,
  });
  if (error) {
   if (/EVENT_OUT_OF_ORDER|duplicate key value|SERVER_MISMATCH/.test(error.message||""))
    return response.status(409).json({ok:false,error:"EVENT_REPLAY_OR_ORDER"});
   if (/MATCH_NOT_FOUND/.test(error.message||""))
    return response.status(404).json({ok:false,error:"MATCH_NOT_FOUND"});
   if (/SERVER_NOT_ASSIGNED/.test(error.message||""))
    return response.status(403).json({ok:false,error:"SERVER_NOT_ASSIGNED"});
   console.error("CS2 ingest rejected", error.code);
   return response.status(503).json({ok:false,error:"EVENT_INGEST_UNAVAILABLE"});
  }
  return response.status(202).json({ok:true});
 } catch {
  return response.status(503).json({ok:false,error:"EVENT_INGEST_UNAVAILABLE"});
 }
}
