import { guardRequest } from "../apiLib/requestGuard.js";
import { requireOwner } from "../apiLib/ownerRequest.js";
import { isUuid, readQueryString } from "../apiLib/requestBody.js";

// Only the authenticated owner with MFA AAL2 may read pending rosters.
// Unlike regular RLS public views, private application data goes through
// this separately authorized database RPC.
export default async function handler(request,response) {
 response.setHeader("Cache-Control","no-store, private");
 response.setHeader("X-Content-Type-Options","nosniff");
 const guard=guardRequest(request,{methods:["GET"],requireJson:false,requireOrigin:false});
 if(!guard.ok) {
  if(guard.allow) response.setHeader("Allow",guard.allow);
  return response.status(guard.status).json({ok:false,error:guard.error});
 }
 const owner=await requireOwner(request,response);
 if(!owner.ok) return response.status(owner.status).json({
  ok:false,error:owner.error,message:owner.message,
 });
 const tournamentId=readQueryString(request.query?.tournamentId,45);
 if(!isUuid(tournamentId)) return response.status(400).json({
  ok:false,error:"INVALID_TOURNAMENT_ID",
 });
 try {
  const {data,error}=await owner.supabase.rpc("iste_owner_list_teams",{
   p_tournament_id:tournamentId,
  });
  if(error) {
   if(["PGRST202","42883"].includes(error.code)) return response.status(503).json({
    ok:false,error:"TEAM_LIST_RPC_NOT_INSTALLED",
   });
   return response.status(502).json({ok:false,error:"TEAM_LIST_UNAVAILABLE"});
  }
  return response.status(200).json({ok:true,teams:Array.isArray(data)?data:[]});
 } catch {
  return response.status(500).json({ok:false,error:"TEAM_LIST_FAILED"});
 }
}
