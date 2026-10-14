import { useEffect, useState } from "react";
import { useLanguage } from "../i18n/LanguageContext.jsx";
import "./TournamentsShowcase.css";
const words={
ru:["Турниры CS2","Сетка победителей","РАУНД 1","ПОЛУФИНАЛ","ПОБЕДИТЕЛЬ","ЧЕМПИОН ТУРНИРА","ДАЛЕЕ","ФИНАЛ","ЗАВЕРШЁН","Визуальная Beta-версия. Реальные турниры пока не подключены к базе.","Повторить анимацию","Создание турниров скоро"],
uk:["Турніри CS2","Сітка переможців","РАУНД 1","ПІВФІНАЛ","ПЕРЕМОЖЕЦЬ","ЧЕМПІОН ТУРНІРУ","ДАЛІ","ФІНАЛ","ЗАВЕРШЕНО","Візуальна Beta-версія. Справжні турніри поки не підключені до бази.","Повторити анімацію","Створення турнірів незабаром"],
en:["CS2 Tournaments","Winners Bracket","ROUND 1","SEMIFINAL","WINNER","TOURNAMENT CHAMPION","ADVANCE","FINAL","FINISHED","Visual Beta. Real tournaments are not yet connected to the database.","Replay animation","Tournament creation coming soon"]};
const games=[[["ISTesport","TEAM ALPHA",13,7],["TEAM BRAVO","TEAM CHARLIE",13,9]],[["ISTesport","TEAM BRAVO",13,10]]];
function Match({m,t}){return <div className="ts-match"><small>{t[8]}</small>{[0,1].map(i=><div key={i} className={"ts-side"+(m[2+i]>m[3-i]?" ts-win":"")}><span>{m[i]}</span><b>{m[2+i]}</b></div>)}</div>}
function Arrow({label,multi}){return <div className={"ts-join"+(multi?" ts-join--merge":"")} aria-hidden="true"><span className="ts-join-label">{label}</span><svg viewBox="0 0 80 300" preserveAspectRatio="none"><path className="ts-join-track" d={multi?"M0 64 H26 V150 H72 M0 236 H26 V150":"M0 150 H72"}/><path className="ts-join-moving" d={multi?"M0 64 H26 V150 H72 M0 236 H26 V150":"M0 150 H72"}/><path className="ts-join-tip" d="m65 143 8 7-8 7"/></svg></div>}
export default function TournamentsShowcase(){
const {language}=useLanguage(),t=words[language]||words.en;
const [playing,setPlaying]=useState(false);
useEffect(()=>{if(window.matchMedia("(prefers-reduced-motion: reduce)").matches)return;setPlaying(true);const id=setTimeout(()=>setPlaying(false),3600);return()=>clearTimeout(id)},[]);
const replay=()=>{if(window.matchMedia("(prefers-reduced-motion: reduce)").matches)return;setPlaying(false);requestAnimationFrame(()=>{setPlaying(true);setTimeout(()=>setPlaying(false),3600)})};
return <section className="ts-page"><header className="ts-hero"><span className="ts-kicker">ISTesport / COUNTER-STRIKE 2</span><h1>{t[0]}</h1><p>{t[9]}</p><div className="ts-actions"><button onClick={replay}>{t[10]}</button><button disabled>{t[11]}</button></div></header><div className="ts-shell"><div className="ts-head"><div><span className="ts-kicker">ISTesport / CHAMPIONSHIP BRACKET</span><h2>{t[1]}</h2></div><span className="ts-chip">VISUAL BETA</span></div><div className="ts-bracket ts-bracket--grid"><div className="ts-round"><h3>{t[2]} <small>2 MATCHES</small></h3>{games[0].map((m,i)=><Match key={i} m={m} t={t}/>)}</div><Arrow label={t[6]} multi/><div className="ts-round"><h3>{t[3]} <small>1 MATCH</small></h3><Match m={games[1][0]} t={t}/></div><Arrow label={t[7]}/><div className="ts-champion"><h3>{t[4]}</h3><div className="ts-champion-card"><span>{t[5]}</span><strong>ISTesport</strong><i>🏆</i></div></div></div><p className="ts-notice">{t[9]}</p></div>{playing&&<div className="ts-overlay" aria-hidden="true">
<div className="ts-cinema-glow"/>
<div className="ts-cinema-heading"><span>ISTesport</span><strong>THE ROAD TO VICTORY</strong></div>
<div className="ts-overlay-rounds"><div><small>ROUND 01</small><b>ISTesport</b><span>TEAM ALPHA</span></div><div><small>SEMIFINAL</small><b>ISTesport</b><span>TEAM BRAVO</span></div><div className="ts-overlay-winner"><small>CHAMPION</small><b>ISTesport</b><span>🏆 WINNER</span></div></div>
<div className="ts-flight"><div className="ts-trail-soft"/><div className="ts-trail-core"/><div className="ts-bullet"><svg viewBox="0 0 300 100" aria-hidden="true"><defs>
<linearGradient id="ts-brass" x1="0" y1="0" x2=".05" y2="1"><stop offset="0" stopColor="#faeac0"/><stop offset=".15" stopColor="#d8b17b"/><stop offset=".42" stopColor="#76502c"/><stop offset=".67" stopColor="#c89b5c"/><stop offset=".88" stopColor="#a27642"/><stop offset="1" stopColor="#51391f"/></linearGradient>
<linearGradient id="ts-lead" x1="0" y1="0" x2=".2" y2="1"><stop offset="0" stopColor="#f7f8f9"/><stop offset=".2" stopColor="#d4d8db"/><stop offset=".45" stopColor="#85898d"/><stop offset=".7" stopColor="#c7cccf"/><stop offset="1" stopColor="#50565b"/></linearGradient>
<linearGradient id="ts-rim" x1="0" y1="0" x2="1" y2="0"><stop stopColor="#896037"/><stop offset=".5" stopColor="#ebca8d"/><stop offset="1" stopColor="#5b4025"/></linearGradient>
</defs>
<path d="M22 16H158c9 0 17 4 24 10l13 12 3 12-3 12-13 12c-7 6-15 10-24 10H22c-9 0-13-5-13-15V31c0-10 4-15 13-15Z" fill="url(#ts-brass)" stroke="#e5ca92" strokeWidth="1.4"/>
<path d="M164 16c11 0 21 5 30 15L211 50l-17 19c-9 10-19 15-30 15 8-11 12-23 12-34s-4-23-12-34" fill="url(#ts-brass)" stroke="#bf965c" strokeWidth="1.5"/>
<path d="M198 31c17-6 29-4 47 3 16 6 33 15 44 16-11 2-28 11-44 16-18 7-30 9-47 3 6-13 9-25 9-38Z" fill="url(#ts-lead)" stroke="#e9edf0" strokeWidth="1.5"/>
<path d="M18 19H153M18 80H153" stroke="#fff1c2" strokeWidth="1" opacity=".48"/>
<path d="M34 17V83M155 18V82" stroke="#4d321c" strokeWidth="2" opacity=".8"/>
<ellipse cx="19" cy="50" rx="9" ry="31" fill="url(#ts-rim)" stroke="#f4d79c" strokeWidth="1.2"/><ellipse cx="19" cy="50" rx="4" ry="16" fill="#7d5630" stroke="#d7b27d"/>
<path d="M213 36c20 1 41 8 63 14-23 7-43 13-63 14 5-10 7-20 0-28" fill="#fff" opacity=".16"/>
</svg></div></div>
<div className="ts-overlay-caption">ISTesport <b>TOURNAMENTS</b></div>
</div>}</section>
}