import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { createSingleEliminationBracket, confirmBracketWinner } from "../../api/lib/tournamentBracket.js";
import { validateManualMatchResult } from "../../api/lib/tournamentManualResults.js";
import "./TournamentMatchLab.css";

const MAPS = ["Mirage", "Inferno", "Nuke", "Ancient", "Anubis", "Dust2", "Overpass", "Train", "Vertigo"];
const PLAYERS = Array.from({ length: 8 }, (_, i) => ({ id: `istedev-${i + 1}`, seed: i + 1 }));
const LABELS = Object.fromEntries(PLAYERS.map((t) => [t.id, `Команда #${t.seed}`]));
const emptyMap = (i) => ({ name: MAPS[i % MAPS.length], scoreA: "", scoreB: "" });
const DEFAULT_MAPS = [emptyMap(0)];
const toInt = (value) => value === "" ? "" : Number(value);

export default function TournamentMatchLab() {
  const [rounds, setRounds] = useState(() => createSingleEliminationBracket(PLAYERS, 8));
  const [selected, setSelected] = useState("r0-m0");
  const [drafts, setDrafts] = useState({});
  const [message, setMessage] = useState("");
  const [confirming, setConfirming] = useState(false);
  const match = rounds.flat().find(m => m.id === selected);
  const draft = drafts[selected] ?? { bestOf: 3, maps: DEFAULT_MAPS };
  const entered = useMemo(() => ({
    bestOf: draft.bestOf,
    maps: draft.maps.map(m => ({ name:m.name, scoreA:m.scoreA, scoreB:m.scoreB }))
  }), [draft]);
  const validated = useMemo(() => validateManualMatchResult(entered), [entered]);
  const displayError = {
    INVALID_MAP_COUNT: "Укажите достаточно карт для выбранного BO.",
    SERIES_INCOMPLETE: "Серия ещё не завершена.",
    INVALID_MAP_SCORE: "Укажите целые значения счёта без ничьих.",
    INVALID_MAP_NAME: "Карты не должны повторяться.",
    SERIES_ALREADY_DECIDED: "После победы в серии дополнительные карты недопустимы."
  };

  function updateDraft(patch) {
    setDrafts(prev => ({ ...prev, [selected]: { ...draft, ...patch } }));
    setMessage(""); setConfirming(false);
  }
  function reset() {
    setRounds(createSingleEliminationBracket(PLAYERS, 8));
    setSelected("r0-m0"); setDrafts({});
    setMessage("Тестовая сетка сброшена."); setConfirming(false);
  }
  function commit() {
    if (!validated.ok || !match?.teamA || !match?.teamB || match.winner) return;
    try {
      const winner = validated.value.winner === "A" ? match.teamA : match.teamB;
      setRounds(prev => confirmBracketWinner(prev, selected, winner));
      setConfirming(false);
      setMessage(`Результат подтверждён только в браузере: ${LABELS[winner]} проходит дальше.`);
    } catch (e) { setMessage(e.message || "Не удалось подтвердить результат."); }
  }

  return <section className="tml-page">
    <div className="tml-top">
      <div><div className="tml-eyebrow">ISTe / OWNER / LOCAL SIMULATION</div><h1>MANUAL MATCH <span>CONTROL</span></h1>
        <p>Результаты BO1 / BO3 / BO5. Здесь нет сохранения в Supabase или отправки результатов на сервер.</p></div>
      <strong className="tml-badge">DEMO ONLY</strong>
    </div>
    <div className="tml-actions"><Link to="/owner/tournaments">← Панель турниров</Link><button type="button" onClick={reset}>Сбросить тестовую сетку</button></div>
    <div className="tml-layout">
      <aside className="tml-rounds">
        {rounds.map((round, i) => <div key={i}><h2>{i === rounds.length-1 ? "ФИНАЛ" : `РАУНД ${i+1}`}</h2>
          {round.map(m => <button key={m.id} className={`tml-match ${m.id === selected ? "tml-selected" : ""}`}
            type="button" onClick={() => { setSelected(m.id); setMessage(""); setConfirming(false); }}>
            <span>{m.teamA ? LABELS[m.teamA] : "Ожидается"}</span><span>{m.teamB ? LABELS[m.teamB] : "Ожидается"}</span>
            <small>{m.confirmed ? "Подтверждено" : m.winner ? "BYE" : "Ожидание"}</small></button>)}</div>)}
      </aside>
      <div className="tml-editor">
        <h2>{match?.teamA ? LABELS[match.teamA] : "Участник A"} <span>VS</span> {match?.teamB ? LABELS[match.teamB] : "Участник B"}</h2>
        {match?.confirmed ? <p className="tml-done">Результат уже подтверждён. Победитель: {LABELS[match.winner]}.</p> :
          !match?.teamA || !match?.teamB ? <p className="tml-note">Матч пока не готов: дождитесь обеих команд.</p> :
          <><label className="tml-label">Формат серии
            <select value={draft.bestOf} onChange={e => updateDraft({ bestOf: Number(e.target.value), maps: [emptyMap(0)] })}>
              {[1,3,5].map(bo => <option value={bo} key={bo}>BO{bo}</option>)}</select></label>
            <div className="tml-maps">{draft.maps.map((m, i) => <div key={i} className="tml-map">
              <label>Карта {i+1}<select value={m.name} onChange={e => updateDraft({ maps:draft.maps.map((row,j) => j===i ? {...row,name:e.target.value} : row) })}>
                {MAPS.map(name=><option key={name} value={name}>{name}</option>)}</select></label>
              <label>Команда A<input type="number" min="0" max="99" value={m.scoreA} onChange={e => updateDraft({ maps:draft.maps.map((row,j) => j===i ? {...row,scoreA:toInt(e.target.value)} : row) })}/></label>
              <label>Команда B<input type="number" min="0" max="99" value={m.scoreB} onChange={e => updateDraft({ maps:draft.maps.map((row,j) => j===i ? {...row,scoreB:toInt(e.target.value)} : row) })}/></label>
              <button type="button" onClick={() => updateDraft({ maps:draft.maps.filter((_,j)=>j!==i) })} aria-label={`Удалить карту ${i+1}`}>×</button>
            </div>)}</div>
            <button type="button" className="tml-secondary" disabled={draft.maps.length >= draft.bestOf} onClick={() => updateDraft({ maps:[...draft.maps,emptyMap(draft.maps.length)] })}>+ Добавить карту</button>
            <p className="tml-note" role="status">{validated.ok ? `Предварительный счёт серии: ${validated.value.scoreA} : ${validated.value.scoreB}. Победитель — ${validated.value.winner === "A" ? LABELS[match.teamA] : LABELS[match.teamB]}.` : (displayError[validated.error] || "Заполните карты и счёт для завершённой серии.")}</p>
            {!confirming ? <button className="tml-primary" type="button" disabled={!validated.ok} onClick={() => setConfirming(true)}>Проверить и подтвердить результат</button> :
            <div className="tml-confirm"><strong>Подтвердить продвижение победителя в следующий раунд?</strong><p>Это изменит только локальную демонстрационную сетку.</p><button type="button" className="tml-primary" onClick={commit}>Да, подтвердить</button><button type="button" className="tml-secondary" onClick={() => setConfirming(false)}>Отмена</button></div>}
          </>}
        {message ? <p className="tml-note" role="status">{message}</p> : null}
      </div>
    </div>
  </section>;
}
