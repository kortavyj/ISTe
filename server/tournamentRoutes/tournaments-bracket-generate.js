import { guardRequest } from "../apiLib/requestGuard.js";
import { requireOwner } from "../apiLib/ownerRequest.js";
import { readJsonBody, isUuid } from "../apiLib/requestBody.js";

// A full bracket is generated only by an audited owner-only database RPC.
// Production mutation stays disabled until migration and integration review.
export default async function handler(request,response) {
 response.setHeader("Cache-Control","no-store, private");
 response.setHeader("X-Content-Type-Options","nosniff");
 const guard=guardRequest(request,{methods:["POST"],requireJson:true,requireOrigin:true,maxBodyBytes:1024});
 if(!guard.ok) {
  if(guard.allow) response.setHeader("Allow",guard.allow);
  return response.status(guard.status).json({ok:false,error:guard.error});
 }
 const owner=await requireOwner(request,response);
 if(!owner.ok) return response.status(owner.status).json({
  ok:false,error:owner.error,message:owner.message,
 });
 if(process.env.ISTE_TOURNAMENT_WRITES_ENABLED!=="true")
  return response.status(503).json({ok:false,error:"TOURNAMENT_WRITES_DISABLED"});
 const body=readJsonBody(request);
 if(!body||typeof body!=="object"||Array.isArray(body)||
    Object.keys(body).some(k=>k!=="tournamentId")||
    !isUuid(body.tournamentId))
   return response.status(400).json({ok:false,error:"INVALID_BRACKET_REQUEST"});
 try {
  const {data,error}=await owner.supabase.rpc("iste_owner_generate_bracket",{
    p_tournament_id:body.tournamentId,
  });
  if(error) {
   if(["PGRST202","42883"].includes(error.code))
    return response.status(503).json({ok:false,error:"BRACKET_RPC_NOT_INSTALLED"});
   return response.status(409).json({ok:false,error:"BRACKET_GENERATION_REJECTED",
     message:"Для создания сетки нужны одобренные команды на все места, статус check-in и отсутствие существующей сетки."});
  }
  return response.status(201).json({ok:true,bracket:data});
 } catch {
  return response.status(500).json({ok:false,error:"BRACKET_GENERATION_FAILED"});
 }
}
