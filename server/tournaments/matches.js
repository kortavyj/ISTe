import { encryptRoomPassword, decryptRoomPassword } from "./roomCrypto.js";
import { guardRequest } from "../../api/lib/requestGuard.js";
import { readJsonBody, isUuid } from "../../api/lib/requestBody.js";
import { readAuthCookies, setAuthCookies } from "../../api/lib/authCookies.js";
import { getSupabaseServerClient } from "../../api/lib/supabaseServer.js";

function fail(response,status,error,message){
  return response.status(status).json({ok:false,error,message});
}
export async function authenticatedUser(request,response,supabase){
  const {accessToken,refreshToken}=readAuthCookies(request);
  if(!refreshToken)return null;
  const {data,error}=await supabase.auth.setSession({
    access_token:accessToken,refresh_token:refreshToken,
  });
  if(error||!data?.user||!data?.session)return null;
  setAuthCookies(response,data.session);
  const {data:role,error:roleError}=await supabase.from("user_roles")
    .select("role,is_blocked").eq("user_id",data.user.id).maybeSingle();
  if(roleError||(role?.is_blocked))return null;
  return data.user;
}
export default async function handler(request,response){
  response.setHeader("Cache-Control","no-store");
  response.setHeader("X-Content-Type-Options","nosniff");
  const method=request.method;
  const guard=guardRequest(request,{
    methods:["GET","POST"],requireJson:method==="POST",
    requireOrigin:method==="POST",maxBodyBytes:4096,
  });
  if(!guard.ok)return fail(response,guard.status,guard.error,"Запрос отклонён.");
  const body=method==="POST"?readJsonBody(request):null;
  const tournamentId=method==="POST"?body?.tournamentId:request.query?.tournamentId;
  if(!isUuid(tournamentId))return fail(response,400,"INVALID_TOURNAMENT","Неизвестный турнир.");
  try{
    const supabase=getSupabaseServerClient();
    if(method==="GET" && request.query?.view==="room"){
      const {accessToken,refreshToken}=readAuthCookies(request);
      if(!accessToken||!refreshToken)return fail(response,401,"AUTH_REQUIRED","Войдите в аккаунт.");
      const {data:session,error:sessionError}=await supabase.auth.setSession({access_token:accessToken,refresh_token:refreshToken});
      if(sessionError||!session?.user||!session?.session)return fail(response,401,"AUTH_REQUIRED","Сессия истекла.");
      setAuthCookies(response,session.session);
      const matchId=request.query?.matchId;
      if(!isUuid(matchId))return fail(response,400,"INVALID_MATCH","Неверный матч.");
      const {data:match,error:matchError}=await supabase.from("tournament_matches")
        .select("id").eq("id",matchId).eq("tournament_id",tournamentId).maybeSingle();
      if(matchError)throw matchError;
      if(!match)return fail(response,404,"MATCH_NOT_FOUND","Матч не найден.");
      const {data,error}=await supabase.rpc("iste_get_match_room",{p_match_id:matchId});
      if(error){
        if(/ROOM_ACCESS_DENIED|ACCOUNT_BLOCKED/.test(String(error.message)))
          return fail(response,403,"FORBIDDEN","Доступ только организатору и подтверждённым участникам матча.");
        if(/AUTH_REQUIRED/.test(String(error.message)))
          return fail(response,401,"AUTH_REQUIRED","Войдите в аккаунт.");
        throw error;
      }
      const room=data?.password ? {...data,password:decryptRoomPassword(data.password)} : data;
      return response.status(200).json({ok:true,room:room||null});
    }
    if(method==="GET" && request.query?.view==="assignments"){
      const user=await authenticatedUser(request,response,supabase);
      if(!user)return fail(response,401,"AUTH_REQUIRED","Войдите в аккаунт.");
      const {data,error}=await supabase.rpc("iste_list_cs2_assignments",{p_tournament_id:tournamentId});
      if(error){
        if(/MFA_REQUIRED|OWNER_REQUIRED|AUTH_REQUIRED/.test(String(error.message))) return fail(response,403,"FORBIDDEN","Недостаточно прав или требуется MFA.");
        throw error;
      }
      return response.status(200).json({ok:true,assignments:data?.assignments||[],history:data?.history||[]});
    }
    if(method==="GET"){
      const {data,error}=await supabase.from("tournament_matches")
        .select("id,tournament_id,round_number,match_number,team_a_id,team_b_id,winner_team_id,status,score_a,score_b")
        .eq("tournament_id",tournamentId).order("round_number")
        .order("match_number").limit(100);
      if(error)throw error;
      return response.status(200).json({ok:true,matches:data});
    }
    const user=await authenticatedUser(request,response,supabase);
    if(!user)return fail(response,401,"AUTH_REQUIRED","Войдите в аккаунт.");
    const {data:tournament,error:tournamentError}=await supabase.from("tournaments")
      .select("id,owner_user_id,status").eq("id",tournamentId).maybeSingle();
    if(tournamentError)throw tournamentError;
    if(!tournament||tournament.owner_user_id!==user.id)
      return fail(response,403,"OWNER_REQUIRED","Недостаточно прав.");
    const action=body?.action;
    let rpc;
    let params;
    if(action==="start"){
      rpc="iste_start_tournament";
      params={p_tournament_id:tournamentId};
    }else if(action==="assign-server"&&isUuid(body?.matchId)&&isUuid(body?.serverId)){
      rpc="iste_assign_cs2_server";
      params={p_match_id:body.matchId,p_server_id:body.serverId};
    }else if(action==="room-settings"&&isUuid(body?.matchId)){
      rpc="iste_save_match_room";
      params={
        p_match_id:body.matchId,
        p_server_host:body.host,
        p_server_port:body.port,
        p_server_password:encryptRoomPassword(body.password||""),
        p_map_name:body.map,
        p_connect_at:body.connectAt||null,
      };
    }else if(action==="result"&&isUuid(body?.matchId)&&Number.isInteger(body?.scoreA)&&Number.isInteger(body?.scoreB)){
      rpc="iste_confirm_tournament_match";
      params={p_match_id:body.matchId,p_score_a:body.scoreA,p_score_b:body.scoreB};
    }else return fail(response,400,"INVALID_ACTION","Неверные параметры матча.");
    if(action==="result"||action==="assign-server"||action==="room-settings"){
      const {data:match,error:matchError}=await supabase.from("tournament_matches")
        .select("id").eq("id",body.matchId).eq("tournament_id",tournamentId).maybeSingle();
      if(matchError)throw matchError;
      if(!match)return fail(response,404,"MATCH_NOT_FOUND","Матч не найден.");
    }
    const {error}=await supabase.rpc(rpc,params);
    if(error){
      const code=String(error.message||"");
      if(/OWNER_REQUIRED|ACCOUNT_BLOCKED|AUTH_REQUIRED|MFA_REQUIRED/.test(code))
        return fail(response,403,"FORBIDDEN","Операция запрещена.");
      if(/NOT_ENOUGH_TEAMS|NOT_IN_REGISTRATION|MATCH_NOT_READY|MATCH_NOT_SCHEDULED|MATCH_ALREADY_STARTED|INVALID_|NEXT_MATCH_LOCKED|BRACKET_SLOT_OCCUPIED/.test(code))
        return fail(response,409,"INVALID_STATE","Проверьте статус турнира и результат.");
      if(/RATE_LIMIT_EXCEEDED/.test(code)) return fail(response,429,"RATE_LIMITED","Слишком много запросов.");
      throw error;
    }
    return response.status(200).json({ok:true});
  }catch(error){
    console.error("Tournament match API:",error?.code||error?.message);
    return fail(response,503,"MATCH_SERVICE_UNAVAILABLE","Сервис матчей пока недоступен.");
  }
}
