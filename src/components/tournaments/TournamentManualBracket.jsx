import { useCallback, useEffect, useMemo, useState } from "react";
import ManualMatchEditor from "./ManualMatchEditor.jsx";
import "./TournamentManualBracket.css";

const sizes = [2, 4, 8, 16, 32];
const LEGACY_KEY = "iste:manual-bracket:v2";
const LIBRARY_KEY = "iste:manual-bracket:library:v1";
const entryKey = id => `iste:manual-bracket:entry:${id}`;
const newId = () => `local-${Date.now()}-${Math.random().toString(36).slice(2,10)}`;
function readLibrary() {
  try {
    const data = JSON.parse(localStorage.getItem(LIBRARY_KEY) || "null");
    if (data && Array.isArray(data.items) && data.items.length > 0 && data.items.length <= 50
      && data.items.every(t => typeof t.id === "string" && /^local-[a-zA-Z0-9-]+$/.test(t.id) && typeof t.title === "string")) {
      return { items: data.items, activeId: data.items.some(t => t.id === data.activeId) ? data.activeId : data.items[0].id };
    }
  } catch { /* fall through to local default */ }
  const id = newId();
  try { const old = localStorage.getItem(LEGACY_KEY); if (old) localStorage.setItem(entryKey(id), old); } catch { /* storage might be unavailable */ }
  return { items:[{ id, title:"ISTe OPEN CUP" }], activeId:id };
}

function initialState(storageKey) {
  try {
    const data = JSON.parse(localStorage.getItem(storageKey) || "null");
    if (data && sizes.includes(data.size) && [1,3,5].includes(data.bestOf) && typeof data.title === "string" && data.title.length <= 100
      && Array.isArray(data.teams) && data.teams.length === data.size && data.teams.every(x => typeof x === "string" && x.length <= 60)
      && (data.entries === null || (Array.isArray(data.entries) && data.entries.length === data.size && data.entries.every(x => typeof x === "string" && x.length <= 60)))) {
      return { ...data, results: data.results && typeof data.results === "object" && !Array.isArray(data.results) ? data.results : {} };
    }
  } catch { /* corrupt or unavailable browser storage */ }
  return { size:8, title:"ISTe OPEN CUP", teams:emptyTeams(8), entries:null, results:{}, bestOf:1 };
}
const emptyTeams = (size) => Array.from({ length: size }, () => "");
const normalizeName = (value) => value.trim().replace(/\s+/g, " ");

function ManualBracketEditor({ workspaceId, onTitleChange }) {
  const storageKey = entryKey(workspaceId);
  const [initial] = useState(() => initialState(storageKey));
  const [size, setSize] = useState(initial.size);
  const [title, setTitle] = useState(initial.title);
  const [teams, setTeams] = useState(initial.teams);
  const [entries, setEntries] = useState(initial.entries);
  const [results, setResults] = useState(initial.results);
  const [error, setError] = useState("");
  const [bestOf, setBestOf] = useState(initial.bestOf);
  const [editing, setEditing] = useState(null);
  const [storageError, setStorageError] = useState(false);
  useEffect(() => {
    try { localStorage.setItem(storageKey, JSON.stringify({size,title,teams,entries,results,bestOf})); setStorageError(false); }
    catch { setStorageError(true); }
  }, [size,title,teams,entries,results,bestOf,storageKey]);
  useEffect(() => { onTitleChange(workspaceId, title.trim() || "Без названия"); }, [workspaceId,title,onTitleChange]);

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
        const validResult = selected && participants.every(Boolean) && participants.includes(selected.winner)
          && Array.isArray(selected.maps) && selected.maps.length <= bestOf && selected.maps.length > 0
          && selected.maps.every(m => typeof m.name === "string" && Number.isInteger(m.a) && Number.isInteger(m.b))
          && [selected.scoreA,selected.scoreB].every(n => Number.isInteger(n))
          && Math.max(selected.scoreA,selected.scoreB) === Math.floor(bestOf/2)+1;
        const winner = validResult ? selected.winner : null;
        matches.push({ key, participants, winner, result: winner ? selected : null });
      }
      result.push(matches);
      current = matches.map(m => m.winner);
    }
    return result;
  }, [entries, results, bestOf]);

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

  function recordMatch(match, result) {
    setResults(previous => {
      const next = { ...previous, [match.key]: result };
      const roundIndex = Number(match.key.split("-")[0]);
      for (const key of Object.keys(next)) if (Number(key.split("-")[0]) > roundIndex) delete next[key];
      return next;
    });
    setEditing(null);
  }

  const champion = rounds.length && rounds[rounds.length - 1][0]?.winner;
  return <section className="tmb-workspace" aria-label="Ручная турнирная сетка">
    <div className="tmb-intro">
      <div><p className="tmb-eyebrow">ISTe / MANUAL TOURNAMENT CREATOR</p><h2>Создать сетку <span>без UUID</span></h2>
        <p>Добавляйте команды вручную и выбирайте победителей матчей. Сетка автоматически обновляет следующие раунды.</p></div>
      <span className="tmb-local-mode">ЛОКАЛЬНЫЙ РЕЖИМ</span>
    </div>
    <div className="tmb-note" role="note">Этот режим работает только в браузере. Данные сохраняются отдельно для каждого турнира в этом браузере. Они не отправляются в Supabase и не публикуются для участников.</div>
    <form className="tmb-setup" onSubmit={generate}>
      <div className="tmb-settings">
        <label>Название турнира<input value={title} onChange={e => setTitle(e.target.value)} maxLength={100} placeholder="Название турнира" /></label>
        <label>Количество команд<select value={size} onChange={e => changeSize(e.target.value)}>{sizes.map(n => <option key={n} value={n}>{n} команд</option>)}</select></label>
        <label>Формат<select value={bestOf} onChange={e => {setBestOf(Number(e.target.value));setResults({});}}><option value={1}>BO1</option><option value={3}>BO3</option><option value={5}>BO5</option></select></label>
      </div>
      <div className="tmb-team-header"><h3>Участники</h3><small>{size} команд · Single Elimination</small></div>
      <div className="tmb-team-grid">{teams.map((name,i) => <label key={i}><span>#{String(i+1).padStart(2,"0")}</span>
        <input aria-label={`Название команды ${i+1}`} placeholder={`Команда ${i+1}`} value={name} maxLength={60} onChange={e => setTeams(old => old.map((x,j) => j === i ? e.target.value : x))} /></label>)}</div>
      {error && <p role="alert" className="tmb-error">{error}</p>}
      {storageError && <p role="alert" className="tmb-error">Браузер не разрешает локальное сохранение. Сетка может исчезнуть после перезагрузки.</p>}
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
            onClick={() => setEditing(match)} aria-label={team ? `Ввести результат матча: ${team}` : "Ожидается команда"}>
            <span>{team || "Ожидается"}</span><b>{match.result ? (j === 0 ? match.result.scoreA : match.result.scoreB) : "—"}</b></button>)}
        </article>)}</div>
      </section>)}</div>
      {editing && <ManualMatchEditor match={editing} bestOf={bestOf} onSave={result=>recordMatch(editing,result)} onClose={()=>setEditing(null)} />}
      <div className="tmb-champion">{champion ? <><small>ПОБЕДИТЕЛЬ ТУРНИРА</small><strong>🏆 {champion}</strong></> : <><small>ФИНАЛЬНЫЙ РЕЗУЛЬТАТ</small><strong>Победитель ещё не определён</strong></>}</div>
    </div>}
  </section>;
}

