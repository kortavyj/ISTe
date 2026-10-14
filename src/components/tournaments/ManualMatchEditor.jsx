import { useState } from "react";
const MAPS = ["Ancient", "Anubis", "Dust2", "Inferno", "Mirage", "Nuke", "Overpass", "Train", "Vertigo"];
export default function ManualMatchEditor({ match, bestOf, onSave, onClose }) {
  const [maps, setMaps] = useState(() => match.result?.maps?.length
    ? match.result.maps.map(m => ({ ...m }))
    : [{ name: "Mirage", a: "", b: "" }]);
  const [error, setError] = useState("");
  const need = Math.floor(bestOf / 2) + 1;
  function patch(i, field, value) {
    setMaps(old => old.map((m, j) => i === j ? { ...m, [field]: value } : m));
    setError("");
  }
  function save(event) {
    event.preventDefault();
    const used = new Set();
    let aWins = 0, bWins = 0;
    const valid = [];
    for (const map of maps) {
      const a = Number(map.a), b = Number(map.b);
      if (!MAPS.includes(map.name) || used.has(map.name) || map.a === "" || map.b === ""
          || !Number.isSafeInteger(a) || !Number.isSafeInteger(b) || a < 0 || b < 0 || a > 99 || b > 99 || a === b
          || aWins === need || bWins === need) {
        setError("Укажите разные карты и корректные счета 0–99 без ничьих или лишних карт."); return;
      }
      used.add(map.name);
      aWins += Number(a > b); bWins += Number(b > a);
      valid.push({ name: map.name, a, b });
    }
    if (Math.max(aWins, bWins) !== need) {
      setError(`Для BO${bestOf} нужно ${need} побед по картам одной команды.`); return;
    }
    onSave({ winner: aWins > bWins ? match.participants[0] : match.participants[1], maps: valid, scoreA: aWins, scoreB: bWins });
  }
  return <div className="tmb-modal-backdrop" onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}>
    <section className="tmb-modal" role="dialog" aria-modal="true" aria-labelledby="tmb-modal-title">
      <div className="tmb-modal-head"><p className="tmb-eyebrow">ISTe / MANUAL SCORE</p><h3 id="tmb-modal-title">{match.participants.join(" — ")}</h3><span>BO{bestOf}</span></div>
      <form onSubmit={save}>
        {maps.map((m,i) => <div className="tmb-map" key={i}>
          <label>Карта {i+1}<select value={m.name} onChange={e=>patch(i,"name",e.target.value)}>
            {MAPS.map(name=><option value={name} key={name}>{name}</option>)}</select></label>
          <label>{match.participants[0]}<input type="number" min="0" max="99" value={m.a} onChange={e=>patch(i,"a",e.target.value)}/></label>
          <label>{match.participants[1]}<input type="number" min="0" max="99" value={m.b} onChange={e=>patch(i,"b",e.target.value)}/></label>
        </div>)}
        {error && <p role="alert" className="tmb-error">{error}</p>}
        <div className="tmb-modal-actions">
          {maps.length < bestOf && <button type="button" onClick={()=>setMaps(old=>[...old,{name:MAPS.find(x=>!old.some(y=>y.name===x))||"Mirage",a:"",b:""}])}>+ Карта</button>}
          {maps.length > 1 && <button type="button" onClick={()=>setMaps(old=>old.slice(0,-1))}>Убрать карту</button>}
          <button type="submit" className="tmb-confirm">Сохранить результат</button>
          <button type="button" onClick={onClose}>Отмена</button>
        </div>
      </form>
    </section>
  </div>;
}
