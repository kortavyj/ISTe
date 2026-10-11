import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import "./Tournaments.css";

export default function TournamentPublic() {
  const { slug } = useParams();
  const [tournament, setTournament] = useState(null);
  const [teams, setTeams] = useState([]);
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => {
    const controller = new AbortController();
    (async () => {
      const r = await fetch("/api/tournaments?slug=" + encodeURIComponent(slug), { signal: controller.signal });
      const d = await r.json();
      if (!r.ok || !d.ok || !d.tournament) throw new Error(d.message || "Турнир не найден.");
      setTournament(d.tournament);
      const teamsResponse = await fetch("/api/tournament-teams?tournamentId=" + encodeURIComponent(d.tournament.id),
        { signal: controller.signal });
      const teamsData = await teamsResponse.json();
      if (!teamsResponse.ok || !teamsData.ok) throw new Error(teamsData.message || "Ошибка загрузки команд.");
      setTeams(teamsData.teams || []);
      const matchResponse = await fetch("/api/tournament-matches?tournamentId="+encodeURIComponent(d.tournament.id),{signal:controller.signal});
      const matchData=await matchResponse.json();
      if(matchResponse.ok&&matchData.ok)setMatches(matchData.matches||[]);
    })().catch(err => {
      if (err.name !== "AbortError") setError(err.message);
    }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [slug]);
  return <section className="iste-tournaments">
    <div className="iste-tournaments__head">
      <span className="iste-tournaments__eyebrow">ISTe · CS2 TOURNAMENT</span>
      <h1>{tournament?.title || (loading ? "Загрузка…" : "Турнир")}</h1>
      <p>{tournament?.description || "Турнир Counter Strike 2"}</p>
      <div className="iste-tournaments__actions"><Link to="/tournaments">Все турниры</Link></div>
    </div>
    {error && <p role="alert" className="iste-tournaments__error">{error}</p>}
    {tournament && <>
      <div className="iste-tournaments__card">
        <span>{tournament.best_of === 3 ? "BO3" : "BO1"} · Single Elimination</span>
        <h2>{tournament.status === "registration" ? "Набор команд организатором" : tournament.status}</h2>
        <p>{teams.length} из {tournament.max_teams} команд</p>
      </div>
      <h2>Участники</h2>
      <div className="iste-tournaments__team-list">
        {teams.length ? teams.map((team, index) => <div className="iste-tournaments__team-item" key={team.id}>
          <span>{index + 1}</span><strong>{team.name}</strong>
        </div>) : <p>Команды ещё не добавлены.</p>}
      </div>
      {matches.length>0 ? (
        <div className="iste-tournaments__bracket-preview">
          <h2>Турнирная сетка</h2>
          <div className="iste-tournaments__rounds">
            {[...new Set(matches.map(match=>match.round_number))].map(round=>
              <div key={round} className="iste-tournaments__round">
                <h3>Раунд {round}</h3>
                {matches.filter(match=>match.round_number===round).map(match=>{
                  const a=teams.find(team=>team.id===match.team_a_id);
                  const b=teams.find(team=>team.id===match.team_b_id);
                  return <div className="iste-tournaments__match" key={match.id}>
                    <small>{match.status}</small>
                    <p>{a?.name||"Ожидается"} {match.score_a!==null?match.score_a:""}</p>
                    <p>{b?.name||"Ожидается"} {match.score_b!==null?match.score_b:""}</p>
                  </div>;
                })}
              </div>
            )}
          </div>
          <p className="iste-tournaments__note">Данные обновляются после перезагрузки страницы. LIVE подключим на отдельном этапе.</p>
        </div>
      ) : <p className="iste-tournaments__note">Сетка появится после запуска турнира организатором.</p>}
    </>}
  </section>;
}