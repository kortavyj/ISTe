import { useState } from "react";
import { Link } from "react-router-dom";
import "./TournamentTeamReviewLab.css";
import "./TournamentWorkspaceShared.css";
import "./TournamentPremiumTheme.css";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const LABELS = {pending:"Ожидает",approved:"Одобрена",rejected:"Отклонена",withdrawn:"Отозвана",checked_in:"Прошла check-in"};

export default function TournamentTeamLiveRead() {
 const [tournamentId,setTournamentId]=useState(()=>new URLSearchParams(window.location.search).get("tournamentId")||"");
 const [teams,setTeams]=useState([]);
 const [filter,setFilter]=useState("all");
 const [loading,setLoading]=useState(false);
 const [error,setError]=useState("");
 const [loadedId,setLoadedId]=useState("");
 const [pendingReview,setPendingReview]=useState(null);
 const [reviewBusy,setReviewBusy]=useState(false);
 const [reviewMessage,setReviewMessage]=useState("");
 async function load(event) {
   event?.preventDefault();
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
 async function reviewTeam() {
   if (!pendingReview || reviewBusy) return;
   setReviewBusy(true);setReviewMessage("");
   try {
     const response=await fetch("/api/tournaments-team-review",{
       method:"POST",credentials:"include",cache:"no-store",
       headers:{"Content-Type":"application/json",Accept:"application/json"},
       body:JSON.stringify({teamId:pendingReview.id,expectedStatus:"pending",decision:pendingReview.decision}),
     });
     const payload=await response.json();
     if (!response.ok||payload?.ok!==true) {
       const known={
         TOURNAMENT_WRITES_DISABLED:"Изменения отключены на сервере. Заявка не была изменена.",
         TEAM_REVIEW_RPC_NOT_INSTALLED:"Функция рассмотрения заявок пока не установлена в базе.",
         TEAM_REVIEW_REJECTED:"Заявка уже рассмотрена или не отвечает требованиям.",
         MFA_REQUIRED:"Для управления заявками требуется MFA.",
         AUTH_REQUIRED:"Сессия истекла. Войдите повторно."
       };
       throw new Error(known[payload?.error]||payload?.message||"Изменение заявки отклонено.");
     }
     setReviewMessage("Решение сохранено. Список заявок обновлён.");
     await load();
   } catch (cause) {setReviewMessage(cause?.message||"Ошибка рассмотрения заявки.");}
   finally {setReviewBusy(false);setPendingReview(null);}
 }
 const visible=teams.filter(t=>filter==="all"||t.status===filter);
 return <section className="tr-page">
   <header className="tr-header"><div><p className="tr-eyebrow">ISTe / OWNER / TOURNAMENTS V2</p>
     <h1>REAL <span>APPLICATIONS</span></h1>
     <p>Управление реальными заявками через защищённый сервер.</p></div>
     <strong className="tr-badge">OWNER ACCESS</strong></header>
   <div className="tr-info" role="status">Эта страница не показывает демонстрационные команды. Если база ещё не подключена, появится сообщение о недоступности — тестовые данные вместо реальных не подставляются.</div>
   <div className="tr-toolbar"><Link to="/owner/tournaments">← Панель турниров</Link><Link to="/owner/tournaments-teams">Демонстрация интерфейса →</Link></div>
   <form onSubmit={load} className="tr-toolbar">
     <label htmlFor="tr-live-tournament-id">ID турнира (UUID)</label>
     <input id="tr-live-tournament-id" type="text" required spellCheck={false} placeholder="xxxxxxxx-xxxx-4xxx-8xxx-xxxxxxxxxxxx" value={tournamentId} onChange={e=>setTournamentId(e.target.value)} style={{maxWidth:390,width:"100%",padding:12,background:"#222226",color:"#fff",border:"1px solid #555"}}/>
     <button type="submit" disabled={loading}>{loading?"Загрузка…":"Загрузить заявки"}</button>
   </form>
   {error?<p role="alert" className="tr-notice">{error}</p>:null}
   {reviewMessage?<p role="status" className="tr-notice">{reviewMessage}</p>:null}
   {loadedId?<><p role="status">Турнир {loadedId} · найдено заявок: {teams.length}</p>
     <div className="tr-tabs" aria-label="Фильтр заявок">
       {["all","pending","approved","rejected","withdrawn","checked_in"].map(value=><button key={value} type="button" className={filter===value?"tr-current":""} aria-pressed={filter===value} onClick={()=>setFilter(value)}>{value==="all"?"Все":LABELS[value]}</button>)}
     </div>
     <div className="tr-list">{visible.length?visible.map(team=><article className="tr-card" key={team.id}>
       <div className="tr-card-top"><h2>{team.name}</h2><span className={`tr-status tr-${team.status}`}>{LABELS[team.status]||team.status}</span></div>
       <p>Капитан: {team.captainUserId||"не указан"} · Участников: {team.members?.length||0}</p>
       <details><summary>Показать состав</summary><ol>{(team.members||[]).map((m,i)=><li key={i}>{m.faceitPlayerId||m.userId||"Неизвестный игрок"}{m.isCaptain?" · капитан":""}</li>)}</ol></details>
       {team.status==="pending" ? <div className="tr-live-actions">
         <button type="button" onClick={()=>setPendingReview({id:team.id,name:team.name,decision:"approve"})}>Одобрить</button>
         <button type="button" onClick={()=>setPendingReview({id:team.id,name:team.name,decision:"reject"})}>Отклонить</button>
       </div> : null}
     </article>):<p>Заявок с выбранным статусом нет.</p>}</div>
   </>:null}
   {pendingReview ? <div className="tr-review-overlay">
     <section className="tr-review-dialog" role="dialog" aria-modal="true" aria-labelledby="tr-review-heading">
       <h2 id="tr-review-heading">Подтвердить решение?</h2>
       <p>Команда: <strong>{pendingReview.name}</strong></p>
       <p>{pendingReview.decision==="approve"?"Одобрение заявки":"Отклонение заявки"} будет отправлено на защищённый сервер. Сервер проверит права, MFA и статус заявки.</p>
       <p>Если запись отключена, данные не изменятся.</p>
       <div className="tr-live-actions">
         <button type="button" disabled={reviewBusy} onClick={()=>void reviewTeam()}>{reviewBusy?"Выполняется…":"Подтвердить"}</button>
         <button type="button" disabled={reviewBusy} onClick={()=>setPendingReview(null)}>Отмена</button>
       </div>
     </section>
   </div> : null}
 </section>;
}
