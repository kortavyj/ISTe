import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import "./TournamentMatchRoom.css";

function getName(teams, id) {
  return teams.find(team => team.id === id)?.name || "Ожидается команда";
}

function Squad({ name, side }) {
  return <aside className="imr-squad" aria-label={`Состав команды ${name}`}>
    <h2>{name}</h2>
    <p className="imr-squad__label">{side === "a" ? "КОМАНДА A" : "КОМАНДА B"}</p>
    <div className="imr-squad__empty">Состав игроков появится после подключения регистрации участников.</div>
  </aside>;
}

export default function TournamentMatchRoom() {
  const { slug, matchId } = useParams();
  const [info, setInfo] = useState(null);
  const [failure, setFailure] = useState("");
  useEffect(() => {
    const ctrl = new AbortController();
    setInfo(null);
    setFailure("");
    async function fetchJson(url) {
      const res = await fetch(url, { signal: ctrl.signal });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.message || "Не удалось загрузить матч.");
      return json;
    }
    (async () => {
      const tournament = await fetchJson("/api/tournaments?slug=" + encodeURIComponent(slug));
      if (!tournament.tournament) throw new Error("Турнир не найден.");
      const id = encodeURIComponent(tournament.tournament.id);
      const [teams, matches] = await Promise.all([
        fetchJson("/api/tournament-teams?tournamentId=" + id),
        fetchJson("/api/tournament-matches?tournamentId=" + id),
      ]);
      const match = (matches.matches || []).find(item => item.id === matchId);
      if (!match) throw new Error("Матч не найден в этом турнире.");
      if (!ctrl.signal.aborted) setInfo({ tournament: tournament.tournament, teams: teams.teams || [], match });
    })().catch(error => { if (!ctrl.signal.aborted) setFailure(error.message); });
    return () => ctrl.abort();
  }, [slug, matchId]);

  const match = info?.match;
  const teamA = match && getName(info.teams, match.team_a_id);
  const teamB = match && getName(info.teams, match.team_b_id);
  const completed = match?.status === "completed" || match?.status === "finished";
  const scoreA = Number.isInteger(match?.score_a) ? match.score_a : "—";
  const scoreB = Number.isInteger(match?.score_b) ? match.score_b : "—";
  return <section className="imr-page">
    <div className="imr-back"><Link to={"/tournaments/" + encodeURIComponent(slug)}>← Вернуться к турниру</Link></div>
    {failure && <p role="alert" className="imr-error">{failure}</p>}
    {!failure && !info && <p role="status">Загружаем матч-рум…</p>}
    {info && <>
      <header className="imr-header">
        <div className="imr-eyebrow">ISTe ESPORTS / CS2 · {info.tournament.title} · РАУНД {match.round_number}</div>
        <div className="imr-score">
          <div className="imr-team">{teamA}</div>
          <div className="imr-result"><strong>{scoreA}</strong><span>VS</span><strong>{scoreB}</strong></div>
          <div className="imr-team">{teamB}</div>
        </div>
        <p className="imr-status">{completed ? "Матч завершён" : match.status === "scheduled" ? "Матч запланирован" : "Статус: " + match.status}</p>
      </header>
      <div className="imr-columns">
        <Squad name={teamA} side="a" />
        <div className="imr-center">
          <div className="imr-panel">
            <span className="imr-kicker">СЕРВЕР</span>
            <h2>Ожидается назначение</h2>
            <p>Организатор предоставит адрес и доступ к серверу. После добавления защищённого доступа участники матча увидят команду подключения здесь.</p>
          </div>
          <div className="imr-panel">
            <span className="imr-kicker">КАРТА</span>
            <h2>Ещё не указана</h2>
            <p>Выбранная карта появится после подключения настроек матча.</p>
          </div>
          <div className="imr-panel imr-panel--muted">
            <span className="imr-kicker">ФОРМАТ</span>
            <h2>{info.tournament.best_of === 3 ? "BO3" : "BO1"}</h2>
            <p>Матч №{match.match_number} · Раунд {match.round_number}</p>
          </div>
        </div>
        <Squad name={teamB} side="b" />
      </div>
      <p className="imr-disclaimer">Данные о сервере и игроках пока не подключены. Результат отображается из турнирной системы; аналитика матча отсутствует.</p>
    </>}
  </section>;
}
