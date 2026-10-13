import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import "./Tournaments.css";
import { useAuth } from "../auth/AuthContext.jsx";

export default function TournamentPublic() {
  const { slug } = useParams();
  const { user } = useAuth();
  const [teamName, setTeamName] = useState("");
  const [playerNames, setPlayerNames] = useState(["", ""]);
  const [joining, setJoining] = useState(false);
  const [joinMessage, setJoinMessage] = useState("");
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
  async function joinTournament(event) {
    event.preventDefault();
    if (!tournament || joining) return;
    setJoining(true);
    setJoinMessage("");
    try {
      const res = await fetch("/api/tournament-teams", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ tournamentId: tournament.id, name: teamName.trim(), join: true, ...(tournament.team_size < 5 ? { players: playerNames.slice(0,tournament.team_size) } : {}) }),
      });
      const data = await res.json();
      if (!res.ok || !data?.ok) throw new Error(data.message || "Не удалось зарегистрировать команду.");
      setTeams(existing => [...existing, data.team]);
      setTeamName("");
      setPlayerNames(["", ""]);
      setJoinMessage("Команда зарегистрирована.");
    } catch (err) {
      setJoinMessage(err.message);
    } finally {
      setJoining(false);
    }
  }
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
        <span>{tournament.team_size || 5}vs{tournament.team_size || 5} · {tournament.best_of === 3 ? "BO3" : "BO1"} · Single Elimination · {({standard:"Стандартное оружие",awp:"Только AWP",pistols:"Только пистолеты",deagle:"Только Desert Eagle"})[tournament.weapon_mode] || "Стандартное оружие"}</span>
        {(tournament.team_size === 1 || tournament.team_size === 2) && <p>Без запасных игроков и замен.</p>}
        <h2>{tournament.status === "registration" ? "Регистрация команд открыта" : tournament.status}</h2>
        <p>{teams.length} из {tournament.max_teams} команд</p>
      </div>
      {tournament.status === "registration" && (
        <div className="iste-tournaments__card">
          <h2>Регистрация команды</h2>
          {user ? (
            <form className="iste-tournaments__team-form" onSubmit={joinTournament}>
              <label>Название команды
                <input required minLength={2} maxLength={60} value={teamName}
                  disabled={joining || teams.length >= tournament.max_teams}
                  onChange={event => setTeamName(event.target.value)} />
              </label>
              {(tournament.team_size === 1 || tournament.team_size === 2) && (
                <div className="iste-tournaments__roster-fields">
                  {Array.from({length:tournament.team_size},(_,index)=>
                    <label key={index}>Игрок {index+1}, ник CS2
                      <input required minLength={2} maxLength={32} autoComplete="off"
                        value={playerNames[index]} disabled={joining}
                        onChange={event=>setPlayerNames(current=>current.map((name,i)=>i===index?event.target.value:name))}/>
                    </label>
                  )}
                  <p className="iste-tournaments__note">Состав фиксируется при регистрации. Изменения и запасные игроки не допускаются.</p>
                </div>
              )}
              <button type="submit" disabled={joining || teams.length >= tournament.max_teams}>
                {joining ? "Отправляем..." : "Зарегистрировать команду"}
              </button>
            </form>
          ) : <p>Для регистрации команды <Link to="/login">войдите в аккаунт</Link>.</p>}
          {joinMessage && <p role="status">{joinMessage}</p>}
        </div>
      )}
      <h2>Участники</h2>
      <div className="iste-tournaments__team-list">
        {teams.length ? teams.map((team, index) => <div className="iste-tournaments__team-item" key={team.id}>
          <span>{index + 1}</span><strong>{team.name}</strong>{team.player_names?.length>0 && <small>{team.player_names.join(" · ")}</small>}
        </div>) : <p>Команды ещё не добавлены.</p>}
      </div>
      {matches.length > 0 ? (
        <div className="iste-tournaments__bracket-preview">
          <div className="iste-tournaments__bracket-head">
            <div><span>ISTe / CHAMPIONSHIP BRACKET</span><h2>Сетка победителей</h2></div>
            <small>{matches.length} матчей · {new Set(matches.map(match => match.round_number)).size} раундов</small>
          </div>
          <div className="iste-tournaments__rounds" aria-label="Турнирная сетка">
            {[...new Set(matches.map(match => match.round_number))].sort((a,b)=>a-b).map((round,roundIndex,rounds)=>
              <div key={round} className="iste-tournaments__round" style={{ "--round-index": roundIndex }}>
                <h3><span>{rounds.length === roundIndex + 1 ? "ФИНАЛ" : "РАУНД " + round}</span><small>{matches.filter(match => match.round_number === round).length} матчей</small></h3>
                {matches.filter(match => match.round_number === round).map(match=>{
                  const a=teams.find(team=>team.id===match.team_a_id);
                  const b=teams.find(team=>team.id===match.team_b_id);
                  const scoreA=match.score_a;
                  const scoreB=match.score_b;
                  const finished=match.status==="completed" || match.status==="finished";
                  const winnerA=finished && scoreA!==null && scoreB!==null && scoreA>scoreB;
                  const winnerB=finished && scoreA!==null && scoreB!==null && scoreB>scoreA;
                  return <article className={"iste-tournaments__match"+(finished?" iste-tournaments__match--finished":"")} key={match.id}>
                    <small className="iste-tournaments__match-status">{finished?"ЗАВЕРШЁН":match.status==="live"?"LIVE":"ОЖИДАНИЕ"}</small>
                    <div className={"iste-tournaments__match-side"+(winnerA?" is-winner":"")}>
                      <span>{a?.name||"Ожидается"}</span><strong>{scoreA??"—"}</strong>
                    </div>
                    <div className={"iste-tournaments__match-side"+(winnerB?" is-winner":"")}>
                      <span>{b?.name||"Ожидается"}</span><strong>{scoreB??"—"}</strong>
                    </div>
                  </article>;
                })}
              </div>
            )}
          </div>
          <p className="iste-tournaments__note">Сетка обновляется после перезагрузки страницы. Автоматическое обновление LIVE пока в разработке.</p>
        </div>
      ) : <p className="iste-tournaments__note">Сетка появится после запуска турнира организатором.</p>}
    </>}
  </section>;
}