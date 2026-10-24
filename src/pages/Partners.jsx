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
        .cyberion-partners{color:#fff;min-height:85vh;background:radial-gradient(ellipse at 79% 10%,#4a060e 0%,transparent 43%),linear-gradient(125deg,#070608 0%,#100608 45%,#050506 100%);padding:54px max(24px,calc((100vw - 1320px)/2)) 72px;font-family:inherit}
        .cyberion-partners *{box-sizing:border-box}.cyberion-partners a{color:inherit;text-decoration:none}
        .cyberion-breadcrumb{color:#999;font-size:13px;margin-bottom:38px}.cyberion-breadcrumb b{color:#ff363e}
        .cyberion-hero{position:relative;overflow:hidden;border:1px solid #47151c;border-radius:18px;padding:44px 44px 48px;background:linear-gradient(90deg,#070507 5%,rgba(7,5,7,.87) 60%,rgba(51,0,7,.34)),repeating-linear-gradient(120deg,transparent 0px,transparent 37px,rgba(255,40,45,.04) 38px,transparent 39px);box-shadow:0 20px 85px #0009}
        .cyberion-kicker{font-size:12px;letter-spacing:.24em;color:#ff424b;font-weight:800;text-transform:uppercase;margin:0 0 24px}
        .cyberion-mark{display:inline-flex;position:relative;align-items:center;font-size:31px;letter-spacing:.04em;line-height:1;font-weight:500;padding-bottom:.58em;white-space:nowrap}
        .cyberion-on{border:3px solid #ffe300;border-radius:99px;display:inline-flex;align-items:center;gap:.14em;height:1.1em;padding:0 .14em .03em .12em;color:#fff}
        .cyberion-on i{display:inline-block;background:#ffe300;width:.63em;height:.63em;border-radius:50%;box-shadow:inset 0 -4px 2px #c1ad00}
        .cyberion-mark strong{position:absolute;color:#ffe500;top:.84em;left:21%;font-size:.64em;letter-spacing:-.015em;font-weight:800}
        .cyberion-mark-large{font-size:clamp(36px,5vw,70px);margin-bottom:10px}
        .cyberion-hero h1{font-size:clamp(25px,3vw,40px);margin:20px 0 8px;max-width:800px}.cyberion-muted{color:#b7aeb1}.cyberion-hero p.cyberion-muted{max-width:700px;line-height:1.75;font-size:15px}
        .cyberion-actions{display:flex;gap:12px;flex-wrap:wrap;margin-top:28px}.cyberion-action{display:inline-flex;align-items:center;justify-content:center;border:1px solid #75232c;padding:13px 20px;border-radius:9px;font-size:14px;font-weight:700;background:#16090d}.cyberion-action-primary{background:#f51425;border-color:#f51425}.cyberion-action:focus-visible,.cyberion-social:focus-visible{outline:2px solid #fff}
        .cyberion-grid{display:grid;grid-template-columns:1fr 1fr 1.1fr;gap:14px;margin-top:18px}
        .cyberion-panel{border:1px solid #66131e;border-radius:14px;background:linear-gradient(140deg,rgba(28,6,10,.96),rgba(8,8,10,.97));padding:23px;min-width:0}
        .cyberion-panel h2{font-size:18px;margin:0 0 20px;display:flex;align-items:center;gap:11px}.cyberion-panel h2 span{color:#ff3145}
        .cyberion-detail{display:flex;gap:12px;align-items:flex-start;border:1px solid #282025;border-radius:7px;padding:12px;margin-top:8px;background:#100e10;font-size:13px;overflow-wrap:anywhere}.cyberion-detail i{color:#ff344b;font-style:normal;font-size:18px}
        .cyberion-spec{display:flex;align-items:center;gap:13px;padding:12px 0;border-bottom:1px solid #35252a;font-size:14px}.cyberion-spec:last-child{border:0}.cyberion-spec i{color:#ff344b;font-style:normal;font-size:20px;min-width:24px}
        .cyberion-map{height:260px;background:linear-gradient(25deg,transparent 47%,#34363e 48%,#34363e 51%,transparent 52%),linear-gradient(-38deg,transparent 46%,#252831 47%,#252831 50%,transparent 51%),repeating-linear-gradient(0deg,#12141a 0 29px,#25252e 30px 31px),repeating-linear-gradient(90deg,#17191e 0 49px,#38333c 50px 51px);border-radius:10px;display:flex;align-items:center;justify-content:center;text-align:center;flex-direction:column;gap:9px;padding:20px}
        .cyberion-map strong{color:white;background:#680d1a;border:1px solid #f43c4e;border-radius:7px;padding:12px;font-size:14px}.cyberion-map small{color:#c9c9d0}.cyberion-map em{color:#f64b5a;font-style:normal;font-size:24px}
        .cyberion-socials{margin-top:16px}.cyberion-social-row{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}.cyberion-social{border:1px solid #75212e;border-radius:10px;padding:16px;background:#1b0b10;font-weight:700;font-size:14px;display:flex;justify-content:space-between;align-items:center;gap:8px}.cyberion-social:hover,.cyberion-action:hover{border-color:#ff4b5a;background:#351018}
        .cyberion-note{font-size:12px;color:#a69a9f;margin:23px 0 0;line-height:1.6}
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
          <div className="cyberion-detail"><i>⌖</i><span>Дніпро, просп. Слобожанський, 89</span></div>
          <div className="cyberion-detail"><i>☎</i><a href="tel:+380685551080">+38 (068) 555-10-80</a></div>
          <div className="cyberion-detail"><i>◎</i><a href={insta} target="_blank" rel="noopener noreferrer">@cyberion_dnipro_kalynova ↗</a></div>
          <div className="cyberion-detail"><i>➤</i><a href={telegram} target="_blank" rel="noopener noreferrer">@CyberionKalynova ↗</a></div>
          <div className="cyberion-detail"><i>↗</i><a href={official} target="_blank" rel="noopener noreferrer">cyberion.ua / Дніпро Лівий берег ↗</a></div>
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
              <small>просп. Слобожанський, 89 · Дніпро</small>
              <small>↗ Відкрити на Google Maps</small>
            </div>
          </a>
        </div>
      </div>
      <div className="cyberion-panel cyberion-socials">
        <h2><span>♧</span> Соцмережі партнера</h2>
        <div className="cyberion-social-row">
          <a className="cyberion-social" href={insta} target="_blank" rel="noopener noreferrer">Instagram <span>↗</span></a>
          <a className="cyberion-social" href={telegram} target="_blank" rel="noopener noreferrer">Telegram <span>↗</span></a>
          <a className="cyberion-social" href={official} target="_blank" rel="noopener noreferrer">Офіційний сайт <span>↗</span></a>
        </div>
      </div>
      <p className="cyberion-note">Характеристики, адреса й телефон наведені за офіційною сторінкою CYBERION. Карта — схематична кнопка для переходу в Google Maps. Логотип оформлено як вебстилізацію, не як оригінальний графічний файл партнера.</p>
    </section>
  );
}
