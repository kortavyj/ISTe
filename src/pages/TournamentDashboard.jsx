import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "./Tournaments.css";

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

  const tournament = tournaments.find(item => item.id === selected);
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
          {tournament?.status === "draft" && (
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
          <div className="iste-tournaments__team-list">
            {teams.length ? teams.map((team, index) =>
              <div key={team.id} className="iste-tournaments__team-item">
                <span>{index + 1}</span><strong>{team.name}</strong>
              </div>
            ) : <p>Список команд пока пуст.</p>}
          </div>
          <p className="iste-tournaments__note">
            Сетка и запуск матчей будут доступны после внедрения и проверки механизма публикации.
          </p>
        </div>
      )}
    </section>
  );
}
