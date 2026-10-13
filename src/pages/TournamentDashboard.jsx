import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "./Tournaments.css";
import { createOpeningRound } from "../lib/tournaments/bracket.js";

async function jsonResponse(response) {
  const data = await response.json();
  if (!response.ok || !data?.ok) throw new Error(data.message || "Не удалось выполнить запрос.");
  return data;
}

export default function TournamentDashboard() {
  const [tournaments, setTournaments] = useState([]);
  const [selected, setSelected] = useState("");
  const [teams, setTeams] = useState([]);
  const [teamName, setTeamName] = useState("");
  const [playerNames, setPlayerNames] = useState(["", ""]);
  const [matches, setMatches] = useState([]);
  const [scores, setScores] = useState({});
  const [serverIds, setServerIds] = useState({});
  const [assignments, setAssignments] = useState([]);
  const [assignmentHistory, setAssignmentHistory] = useState([]);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/tournaments?mine=1", { credentials: "include", signal: controller.signal })
      .then(jsonResponse)
      .then(data => {
        setTournaments(data.tournaments || []);
        setSelected(data.tournaments?.[0]?.id || "");
      })
      .catch(err => { if (err.name !== "AbortError") setError(err.message); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (!selected) { setTeams([]); setMatches([]); setAssignments([]); setAssignmentHistory([]); return; }
    const controller = new AbortController();
    fetch("/api/tournament-teams?tournamentId=" + encodeURIComponent(selected),
      { credentials: "include", signal: controller.signal })
      .then(jsonResponse)
      .then(data => setTeams(data.teams || []))
      .catch(err => { if (err.name !== "AbortError") setError(err.message); });
    fetch("/api/tournament-matches?tournamentId=" + encodeURIComponent(selected),
      { credentials:"include", signal:controller.signal })
      .then(jsonResponse).then(data => setMatches(data.matches || []))
      .catch(err => { if(err.name !== "AbortError") setError(err.message); });
    fetch("/api/tournament-matches?tournamentId="+encodeURIComponent(selected)+"&view=assignments",
      { credentials:"include", signal:controller.signal })
      .then(jsonResponse)
      .then(data => {setAssignments(data.assignments||[]);setAssignmentHistory(data.history||[]);})
      .catch(err => {if(err.name!=="AbortError") setError(err.message);});
    return () => controller.abort();
  }, [selected]);

  async function addTeam(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setSuccess("");
    try {
      const response = await fetch("/api/tournament-teams", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json", "Accept": "application/json" },
        body: JSON.stringify({ tournamentId: selected, name: teamName.trim(), ...(tournament?.team_size < 5 ? { players: playerNames.slice(0,tournament.team_size) } : {}) }),
      });
      const data = await jsonResponse(response);
      setTeams(current => [...current, data.team]);
      setTeamName("");
      setPlayerNames(["", ""]);
      setSuccess("Команда добавлена.");
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function publishTournament() {
    if (!selected || busy) return;
    setBusy(true); setError(""); setSuccess("");
    try {
      const response = await fetch("/api/tournament-action", {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ tournamentId: selected, action: "publish" }),
      });
      const data = await jsonResponse(response);
      setTournaments(current => current.map(item => item.id === selected
        ? { ...item, ...data.tournament } : item));
      setSuccess("Турнир опубликован. Пока команды добавляет организатор; самостоятельная регистрация игроков ещё не включена.");
    } catch (err) { setError(err.message); }
    finally { setBusy(false); }
  }

  async function matchAction(action, matchId) {
    if (busy) return;
    setBusy(true); setError(""); setSuccess("");
    try {
      const input = scores[matchId] || { a:"", b:"" };
      const payload = { tournamentId:selected, action };
      if (action === "assign-server") {
        const serverId = (serverIds[matchId] || "").trim();
        if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(serverId)) throw new Error("Укажите корректный UUID игрового сервера.");
        payload.matchId=matchId;
        payload.serverId=serverId;
      }
      if (action === "result") {
        if (input.a === "" || input.b === "") throw new Error("Введите оба результата.");
        payload.matchId=matchId;
        payload.scoreA=Number(input.a);
        payload.scoreB=Number(input.b);
        if(!Number.isInteger(payload.scoreA)||!Number.isInteger(payload.scoreB)) {
          throw new Error("Счёт должен быть целым числом.");
        }
      }
      const response=await fetch("/api/tournament-matches",{
        method:"POST",credentials:"include",
        headers:{"Content-Type":"application/json",Accept:"application/json"},
        body:JSON.stringify(payload),
      });
      await jsonResponse(response);
      const [updatedMatches,updatedTournaments]=await Promise.all([
        fetch("/api/tournament-matches?tournamentId="+encodeURIComponent(selected),{credentials:"include"}).then(jsonResponse),
        fetch("/api/tournaments?mine=1",{credentials:"include"}).then(jsonResponse),
      ]);
      setMatches(updatedMatches.matches||[]);
      if(action==="assign-server"){
        const state=await fetch("/api/tournament-matches?tournamentId="+encodeURIComponent(selected)+"&view=assignments",{credentials:"include"}).then(jsonResponse);
        setAssignments(state.assignments||[]);setAssignmentHistory(state.history||[]);
      }
      setTournaments(updatedTournaments.tournaments||[]);
      setSuccess(action==="start"?"Турнир запущен.":action==="assign-server"?"Игровой сервер назначен матчу.":"Результат зафиксирован.");
    } catch(err) { setError(err.message); }
    finally { setBusy(false); }
  }

  const tournament = tournaments.find(item => item.id === selected);
  const openingRound = teams.length >= 2 ? createOpeningRound(teams) : null;
  return (
    <section className="iste-tournaments">
      <div className="iste-tournaments__head">
        <span className="iste-tournaments__eyebrow">ISTe · CS2</span>
        <h1>Мои турниры</h1>
        <p>Управление черновиками и составом участников. До публикации турнир не показывается зрителям.</p>
        <div className="iste-tournaments__actions">
          <Link to="/tournaments">Все турниры</Link>
          <Link to="/tournaments/create">Создать турнир</Link>
        </div>
      </div>
      {error && <p className="iste-tournaments__error" role="alert">{error}</p>}
      {success && <p role="status">{success}</p>}
      {loading ? <p>Загружаем турниры...</p> : tournaments.length === 0 ? (
        <div className="iste-tournaments__empty">У вас пока нет турниров. Создайте первый черновик.</div>
      ) : (
        <div className="iste-tournaments__form">
          <label>Турнир
            <select value={selected} onChange={event => {
              setSelected(event.target.value); setError(""); setSuccess("");
            }}>
              {tournaments.map(item => <option key={item.id} value={item.id}>
                {item.title} ({item.status})
              </option>)}
            </select>
          </label>
          <div>
            <h2>{tournament?.title}</h2>
            <p>Команды: {teams.length} / {tournament?.max_teams}</p>
          </div>
          {["draft", "registration"].includes(tournament?.status) && (
            <form onSubmit={addTeam} className="iste-tournaments__team-form">
              <label>Название новой команды
                <input minLength={2} maxLength={60} required
                  value={teamName} onChange={event => setTeamName(event.target.value)}
                  disabled={busy || teams.length >= tournament.max_teams} />
              </label>
              {(tournament?.team_size === 1 || tournament?.team_size === 2) && (
                <div className="iste-tournaments__roster-fields">
                  {Array.from({length:tournament.team_size},(_,index)=>
                    <label key={index}>Игрок {index+1}, ник CS2
                      <input required minLength={2} maxLength={32} autoComplete="off"
                        value={playerNames[index]} disabled={busy}
                        onChange={event=>setPlayerNames(current=>current.map((name,i)=>i===index?event.target.value:name))}/>
                    </label>
                  )}
                  <p className="iste-tournaments__note">Никаких запасных или замен после регистрации.</p>
                </div>
              )}
              <button type="submit" disabled={busy || teams.length >= tournament.max_teams}>
                {busy ? "Добавляем..." : "Добавить команду"}
              </button>
            </form>
          )}
          {tournament?.status === "draft" && (
            <button type="button" disabled={busy} onClick={publishTournament}>
              Опубликовать турнир
            </button>
          )}
          {tournament?.status === "registration" && (
            <p className="iste-tournaments__note">Турнир опубликован. Сейчас команды добавляет только организатор. Самостоятельная регистрация игроков ещё не реализована.</p>
          )}
          <div className="iste-tournaments__team-list">
            {teams.length ? teams.map((team, index) =>
              <div key={team.id} className="iste-tournaments__team-item">
                <span>{index + 1}</span><strong>{team.name}</strong>
              </div>
            ) : <p>Список команд пока пуст.</p>}
          </div>
          {tournament?.status==="registration" && teams.length>=2 && (
            <button type="button" disabled={busy} onClick={()=>matchAction("start")}>
              Зафиксировать сетку и запустить турнир
            </button>
          )}
          {matches.length>0 && (
            <div className="iste-tournaments__bracket-preview">
              <h3>Матчи турнирной сетки</h3>
              {matches.map(match=>{
                const a=teams.find(team=>team.id===match.team_a_id);
                const b=teams.find(team=>team.id===match.team_b_id);
                const value=scores[match.id]||{a:"",b:""};
                return <div className="iste-tournaments__match" key={match.id}>
                  <span>Раунд {match.round_number} · Матч {match.match_number} · {match.status}</span>
                  <strong>{a?.name||"Ожидается"} — {b?.name||"Ожидается"}</strong>
                  <p>CS2-сервер: {assignments.find(item=>item.matchId===match.id)?.serverId||"не назначен"}</p>
                  {match.status==="completed"&&<p>Счёт: {match.score_a}:{match.score_b}</p>}
                  {match.status==="scheduled"&&<>
                    <label>UUID назначаемого CS2-сервера
                      <input type="text" placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" value={serverIds[match.id]||""}
                        onChange={event=>setServerIds(current=>({...current,[match.id]:event.target.value}))} disabled={busy} />
                    </label>
                    <button type="button" disabled={busy} onClick={()=>matchAction("assign-server",match.id)}>Назначить / переназначить сервер</button>
                    <div className="iste-tournaments__score-inputs">
                      <input type="number" min="0" max="100" aria-label="Счёт первой команды"
                        value={value.a} onChange={e=>setScores(v=>({...v,[match.id]:{...value,a:e.target.value}}))}/>
                      <span>:</span>
                      <input type="number" min="0" max="100" aria-label="Счёт второй команды"
                        value={value.b} onChange={e=>setScores(v=>({...v,[match.id]:{...value,b:e.target.value}}))}/>
                    </div>
                    <button type="button" disabled={busy} onClick={()=>matchAction("result",match.id)}>
                      Подтвердить результат
                    </button>
                  </>}
                </div>;
              })}
            </div>
          )}
          {assignmentHistory.length>0 && <section aria-label="История назначений серверов">
            <h3>История назначений CS2-серверов</h3>
            <ul>{assignmentHistory.map((entry,index)=><li key={entry.matchId+"-"+entry.changedAt+"-"+index}>
              {new Date(entry.changedAt).toLocaleString("ru-RU")} · Матч {matches.find(item=>item.id===entry.matchId)?.match_number||entry.matchId}:
              {" "}{entry.previousServerId||"не назначен"} → {entry.serverId}
            </li>)}</ul>
          </section>}
          {tournament?.status==="draft" && openingRound && (
            <div className="iste-tournaments__bracket-preview">
              <h3>Предварительная сетка · раунд 1</h3>
              <p className="iste-tournaments__note">Посев отражает порядок добавления команд. Это предпросмотр, матчи ещё не запущены.</p>
              {openingRound.matches.map(match => (
                <div className="iste-tournaments__team-item" key={match.position}>
                  <span>#{match.position}</span>
                  <strong>{teams.find(team => team.id === match.teamA)?.name || "BYE"}</strong>
                  <span>vs</span>
                  <strong>{teams.find(team => team.id === match.teamB)?.name || "BYE"}</strong>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
