import { useMemo, useState } from "react";
import "./TournamentManualBracket.css";

const sizes = [2, 4, 8, 16, 32];
const emptyTeams = (size) => Array.from({ length: size }, () => "");
const normalizeName = (value) => value.trim().replace(/\s+/g, " ");

export default function TournamentManualBracket() {
  const [size, setSize] = useState(8);
  const [title, setTitle] = useState("ISTe OPEN CUP");
  const [teams, setTeams] = useState(() => emptyTeams(8));
  const [entries, setEntries] = useState(null);
  const [results, setResults] = useState({});
  const [error, setError] = useState("");
  const [bestOf, setBestOf] = useState(1);

  const rounds = useMemo(() => {
    if (!entries) return [];
    const result = [];
    let current = [...entries];
    for (let round = 0; current.length > 1; round += 1) {
      const matches = [];
      for (let i = 0; i < current.length; i += 2) {
        const key = `${round}-${i / 2}`;
        const selected = results[key];
        const participants = [current[i], current[i + 1]];
        const winner = selected != null && participants.includes(selected.winner) ? selected.winner : null;
        matches.push({ key, participants, winner, result: winner ? selected : null });
      }
      result.push(matches);
      current = matches.map(m => m.winner);
    }
    return result;
  }, [entries, results]);

  function changeSize(value) {
    const next = Number(value);
    setSize(next);
    setTeams(old => Array.from({ length: next }, (_, i) => old[i] || ""));
    setEntries(null); setResults({}); setError("");
  }

  function generate(event) {
    event.preventDefault();
    const names = teams.map(normalizeName);
    if (names.some(name => name.length < 2 || name.length > 60)) {
      setError("Заполните названия всех команд (от 2 до 60 символов)."); return;
    }
    if (new Set(names.map(name => name.toLocaleLowerCase())).size !== names.length) {
      setError("Названия команд не должны повторяться."); return;
    }
    setEntries(names); setResults({}); setError("");
  }

  function selectWinner(match, team) {
    if (!team || !match.participants.every(Boolean)) return;
    const index = rounds.findIndex(round => round.some(item => item.key === match.key));
    setResults(previous => {
      const next = Object.fromEntries(Object.entries(previous).filter(([key]) => Number(key.split("-")[0]) <= index));
      next[match.key] = { winner: team };
      return next;
    });
  }

  const champion = rounds.length && rounds[rounds.length - 1][0]?.winner;
  return <section className="tmb-workspace" aria-label="Ручная турнирная сетка">
    <div className="tmb-intro">
      <div><p className="tmb-eyebrow">ISTe / MANUAL TOURNAMENT CREATOR</p><h2>Создать сетку <span>без UUID</span></h2>
        <p>Добавляйте команды вручную и выбирайте победителей матчей. Сетка автоматически обновляет следующие раунды.</p></div>
      <span className="tmb-local-mode">ЛОКАЛЬНЫЙ РЕЖИМ</span>
    </div>
    <div className="tmb-note" role="note">Этот режим работает только в браузере. Данные не записываются в Supabase и не публикуются для участников; при обновлении страницы они исчезнут.</div>
    <form className="tmb-setup" onSubmit={generate}>
      <div className="tmb-settings">
        <label>Название турнира<input value={title} onChange={e => setTitle(e.target.value)} maxLength={100} placeholder="Название турнира" /></label>
        <label>Количество команд<select value={size} onChange={e => changeSize(e.target.value)}>{sizes.map(n => <option key={n} value={n}>{n} команд</option>)}</select></label>
        <label>Формат<select value={bestOf} onChange={e => setBestOf(Number(e.target.value))}><option value={1}>BO1</option><option value={3}>BO3</option><option value={5}>BO5</option></select></label>
      </div>
      <div className="tmb-team-header"><h3>Участники</h3><small>{size} команд · Single Elimination</small></div>
      <div className="tmb-team-grid">{teams.map((name,i) => <label key={i}><span>#{String(i+1).padStart(2,"0")}</span>
        <input aria-label={`Название команды ${i+1}`} placeholder={`Команда ${i+1}`} value={name} maxLength={60} onChange={e => setTeams(old => old.map((x,j) => j === i ? e.target.value : x))} /></label>)}</div>
      {error && <p role="alert" className="tmb-error">{error}</p>}
      <div className="tmb-setup-actions"><button className="tmb-create" type="submit">Сформировать сетку ↗</button><button type="button" onClick={() => {setTeams(emptyTeams(size));setEntries(null);setResults({});setError("");}}>Очистить</button></div>
    </form>
    {entries && <div className="tmb-bracket-section">
      <div className="tmb-bracket-head"><div><p className="tmb-eyebrow">MANUAL BRACKET / BO{bestOf}</p><h3>{title.trim() || "Новый турнир"}</h3></div><span>{size} КОМАНД</span></div>
      <div className="tmb-rounds">{rounds.map((matches,roundIndex) => <section className="tmb-round" key={roundIndex}>
        <h4>{roundIndex === rounds.length-1 ? "ФИНАЛ" : roundIndex === rounds.length-2 ? "ПОЛУФИНАЛ" : `РАУНД ${roundIndex+1}`}</h4>
        <div className="tmb-match-list">{matches.map((match,i) => <article className="tmb-match" key={match.key}>
          <div className="tmb-match-label">МАТЧ {i+1} · BO{bestOf}</div>
          {match.participants.map((team,j) => <button type="button" key={j} disabled={!team || !match.participants.every(Boolean)}
            className={match.winner === team && team ? "tmb-team tmb-winner" : "tmb-team"}
            onClick={() => selectWinner(match,team)} aria-label={team ? `Победитель матча: ${team}` : "Ожидается команда"}>
            <span>{team || "Ожидается"}</span><b>{team && match.winner === team ? "✓" : "—"}</b></button>)}
        </article>)}</div>
      </section>)}</div>
      <div className="tmb-champion">{champion ? <><small>ПОБЕДИТЕЛЬ ТУРНИРА</small><strong>🏆 {champion}</strong></> : <><small>ФИНАЛЬНЫЙ РЕЗУЛЬТАТ</small><strong>Победитель ещё не определён</strong></>}</div>
    </div>}
  </section>;
}
