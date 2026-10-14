import { useState } from "react";
import { Link } from "react-router-dom";
import "./TournamentPreview.css";

const seeds = [
  ["ISTe Alpha", "Firestorm", 13, 8],
  ["Nova Squad", "Northern Wolves", 16, 14],
  ["Cyber Unit", "Phantoms", 7, 13],
  ["Aurora", "Last Hope", 13, 11],
];
const initialScores = seeds.map((s) => ({ a: s[2], b: s[3] }));

export default function TournamentPreview() {
  const [tab, setTab] = useState("bracket");
  const [scores, setScores] = useState(initialScores);
  const [selected, setSelected] = useState(0);
  const [showFinished, setShowFinished] = useState(true);
  const winners = seeds.map((pair, index) =>
    Number(scores[index].a) >= Number(scores[index].b) ? pair[0] : pair[1]
  );
  const round2 = [[winners[0], winners[1]], [winners[2], winners[3]]];

  function changeScore(index, team, value) {
    const number = value === "" ? "" : Math.min(99, Math.max(0, Number(value)));
    setScores((current) => current.map((s, i) => i === index ? { ...s, [team]: number } : s));
  }

  return (
    <section className="tp-page">
      <nav className="tp-breadcrumbs" aria-label="Навигация"><Link to="/founder">Панель владельца</Link><span>/</span><Link to="/owner/tournaments">Турниры</Link><span>/</span><span>Демо-сетка</span></nav>
      <header className="tp-hero">
        <div>
          <div className="tp-eyebrow">ISTe ESPORTS / TOURNAMENT CONTROL</div>
          <h1>CS2 <span>TOURNAMENTS</span></h1>
          <p>Демонстрационная сетка и управление матчами в едином интерфейсе ISTe. Изменения не затрагивают реальные турниры.</p>
          <div className="tp-tags"><span>CS2</span><span>Single Elimination</span><span>BO1 / BO3</span><span>8 команд</span></div>
        </div>
        <div className="tp-preview-badge">TEST MODE <small>Не реальные матчи</small></div>
      </header>

      <div className="tp-nav" role="tablist" aria-label="Экраны турнирной системы">
        {[
          ["bracket", "Турнирная сетка"],
          ["matches", "LIVE и матчи"],
          ["manage", "Панель организатора"],
        ].map(([id,label]) => <button type="button" role="tab" aria-selected={tab===id}
          className={tab===id ? "tp-tab-active" : ""}
          onClick={()=>setTab(id)} key={id}>{label}</button>)}
      </div>

      {tab === "bracket" && <>
        <div className="tp-heading"><div><h2>ISTe OPEN CUP</h2><p>Плей-офф · 8 команд · демонстрационная сетка</p></div><span className="tp-status">ПРЕДПРОСМОТР</span></div>
        <div className="tp-bracket">
          <div className="tp-round">
            <h3>1/4 ФИНАЛА</h3>
            {seeds.map((match,i)=><button type="button" className="tp-match" key={i} onClick={()=>{setSelected(i);setTab("matches")}}>
              <div><span>{match[0]}</span><b className={Number(scores[i].a)>Number(scores[i].b)?"tp-win":""}>{scores[i].a}</b></div>
              <div><span>{match[1]}</span><b className={Number(scores[i].b)>Number(scores[i].a)?"tp-win":""}>{scores[i].b}</b></div>
            </button>)}
          </div>
          <div className="tp-round tp-round-mid">
            <h3>ПОЛУФИНАЛЫ</h3>
            {round2.map((match,i)=><div className="tp-match tp-static" key={i}>
              <div><span>{match[0]}</span><b>—</b></div>
              <div><span>{match[1]}</span><b>—</b></div>
            </div>)}
          </div>
          <div className="tp-round tp-round-final">
            <h3>ФИНАЛ</h3>
            <div className="tp-match tp-static">
              <div><span>Победитель 1</span><b>—</b></div>
              <div><span>Победитель 2</span><b>—</b></div>
            </div>
          </div>
        </div>
      </>}

      {tab === "matches" && <>
        <div className="tp-heading"><div><h2>Центр матчей</h2><p>Тестирование обновления счёта и интерфейса</p></div><span className="tp-status">ДЕМО-ДАННЫЕ</span></div>
        <label className="tp-label">Выбрать матч
          <select value={selected} onChange={e=>setSelected(Number(e.target.value))}>
            {seeds.map((m,i)=><option key={i} value={i}>{m[0]} — {m[1]}</option>)}
          </select>
        </label>
        <div className="tp-live-card">
          <span className="tp-eyebrow">DEMONSTRATION / MIRAGE / BO1</span>
          <div className="tp-live-score">
            <strong>{seeds[selected][0]}</strong>
            <div><span>{scores[selected].a} : {scores[selected].b}</span><small>Изменяйте счёт ниже</small></div>
            <strong>{seeds[selected][1]}</strong>
          </div>
          <div className="tp-controls">
            <label>Команда A <input type="number" min="0" max="99" value={scores[selected].a}
              onChange={e=>changeScore(selected,"a",e.target.value)} /></label>
            <label>Команда B <input type="number" min="0" max="99" value={scores[selected].b}
              onChange={e=>changeScore(selected,"b",e.target.value)} /></label>
          </div>
          <p>Сетка пересчитывается в браузере. Данные не отправляются на сервер и не сохраняются.</p>
        </div>
      </>}

      {tab === "manage" && <>
        <div className="tp-heading"><div><h2>Панель организатора</h2><p>Так будет выглядеть управление своими турнирами</p></div><span className="tp-status">ПРОТОТИП</span></div>
        <div className="tp-cards">
          <article><small>УЧАСТНИКОВ</small><strong>8 / 8</strong><span>Регистрация закрыта</span></article>
          <article><small>МАТЧЕЙ</small><strong>4 / 7</strong><span>Первый раунд</span></article>
          <article><small>ИСТОЧНИК СЧЁТА</small><strong>Ручной</strong><span>Автоподключение позже</span></article>
        </div>
        <label className="tp-checkbox"><input type="checkbox" checked={showFinished} onChange={e=>setShowFinished(e.target.checked)}/> Показывать завершённые матчи</label>
        {showFinished && <div className="tp-rows">{seeds.map((m,i)=><div key={i}><span>{m[0]} — {m[1]}</span><strong>{scores[i].a}:{scores[i].b}</strong></div>)}</div>}
      </>}

      <footer className="tp-footer"><span>ISTe / TOURNAMENT OPERATIONS · ДЕМОНСТРАЦИОННЫЕ ДАННЫЕ</span><Link to="/owner/tournaments">← К управлению турнирами</Link></footer>
    </section>
  );
}