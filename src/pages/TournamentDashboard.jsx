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
    if (!selected) { setTeams([]); return; }
    const controller = new AbortController();
    fetch("/api/tournament-teams?tournamentId=" + encodeURIComponent(selected),
      { credentials: "include", signal: controller.signal })
      .then(jsonResponse)
      .then(data => setTeams(data.teams || []))
      .catch(err => { if (err.name !== "AbortError") setError(err.message); });
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
      setSuccess("Турнир опубликован. Приём команд открыт.");
    } catch (err) { setError(err.message); }
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
              Опубликовать турнир и открыть регистрацию
            </button>
          )}
          {tournament?.status === "registration" && (
            <p className="iste-tournaments__note">Турнир опубликован. Организатор может продолжать добавлять команды до запуска сетки.</p>
          )}
          <div className="iste-tournaments__team-list">
            {teams.length ? teams.map((team, index) =>
              <div key={team.id} className="iste-tournaments__team-item">
                <span>{index + 1}</span><strong>{team.name}</strong>
              </div>
            ) : <p>Список команд пока пуст.</p>}
          </div>
          {openingRound && (
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
