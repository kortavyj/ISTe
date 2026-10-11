import cs2Ingest from "../server/tournaments/cs2Ingest.js";
import { MAX_RAW_BODY_BYTES } from "../server/tournaments/serverEventSecurity.js";

export const config = { api: { bodyParser: false } };

export default async function handler(request, response) {
 response.setHeader("Cache-Control","no-store");
 if (request.method !== "POST") return response.status(405).json({ok:false,error:"METHOD_NOT_ALLOWED"});
 const chunks = [];
 let size = 0;
 try {
  for await (const chunk of request) {
   size += chunk.length;
   if (size > MAX_RAW_BODY_BYTES) {
    return response.status(413).json({ok:false,error:"REQUEST_TOO_LARGE"});
   }
   chunks.push(chunk);
  }
 } catch {
  return response.status(400).json({ok:false,error:"INVALID_BODY"});
 }
 request.rawCs2Body = Buffer.concat(chunks).toString("utf8");
 return cs2Ingest(request,response);
}
