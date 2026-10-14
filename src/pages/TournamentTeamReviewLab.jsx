import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import "./TournamentTeamReviewLab.css";
import "./TournamentWorkspaceShared.css";

const EXAMPLES = [
 {id:"example-1",name:"ISTe Alpha",captain:"AlphaCaptain",members:["AlphaCaptain","A1","A2","A3","A4"],status:"pending"},
 {id:"example-2",name:"Northern Wolves",captain:"WolfLead",members:["WolfLead","W1","W2","W3","W4","W5"],status:"pending"},
 {id:"example-3",name:"Kyiv Five",captain:"KyivLeader",members:["KyivLeader","K1","K2","K3","K4"],status:"pending"},
 {id:"example-4",name:"Night Shift",captain:"NightLead",members:["NightLead","N1","N2","N3","N4"],status:"pending"},
 {id:"example-5",name:"Mirage Squad",captain:"MirageLead",members:["MirageLead","M1","M2","M3","M4"],status:"pending"},
];

export default function TournamentTeamReviewLab() {
 const [teams,setTeams] = useState(EXAMPLES);
 const [capacity,setCapacity] = useState(4);
 const [filter,setFilter] = useState("all");
 const [selection,setSelection] = useState(null);
 const [notice,setNotice] = useState("");
 const approved = useMemo(()=>teams.filter(t=>t.status==="approved").length,[teams]);
 const visible = useMemo(()=>teams.filter(t=>filter==="all"||t.status===filter),[teams,filter]);
 const pending = teams.filter(t=>t.status==="pending").length;
 function decide() {
   if (!selection) return;
   const team=teams.find(t=>t.id===selection.id);
   if (!team||team.status!=="pending") {setSelection(null);setNotice("Заявка уже рассмотрена.");return;}
   if (selection.action==="approved"&&approved>=capacity) {setSelection(null);setNotice("Лимит одобренных команд достигнут.");return;}
   setTeams(prev=>prev.map(t=>t.id===selection.id?{...t,status:selection.action}:t));
   setNotice(`${team.name}: ${selection.action==="approved"?"одобрена":"отклонена"} (только в браузере).`);
   setSelection(null);
 }
 function reset() {setTeams(EXAMPLES);setSelection(null);setNotice("Демонстрационные заявки сброшены.");}
 return <section className="tr-page">
   <header className="tr-header"><div><p className="tr-eyebrow">ISTe / OWNER / TOURNAMENTS V2</p>
     <h1>TEAM <span>APPLICATIONS</span></h1>
     <p>Рассмотрение заявок команд и проверка составов для CS2.</p></div>
     <strong className="tr-badge">DEMO ONLY</strong></header>
   <div className="tr-info" role="status"><strong>Демонстрационный режим.</strong> Примеры команд вымышлены. Решения хранятся только в текущей вкладке, запросы к API и Supabase не отправляются.</div>
   <div className="tr-toolbar">
     <Link to="/owner/tournaments">← Панель турниров</Link>
     <label>Лимит команд <select value={capacity} onChange={e=>{setCapacity(Number(e.target.value));setSelection(null);}}><option value={2}>2</option><option value={4}>4</option><option value={8}>8</option></select></label>
     <button onClick={reset} type="button">Сбросить демоданные</button>
   </div>
   <div className="tr-stats"><div><strong>{teams.length}</strong><small>Заявок</small></div><div><strong>{pending}</strong><small>Ожидают</small></div><div><strong>{approved} / {capacity}</strong><small>Одобрено / лимит</small></div><div><strong>{teams.filter(t=>t.status==="rejected").length}</strong><small>Отклонено</small></div></div>
   <div className="tr-tabs" aria-label="Фильтр заявок">{[["all","Все"],["pending","Ожидают"],["approved","Одобрены"],["rejected","Отклонены"]].map(([value,label])=><button type="button" key={value} aria-pressed={filter===value} className={filter===value?"tr-current":""} onClick={()=>setFilter(value)}>{label}</button>)}</div>
   <div className="tr-list">{visible.length===0?<p>Заявок с таким статусом нет.</p>:visible.map(team=><article key={team.id} className="tr-card">
     <div className="tr-card-top"><h2>{team.name}</h2><span className={`tr-status tr-${team.status}`}>{team.status==="pending"?"Ожидает":team.status==="approved"?"Одобрена":"Отклонена"}</span></div>
     <p>Капитан: <strong>{team.captain}</strong> · {team.members.length} игроков</p>
     <details><summary>Показать состав</summary><ol>{team.members.map((member,i)=><li key={member}>{member}{i===0?" · капитан":""}</li>)}</ol></details>
     {team.status==="pending"?<div className="tr-card-actions"><button type="button" disabled={approved>=capacity} onClick={()=>setSelection({id:team.id,action:"approved"})}>Одобрить</button><button type="button" onClick={()=>setSelection({id:team.id,action:"rejected"})}>Отклонить</button></div>:null}
   </article>)}</div>
   {notice?<p className="tr-notice" role="status">{notice}</p>:null}
   {selection?<div className="tr-overlay" role="presentation"><div className="tr-dialog" role="dialog" aria-modal="true" aria-labelledby="tr-dialog-title">
     <h2 id="tr-dialog-title">Подтвердить решение?</h2>
     <p>{selection.action==="approved"?"Одобрить":"Отклонить"} заявку команды «{teams.find(t=>t.id===selection.id)?.name}»?</p><p>Изменится только локальная демонстрация.</p>
     <button type="button" onClick={decide}>Подтвердить</button><button type="button" onClick={()=>setSelection(null)}>Отмена</button>
   </div></div>:null}
 </section>;
}
