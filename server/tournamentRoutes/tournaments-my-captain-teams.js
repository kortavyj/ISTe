import { guardRequest } from "../apiLib/requestGuard.js";
import { readAuthCookies, setAuthCookies, clearAuthCookies } from "../apiLib/authCookies.js";
import { getSupabaseServerClient } from "../apiLib/supabaseServer.js";

export function createMyCaptainTeamsHandler({getClient=getSupabaseServerClient}={}) {
 return async function handler(request,response) {
 response.setHeader("Cache-Control","no-store, private");
 response.setHeader("X-Content-Type-Options","nosniff");
 const guard=guardRequest(request,{methods:["GET"],requireJson:false,requireOrigin:false});
 if(!guard.ok) {
  if(guard.allow) response.setHeader("Allow",guard.allow);
  return response.status(guard.status).json({ok:false,error:guard.error});
 }
 const {accessToken,refreshToken}=readAuthCookies(request);
 if(!refreshToken){clearAuthCookies(response);return response.status(401).json({ok:false,error:"AUTH_REQUIRED"});}
 try {
  const supabase=getClient();
  const session=await supabase.auth.setSession({access_token:accessToken,refresh_token:refreshToken});
  if(session.error || !session.data?.session || !session.data?.user){
   clearAuthCookies(response);return response.status(401).json({ok:false,error:"AUTH_REQUIRED"});
  }
  setAuthCookies(response,session.data.session);
  const {data,error}=await supabase.rpc("iste_v2_my_pending_captain_teams");
  if(error){
   if(["PGRST202","42883"].includes(error.code))return response.status(503).json({ok:false,error:"CAPTAIN_TEAMS_NOT_READY"});
   return response.status(502).json({ok:false,error:"CAPTAIN_TEAMS_UNAVAILABLE"});
  }
  return response.status(200).json({ok:true,teams:Array.isArray(data)?data:[]});
 }catch{return response.status(500).json({ok:false,error:"CAPTAIN_TEAMS_FAILED"});}
 };
}
export default createMyCaptainTeamsHandler();
