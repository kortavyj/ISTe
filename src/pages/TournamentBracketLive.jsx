import { useState } from "react";
import { Link } from "react-router-dom";
import TournamentManualBracket from "../components/tournaments/TournamentManualBracket.jsx";
import "./TournamentBracketLive.css";
import "./TournamentWorkspaceShared.css";
import "./TournamentPremiumTheme.css";
const MAPS=["Ancient","Anubis","Dust2","Inferno","Mirage","Nuke","Overpass","Train","Vertigo"];
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export default function TournamentBracketLive(){
 const [mode,setMode]=useState("manual");
 const [id,setId]=useState(()=>new URLSearchParams(window.location.search).get("tournamentId")||"");const [matches,setMatches]=useState(null);
 const [loading,setLoading]=useState(false);const [error,setError]=useState("");
 const [editing,setEditing]=useState(null);const [saveBusy,setSaveBusy]=useState(false);const [saveError,setSaveError]=useState("");const [notice,setNotice]=useState("");
 async function load(e){
  e?.preventDefault();setError("");setMatches(null);
  if(!UUID.test(id.trim())){setError("Введите корректный UUID турнира.");return;}
  setLoading(true);
  try{
   const response=await fetch("/api/tournaments-bracket?tournamentId="+encodeURIComponent(id.trim()),{credentials:"include",cache:"no-store",headers:{Accept:"application/json"}});
   const data=await response.json();
   if(!response.ok||!data.ok)throw new Error(data.error==="BRACKET_READ_RPC_NOT_INSTALLED"?"Турнирная база ещё не подключена.":data.message||"Не удалось загрузить сетку.");
   setMatches(Array.isArray(data.matches)?data.matches:[]);
  }catch(err){setError(err.message||"Ошибка загрузки.");}finally{setLoading(false);}
 }
 function openEditor(match){
  if(!match.teamAId||!match.teamBId || !Number.isSafeInteger(match.version))return;
  setSaveError("");setNotice("");
  setEditing({id:match.id,version:match.version,bestOf:match.bestOf,nameA:match.teamAName||"Команда A",nameB:match.teamBName||"Команда B",maps:[{name:"",scoreA:"",scoreB:""}]});
 }
 function patchMap(i,key,value){setEditing(current=>({...current,maps:current.maps.map((map,index)=>index===i?{...map,[key]:value}:map)}));}
 async function confirmResult(){
  if(!editing||saveBusy)return;
  setSaveError("");
  const maps=editing.maps.map(m=>({name:m.name,scoreA:Number(m.scoreA),scoreB:Number(m.scoreB)}));
  if(maps.some((m,i)=>!MAPS.includes(m.name)||maps.findIndex(x=>x.name===m.name)!==i||!Number.isSafeInteger(m.scoreA)||!Number.isSafeInteger(m.scoreB)||m.scoreA<0||m.scoreB<0||m.scoreA>99||m.scoreB>99||m.scoreA===m.scoreB||editing.maps[i].scoreA===""||editing.maps[i].scoreB==="")){
    setSaveError("Выберите уникальные карты и корректные, неравные счета (0–99).");return;
  }
  let a=0,b=0;const need=(editing.bestOf+1)/2;
  for(const m of maps){if(a>=need||b>=need){setSaveError("Лишняя карта после победы в серии.");return;}a+=Number(m.scoreA>m.scoreB);b+=Number(m.scoreB>m.scoreA);}
  if(maps.length<need||maps.length>editing.bestOf||Math.max(a,b)!==need){setSaveError("Серия не завершена: у одной команды должно быть "+need+" побед по картам.");return;}
  setSaveBusy(true);
  try{
   const response=await fetch("/api/tournaments-match-confirm",{method:"POST",credentials:"include",cache:"no-store",headers:{"Content-Type":"application/json",Accept:"application/json"},body:JSON.stringify({matchId:editing.id,expectedVersion:editing.version,result:{bestOf:editing.bestOf,maps}})});
   const data=await response.json();
   if(!response.ok||data?.ok!==true){
    const errors={TOURNAMENT_WRITES_DISABLED:"Запись отключена сервером. Результат не сохранён.",MATCH_CONFIRM_RPC_NOT_INSTALLED:"Подтверждение матчей ещё не подключено в DEV.",MATCH_CONFIRM_REJECTED:"Матч изменён либо результат отклонён. Обновите сетку.",MFA_REQUIRED:"Нужно подтвердить MFA.",AUTH_REQUIRED:"Требуется повторный вход."};
    throw new Error(errors[data?.error]||data?.message||"Не удалось сохранить результат.");
   }
   setEditing(null);setNotice("Результат матча сохранён. Сетка обновлена.");await load();
  }catch(err){setSaveError(err?.message||"Ошибка подтверждения.");}finally{setSaveBusy(false);}
 }
 const rounds=matches===null?[]:[...new Set(matches.map(m=>m.roundIndex))].sort((a,b)=>a-b);
 return <main className="tbl-page">
  <header><p>ISTe / OWNER / TOURNAMENTS V2</p><h1>LIVE <span>BRACKET</span></h1><p>Реальная турнирная сетка и подтверждение результатов владельцем.</p></header>
  <nav><Link to="/owner/tournaments">← Панель турниров</Link><Link to="/owner/tournaments-match-lab">Тестовая сетка →</Link></nav>
  <div className="tbl-mode-tabs" role="group" aria-label="Способ создания и загрузки сетки"><button type="button" className={mode==="manual"?"is-active":""} onClick={()=>setMode("manual")}>Создать вручную · без UUID</button><button type="button" className={mode==="server"?"is-active":""} onClick={()=>setMode("server")}>Загрузить реальный турнир</button></div>
  {mode==="manual"?<TournamentManualBracket/>:<>
  <form onSubmit={load}><label htmlFor="tbl-id">UUID турнира</label><input id="tbl-id" value={id} onChange={e=>setId(e.target.value)} placeholder="xxxxxxxx-xxxx-4xxx-8xxx-xxxxxxxxxxxx" required spellCheck={false}/><button type="submit" disabled={loading}>{loading?"Загрузка…":"Загрузить"}</button></form>
  <p className="tbl-note">Здесь нет демонстрационных команд. Если база ещё не настроена, появится ошибка без подмены реальных данных.</p>
  {error?<p role="alert" className="tbl-error">{error}</p>:null}
  {notice?<p role="status" className="tbl-note">{notice}</p>:null}
  {matches?.length===0?<p role="status">Для этого турнира матчи ещё не созданы.</p>:null}
  <div className="tbl-rounds">{rounds.map(round=><section key={round}><h2>РАУНД {round+1}</h2>{matches.filter(m=>m.roundIndex===round).sort((a,b)=>a.matchIndex-b.matchIndex).map(m=><article key={m.id}>
   <small>Матч #{m.matchIndex+1} · BO{m.bestOf} · {m.status}</small>
   <p className={m.winnerTeamId===m.teamAId?"tbl-winner":""}>{m.teamAName||"Ожидается"} <strong>{m.scoreA??"—"}</strong></p>
   <p className={m.winnerTeamId===m.teamBId?"tbl-winner":""}>{m.teamBName||"Ожидается"} <strong>{m.scoreB??"—"}</strong></p>
   {m.teamAId&&m.teamBId&&m.status!=="finished"&&Number.isSafeInteger(m.version)?<button type="button" onClick={()=>openEditor(m)}>Ввести результат</button>:null}
   {m.maps?.length?<details><summary>Карты ({m.maps.length})</summary>{m.maps.map((map,i)=><div key={i}>{map.name}: {map.scoreA}–{map.scoreB}</div>)}</details>:null}
  </article>)}</section>)}</div>
  {editing?<div className="tbl-overlay"><section role="dialog" aria-modal="true" aria-labelledby="tbl-confirm-heading" className="tbl-dialog">
   <h2 id="tbl-confirm-heading">Подтверждение результата · BO{editing.bestOf}</h2>
   <p>{editing.nameA} — {editing.nameB}</p>
   <p className="tbl-note">Результат проверяется сервером и базой. Победитель определяется по победам на картах.</p>
   {editing.maps.map((m,i)=><div key={i} className="tbl-map-edit">
    <label>Карта {i+1}<select value={m.name} onChange={e=>patchMap(i,"name",e.target.value)}><option value="">Выберите карту</option>{MAPS.map(name=><option key={name} value={name}>{name}</option>)}</select></label>
    <label>{editing.nameA}<input inputMode="numeric" type="number" min="0" max="99" value={m.scoreA} onChange={e=>patchMap(i,"scoreA",e.target.value)}/></label>
    <label>{editing.nameB}<input inputMode="numeric" type="number" min="0" max="99" value={m.scoreB} onChange={e=>patchMap(i,"scoreB",e.target.value)}/></label>
   </div>)}
   <div className="tbl-dialog-actions">
    {editing.maps.length<editing.bestOf?<button type="button" disabled={saveBusy} onClick={()=>setEditing(x=>({...x,maps:[...x.maps,{name:"",scoreA:"",scoreB:""}]}))}>Добавить карту</button>:null}
    {editing.maps.length>1?<button type="button" disabled={saveBusy} onClick={()=>setEditing(x=>({...x,maps:x.maps.slice(0,-1)}))}>Убрать последнюю</button>:null}
   </div>
   {saveError?<p role="alert" className="tbl-error">{saveError}</p>:null}
   <div className="tbl-dialog-actions"><button type="button" disabled={saveBusy} onClick={()=>void confirmResult()}>{saveBusy?"Сохранение…":"Подтвердить результат"}</button><button type="button" disabled={saveBusy} onClick={()=>setEditing(null)}>Отмена</button></div>
  </section></div>:null}
  </>}
 </main>;
}
