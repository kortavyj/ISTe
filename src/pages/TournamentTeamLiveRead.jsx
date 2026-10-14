import { useState } from "react";
import { Link } from "react-router-dom";
import "./TournamentTeamReviewLab.css";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const LABELS = {pending:"Ожидает",approved:"Одобрена",rejected:"Отклонена",withdrawn:"Отозвана",checked_in:"Прошла check-in"};

export default function TournamentTeamLiveRead() {
 const [tournamentId,setTournamentId]=useState("");
 const [teams,setTeams]=useState([]);
 const [filter,setFilter]=useState("all");
 const [loading,setLoading]=useState(false);
 const [error,setError]=useState("");
 const [loadedId,setLoadedId]=useState("");
 async function load(event) {
   event.preventDefault();
   if (!UUID.test(tournamentId.trim())) {setError("Введите корректный UUID турнира.");return;}
   setLoading(true);setError("");setTeams([]);setLoadedId("");
   try {
     const response=await fetch(`/api/tournaments-team-list?tournamentId=${encodeURIComponent(tournamentId.trim())}`,{
       method:"GET",credentials:"include",cache:"no-store",headers:{Accept:"application/json"}
     });
     const payload=await response.json();
     if (!response.ok||payload?.ok!==true) {
       const known={
         TEAM_LIST_RPC_NOT_INSTALLED:"База турниров ещё не подключена. Применять миграции пока не нужно.",
         AUTH_REQUIRED:"Сессия истекла. Выполните повторный вход.",
         MFA_REQUIRED:"Для просмотра заявок требуется MFA.",
         OWNER_REQUIRED:"Просмотр доступен только владельцу."
       };
       throw new Error(known[payload?.error]||"Не удалось загрузить заявки. Проверьте доступ и ID турнира.");
     }
     setTeams(Array.isArray(payload.teams)?payload.teams:[]);
     setLoadedId(tournamentId.trim());
   } catch (cause) {setError(cause?.message||"Ошибка запроса.");}
   finally {setLoading(false);}
 }
 const visible=teams.filter(t=>filter==="all"||t.status===filter);
 return <section className="tr-page">
   <header className="tr-header"><div><p className="tr-eyebrow">ISTe / OWNER / TOURNAMENTS V2</p>
     <h1>REAL <span>APPLICATIONS</span></h1>
     <p>Защищённый просмотр заявок из базы. Без изменения данных.</p></div>
     <strong className="tr-badge">READ ONLY</strong></header>
   <div className="tr-info" role="status">Эта страница не показывает демонстрационные команды. Если база ещё не подключена, появится сообщение о недоступности — тестовые данные вместо реальных не подставляются.</div>
   <div className="tr-toolbar"><Link to="/owner/tournaments">← Панель турниров</Link><Link to="/owner/tournaments-teams">Демонстрация интерфейса →</Link></div>
   <form onSubmit={load} className="tr-toolbar">
     <label htmlFor="tr-live-tournament-id">ID турнира (UUID)</label>
     <input id="tr-live-tournament-id" type="text" required spellCheck={false} placeholder="xxxxxxxx-xxxx-4xxx-8xxx-xxxxxxxxxxxx" value={tournamentId} onChange={e=>setTournamentId(e.target.value)} style={{maxWidth:390,width:"100%",padding:12,background:"#222226",color:"#fff",border:"1px solid #555"}}/>
     <button type="submit" disabled={loading}>{loading?"Загрузка…":"Загрузить заявки"}</button>
   </form>
   {error?<p role="alert" className="tr-notice">{error}</p>:null}
   {loadedId?<><p role="status">Турнир {loadedId} · найдено заявок: {teams.length}</p>
     <div className="tr-tabs" aria-label="Фильтр заявок">
       {["all","pending","approved","rejected","withdrawn","checked_in"].map(value=><button key={value} type="button" className={filter===value?"tr-current":""} aria-pressed={filter===value} onClick={()=>setFilter(value)}>{value==="all"?"Все":LABELS[value]}</button>)}
     </div>
     <div className="tr-list">{visible.length?visible.map(team=><article className="tr-card" key={team.id}>
       <div className="tr-card-top"><h2>{team.name}</h2><span className={`tr-status tr-${team.status}`}>{LABELS[team.status]||team.status}</span></div>
       <p>Капитан: {team.captainUserId||"не указан"} · Участников: {team.members?.length||0}</p>
       <details><summary>Показать состав</summary><ol>{(team.members||[]).map((m,i)=><li key={i}>{m.faceitPlayerId||m.userId||"Неизвестный игрок"}{m.isCaptain?" · капитан":""}</li>)}</ol></details>
       <p>Рассмотрение заявок станет доступно после безопасного подключения записи.</p>
     </article>):<p>Заявок с выбранным статусом нет.</p>}</div>
   </>:null}
 </section>;
}
