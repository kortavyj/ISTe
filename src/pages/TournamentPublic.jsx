import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import "./Tournaments.css";
import { useLanguage } from "../i18n/LanguageContext.jsx";
import { useAuth } from "../auth/AuthContext.jsx";

export default function TournamentPublic() {
  const { slug } = useParams();
  const { language } = useLanguage();
  const copy = ({
    ru: { bracket: "Сетка победителей", round: "Раунд", final: "ФИНАЛ", champion: "ЧЕМПИОН ТУРНИРА", winner: "ПОБЕДИТЕЛЬ", advance: "ДАЛЕЕ", awaiting: "Ожидается", finished: "ЗАВЕРШЁН", pending: "ОЖИДАНИЕ", matches: "матчей", note: "Сетка обновляется после перезагрузки страницы. LIVE будет подключён отдельно." },
    uk: { bracket: "Сітка переможців", round: "Раунд", final: "ФІНАЛ", champion: "ЧЕМПІОН ТУРНІРУ", winner: "ПЕРЕМОЖЕЦЬ", advance: "ДАЛІ", awaiting: "Очікується", finished: "ЗАВЕРШЕНО", pending: "ОЧІКУВАННЯ", matches: "матчів", note: "Сітка оновлюється після перезавантаження сторінки. LIVE підключимо окремо." },
    en: { bracket: "Winners Bracket", round: "Round", final: "FINAL", champion: "TOURNAMENT CHAMPION", winner: "WINNER", advance: "ADVANCE", awaiting: "Awaiting", finished: "FINISHED", pending: "PENDING", matches: "matches", note: "Bracket updates after page reload. LIVE updates are coming later." },
  })[language] || ({ bracket: "Winners Bracket", round: "Round", final: "FINAL", champion: "TOURNAMENT CHAMPION", winner: "WINNER", advance: "ADVANCE", awaiting: "Awaiting", finished: "FINISHED", pending: "PENDING", matches: "matches", note: "Bracket updates after page reload. LIVE updates are coming later." });
  const { user } = useAuth();
  const [teamName, setTeamName] = useState("");
  const [playerNames, setPlayerNames] = useState(["", ""]);
  const [steamIds, setSteamIds] = useState(["", ""]);
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
        body: JSON.stringify({ tournamentId: tournament.id, name: teamName.trim(), join: true, ...(tournament.team_size < 5 ? { players: playerNames.slice(0,tournament.team_size), steamIds: steamIds.slice(0,tournament.team_size) } : {}) }),
      });
      const data = await res.json();
      if (!res.ok || !data?.ok) throw new Error(data.message || "Не удалось зарегистрировать команду.");
      setTeams(existing => [...existing, data.team]);
      setTeamName("");
      setPlayerNames(["", ""]);
      setSteamIds(["", ""]);
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
                      <span className="iste-tournaments__steam-caption">SteamID64 игрока</span>
                      <input required inputMode="numeric" pattern="7656119[0-9]{10}" minLength={17} maxLength={17}
                        placeholder="17 цифр SteamID64" autoComplete="off" value={steamIds[index]} disabled={joining}
                        onChange={event=>setSteamIds(current=>current.map((id,i)=>i===index?event.target.value.trim():id))}/>
                    </label>
                  )}
                  <p className="iste-tournaments__note">SteamID64 проверяется по формату, но принадлежность аккаунта пока не подтверждается. Состав фиксируется при регистрации.</p>
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
      {matches.length > 0 ? (() => {
        const rounds = [...new Set(matches.map(match => match.round_number))].sort((a,b)=>a-b);
        const lastRound = matches.filter(match => match.round_number === rounds[rounds.length-1]);
        const finalMatch = lastRound.length === 1 ? lastRound[0] : null;
        const championTeam = finalMatch?.winner_team_id
          ? teams.find(team => team.id === finalMatch.winner_team_id)
          : null;
        return (
          <div className="iste-tournaments__bracket-preview iste-tournaments__bracket-v2">
            <div className="iste-tournaments__bracket-head">
              <div><span>ISTe / CHAMPIONSHIP BRACKET</span><h2>{copy.bracket}</h2></div>
              <small>{matches.length} {copy.matches} · {rounds.length} ROUNDS</small>
            </div>
            <div className="iste-tournaments__bracket-flow" aria-label={copy.bracket}>
              {rounds.map((round, roundIndex) => (
                <div className="iste-tournaments__flow-fragment" key={round}>
                  <div className="iste-tournaments__round" style={{ "--round-index": roundIndex }}>
                    <h3><span>{roundIndex === rounds.length-1 ? copy.final : copy.round + " " + round}</span><small>{matches.filter(match => match.round_number === round).length} {copy.matches}</small></h3>
                    <div className="iste-tournaments__round-matches">
                      {matches.filter(match => match.round_number === round).map(match => {
                        const a = teams.find(team => team.id === match.team_a_id);
                        const b = teams.find(team => team.id === match.team_b_id);
                        const finished = match.status === "completed" || match.status === "finished";
                        const winnerA = finished && (match.winner_team_id ? match.winner_team_id === a?.id : match.score_a != null && match.score_b != null && match.score_a > match.score_b);
                        const winnerB = finished && (match.winner_team_id ? match.winner_team_id === b?.id : match.score_a != null && match.score_b != null && match.score_b > match.score_a);
                        return (
                          <article className={"iste-tournaments__match" + (finished ? " iste-tournaments__match--finished" : "")} key={match.id}>
                            <small className="iste-tournaments__match-status">{finished ? copy.finished : match.status === "live" ? "LIVE" : copy.pending}</small>
                            <div className={"iste-tournaments__match-side" + (winnerA ? " is-winner" : "")}><span>{a?.name || copy.awaiting}</span><strong>{match.score_a ?? "—"}</strong></div>
                            <div className={"iste-tournaments__match-side" + (winnerB ? " is-winner" : "")}><span>{b?.name || copy.awaiting}</span><strong>{match.score_b ?? "—"}</strong></div>
                          </article>
                        );
                      })}
                    </div>
                  </div>
                  <div className="iste-tournaments__flow-arrow" aria-hidden="true">
                    <span>{roundIndex === rounds.length-1 ? copy.winner : copy.advance}</span>
                    <svg viewBox="0 0 78 160" preserveAspectRatio="none"><path className="iste-tournaments__flow-line" d="M0 34 H25 V80 H68 M0 126 H25 V80"/><path className="iste-tournaments__flow-light" d="M0 34 H25 V80 H68 M0 126 H25 V80"/><path className="iste-tournaments__flow-tip" d="m60 73 9 7-9 7"/></svg>
                  </div>
                </div>
              ))}
              <div className="iste-tournaments__champion">
                <h3>{copy.winner}</h3>
                <div className={"iste-tournaments__champion-card" + (championTeam ? " is-confirmed" : "")}>
                  <span>{copy.champion}</span>
                  <strong>{championTeam?.name || copy.awaiting}</strong>
                  <svg viewBox="0 0 48 48" aria-hidden="true" fill="none"><path d="M14 7h20v14a10 10 0 0 1-20 0V7ZM14 12H7v4a9 9 0 0 0 9 9M34 12h7v4a9 9 0 0 1-9 9M24 31v7M16 42h16" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </div>
              </div>
            </div>
            <p className="iste-tournaments__note">{copy.note}</p>
          </div>
        );
      })() : <p className="iste-tournaments__note">Сетка появится после запуска турнира организатором.</p>}
    </>}
  </section>;
}