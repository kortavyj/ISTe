import { useState } from "react";
import { Link } from "react-router-dom";
import "./TournamentBracketLive.css";
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export default function TournamentBracketLive(){
 const [id,setId]=useState("");const [matches,setMatches]=useState(null);
 const [loading,setLoading]=useState(false);const [error,setError]=useState("");
 async function load(e){
  e.preventDefault();setError("");setMatches(null);
  if(!UUID.test(id.trim())){setError("Введите корректный UUID турнира.");return;}
  setLoading(true);
  try{
   const response=await fetch("/api/tournaments-bracket?tournamentId="+encodeURIComponent(id.trim()),{credentials:"include",cache:"no-store",headers:{Accept:"application/json"}});
   const data=await response.json();
   if(!response.ok||!data.ok)throw new Error(data.error==="BRACKET_READ_RPC_NOT_INSTALLED"?"Турнирная база ещё не подключена.":data.message||"Не удалось загрузить сетку.");
   setMatches(Array.isArray(data.matches)?data.matches:[]);
  }catch(err){setError(err.message||"Ошибка загрузки.");}finally{setLoading(false);}
 }
 const rounds=matches===null?[]:[...new Set(matches.map(m=>m.roundIndex))].sort((a,b)=>a-b);
 return <main className="tbl-page">
  <header><p>ISTe / OWNER / TOURNAMENTS V2</p><h1>LIVE <span>BRACKET</span></h1><p>Реальная турнирная сетка из базы — только просмотр.</p></header>
  <nav><Link to="/owner/tournaments">← Панель турниров</Link><Link to="/owner/tournaments-match-lab">Тестовая сетка →</Link></nav>
  <form onSubmit={load}><label htmlFor="tbl-id">UUID турнира</label><input id="tbl-id" value={id} onChange={e=>setId(e.target.value)} placeholder="xxxxxxxx-xxxx-4xxx-8xxx-xxxxxxxxxxxx" required spellCheck={false}/><button type="submit" disabled={loading}>{loading?"Загрузка…":"Загрузить"}</button></form>
  <p className="tbl-note">Здесь нет демонстрационных команд. Если база ещё не настроена, появится ошибка без подмены реальных данных.</p>
  {error?<p role="alert" className="tbl-error">{error}</p>:null}
  {matches?.length===0?<p role="status">Для этого турнира матчи ещё не созданы.</p>:null}
  <div className="tbl-rounds">{rounds.map(round=><section key={round}><h2>РАУНД {round+1}</h2>{matches.filter(m=>m.roundIndex===round).sort((a,b)=>a.matchIndex-b.matchIndex).map(m=><article key={m.id}>
   <small>Матч #{m.matchIndex+1} · BO{m.bestOf} · {m.status}</small>
   <p className={m.winnerTeamId===m.teamAId?"tbl-winner":""}>{m.teamAName||"Ожидается"} <strong>{m.scoreA??"—"}</strong></p>
   <p className={m.winnerTeamId===m.teamBId?"tbl-winner":""}>{m.teamBName||"Ожидается"} <strong>{m.scoreB??"—"}</strong></p>
   {m.maps?.length?<details><summary>Карты ({m.maps.length})</summary>{m.maps.map((map,i)=><div key={i}>{map.name}: {map.scoreA}–{map.scoreB}</div>)}</details>:null}
  </article>)}</section>)}</div>
 </main>;
}
