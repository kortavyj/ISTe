import { guardRequest } from "./lib/requestGuard.js";
import { readJsonBody, isUuid } from "./lib/requestBody.js";
import { readAuthCookies, setAuthCookies } from "./lib/authCookies.js";
import { getSupabaseServerClient } from "./lib/supabaseServer.js";

function fail(response,status,error,message){
  return response.status(status).json({ok:false,error,message});
}
async function authenticatedUser(request,response,supabase){
  const {accessToken,refreshToken}=readAuthCookies(request);
  if(!refreshToken)return null;
  const {data,error}=await supabase.auth.setSession({
    access_token:accessToken,refresh_token:refreshToken,
  });
  if(error||!data?.user||!data?.session)return null;
  setAuthCookies(response,data.session);
  const {data:role,error:roleError}=await supabase.from("user_roles")
    .select("is_blocked").eq("user_id",data.user.id).maybeSingle();
  if(roleError||role?.is_blocked)return null;
  return data.user;
}
export default async function handler(request,response){
  response.setHeader("Cache-Control","no-store");
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
    }else if(action==="result"&&isUuid(body?.matchId)&&Number.isInteger(body?.scoreA)&&Number.isInteger(body?.scoreB)){
      rpc="iste_confirm_tournament_match";
      params={p_match_id:body.matchId,p_score_a:body.scoreA,p_score_b:body.scoreB};
    }else return fail(response,400,"INVALID_ACTION","Неверные параметры матча.");
    if(action==="result"){
      const {data:match,error:matchError}=await supabase.from("tournament_matches")
        .select("id").eq("id",body.matchId).eq("tournament_id",tournamentId).maybeSingle();
      if(matchError)throw matchError;
      if(!match)return fail(response,404,"MATCH_NOT_FOUND","Матч не найден.");
    }
    const {error}=await supabase.rpc(rpc,params);
    if(error){
      const code=String(error.message||"");
      if(/OWNER_REQUIRED|ACCOUNT_BLOCKED|AUTH_REQUIRED/.test(code))
        return fail(response,403,"FORBIDDEN","Операция запрещена.");
      if(/NOT_ENOUGH_TEAMS|NOT_IN_REGISTRATION|MATCH_NOT_READY|INVALID_|NEXT_MATCH_LOCKED|BRACKET_SLOT_OCCUPIED/.test(code))
        return fail(response,409,"INVALID_STATE","Проверьте статус турнира и результат.");
      throw error;
    }
    return response.status(200).json({ok:true});
  }catch(error){
    console.error("Tournament match API:",error?.code||error?.message);
    return fail(response,503,"MATCH_SERVICE_UNAVAILABLE","Сервис матчей пока недоступен.");
  }
}