function downloadTournament(id, title) {
  const raw = localStorage.getItem(entryKey(id));
  if (!raw) throw new Error("Сохранённые данные не найдены.");
  const parsed = JSON.parse(raw);
  const payload = JSON.stringify({ schema:"iste-manual-tournament-v1", title, tournament:parsed }, null, 2);
  const blob = new Blob([payload], {type:"application/json"});
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "ISTe-tournament-" + new Date().toISOString().slice(0,10) + ".json";
  document.body.appendChild(anchor); anchor.click(); anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export default function TournamentManualBracket() {
  const [library, setLibrary] = useState(readLibrary);
  const [libraryError, setLibraryError] = useState("");
  useEffect(() => {
    try { localStorage.setItem(LIBRARY_KEY, JSON.stringify(library)); }
    catch { setLibraryError("Не удалось сохранить список турниров в браузере."); }
  }, [library]);
  const updateTitle = useCallback((id, title) => {
    setLibrary(old => {
      if (!old.items.some(item => item.id === id && item.title !== title)) return old;
      return { ...old, items:old.items.map(item => item.id === id ? {...item,title} : item) };
    });
  }, []);
  function create() {
    if (library.items.length >= 50) { setLibraryError("Лимит — 50 локальных турниров."); return; }
    const id = newId();
    setLibrary(old => ({ items:[...old.items,{id,title:"Новый турнир"}],activeId:id }));
    setLibraryError("");
  }
  function remove() {
    if (!window.confirm("Удалить текущий локальный турнир? Отменить действие будет нельзя.")) return;
    try { localStorage.removeItem(entryKey(library.activeId)); } catch { /* warn on next storage failure */ }
    const remaining = library.items.filter(item => item.id !== library.activeId);
    if (!remaining.length) {
      const id = newId();
      setLibrary({items:[{id,title:"ISTe OPEN CUP"}],activeId:id});
    } else setLibrary({items:remaining,activeId:remaining[0].id});
  }
  function exportCurrent() {
    try { downloadTournament(library.activeId, library.items.find(item=>item.id===library.activeId)?.title || "ISTe");setLibraryError(""); }
    catch { setLibraryError("Не удалось экспортировать турнир. Проверьте настройки браузера."); }
  }
  return <>
    <div className="tmb-library">
      <div><p className="tmb-eyebrow">ISTe / MY MANUAL TOURNAMENTS</p><h2>Мои локальные турниры</h2><p>Переключайтесь между независимыми сетками без UUID.</p></div>
      <label>Выбранный турнир
        <select value={library.activeId} onChange={e=>setLibrary(old=>({...old,activeId:e.target.value}))}>
          {library.items.map(item=><option key={item.id} value={item.id}>{item.title}</option>)}
        </select>
      </label>
      <div className="tmb-library-actions">
        <button type="button" onClick={create}>+ Новый турнир</button>
        <button type="button" onClick={exportCurrent}>Экспорт JSON ↓</button>
        <button type="button" onClick={remove} className="tmb-remove">Удалить</button>
      </div>
    </div>
    {libraryError && <p role="alert" className="tmb-error">{libraryError}</p>}
    <ManualBracketEditor key={library.activeId} workspaceId={library.activeId} onTitleChange={updateTitle}/>
  </>;
}
