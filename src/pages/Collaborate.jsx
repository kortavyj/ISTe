import { useState } from "react";
import { Link } from "react-router-dom";
import VisitorWorldMap from "../components/VisitorWorldMap.jsx";

const EMAIL = "istesport.official@gmail.com";
const DISCORD = "https://discord.gg/AzpCxEgxye";

const packages = [
  { title: "Турніри під ключ", description: "Реєстрація команд, регламент, турнірна сітка, модерація та підсумковий звіт." },
  { title: "Брендові інтеграції", description: "Присутність партнера в анонсах, матеріалах події та комунікації зі спільнотою за погодженими умовами." },
  { title: "Цифрові рішення", description: "Лендінги, інтеграції FACEIT, Discord-боти та автоматизація для ігрових спільнот." }
];

function openEmail(subject, body) {
  window.location.href = "mailto:" + EMAIL + "?subject=" + encodeURIComponent(subject) + "&body=" + encodeURIComponent(body);
}


const DAILY_SAMPLE = [18,20,21,19,22,24,26,23,21,20,24,27,29,25,22,21,23,24,26,28,26,25,22,20,21,23,25,26,24,25];
const MONTHLY_AVERAGE = 700;
const countries = [
  { name: "Україна", value: 43, x: 59, y: 29 },
  { name: "Німеччина", value: 3, x: 50, y: 29 },
  { name: "Чехія", value: 3, x: 52, y: 31 },
  { name: "Росія", value: 2, x: 74, y: 22 },
  { name: "Польща", value: 1, x: 54, y: 27 },
  { name: "США", value: 1, x: 19, y: 36 },
  { name: "Монголія", value: 1, x: 78, y: 35 },
  { name: "Нідерланди", value: 1, x: 48, y: 28 },
];
const geographyTotal = countries.reduce((sum, item) => sum + item.value, 0);
function AudienceInsights() {
  const [windowDays, setWindowDays] = useState(30);
  const daily = DAILY_SAMPLE.map((count, index) => ({ day: index + 1, count }));
  const selected = daily.slice(-windowDays);
  const max = Math.max(...selected.map(item => item.count), 1);
  const points = selected.map((item, index) => ({
    x: 22 + index * 656 / Math.max(1, selected.length - 1),
    y: 170 - item.count / (max + 5) * 145,
    count: item.count,
    day: item.day,
  }));
  const path = points.map((point, i) => `${i ? "L" : "M"} ${point.x.toFixed(1)} ${point.y.toFixed(1)}`).join(" ");
  const area = path + " L 678 185 L 22 185 Z";
  const sampleTotal = DAILY_SAMPLE.reduce((a, b) => a + b, 0);
  return (
    <section className="iste-insights" aria-labelledby="iste-insights-title">
      <div className="iste-insights-heading">
        <div><p className="eyebrow">Аудиторія ISTe</p><h2 id="iste-insights-title">ISTe у цифрах</h2><p>Орієнтовна відвідуваність та географія за наданою статистикою.</p></div>
        <span className="iste-insights-status">Показники оновлюються вручну</span>
      </div>
      <div className="iste-insights-kpis">
        <div className="iste-insights-kpi"><span>Відвідувачів на місяць</span><strong>≈ 700</strong><small>Середня оцінка команди ISTe</small></div>
        <div className="iste-insights-kpi"><span>За день у середньому</span><strong>≈ 23</strong><small>700 / 30 днів, розрахункове значення</small></div>
        <div className="iste-insights-kpi"><span>Країн у знімку</span><strong>8</strong><small>Статистика за 31.10.2026</small></div>
        <div className="iste-insights-kpi"><span>Значень у другому стовпці</span><strong>55</strong><small>Сума наданих даних за день</small></div>
      </div>
      <div className="iste-insights-panels">
        <div className="iste-insights-panel">
          <div className="iste-insights-panelhead"><div><h3>Динаміка відвідувань</h3><p>Ілюстративний розподіл середньої місячної відвідуваності</p></div>
          <div className="iste-insights-switch" aria-label="Період графіка">{[7,30].map(n=><button type="button" key={n} aria-pressed={windowDays===n} className={windowDays===n?"active":""} onClick={()=>setWindowDays(n)}>{n} днів</button>)}</div></div>
          <svg className="iste-insights-chart" viewBox="0 0 700 220" role="img" aria-label={`Модельний графік відвідувань за ${windowDays} днів. Значення не є реальною щоденною аналітикою.`}>
            <defs><linearGradient id="iste-traffic-gradient" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="#fb4263" stopOpacity=".34"/><stop offset="100%" stopColor="#fb4263" stopOpacity="0"/></linearGradient></defs>
            {[50,95,140,185].map(y=><line key={y} x1="20" y1={y} x2="680" y2={y} stroke="#47303e" strokeDasharray="4 7"/>)}
            <path d={area} fill="url(#iste-traffic-gradient)"/><path d={path} fill="none" stroke="#ff4567" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round"/>
            {points.filter((_,i)=>i===0||i===points.length-1||i%Math.max(1,Math.floor(points.length/6))===0).map((p,i)=><g key={i}><circle cx={p.x} cy={p.y} r="4" fill="#fff" stroke="#ff4567" strokeWidth="2"/><text x={p.x} y={p.y-12} fill="#f2dce4" fontSize="12" textAnchor="middle">{p.count}</text></g>)}
            <text x="22" y="208" fill="#b9aeb9" fontSize="12">{selected[0].day} день</text><text x="678" y="208" fill="#b9aeb9" textAnchor="end" fontSize="12">{selected[selected.length-1].day} день</text>
          </svg>
          <p className="iste-insights-warning">Модель, не фактичні щоденні вимірювання. Сума модельного ряду: {sampleTotal}. Середня оцінка за місяць: {MONTHLY_AVERAGE}.</p>
        </div>
        <div className="iste-insights-panel">
          <div className="iste-insights-panelhead"><div><h3>Географія аудиторії</h3><p>Знімок за 31 жовтня 2026 року</p></div></div>
          <VisitorWorldMap />
          <div className="iste-country-list">{countries.map(c=><div className="iste-country" key={c.name}><span>{c.name}</span><div className="iste-country-track"><i style={{width:`${c.value/43*100}%`}}/></div><b>{c.value}</b></div>)}</div>
          <p className="iste-insights-warning">Показані значення другого стовпця наданої таблиці, разом {geographyTotal}. Значення першого стовпця не змішуються з ними. Бразилія не включена, оскільки число не надано.</p>
        </div>
      </div>
    </section>
  );
}

