import { useState } from "react";
import { Link } from "react-router-dom";

const NEXT = { draft:"registration", registration:"checkin", checkin:"live", live:"finished" };
const LABEL = { draft:"Черновик", registration:"Регистрация", checkin:"Check-in", live:"Идёт турнир", finished:"Завершён", cancelled:"Отменён" };

export default function TournamentOwnerActions({ tournament, onUpdated }) {
  const [confirm,setConfirm] = useState(false);
  const [busy,setBusy] = useState(false);
  const [message,setMessage] = useState("");
  const next = NEXT[tournament.status];

  async function advance() {
    if (!confirm || busy || !next) return;
    setBusy(true);setMessage("");
    try {
      const response=await fetch("/api/tournaments-status-transition",{
        method:"POST",credentials:"include",cache:"no-store",
        headers:{"Content-Type":"application/json",Accept:"application/json"},
        body:JSON.stringify({tournamentId:tournament.id,expectedStatus:tournament.status,nextStatus:next}),
      });
      const data=await response.json();
      if (!response.ok || data?.ok!==true) {
        throw new Error(data?.error==="TOURNAMENT_WRITES_DISABLED"
          ?"Изменения отключены на сервере до безопасного запуска."
          :data?.message || "Сервер отклонил изменение статуса.");
      }
      setMessage("Статус успешно обновлён.");await onUpdated();
    } catch (error) {
      setMessage(error?.message||"Временная ошибка сервера.");
    } finally {setBusy(false);setConfirm(false);}
  }

  return <div className="ot-team-actions">
    <Link to={`/owner/tournaments-team-applications?tournamentId=${encodeURIComponent(tournament.id)}`}>Заявки команд →</Link>
    <Link to={`/owner/tournaments-bracket?tournamentId=${encodeURIComponent(tournament.id)}`}>Турнирная сетка →</Link>
    {next?<button type="button" onClick={()=>setConfirm(true)}>Перевести в «{LABEL[next]}»</button>:null}
    {message?<p role="status">{message}</p>:null}
    {confirm?<div className="ot-confirm-overlay">
      <section className="ot-confirm-panel" role="dialog" aria-modal="true" aria-labelledby="ot-confirm-heading">
        <h2 id="ot-confirm-heading">Изменить статус турнира?</h2>
        <p>{tournament.title}</p>
        <p>{LABEL[tournament.status]} → {LABEL[next]}</p>
        <p>Сервер дополнительно проверит MFA, состав команд и готовность сетки. Реальная запись пока отключена.</p>
        <div className="ot-confirm-buttons">
          <button type="button" disabled={busy} onClick={()=>void advance()}>{busy?"Проверка…":"Подтвердить"}</button>
          <button type="button" disabled={busy} onClick={()=>setConfirm(false)}>Отмена</button>
        </div>
      </section>
    </div>:null}
  </div>;
}
