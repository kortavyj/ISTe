import { guardRequest } from "../apiLib/requestGuard.js";
import { readJsonBody, isUuid } from "../apiLib/requestBody.js";
import { readAuthCookies, setAuthCookies, clearAuthCookies } from "../apiLib/authCookies.js";
import { getSupabaseServerClient } from "../apiLib/supabaseServer.js";

export function createReplacementInviteHandler({getClient=getSupabaseServerClient,writesEnabled=()=>process.env.ISTE_TOURNAMENT_WRITES_ENABLED==="true"}={}) {
 return async function handler(request,response) {
  response.setHeader("Cache-Control","no-store, private");
  response.setHeader("X-Content-Type-Options","nosniff");
  const guard=guardRequest(request,{methods:["POST"],requireJson:true,requireOrigin:true,maxBodyBytes:1024});
  if(!guard.ok) {
   if(guard.allow) response.setHeader("Allow",guard.allow);
   return response.status(guard.status).json({ok:false,error:guard.error});
  }
  const input=readJsonBody(request);
  if(!input || typeof input!=="object" || Array.isArray(input)
   || Object.keys(input).some(key=>!["teamId","userId"].includes(key))
   || !isUuid(input.teamId) || !isUuid(input.userId))
   return response.status(400).json({ok:false,error:"INVALID_REPLACEMENT_REQUEST"});
  const {accessToken,refreshToken}=readAuthCookies(request);
  if(!refreshToken) {
   clearAuthCookies(response);
   return response.status(401).json({ok:false,error:"AUTH_REQUIRED"});
  }
  try {
   const supabase=getClient();
   const session=await supabase.auth.setSession({access_token:accessToken,refresh_token:refreshToken});
   if(session.error || !session.data?.session || !session.data?.user) {
    clearAuthCookies(response);
    return response.status(401).json({ok:false,error:"AUTH_REQUIRED"});
   }
   setAuthCookies(response,session.data.session);
   if(!writesEnabled()) return response.status(503).json({ok:false,error:"TOURNAMENT_WRITES_DISABLED"});
   const {data,error}=await supabase.rpc("iste_v2_invite_replacement",{
    p_team_id:input.teamId,p_user_id:input.userId,
   });
   if(error) {
    if(["PGRST202","42883"].includes(error.code))
     return response.status(503).json({ok:false,error:"REPLACEMENT_RPC_NOT_READY"});
    if(error.code==="42501" && error.message==="TEAM_NOT_FOUND")
     return response.status(403).json({ok:false,error:"CAPTAIN_REQUIRED"});
    if(error.code==="22023" && error.message==="PLAYER_ACCOUNT_NOT_FOUND")
     return response.status(400).json({ok:false,error:"PLAYER_ACCOUNT_NOT_FOUND"});
    if(error.code==="42501" && error.message==="ACCOUNT_BLOCKED")
     return response.status(403).json({ok:false,error:"ACCOUNT_BLOCKED"});
    return response.status(409).json({ok:false,error:"REPLACEMENT_REJECTED"});
   }
   return response.status(201).json({ok:true,invitation:data});
  } catch {
   return response.status(500).json({ok:false,error:"REPLACEMENT_FAILED"});
  }
 };
}
export default createReplacementInviteHandler();
