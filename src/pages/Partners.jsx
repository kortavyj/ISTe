import { useLanguage } from "../i18n/LanguageContext.jsx";

const official = "https://www.cyberion.ua/clubs/cyberion_dnipro_kalynova/";
const insta = "https://www.instagram.com/cyberion_dnipro_kalynova/";
const telegram = "https://t.me/CyberionKalynova";
const maps = "https://maps.app.goo.gl/63wRjufNFefTrydQA";

const specs = [
  ["◈", "30 геймерських ПК з NVIDIA RTX 5070+"],
  ["▤", "32 GB DDR5"],
  ["◉", "AMD Ryzen 5 7500F"],
  ["▣", "Монітори ASUS 24″ / 27″, 310 Hz"],
  ["⌨", "ASUS TUF Gaming K3 Gen II"],
  ["♜", "Ігрові крісла Cougar Armor Elite"],
];

const contactIcons = {
  location: <><path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" /><circle cx="12" cy="10" r="2.7" /></>,
  phone: <><path d="M21 16.4v2.8a2 2 0 0 1-2.2 2 18.3 18.3 0 0 1-8-2.8 18 18 0 0 1-5.5-5.5 18.3 18.3 0 0 1-2.8-8A2 2 0 0 1 4.5 2.7h2.8a2 2 0 0 1 2 1.7l.5 3a2 2 0 0 1-.6 1.8l-1.5 1.5a14 14 0 0 0 5.6 5.6l1.5-1.5a2 2 0 0 1 1.8-.6l3 .5a2 2 0 0 1 1.4 2Z" /></>,
  instagram: <><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><path d="M17.6 6.4h.01" strokeWidth="2.8" /></>,
  telegram: <><path d="m21.5 3-3.3 17.2-5.7-4.3-3.2 3.2.7-5.4L21.5 3ZM21.5 3 2.5 10.7l6.8 3 12.2-10.7Z" /><path d="m9.3 13.7 8-6.7" /></>,
  web: <><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3c3 3 4.5 6 4.5 9S15 18 12 21M12 3c-3 3-4.5 6-4.5 9S9 18 12 21" /></>,
};
function ContactIcon({ name }) {
  return <span className="cyberion-detail-icon" aria-hidden="true"><svg viewBox="0 0 24 24" width="23" height="23" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">{contactIcons[name]}</svg></span>;
}

function Logo({ large = false }) {
  return (
    <div className={`cyberion-mark${large ? " cyberion-mark-large" : ""}`} aria-label="CYBERION KALYNOVA">
      <span>CYBERI</span><span className="cyberion-on"><i />N</span>
      <strong>KALYNOVA</strong>
    </div>
  );
}

