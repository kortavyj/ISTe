import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { readSharedBracket } from "../components/tournaments/manualBracketShare.js";
import "./TournamentSharedBracket.css";

function makeRounds(data) {
  let current = [...data.entries]; const rounds = [];
  for (let round = 0; current.length > 1; round++) {
    const matches = [];
    for (let i = 0; i < current.length; i+=2) {
      const key = `${round}-${i/2}`, participants=[current[i],current[i+1]];
      const result=data.results[key];
      const winner=result && participants.every(Boolean) && participants.includes(result.winner) ? result.winner : null;
      matches.push({key,participants,result:winner?result:null,winner});
    }
    rounds.push(matches);current=matches.map(m=>m.winner);
  }
  return rounds;
}
export default function TournamentSharedBracket() {
  const [data,setData]=useState(null);const [error,setError]=useState("");
  useEffect(()=>{let active=true;
    const token=new URLSearchParams(window.location.hash.slice(1)).get("s");
    readSharedBracket(token).then(value=>{if(active)setData(value);}).catch(()=>{if(active)setError("Не удалось открыть сетку. Проверьте, что ссылка скопирована полностью.");});
    return ()=>{active=false;};
  },[]);
  const rounds=useMemo(()=>data?makeRounds(data):[],[data]);
  const champion=rounds.at(-1)?.[0]?.winner;
  return <main className="tsb-page">
    <header className="tsb-hero"><p>ISTe ESPORTS / TOURNAMENT VIEWER</p><h1>ТУРНИРНАЯ <span>СЕТКА</span></h1><p>Публичный просмотр без входа и без доступа к редактированию.</p><span className="tsb-snapshot">СНИМОК · READ ONLY</span></header>
    <div className="tsb-nav"><Link to="/tournaments">← Все турниры ISTe</Link><span>Это сохранённая версия сетки. Последующие изменения организатора не появятся автоматически.</span></div>
    {!error&&!data&&<div className="tsb-message" role="status">Загрузка сетки…</div>}
    {error&&<div className="tsb-message" role="alert">{error}</div>}
    {data&&<><div className="tsb-title"><div><p>MANUAL TOURNAMENT / BO{data.bestOf}</p><h2>{data.title}</h2></div><span>{data.size} КОМАНД</span></div>
      <div className="tsb-rounds">{rounds.map((matches,round)=><section key={round}><h3>{round===rounds.length-1?"ФИНАЛ":round===rounds.length-2?"ПОЛУФИНАЛ":`РАУНД ${round+1}`}</h3><div className="tsb-match-group">{matches.map((match,i)=><article key={match.key}><small>МАТЧ {i+1} · BO{data.bestOf}</small>{match.participants.map((team,j)=><div key={j} className={team&&match.winner===team?"tsb-winner":""}><span>{team||"Ожидается"}</span><b>{match.result?(j===0?match.result.scoreA:match.result.scoreB):"—"}</b></div>)}{match.result?.maps?.length>0&&<details><summary>Карты ({match.result.maps.length})</summary>{match.result.maps.map((map,k)=><p key={k}>{map.name}: {map.a}–{map.b}</p>)}</details>}</article>)}</div></section>)}</div>
      <div className="tsb-champion"><small>ИТОГ ТУРНИРА</small><strong>{champion?`🏆 ${champion}`:"Победитель ещё не определён"}</strong></div>
    </>}
  </main>;
}
