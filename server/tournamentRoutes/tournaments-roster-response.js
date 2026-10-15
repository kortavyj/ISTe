import { guardRequest } from "../apiLib/requestGuard.js";
import { readJsonBody, isUuid } from "../apiLib/requestBody.js";
import { readAuthCookies, setAuthCookies, clearAuthCookies } from "../apiLib/authCookies.js";
import { getSupabaseServerClient } from "../apiLib/supabaseServer.js";

export default async function handler(request,response) {
 response.setHeader("Cache-Control","no-store, private");
 response.setHeader("X-Content-Type-Options","nosniff");
 const guard=guardRequest(request,{methods:["POST"],requireJson:true,requireOrigin:true,maxBodyBytes:1024});
 if(!guard.ok) {
   if(guard.allow) response.setHeader("Allow",guard.allow);
   return response.status(guard.status).json({ok:false,error:guard.error});
 }
 const input=readJsonBody(request);
 if(!input || typeof input!=="object" || Array.isArray(input)
   || Object.keys(input).some(key=>!["memberId","accept"].includes(key))
   || !isUuid(input.memberId) || typeof input.accept!=="boolean")
   return response.status(400).json({ok:false,error:"INVALID_REQUEST"});
 const {accessToken,refreshToken}=readAuthCookies(request);
 if(!refreshToken) {
   clearAuthCookies(response);
   return response.status(401).json({ok:false,error:"AUTH_REQUIRED"});
 }
 try {
   const supabase=getSupabaseServerClient();
   const session=await supabase.auth.setSession({access_token:accessToken,refresh_token:refreshToken});
   if(session.error || !session.data?.session || !session.data?.user) {
     clearAuthCookies(response);
     return response.status(401).json({ok:false,error:"AUTH_REQUIRED"});
   }
   setAuthCookies(response,session.data.session);
   if(process.env.ISTE_TOURNAMENT_WRITES_ENABLED!=="true")
     return response.status(503).json({ok:false,error:"TOURNAMENT_WRITES_DISABLED"});
   const {data,error}=await supabase.rpc("iste_v2_respond_roster_membership",{
     p_member_id:input.memberId,p_accept:input.accept,
   });
   if(error) {
     if(["PGRST202","42883"].includes(error.code))
       return response.status(503).json({ok:false,error:"ROSTER_RESPONSE_NOT_READY"});
     if(error.code==="42501" && error.message==="ACCOUNT_BLOCKED")
       return response.status(403).json({ok:false,error:"ACCOUNT_BLOCKED"});
     if(error.code==="40001" && error.message==="MEMBERSHIP_ALREADY_CONFIRMED")
       return response.status(409).json({ok:false,error:"MEMBERSHIP_ALREADY_CONFIRMED"});
     return response.status(409).json({ok:false,error:"ROSTER_RESPONSE_REJECTED"});
   }
   return response.status(200).json({ok:true,result:data});
 } catch {
   return response.status(500).json({ok:false,error:"ROSTER_RESPONSE_FAILED"});
 }
}
