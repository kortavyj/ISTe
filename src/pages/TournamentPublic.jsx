import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import "./Tournaments.css";
import { useAuth } from "../auth/AuthContext.jsx";

export default function TournamentPublic() {
  const { slug } = useParams();
  const { user } = useAuth();
  const [teamName, setTeamName] = useState("");
  const [joining, setJoining] = useState(false);
  const [joinMessage, setJoinMessage] = useState("");
  const [tournament, setTournament] = useState(null);
  const [teams, setTeams] = useState([]);
  const [matches, setMatches] = useState([]);
  const [rosters, setRosters] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => {
    const controller = new AbortController();
    setRosters({});
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
      const rosterResults=await Promise.all((teamsData.teams||[]).map(async team=>{
        const res=await fetch("/api/tournament-teams?tournamentId="+encodeURIComponent(d.tournament.id)+"&teamId="+encodeURIComponent(team.id)+"&view=roster",{credentials:"include",signal:controller.signal});
        if(!res.ok)return [team.id,null];
        const data=await res.json();return [team.id,data.ok?data:null];
      }));
      setRosters(Object.fromEntries(rosterResults));
      const matchResponse = await fetch("/api/tournament-matches?tournamentId="+encodeURIComponent(d.tournament.id),{signal:controller.signal});
      const matchData=await matchResponse.json();
      if(matchResponse.ok&&matchData.ok)setMatches(matchData.matches||[]);
    })().catch(err => {
      if (err.name !== "AbortError") setError(err.message);
    }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [slug, user?.id]);
  async function refreshRosters() {
    if (!tournament || joining) return;
    setJoining(true);
    try {
      const result = await Promise.all(teams.map(async team => {
        const response = await fetch("/api/tournament-teams?tournamentId=" +
          encodeURIComponent(tournament.id) + "&teamId=" + encodeURIComponent(team.id) +
          "&view=roster", { credentials: "include", cache: "no-store" });
        if (!response.ok) return [team.id, null];
        const data = await response.json();
        return [team.id, data.ok ? data : null];
      }));
      setRosters(Object.fromEntries(result));
    } catch (err) {
      setJoinMessage(err.message || "Не удалось обновить составы.");
    } finally {
      setJoining(false);
    }
  }
  async function reviewApplication(teamId, userId, accept) {
    setJoining(true);setJoinMessage("");
    try {
      const res=await fetch("/api/tournament-teams",{method:"POST",credentials:"include",headers:{"Content-Type":"application/json"},body:JSON.stringify({tournamentId:tournament.id,teamId,userId,accept,action:"review-application"})});
      const data=await res.json();if(!res.ok||!data.ok)throw new Error(data.message||"Ошибка.");
      const updatedResponse=await fetch("/api/tournament-teams?tournamentId="+encodeURIComponent(tournament.id)+"&teamId="+encodeURIComponent(teamId)+"&view=roster",{credentials:"include",cache:"no-store"});
      const updated=await updatedResponse.json();
      if(!updatedResponse.ok||!updated.ok)throw new Error("Заявка обработана, но обновить состав не удалось. Нажмите «Обновить составы и заявки».");
      setRosters(prev=>({...prev,[teamId]:updated}));setJoinMessage(accept?"Заявка одобрена.":"Заявка отклонена.");
    }catch(error){setJoinMessage(error.message);}finally{setJoining(false);}
  }
  async function joinTeam(teamId) {
    if (!tournament || joining) return;
    setJoining(true); setJoinMessage("");
    try {
      const res=await fetch("/api/tournament-teams",{method:"POST",credentials:"include",headers:{"Content-Type":"application/json"},body:JSON.stringify({tournamentId:tournament.id,teamId,action:"join-team"})});
      const data=await res.json();
      if(!res.ok||!data.ok)throw new Error(data.message||"Не удалось вступить в команду.");
      setJoinMessage("Заявка отправлена капитану. Доступ откроется после одобрения.");
      const fresh=await fetch("/api/tournament-teams?tournamentId="+encodeURIComponent(tournament.id)+"&teamId="+encodeURIComponent(teamId)+"&view=roster",{credentials:"include",cache:"no-store"});
      if(fresh.ok){const current=await fresh.json();if(current.ok)setRosters(prev=>({...prev,[teamId]:current}));}
    }catch(err){setJoinMessage(err.message);}finally{setJoining(false);}
  }
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
        body: JSON.stringify({ tournamentId: tournament.id, name: teamName.trim(), join: true }),
      });
      const data = await res.json();
      if (!res.ok || !data?.ok) throw new Error(data.message || "Не удалось зарегистрировать команду.");
      setTeams(existing => [...existing, data.team]);
      setTeamName("");
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
        <span>{tournament.best_of === 3 ? "BO3" : "BO1"} · Single Elimination</span>
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
              <button type="submit" disabled={joining || teams.length >= tournament.max_teams}>
                {joining ? "Отправляем..." : "Зарегистрировать команду"}
              </button>
            </form>
          ) : <p>Для регистрации команды <Link to="/login">войдите в аккаунт</Link>.</p>}
          {joinMessage && <p role="status">{joinMessage}</p>}
        </div>
      )}
      <h2>Участники</h2>
      {user && <button type="button" disabled={joining} onClick={refreshRosters}>Обновить составы и заявки</button>}
      <div className="iste-tournaments__team-list">
        {teams.length ? teams.map((team, index) => <div className="iste-tournaments__team-item" key={team.id}>
          <span>{index + 1}</span><strong>{team.name}</strong>
          {tournament.status === "registration" && user && <button type="button" disabled={joining} onClick={()=>joinTeam(team.id)}>Подать заявку</button>}
          <div className="iste-tournaments__roster">
            <small>Состав: {rosters[team.id]?.players?.length ?? "—"} / 5</small>
            {rosters[team.id]?.players?.map(player=><span key={player.userId}>{player.captain?"Капитан":"Игрок"} · {player.name||"Игрок ISTe"}</span>)}
            {rosters[team.id]?.applications?.map(application=><div key={application.userId}>
              <small>Заявка: {application.userId.slice(0,8)}</small>
              <button type="button" disabled={joining} onClick={()=>reviewApplication(team.id,application.userId,true)}>Принять</button>
              <button type="button" disabled={joining} onClick={()=>reviewApplication(team.id,application.userId,false)}>Отклонить</button>
            </div>)}
          </div>
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
                    <Link to={"/tournaments/" + encodeURIComponent(slug) + "/matches/" + encodeURIComponent(match.id)}>Открыть матч-рум →</Link>
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