export default function Collaborate() {
  const [kind, setKind] = useState("partner");
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [message, setMessage] = useState("");
  const [accepted, setAccepted] = useState(false);
  const [website, setWebsite] = useState("");
  const [sending, setSending] = useState(false);
  const [feedback, setFeedback] = useState("");

  async function submit(event) {
    event.preventDefault();
    if (!name.trim() || !contact.trim() || message.trim().length < 10 || !accepted || sending) return;
    setSending(true);
    setFeedback("");
    try {
      const response = await fetch("/api/collaborate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind, name, contact, message, accepted, website }),
      });
      const result = await response.json();
      if (!response.ok || result.ok !== true) throw new Error(result.message || "Не вдалося надіслати заявку.");
      setFeedback("Дякуємо! Вашу заявку збережено. Команда ISTe розгляне звернення.");
      setName(""); setContact(""); setMessage(""); setAccepted(false);
    } catch (error) {
      setFeedback(error.message || "Помилка відправлення. Спробуйте ще раз.");
    } finally { setSending(false); }
  }

  return (
    <main className="iste-collaborate">
      <style>{`
        .iste-collaborate{max-width:1160px;margin:0 auto;padding:64px 24px 96px;color:#f7f7f9}
        .iste-collaborate *{box-sizing:border-box}
        .iste-collaborate h1{font-size:clamp(34px,5vw,62px);letter-spacing:-.045em;margin:8px 0 16px}
        .iste-collaborate h2{font-size:clamp(22px,3vw,32px);margin:0 0 12px}
        .iste-collaborate p{line-height:1.7;color:#b9bdc7}
        .iste-collaborate .eyebrow{color:#ff455d;font-size:13px;font-weight:800;letter-spacing:.16em;text-transform:uppercase}
        .iste-collaborate .intro{max-width:780px;font-size:18px}
        .iste-collaborate .actions{display:flex;gap:12px;flex-wrap:wrap;margin:28px 0 48px}
        .iste-collaborate .btn{display:inline-flex;align-items:center;justify-content:center;min-height:46px;padding:11px 18px;border-radius:10px;border:1px solid #ff304f;background:#e41e42;color:white;text-decoration:none;font-size:14px;font-weight:750;cursor:pointer}
        .iste-collaborate .btn.secondary{background:transparent;color:#fff;border-color:#58515b}
        .iste-collaborate .cards{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:15px;margin-bottom:42px}
        .iste-collaborate .card,.iste-collaborate .panel{background:linear-gradient(150deg,#230b15,#0f1017);border:1px solid #5b2333;border-radius:16px;padding:24px}
        .iste-collaborate .card h3{font-size:19px;margin:0 0 10px}
        .iste-collaborate .card p{margin:0;font-size:14px}
        .iste-collaborate .two{display:grid;grid-template-columns:1fr 1fr;gap:20px}
        .iste-collaborate .facts{display:grid;gap:9px;margin:22px 0 0}
        .iste-collaborate .facts div{padding:13px;border:1px solid #372632;border-radius:9px;color:#d8d7dc}
        .iste-collaborate label{display:block;color:#f1e8eb;font-weight:650;margin:0 0 14px}
        .iste-collaborate input:not([type="checkbox"]),.iste-collaborate select,.iste-collaborate textarea{display:block;width:100%;margin-top:7px;padding:12px;background:#101015;border:1px solid #59414b;border-radius:9px;color:white;font:inherit}
        .iste-collaborate textarea{min-height:130px;resize:vertical}
        .iste-collaborate .check{display:flex;align-items:flex-start;gap:10px;font-size:13px;font-weight:400;color:#c9c1c7}
        .iste-collaborate .check input{margin-top:3px}
        .iste-collaborate .notice{font-size:12px;color:#a8a7b0}

        .iste-insights{margin:12px 0 42px}.iste-insights-heading{display:flex;align-items:end;justify-content:space-between;gap:20px;margin-bottom:22px}.iste-insights-heading h2{font-size:clamp(28px,4vw,42px)}.iste-insights-heading p{margin:0}.iste-insights-status{font-size:12px;color:#f6b5c3;border:1px solid #693243;border-radius:99px;padding:9px 13px;white-space:nowrap;background:#30121f}
        .iste-insights-kpis{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:14px;margin-bottom:16px}.iste-insights-kpi{min-width:0;display:flex;flex-direction:column;gap:9px;padding:21px;border-radius:16px;border:1px solid #653145;background:radial-gradient(circle at 100% 0%,#592037 0%,transparent 65%),#17121b}.iste-insights-kpi span{color:#c8b5c0;font-size:13px}.iste-insights-kpi strong{font-size:clamp(28px,3.5vw,43px);letter-spacing:-.05em;line-height:1;color:#fff}.iste-insights-kpi small{font-size:11px;line-height:1.45;color:#a9a0aa}
        .iste-insights-panels{display:grid;grid-template-columns:1.12fr 1fr;gap:16px}.iste-insights-panel{min-width:0;border:1px solid #5d283b;border-radius:18px;background:linear-gradient(145deg,#24111c,#101119 60%);padding:22px;box-shadow:0 18px 46px #0004}.iste-insights-panelhead{display:flex;align-items:start;justify-content:space-between;flex-wrap:wrap;gap:12px}.iste-insights-panelhead h3{font-size:20px;margin:0 0 5px}.iste-insights-panelhead p{font-size:12px;margin:0}.iste-insights-switch{display:flex;padding:3px;border:1px solid #6b3748;border-radius:9px}.iste-insights-switch button{border:0;background:transparent;color:#baacb8;border-radius:7px;padding:7px 10px;font:inherit;font-size:12px;cursor:pointer}.iste-insights-switch button.active{background:#e32950;color:#fff}
        .iste-insights-chart{width:100%;height:auto;display:block;margin-top:18px}.iste-insights-warning{font-size:11px!important;line-height:1.6!important;color:#c2a1b2!important;margin:12px 0 0}.iste-geo-map{position:relative;margin-top:12px;border:1px solid #513247;border-radius:12px;overflow:hidden;background:radial-gradient(ellipse at center,#231b2a,#100e17)}.iste-geo-map svg{width:100%;height:auto;display:block}.iste-geo-map>span{display:block;text-align:center;font-size:10px;color:#b5a1af;padding:3px 7px 8px}.iste-country-list{display:grid;gap:9px;margin-top:14px}.iste-country{display:grid;grid-template-columns:105px 1fr 24px;gap:8px;align-items:center;font-size:12px;color:#e6dce2}.iste-country-track{height:6px;background:#3a2732;border-radius:20px;overflow:hidden}.iste-country-track i{height:100%;display:block;background:linear-gradient(90deg,#fc3050,#ff8299);border-radius:20px}.iste-country b{text-align:right}
        @media(max-width:960px){.iste-insights-kpis{grid-template-columns:repeat(2,minmax(0,1fr))}.iste-insights-panels{grid-template-columns:1fr}}@media(max-width:560px){.iste-insights-heading{align-items:start;flex-direction:column}.iste-insights-kpis{gap:9px}.iste-insights-kpi{padding:16px}.iste-insights-panel{padding:14px}.iste-country{grid-template-columns:93px 1fr 20px;gap:6px}}

        /* Partnership page visual refresh */
        .iste-collaborate{max-width:1320px;padding:35px 28px 78px;background:radial-gradient(ellipse at 84% 5%,rgba(159,23,53,.12),transparent 38%)}
        .iste-collaborate .iste-hero{position:relative;isolation:isolate;overflow:hidden;padding:60px clamp(24px,5vw,70px) 42px;margin-bottom:20px;border:1px solid #663040;border-radius:26px;background:radial-gradient(ellipse at 86% 24%,rgba(218,29,64,.28),transparent 52%),linear-gradient(125deg,#1d101a,#0a0b12 65%);box-shadow:0 25px 70px #0007}
        .iste-collaborate .iste-hero:after{content:"ISTe";position:absolute;right:4%;top:7%;font-size:clamp(95px,16vw,240px);font-weight:950;letter-spacing:-.09em;color:rgba(255,255,255,.027);pointer-events:none;z-index:-1}
        .iste-collaborate .iste-hero h1{max-width:820px;font-size:clamp(40px,5.4vw,72px);line-height:1.07;letter-spacing:-.055em;margin:12px 0 20px}
        .iste-collaborate .iste-hero .intro{max-width:690px;color:#d4c4ce;font-size:clamp(15px,1.55vw,19px);line-height:1.65}
        .iste-collaborate .iste-hero .actions{margin:28px 0 0}
        .iste-collaborate .btn{border-radius:11px;transition:transform .2s,border-color .2s,box-shadow .2s;background:linear-gradient(135deg,#ef244b,#b90e32);border-color:#eb3154;box-shadow:0 7px 18px rgba(191,24,57,.14)}
        .iste-collaborate .btn:hover{transform:translateY(-2px);box-shadow:0 12px 26px rgba(220,29,64,.25)}
        .iste-collaborate .btn.secondary{background:#ffffff07;box-shadow:none;border-color:#715462}
        .iste-collaborate .btn.secondary:hover{border-color:#f36a85}
        .iste-collaborate .cards{gap:15px;margin-bottom:46px}
        .iste-collaborate .card{position:relative;overflow:hidden;min-height:158px;padding:26px 24px;background:linear-gradient(155deg,#21111d,#111018 73%);border:1px solid #52303d;border-radius:17px;transition:transform .22s,border-color .22s}
        .iste-collaborate .card:before{content:"";display:block;width:33px;height:3px;background:#ed3659;border-radius:4px;margin-bottom:22px}
        .iste-collaborate .card:hover{transform:translateY(-4px);border-color:#df4267}
        .iste-collaborate .card h3{font-size:19px;margin-bottom:12px}
        .iste-collaborate .card p{line-height:1.6}
        .iste-insights{margin:0 0 44px}
        .iste-insights-heading{margin-bottom:18px}
        .iste-insights-heading h2{font-size:clamp(30px,3vw,42px)}
        .iste-insights-kpis{gap:12px}
        .iste-insights-kpi{background:linear-gradient(145deg,#25101c,#12131b);border-color:#4e2a38;padding:20px 22px;border-radius:14px;gap:8px}
        .iste-insights-kpi strong{color:#fff}
        .iste-insights-panels{grid-template-columns:minmax(0,1fr) minmax(0,1fr);align-items:start}
        .iste-insights-panel{padding:23px;border-radius:17px;background:linear-gradient(145deg,#1b111b,#101018);box-shadow:none}
        .iste-insights-panelhead h3{font-size:19px}
        .iste-collaborate .two{align-items:start;grid-template-columns:.88fr 1.12fr;gap:16px}
        .iste-collaborate .panel{padding:clamp(22px,2.5vw,34px);border-radius:18px;background:linear-gradient(145deg,#21111c,#100e16);border-color:#55303e}
        .iste-collaborate .panel h2{line-height:1.22}
        .iste-collaborate .facts{gap:10px;margin:20px 0 0}
        .iste-collaborate .facts div{background:#ffffff04;border-color:#513140;border-radius:10px;line-height:1.6;font-size:13px}
        .iste-collaborate label{font-size:13px;margin-bottom:15px}
        .iste-collaborate input:not([type="checkbox"]),.iste-collaborate select,.iste-collaborate textarea{min-height:46px;outline:none;border:1px solid #614251;border-radius:10px;background:#0d0d14;transition:border-color .2s,box-shadow .2s}
        .iste-collaborate input:focus,.iste-collaborate select:focus,.iste-collaborate textarea:focus{border-color:#ff5579;box-shadow:0 0 0 3px #ff315122}
        .iste-collaborate textarea{min-height:128px}
        .iste-collaborate .notice{line-height:1.65}
        @media(max-width:960px){.iste-insights-panels,.iste-collaborate .two{grid-template-columns:1fr}}
        @media(max-width:760px){.iste-collaborate{padding:18px 14px 56px}.iste-collaborate .iste-hero{padding:35px 22px 30px;border-radius:18px}.iste-collaborate .iste-hero h1{font-size:clamp(33px,9vw,51px)}.iste-collaborate .cards{gap:12px;margin-bottom:32px}.iste-collaborate .card{min-height:unset;padding:21px}.iste-insights{margin-bottom:30px}}
        @media(prefers-reduced-motion:reduce){.iste-collaborate .card,.iste-collaborate .btn{transition:none}}
        @media(max-width:760px){.iste-collaborate .cards,.iste-collaborate .two{grid-template-columns:1fr}}

        /* Commercial landing visual system */
        .iste-collaborate{max-width:1380px;padding:28px 26px 90px}
        .iste-collaborate .iste-hero{display:grid;grid-template-columns:minmax(0,1.2fr) minmax(280px,.8fr);align-items:center;min-height:410px;gap:20px;padding:56px clamp(26px,5vw,72px);margin-bottom:52px;border:1px solid #592537;border-radius:26px;background:radial-gradient(ellipse at 82% 42%,rgba(218,32,74,.18),transparent 50%),radial-gradient(ellipse at 8% 0%,rgba(147,30,68,.17),transparent 48%),#0d0a12}
        .iste-collaborate .iste-hero:after{display:none}
        .iste-hero-content{position:relative;z-index:2}
        .iste-hero-side{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:22px;min-width:0}
        .iste-hero-ring{position:relative;width:min(100%,340px);aspect-ratio:1;display:flex;flex-direction:column;align-items:center;justify-content:center;border-radius:50%;border:1px solid #8a344a;background:radial-gradient(circle,#4a1728 0%,#170c17 58%,#0c0b12 72%);box-shadow:0 0 0 19px #ac23410c,0 0 0 42px #ac234108,inset 0 0 70px #b4253e33}
        .iste-hero-ring:before,.iste-hero-ring:after{content:"";position:absolute;width:12px;height:12px;background:#ff3b62;border-radius:50%;box-shadow:0 0 20px #ff3b62}
        .iste-hero-ring:before{top:16%;left:14%}.iste-hero-ring:after{right:10%;bottom:20%;width:7px;height:7px}
        .iste-hero-brand{font-size:clamp(65px,8vw,112px);font-weight:950;letter-spacing:-.11em;line-height:1;text-shadow:0 7px 35px #0008}
        .iste-hero-brand span{color:#ff4266}
        .iste-hero-ring-caption{margin-top:14px;color:#d7a4b2;font-size:10px;font-weight:900;letter-spacing:.24em;text-align:center}
        .iste-hero-decor{display:flex;gap:14px;flex-wrap:wrap;justify-content:center;color:#946b7b;font-size:10px;font-weight:800;letter-spacing:.08em}
        .iste-collaborate .iste-hero h1{max-width:740px}
        .iste-collaborate .iste-hero .intro{max-width:610px}
        .iste-section-heading{display:flex;justify-content:space-between;align-items:end;gap:30px;margin:0 0 20px}
        .iste-section-heading h2{margin:7px 0 0!important;font-size:clamp(26px,3vw,36px)!important;letter-spacing:-.035em}
        .iste-section-heading p{max-width:430px;font-size:14px;line-height:1.6;margin:0}
        .iste-collaborate .eyebrow{font-size:11px;letter-spacing:.15em}
        .iste-collaborate .cards{margin-bottom:55px}
        .iste-collaborate .card{min-height:206px;padding:30px;background:linear-gradient(145deg,#21111b,#101017 75%)}
        .iste-collaborate .card:before{width:45px;margin-bottom:26px}
        .iste-card-number{position:absolute;top:21px;right:22px;font-size:13px;font-weight:800;color:#995063;letter-spacing:.13em}
        .iste-card-arrow{position:absolute;right:25px;bottom:19px;color:#f45776;font-size:24px}
        .iste-collaborate .card p{max-width:300px}
        .iste-insights{margin-bottom:56px}
        .iste-insights-heading{padding-bottom:18px;border-bottom:1px solid #422331}
        .iste-insights-kpi{border-radius:17px;background:linear-gradient(145deg,#1f111c,#100f16);padding:25px}
        .iste-insights-kpi strong{font-size:clamp(34px,3.6vw,50px)}
        .iste-insights-panel{border-radius:18px;background:linear-gradient(145deg,#1c111a,#0e0f17);padding:26px}
        .iste-insights-panels{align-items:stretch}
        .iste-last-heading{padding-top:8px}
        .iste-collaborate .two{align-items:stretch;grid-template-columns:.95fr 1.05fr;gap:20px}
        .iste-collaborate .two>.panel{min-width:0;box-shadow:0 14px 42px #0003}
        .iste-collaborate .panel .actions{margin-bottom:20px}
        .iste-collaborate .panel h2{font-size:clamp(23px,2.3vw,31px)}
        .iste-collaborate .panel a:not(.btn){color:#ef7290}
        .iste-collaborate input:not([type="checkbox"]):focus-visible,.iste-collaborate select:focus-visible,.iste-collaborate textarea:focus-visible,.iste-collaborate .btn:focus-visible{outline:2px solid #ff7b9c;outline-offset:2px}
        @media(max-width:980px){.iste-collaborate .iste-hero{grid-template-columns:1fr}.iste-hero-side{display:none}.iste-collaborate .two{grid-template-columns:1fr}}
        @media(max-width:720px){.iste-collaborate{padding:16px 14px 58px}.iste-collaborate .iste-hero{min-height:0;padding:38px 23px;margin-bottom:35px}.iste-section-heading{align-items:start;flex-direction:column;gap:10px}.iste-collaborate .cards{margin-bottom:40px}.iste-collaborate .card{min-height:170px;padding:24px}.iste-insights{margin-bottom:40px}.iste-insights-panel{padding:17px}}
        @media(prefers-reduced-motion:reduce){.iste-collaborate .card,.iste-collaborate .btn{transition:none}}
      `}</style>
      <div className="iste-hero"><div className="iste-hero-content"><p className="eyebrow">ISTe Esports · Для брендів, клубів та команд</p>
      <h1>Станьте партнером ISTe</h1>
      <p className="intro">Розвиваємо ігрову спільноту, проводимо змагальні активності та створюємо цифрові продукти. Запрошуємо до співпраці бренди, комп'ютерні клуби й організаторів подій.</p>
      <div className="actions">
        <a className="btn" href="#request">Запропонувати співпрацю</a>
        <a className="btn secondary" href={DISCORD} target="_blank" rel="noopener noreferrer">Приєднатися до Discord</a>
        <Link className="btn secondary" to="/tournaments">Турніри ISTe</Link>
      </div></div><div className="iste-hero-side" aria-hidden="true"><div className="iste-hero-ring"><div className="iste-hero-brand">IST<span>e</span></div><div className="iste-hero-ring-caption">ESPORTS · COMMUNITY · DIGITAL</div></div><div className="iste-hero-decor"><span>01 / CONNECT</span><span>02 / CREATE</span><span>03 / GROW</span></div></div></div>
      <div className="iste-section-heading"><div><span className="eyebrow">МОЖЛИВОСТІ ДЛЯ БІЗНЕСУ</span><h2>Формати співпраці</h2></div><p>Від ігрових подій до цифрових продуктів, підберемо формат під цілі вашого бренду.</p></div>
      <section aria-label="Формати співпраці" className="cards">
        {packages.map((item,index) => <article className="card" key={item.title}><span className="iste-card-number">0{index+1}</span><h3>{item.title}</h3><p>{item.description}</p><span className="iste-card-arrow" aria-hidden="true">↗</span></article>)}
      </section>
      <AudienceInsights />
      <div className="iste-section-heading iste-last-heading"><div><span className="eyebrow">ПОЧНІМО СПІВПРАЦЮ</span><h2>Обговорімо ваш проєкт</h2></div><p>Опишіть ідею, а ми підготуємо пропозицію щодо можливого формату роботи.</p></div>
      <div className="two">
        <section className="panel" aria-labelledby="media-title">
          <p className="eyebrow">Медіакіт · Коротка версія</p>
          <h2 id="media-title">ISTe для партнерів</h2>
          <p>Ми працюємо на перетині кіберспорту, спільнот та вебтехнологій. Можемо обговорити спонсорство змагань, спільні активності, брендований контент і технічні послуги.</p>
          <div className="facts">
            <div>Напрямки: CS2, FACEIT, Discord, турнірні та вебінструменти</div>
            <div>Формати: онлайн події, партнерські кампанії, технічні проєкти</div>
            <div>Охоплення та аудиторія: надаємо перевірені показники за запитом</div>
            <div>Реклама продукції з віковими обмеженнями: лише для повнолітньої аудиторії та з дотриманням законодавства</div>
          </div>
          <div className="actions"><button type="button" className="btn secondary" onClick={() => openEmail("ISTe | Запит медіакіту", "Вітаю! Прошу надіслати актуальний медіакіт ISTe з підтвердженими показниками аудиторії.")}>Запросити медіакіт</button></div>
          <p className="notice">Актуальні цифри не опубліковані, доки їх не підтверджено. Ця сторінка містить коротку відкриту версію пропозиції.</p>
        </section>
        <section className="panel" id="request" aria-labelledby="request-title">
          <p className="eyebrow">Зв'язатися з ISTe</p>
          <h2 id="request-title">Заявка на партнерство або турнір</h2>
          <form onSubmit={submit}><input type="text" autoComplete="off" tabIndex={-1} aria-hidden="true" value={website} onChange={event => setWebsite(event.target.value)} style={{position:"absolute",left:"-10000px",opacity:0}} />
            <label>Тип звернення<select value={kind} onChange={event => setKind(event.target.value)}><option value="partner">Партнерство / реклама</option><option value="tournament">Організація турніру</option></select></label>
            <label>Ім'я або компанія<input required maxLength={120} value={name} onChange={event => setName(event.target.value)} /></label>
            <label>Email, Telegram або Discord<input required maxLength={180} value={contact} onChange={event => setContact(event.target.value)} /></label>
            <label>{kind === "partner" ? "Опишіть ідею співпраці" : "Гра, дата, кількість команд і формат"}<textarea required maxLength={2500} value={message} onChange={event => setMessage(event.target.value)} /></label>
            <label className="check"><input type="checkbox" checked={accepted} onChange={event => setAccepted(event.target.checked)} required />Погоджуюсь передати вказані контактні дані команді ISTe для відповіді на запит.</label>
            <button type="submit" className="btn" disabled={sending}>{sending ? "Надсилаємо…" : "Надіслати заявку"}</button>{feedback && <p role="status" aria-live="polite">{feedback}</p>}
          </form>
          <p className="notice">Заявка зберігається в захищеній базі ISTe для розгляду командою. Контактні дані не публікуються.</p>
          <p className="notice">Або напишіть напряму: <a href={"mailto:" + EMAIL}>{EMAIL}</a></p>
        </section>
      </div>
    </main>
  );
}
