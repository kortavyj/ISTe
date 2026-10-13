import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "./Tournaments.css";
import { createOpeningRound } from "../lib/tournaments/bracket.js";

async function jsonResponse(response) {
  const data = await response.json();
  if (!response.ok || !data?.ok) throw new Error(data.message || "Не удалось выполнить запрос.");
  return data;
}


function PlayoffBracket({ matches, teams, finished }) {
  const names = new Map(teams.map(team => [team.id, team.name]));
  const rounds = [...new Set(matches.map(match => match.round_number))].sort((a,b) => a-b);
  const final = matches.find(match => match.round_number === rounds[rounds.length-1] && match.status === "completed" && match.winner_team_id);
  const champion = finished && final ? names.get(final.winner_team_id) : null;
  return <section className="iste-playoff" aria-label="Турнирная сетка плей-офф">
    <div className="iste-playoff__heading">
      <h3>Сетка плей-офф</h3>
      <p>Путь команд от первого раунда до финала</p>
    </div>
    <div className="iste-playoff__rounds">
      {rounds.map((round,index) => <div className="iste-playoff__round" key={round}>
        <h4>{index===rounds.length-1?"Финал":rounds.length-index===2?"Полуфинал":"Раунд "+round}</h4>
        {matches.filter(match=>match.round_number===round).sort((a,b)=>a.match_number-b.match_number).map(match=>
          <div className="iste-playoff__match" key={match.id}>
            <small>Матч {match.match_number} · {match.status==="completed"?"Завершён":match.status==="scheduled"?"Ожидает результата":"Ожидает соперников"}</small>
            {[["a",match.team_a_id,match.score_a],["b",match.team_b_id,match.score_b]].map(([side,id,score])=>
              <div key={side} className={"iste-playoff__team"+(match.status==="completed"&&id===match.winner_team_id?" iste-playoff__team--winner":"")}>
                <span>{id?names.get(id)||"Команда":"Ожидается"}</span>
                <strong>{match.status==="completed"&&score!==null?score:"—"}</strong>
              </div>
            )}
          </div>
        )}
      </div>)}
    </div>
    {champion&&<div className="iste-playoff__champion"><span>🏆 Чемпион турнира</span><strong>{champion}</strong></div>}
  </section>;
}

function RoomSettingsForm({value,onChange,onSave,busy}) {
  const update=(key,val)=>onChange({...value,[key]:val});
  return <div className="iste-tournaments__team-form">
    <strong>Подключение к матчу (только капитаны)</strong>
    <label>IP или домен сервера <input value={value.host||""} onChange={e=>update("host",e.target.value)} placeholder="cs2.example.com" /></label>
    <label>Порт <input type="number" min="1" max="65535" value={value.port||""} onChange={e=>update("port",e.target.value)} placeholder="27015" /></label>
    <label>Пароль (необязательно) <input type="password" autoComplete="off" value={value.password||""} onChange={e=>update("password",e.target.value)} /></label>
    <label>Карта <select value={value.map||""} onChange={e=>update("map",e.target.value)}><option value="">Выбрать карту</option>{["de_ancient","de_anubis","de_dust2","de_inferno","de_mirage","de_nuke","de_train","de_vertigo","de_overpass"].map(m=><option key={m} value={m}>{m.slice(3)}</option>)}</select></label>
    <label>Время подключения <input type="datetime-local" value={value.connectAt||""} onChange={e=>update("connectAt",e.target.value)} /></label>
    <button type="button" disabled={busy} onClick={onSave}>Сохранить настройки матча</button>
  </div>;
}

export default function TournamentDashboard() {
  const [tournaments, setTournaments] = useState([]);
  const [selected, setSelected] = useState("");
  const [teams, setTeams] = useState([]);
  const [teamName, setTeamName] = useState("");
  const [matches, setMatches] = useState([]);
  const [scores, setScores] = useState({});
  const [serverIds, setServerIds] = useState({});
  const [matchModes, setMatchModes] = useState({});
  const [roomSettings, setRoomSettings] = useState({});
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
        body: JSON.stringify({ tournamentId: selected, name: teamName.trim() }),
      });
      const data = await jsonResponse(response);
      setTeams(current => [...current, data.team]);
      setTeamName("");
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
      if (action === "room-settings") {
        const room = roomSettings[matchId] || {};
        payload.matchId=matchId;
        payload.host=room.host?.trim();
        payload.port=Number(room.port);
        payload.password=room.password || "";
        payload.map=room.map;
        payload.connectAt=room.connectAt ? new Date(room.connectAt).toISOString() : null;
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
              <PlayoffBracket matches={matches} teams={teams} finished={tournament?.status==="completed"}/>
              <h3>Управление матчами</h3>
              {matches.map(match=>{
                const a=teams.find(team=>team.id===match.team_a_id);
                const b=teams.find(team=>team.id===match.team_b_id);
                const value=scores[match.id]||{a:"",b:""};
                return <div className="iste-tournaments__match" key={match.id}>
                  <span>Раунд {match.round_number} · Матч {match.match_number} · {match.status}</span>
                  <strong>{a?.name||"Ожидается"} — {b?.name||"Ожидается"}</strong>
                  {match.status==="completed"&&<p>Счёт: {match.score_a}:{match.score_b}</p>}
                  {match.status==="scheduled"&&<label>Режим проведения матча
                    <select aria-label="Режим проведения матча" value={matchModes[match.id]||"manual"}
                      onChange={event=>setMatchModes(current=>({...current,[match.id]:event.target.value}))}>
                      <option value="manual">Ручное управление — без сервера</option>
                      <option value="server">С CS2-сервером</option>
                    </select>
                  </label>}
                  {match.status==="scheduled"&&(matchModes[match.id]||"manual")==="server"&&<>
                    <p>CS2-сервер: {assignments.find(item=>item.matchId===match.id)?.serverId||"не назначен"}</p>
                    <RoomSettingsForm value={roomSettings[match.id]||{}} onChange={value=>setRoomSettings(current=>({...current,[match.id]:value}))} onSave={()=>matchAction("room-settings",match.id)} busy={busy}/>
                    <label>UUID назначаемого CS2-сервера
                      <input type="text" placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" value={serverIds[match.id]||""}
                        onChange={event=>setServerIds(current=>({...current,[match.id]:event.target.value}))} disabled={busy} />
                    </label>
                    <button type="button" disabled={busy} onClick={()=>matchAction("assign-server",match.id)}>Назначить / переназначить сервер</button>
                  </>}
                  {match.status==="scheduled"&&<>
                    {(matchModes[match.id]||"manual")==="manual"&&<p className="iste-tournaments__note">Сервер не требуется. Проведите игру самостоятельно, внесите итоговый счёт и подтвердите результат — победитель автоматически пройдёт дальше по сетке.</p>}
                    <strong>{tournament?.best_of===3?"Итог серии BO3 (победы по картам)":"Итог матча BO1 (раунды CS2)"}</strong>
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
