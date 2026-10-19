import { useCallback, useEffect, useState } from "react";

const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export default function CaptainReplacementInvites(){
 const [teams,setTeams]=useState([]);
 const [state,setState]=useState("loading");
 const [userIds,setUserIds]=useState({});
 const [busy,setBusy]=useState("");
 const [notice,setNotice]=useState("");
 const refresh=useCallback(async()=>{
  setState("loading");
  try{
   const response=await fetch("/api/tournaments-my-captain-teams",{credentials:"include",cache:"no-store",headers:{Accept:"application/json"}});
   const payload=await response.json();
   if(response.status===503&&payload?.error==="CAPTAIN_TEAMS_NOT_READY"){setState("unavailable");return;}
   if(!response.ok||payload?.ok!==true)throw new Error("Ошибка загрузки.");
   setTeams(Array.isArray(payload.teams)?payload.teams:[]);
   setState("ready");
  }catch{setState("error");}
 },[]);
 useEffect(()=>{void refresh()},[refresh]);
 async function invite(event,teamId){
  event.preventDefault();
  const userId=(userIds[teamId]||"").trim();
  if(!UUID.test(userId)){setNotice("Укажите корректный UUID аккаунта ISTe.");return;}
  setBusy(teamId);setNotice("");
  try{
   const response=await fetch("/api/tournaments-replacement-invite",{
    method:"POST",credentials:"include",cache:"no-store",
    headers:{"Content-Type":"application/json",Accept:"application/json"},
    body:JSON.stringify({teamId,userId})
   });
   const payload=await response.json();
   if(!response.ok||payload?.ok!==true){
    const known={TOURNAMENT_WRITES_DISABLED:"Приглашения временно отключены.",CAPTAIN_REQUIRED:"Приглашать может только капитан команды.",PLAYER_ACCOUNT_NOT_FOUND:"Аккаунт ISTe с таким UUID не найден. Проверьте ID игрока и убедитесь, что он зарегистрирован на ISTe.",REPLACEMENT_REJECTED:"Приглашение отклонено: проверьте состав и статус регистрации."};
    throw new Error(known[payload?.error]||"Не удалось отправить приглашение.");
   }
   setNotice("Приглашение создано. Игрок должен подтвердить его в своём кабинете.");
   setUserIds(prev=>({...prev,[teamId]:""}));
   await refresh();
  }catch(error){setNotice(error?.message||"Не удалось отправить приглашение.");}
  finally{setBusy("");}
 }
 if(state==="unavailable")return null;
 return <section className="auth-card" aria-label="Замена игроков в турнирах" style={{marginBottom:24}}>
  <h2>Замена игроков в турнирах CS2</h2>
  {state==="loading"&&<p role="status">Загружаем команды капитана…</p>}
  {state==="error"&&<p role="alert">Не удалось загрузить команды. <button type="button" onClick={()=>void refresh()}>Повторить</button></p>}
  {state==="ready"&&teams.length===0&&<p>Ожидающих рассмотрения команд нет.</p>}
  {state==="ready"&&teams.map(team=><form key={team.team_id} onSubmit={e=>void invite(e,team.team_id)} style={{padding:"12px 0",borderTop:"1px solid #444"}}>
   <h3>{team.team_name}</h3>
   <p>{team.tournament_title} · Участников в заявке: {team.member_count} / 7</p>
   <label className="auth-field"><span>UUID аккаунта ISTe нового игрока</span>
    <input className="auth-input" value={userIds[team.team_id]||""} onChange={e=>setUserIds(prev=>({...prev,[team.team_id]:e.target.value}))} required disabled={Boolean(busy)||Number(team.member_count)>=7}/></label>
   <button className="auth-button" type="submit" disabled={Boolean(busy)||Number(team.member_count)>=7}>{busy===team.team_id?"Отправляем…":"Пригласить игрока"}</button>
  </form>)}
  {notice&&<p role="status">{notice}</p>}
 </section>
}