export default function Partners() {
  const { language } = useLanguage();
  const uk = language === "uk";
  return (
    <section className="cyberion-partners">
      <style>{`
        .cyberion-partners{color:#fff;min-height:85vh;background:radial-gradient(ellipse at 79% 10%,#4a060e 0%,transparent 43%),linear-gradient(125deg,#070608 0%,#100608 45%,#050506 100%);padding:28px max(24px,calc((100vw - 1320px)/2)) 72px;font-family:inherit;position:relative;isolation:isolate}
        .cyberion-partners:before{content:"";position:absolute;inset:0;z-index:-1;background:linear-gradient(90deg,rgba(4,2,5,.92) 0%,rgba(4,2,5,.6) 51%,rgba(4,2,5,.26) 100%),linear-gradient(0deg,rgba(4,2,5,.87),transparent 52%),url("https://www.cyberion.ua/wp-content/themes/cyberion/assets/img/clubbg.jpg") center top / cover no-repeat;opacity:.96}.cyberion-partners *{box-sizing:border-box}.cyberion-partners a{color:inherit;text-decoration:none}
        .cyberion-breadcrumb{color:#999;font-size:13px;margin-bottom:22px}.cyberion-breadcrumb b{color:#ff363e}
        .cyberion-hero{position:relative;overflow:hidden;border:0;border-radius:0;padding:22px 12px 28px;background:transparent;box-shadow:none}
        .cyberion-kicker{font-size:12px;letter-spacing:.24em;color:#ff424b;font-weight:800;text-transform:uppercase;margin:0 0 24px}
        .cyberion-mark{display:inline-flex;position:relative;align-items:center;font-size:31px;letter-spacing:.04em;line-height:1;font-weight:500;padding-bottom:.58em;white-space:nowrap}
        .cyberion-on{border:3px solid #ffe300;border-radius:99px;display:inline-flex;align-items:center;gap:.14em;height:1.1em;padding:0 .14em .03em .12em;color:#fff}
        .cyberion-on i{display:inline-block;background:#ffe300;width:.63em;height:.63em;border-radius:50%;box-shadow:inset 0 -4px 2px #c1ad00}
        .cyberion-mark strong{position:absolute;color:#ffe500;top:.84em;left:21%;font-size:.64em;letter-spacing:-.015em;font-weight:800}
        .cyberion-mark-large{font-size:clamp(36px,5vw,66px);margin-bottom:10px}
        .cyberion-hero h1{font-size:clamp(25px,3vw,40px);margin:20px 0 8px;max-width:800px}.cyberion-muted{color:#b7aeb1}.cyberion-hero p.cyberion-muted{max-width:700px;line-height:1.75;font-size:15px}
        .cyberion-actions{display:flex;gap:12px;flex-wrap:wrap;margin-top:28px}.cyberion-action{display:inline-flex;align-items:center;justify-content:center;border:1px solid #75232c;padding:13px 20px;border-radius:9px;font-size:14px;font-weight:700;background:#16090d}.cyberion-action-primary{background:#f51425;border-color:#f51425}.cyberion-action:focus-visible,.cyberion-social:focus-visible{outline:2px solid #fff}
        .cyberion-grid{display:grid;grid-template-columns:1fr 1fr 1.1fr;gap:14px;margin-top:0}
        .cyberion-panel{border:1px solid #66131e;border-radius:14px;background:linear-gradient(140deg,rgba(28,6,10,.94),rgba(8,8,10,.9));backdrop-filter:blur(10px);padding:23px;min-width:0}
        .cyberion-panel h2{font-size:18px;margin:0 0 20px;display:flex;align-items:center;gap:11px}.cyberion-panel h2 span{color:#ff3145}
        .cyberion-detail{display:flex;gap:12px;align-items:flex-start;border:1px solid #282025;border-radius:7px;padding:12px;margin-top:8px;background:#100e10;font-size:13px;overflow-wrap:anywhere}.cyberion-detail i{color:#ff344b;font-style:normal;font-size:18px}
        .cyberion-spec{display:flex;align-items:center;gap:13px;padding:12px 0;border-bottom:1px solid #35252a;font-size:14px}.cyberion-spec:last-child{border:0}.cyberion-spec i{color:#ff344b;font-style:normal;font-size:20px;min-width:24px}
        .cyberion-map{height:260px;background:linear-gradient(25deg,transparent 47%,#34363e 48%,#34363e 51%,transparent 52%),linear-gradient(-38deg,transparent 46%,#252831 47%,#252831 50%,transparent 51%),repeating-linear-gradient(0deg,#12141a 0 29px,#25252e 30px 31px),repeating-linear-gradient(90deg,#17191e 0 49px,#38333c 50px 51px);border-radius:10px;display:flex;align-items:center;justify-content:center;text-align:center;flex-direction:column;gap:9px;padding:20px}
        .cyberion-map strong{color:white;background:#680d1a;border:1px solid #f43c4e;border-radius:7px;padding:12px;font-size:14px}.cyberion-map small{color:#c9c9d0}.cyberion-map em{color:#f64b5a;font-style:normal;font-size:24px}
        .cyberion-socials{margin-top:16px}.cyberion-social-row{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}.cyberion-social{border:1px solid #75212e;border-radius:10px;padding:16px;background:#1b0b10;font-weight:700;font-size:14px;display:flex;justify-content:space-between;align-items:center;gap:8px}.cyberion-social:hover,.cyberion-action:hover{border-color:#ff4b5a;background:#351018}
        .cyberion-note{font-size:12px;color:#a69a9f;margin:23px 0 0;line-height:1.6}

        /* Three neon information panels */
        .cyberion-grid{display:grid;grid-template-columns:1fr 1fr 1.06fr;gap:18px;margin-top:0;align-items:stretch}
        .cyberion-panel{position:relative;overflow:hidden;min-width:0;padding:30px 27px 31px;border:1px solid #f02b4c;border-radius:19px;background:linear-gradient(145deg,rgba(45,6,15,.93),rgba(11,6,11,.97) 53%,rgba(34,3,10,.94));backdrop-filter:blur(12px);box-shadow:inset 0 1px rgba(255,121,141,.13),0 18px 55px rgba(0,0,0,.32),0 0 20px rgba(205,15,45,.08)}
        .cyberion-panel:before{content:"";position:absolute;right:-64px;top:-90px;width:200px;height:180px;background:radial-gradient(circle,rgba(197,16,43,.16),transparent 70%);pointer-events:none}
        .cyberion-panel h2{position:relative;font-size:clamp(17px,1.6vw,23px);font-weight:800;letter-spacing:-.02em;margin:0 0 28px;display:flex;align-items:center;gap:18px}
        .cyberion-panel h2:after{content:"";position:absolute;bottom:-13px;left:56px;width:62px;height:2px;background:linear-gradient(90deg,#f3294d,transparent)}
        .cyberion-panel h2 span{color:#ff3659;font-size:26px;line-height:1}
        .cyberion-detail{display:flex;align-items:center;gap:18px;border:1px solid #642332;border-radius:13px;padding:13px 17px;margin-top:11px;min-height:67px;background:linear-gradient(105deg,rgba(27,10,17,.98),rgba(23,11,18,.84));font-size:14px;overflow-wrap:anywhere;transition:border-color .18s,background .18s}
        .cyberion-detail:has(a):hover{border-color:#e73355;background:#2b0d18}
        .cyberion-detail i{font-style:normal;font-size:22px;color:#ff4162;display:grid;place-items:center;flex:0 0 53px;height:49px;border:1px solid #8b2538;border-radius:11px;background:radial-gradient(circle at 48% 80%,rgba(245,15,59,.35),rgba(43,11,22,.9));box-shadow:inset 0 0 11px rgba(255,34,67,.16)}
        .cyberion-spec{display:flex;align-items:center;gap:23px;padding:10px 0;border-bottom:1px solid #43202c;font-size:14px;min-height:66px}
        .cyberion-spec:last-child{border:0}.cyberion-spec i{font-style:normal;font-size:24px;color:#fa3354;display:grid;place-items:center;flex:0 0 54px;height:50px;border:1px solid #57202b;border-radius:11px;background:linear-gradient(160deg,#450c1d,#1b0811)}
        .cyberion-spec span{min-width:0}
        .cyberion-map{position:relative;overflow:hidden;isolation:isolate;height:310px;margin-bottom:14px;background:#14141d;border:1px solid #5b2336;border-radius:13px;display:flex;align-items:center;justify-content:center;text-align:center;flex-direction:column;gap:14px;padding:24px;box-shadow:inset 0 0 28px #04030b}
        .cyberion-map:before{content:"";position:absolute;inset:-25%;z-index:-1;opacity:.7;background:repeating-linear-gradient(0deg,transparent 0 47px,rgba(100,104,124,.16) 48px 49px,transparent 50px 100px),repeating-linear-gradient(90deg,transparent 0 48px,rgba(100,104,124,.13) 49px 50px,transparent 51px 100px),linear-gradient(30deg,transparent 39%,#3e303c 39.5%,#302631 43%,transparent 43.5%),linear-gradient(-39deg,transparent 43%,#38303d 43.4%,#38303d 48%,transparent 48.4%);transform:rotate(-12deg) scale(1.2)}
        .cyberion-map strong{color:#fff;background:linear-gradient(125deg,#500e20,#8f1028);border:1px solid #fa3052;border-radius:10px;padding:15px 20px;font-size:16px;box-shadow:0 0 25px rgba(255,23,66,.28)}
        .cyberion-map small{color:#d3cbd0;font-size:12px}.cyberion-map em{color:#ff315c;font-size:33px;font-style:normal;filter:drop-shadow(0 0 12px #ff144b)}
        .cyberion-location-link{display:block;text-decoration:none}
        .cyberion-location-link:hover .cyberion-map{border-color:#ff4b6a}
        .cyberion-location-caption{display:grid;gap:9px;text-align:center;color:#c4b8bf;padding:8px 5px 0;font-size:14px}
        .cyberion-location-caption span:last-child{color:#a6a0aa}

        .cyberion-detail-icon{color:#ff476a;display:grid;place-items:center;flex:0 0 53px;width:53px;height:49px;border:1px solid rgba(255,73,104,.47);border-radius:11px;background:radial-gradient(circle at 45% 83%,rgba(243,24,75,.35),rgba(38,10,23,.95));box-shadow:inset 0 0 15px rgba(255,39,82,.13),0 0 12px rgba(238,22,72,.08);transition:transform .2s ease,border-color .2s ease,box-shadow .2s ease}
        .cyberion-detail:has(a):hover .cyberion-detail-icon{transform:translateY(-1px) scale(1.04);border-color:#ff728c;box-shadow:0 0 20px rgba(255,42,88,.23),inset 0 0 18px rgba(255,55,97,.19)}
        .cyberion-detail-icon svg{display:block;flex-shrink:0}
        @media(max-width:1050px){.cyberion-grid{grid-template-columns:1fr 1fr}.cyberion-grid>.cyberion-panel:last-child{grid-column:1/-1}}
        @media(max-width:650px){.cyberion-grid{grid-template-columns:1fr;gap:14px}.cyberion-grid>.cyberion-panel:last-child{grid-column:auto}.cyberion-panel{padding:22px 17px}.cyberion-detail{padding:10px;font-size:13px}.cyberion-map{height:245px}}

        /* Compact layout matching the provided CYBERION partner mockup */
        .cyberion-partners{padding-top:22px;padding-bottom:40px}
        .cyberion-hero{padding:14px 12px 19px}
        .cyberion-kicker{margin-bottom:14px}
        .cyberion-mark-large{font-size:clamp(35px,4.5vw,65px);margin-bottom:0}
        .cyberion-hero h1{font-size:clamp(24px,2.5vw,34px);margin:12px 0 3px}
        .cyberion-hero p.cyberion-muted{font-size:14px;line-height:1.5;margin:6px 0}
        .cyberion-actions{margin-top:20px}
        .cyberion-grid{grid-template-columns:1.17fr .87fr 1.14fr;gap:11px}
        .cyberion-panel{padding:17px 16px;border:1px solid rgba(224,27,56,.75);border-radius:12px;background:linear-gradient(145deg,rgba(32,5,10,.89),rgba(8,7,10,.89));box-shadow:0 12px 38px #0005}
        .cyberion-panel h2{font-size:16px;gap:11px;margin:0 0 14px;letter-spacing:0}
        .cyberion-panel h2:after{display:none}
        .cyberion-panel h2 span{font-size:20px}
        .cyberion-detail{margin-top:6px;min-height:37px;padding:5px 8px;gap:10px;border-radius:8px;border-color:#3f3035;font-size:12px;background:rgba(10,11,16,.95)}
        .cyberion-detail-icon{height:28px;width:28px;flex:0 0 28px;border:0;background:transparent;box-shadow:none;color:#ff2047}
        .cyberion-detail-icon svg{height:21px;width:21px}
        .cyberion-detail:has(a):hover .cyberion-detail-icon{transform:none;box-shadow:none}
        .cyberion-spec{min-height:41px;padding:6px 2px;gap:10px;font-size:12px;border-bottom-color:#3e262d}
        .cyberion-spec i{font-size:18px;min-width:27px;flex:0 0 27px;height:27px;background:transparent;border:0;color:#ff1d45}
        .cyberion-map{height:218px;margin:0;border-radius:9px;padding:14px;gap:8px;background:#15161c}
        .cyberion-map strong{padding:9px 12px;font-size:13px}
        .cyberion-map em{font-size:28px}
        .cyberion-map:before{opacity:.85}
        .cyberion-location-caption{font-size:12px;padding:10px 1px 0;gap:5px}
        .cyberion-socials{display:flex;gap:24px;align-items:center;margin-top:12px;padding:15px 18px}
        .cyberion-socials h2{margin:0;flex:0 0 185px;font-size:15px;white-space:nowrap}
        .cyberion-social-row{flex:1;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px}
        .cyberion-social{background:rgba(21,7,11,.9);border:1px solid #8a202d;border-radius:8px;padding:12px 14px;font-size:12px;line-height:1.35;overflow-wrap:anywhere}
        .cyberion-social strong{display:block;font-size:12px}
        .cyberion-social small{display:block;margin-top:3px;font-size:11px;font-weight:400;color:#bcb3b8}
        .cyberion-social-symbol{font-size:19px;color:#ff3055}
        @media(max-width:1050px){.cyberion-grid{grid-template-columns:1fr 1fr}.cyberion-grid>.cyberion-panel:last-child{grid-column:1/-1}.cyberion-socials{flex-direction:column;align-items:stretch;gap:10px}.cyberion-socials h2{flex:auto}}
        @media(max-width:650px){.cyberion-grid{grid-template-columns:1fr}.cyberion-grid>.cyberion-panel:last-child{grid-column:auto}.cyberion-social-row{grid-template-columns:1fr}.cyberion-socials{padding:14px}}
        @media(max-width:850px){.cyberion-grid{grid-template-columns:1fr}.cyberion-social-row{grid-template-columns:1fr}.cyberion-hero{padding:26px 18px}.cyberion-partners{padding:26px 16px 60px}.cyberion-mark-large{font-size:clamp(30px,8vw,56px)}}
      `}</style>
      <div className="cyberion-breadcrumb">ISTe　›　{uk ? "Партнери" : "Partners"}　›　<b>CYBERION KALYNOVA</b></div>
      <div className="cyberion-hero">
        <p className="cyberion-kicker">{uk ? "Наш партнер" : "Our partner"}</p>
        <Logo large />
        <h1>Кіберклуб CYBERION Дніпро Лівий берег</h1>
        <p className="cyberion-muted">Мережа кіберклубів України · Дніпро, просп. Слобожанський, 89</p>
        <p className="cyberion-muted">Ігровий простір із 30 геймерськими ПК, сучасним обладнанням та можливістю забронювати місце через офіційні канали клубу.</p>
        <div className="cyberion-actions">
          <a className="cyberion-action cyberion-action-primary" href={telegram} target="_blank" rel="noopener noreferrer">↗ {uk ? "Забронювати місце" : "Book a place"}</a>
          <a className="cyberion-action" href={official} target="_blank" rel="noopener noreferrer">↗ {uk ? "Офіційна сторінка клубу" : "Official club page"}</a>
        </div>
      </div>
      <div className="cyberion-grid">
        <div className="cyberion-panel">
          <h2><span>⌖</span> Контактна інформація</h2>
          <div className="cyberion-detail"><ContactIcon name="location" /><span>Дніпро, просп. Слобожанський, 89</span></div>
          <div className="cyberion-detail"><ContactIcon name="phone" /><a href="tel:+380685551080">+38 (068) 555-10-80</a></div>
          <div className="cyberion-detail"><ContactIcon name="instagram" /><a href={insta} target="_blank" rel="noopener noreferrer">@cyberion_dnipro_kalynova ↗</a></div>
          <div className="cyberion-detail"><ContactIcon name="telegram" /><a href={telegram} target="_blank" rel="noopener noreferrer">@CyberionKalynova ↗</a></div>
          <div className="cyberion-detail"><ContactIcon name="web" /><a href={official} target="_blank" rel="noopener noreferrer">cyberion.ua / Дніпро Лівий берег ↗</a></div>
        </div>
        <div className="cyberion-panel">
          <h2><span>⚙</span> Що є в клубі</h2>
          {specs.map(([icon,text]) => <div className="cyberion-spec" key={text}><i>{icon}</i><span>{text}</span></div>)}
        </div>
        <div className="cyberion-panel">
          <h2><span>⌖</span> Розташування</h2>
          <a href={maps} target="_blank" rel="noopener noreferrer" aria-label="Відкрити місце CYBERION у Google Maps">
            <div className="cyberion-map">
              <em>📍</em>
              <strong>CYBERION KALYNOVA</strong>

            </div>
          </a>
          <div className="cyberion-location-caption"><span>📍 просп. Слобожанський, 89 · Дніпро</span><span>↗ Відкрити на Google Maps</span></div>
        </div>
      </div>
      <div className="cyberion-panel cyberion-socials">
        <h2><span>♧</span> Соцмережі партнера</h2>
        <div className="cyberion-social-row">
          <a className="cyberion-social" href={insta} target="_blank" rel="noopener noreferrer"><span className="cyberion-social-symbol">◎</span><span><strong>Instagram</strong><small>@cyberion_dnipro_kalynova</small></span><span>↗</span></a>
          <a className="cyberion-social" href={telegram} target="_blank" rel="noopener noreferrer"><span className="cyberion-social-symbol">➤</span><span><strong>Telegram</strong><small>@CyberionKalynova</small></span><span>↗</span></a>
          <a className="cyberion-social" href={official} target="_blank" rel="noopener noreferrer"><span className="cyberion-social-symbol">◎</span><span><strong>Сайт</strong><small>cyberion.ua/clubs/cyberion_dnipro_kalynova</small></span><span>↗</span></a>
        </div>
      </div>
    </section>
  );
}
