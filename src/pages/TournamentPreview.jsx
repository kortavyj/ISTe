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
  const [tournament, setTournament] = useState({ name:"ISTe OPEN CUP", format:"single_elimination", bestOf:"BO1", capacity:8, status:"draft", startsAt:"" });
  const [teams, setTeams] = useState(["ISTe Main", "ISTe Academy", "Firestorm", "Nova Squad"]);
  const [newTeam, setNewTeam] = useState("");
  const [notice, setNotice] = useState("");
  const updateTournament = (key,value) => { setTournament(current => ({...current,[key]:value})); setNotice("Демонстрационные настройки изменены. На сервере не сохранено."); };
  const addTeam = () => { const name=newTeam.trim();if(!name){setNotice("Введите название команды.");return;}if(teams.some(t=>t.toLocaleLowerCase()===name.toLocaleLowerCase())){setNotice("Команда уже добавлена.");return;}if(teams.length>=Number(tournament.capacity)){setNotice("Лимит участников достигнут.");return;}setTeams(current=>[...current,name]);setNewTeam("");setNotice("Команда добавлена только в демонстрационный список.");};
  const resetSandbox=()=>{setTournament({name:"ISTe OPEN CUP",format:"single_elimination",bestOf:"BO1",capacity:8,status:"draft",startsAt:""});setTeams(["ISTe Main","ISTe Academy","Firestorm","Nova Squad"]);setScores(initialScores);setNotice("Демонстрация сброшена.");};
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
      <header className="tp-hero">
        <div>
          <div className="tp-eyebrow">ISTe / PRIVATE DEVELOPMENT PREVIEW</div>
          <h1>CS2 TOURNAMENTS</h1>
          <p>Закрытый интерактивный прототип турнирного раздела. Только для владельца ISTe.</p>
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
        <div className="tp-heading"><div><h2>Панель организатора · V2</h2><p>Закрытый этап 1 · настройка турнира и участников в браузере</p></div><span className="tp-status">SANDBOX · БЕЗ БАЗЫ</span></div>
        <div className="tp-cards"><article><small>ЗАЯВКИ / МЕСТА</small><strong>{teams.length} / {tournament.capacity}</strong><span>Локальные тестовые команды</span></article><article><small>ФОРМАТ</small><strong>{tournament.bestOf}</strong><span>Single Elimination</span></article><article><small>СТАТУС</small><strong>{tournament.status}</strong><span>Не опубликовано</span></article></div>
        <div className="tp-v2-grid">
          <section className="tp-v2-panel"><h3>Настройки турнира</h3><div className="tp-v2-fields">
            <label>Название турнира<input maxLength={80} value={tournament.name} onChange={e=>updateTournament("name",e.target.value)}/></label>
            <label>Формат<select value={tournament.format} onChange={e=>updateTournament("format",e.target.value)}><option value="single_elimination">Single Elimination</option></select></label>
            <label>Тип матчей<select value={tournament.bestOf} onChange={e=>updateTournament("bestOf",e.target.value)}><option>BO1</option><option>BO3</option><option>BO5</option></select></label>
            <label>Количество команд<select value={tournament.capacity} onChange={e=>{const cap=Number(e.target.value);if(cap<teams.length){setNotice("Сначала удалите лишние команды.");return;}updateTournament("capacity",cap);}}><option value={4}>4</option><option value={8}>8</option><option value={16}>16</option><option value={32}>32</option></select></label>
            <label>Начало (локальное время)<input type="datetime-local" value={tournament.startsAt} onChange={e=>updateTournament("startsAt",e.target.value)}/></label>
            <label>Состояние<select value={tournament.status} onChange={e=>updateTournament("status",e.target.value)}><option value="draft">Черновик</option><option value="registration">Регистрация</option><option value="live">В процессе</option><option value="finished">Завершён</option></select></label>
          </div></section>
          <section className="tp-v2-panel"><h3>Участники ({teams.length})</h3><form className="tp-v2-add" onSubmit={e=>{e.preventDefault();addTeam();}}><input aria-label="Название команды" placeholder="Название команды" maxLength={60} value={newTeam} onChange={e=>setNewTeam(e.target.value)}/><button type="submit">Добавить</button></form><div className="tp-v2-teams">{teams.map((team,index)=><div key={team}><span><b>{String(index+1).padStart(2,"0")}</b> {team}</span><button type="button" onClick={()=>{setTeams(current=>current.filter(t=>t!==team));setNotice("Команда удалена из демонстрации.");}} aria-label={`Удалить ${team}`}>Удалить</button></div>)}</div></section>
        </div>
        <p className="tp-v2-notice" role="status">{notice || "Все изменения работают только в этой вкладке. В Supabase ничего не записывается."}</p>
        <button className="tp-v2-reset" type="button" onClick={resetSandbox}>Сбросить демо</button>
        <label className="tp-checkbox"><input type="checkbox" checked={showFinished} onChange={e=>setShowFinished(e.target.checked)}/> Показать тестовые результаты матчей</label>
        {showFinished && <div className="tp-rows">{seeds.map((m,i)=><div key={i}><span>{m[0]} — {m[1]}</span><strong>{scores[i].a}:{scores[i].b}</strong></div>)}</div>}
      </>}

      <footer className="tp-footer"><span>PRIVATE PREVIEW · Только макет, никаких реальных турниров</span><Link to="/founder">← Панель владельца</Link></footer>
    </section>
  );
}