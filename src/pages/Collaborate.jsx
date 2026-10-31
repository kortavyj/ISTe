import { useState } from "react";
import { Link } from "react-router-dom";

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

export default function Collaborate() {
  const [kind, setKind] = useState("partner");
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [message, setMessage] = useState("");
  const [accepted, setAccepted] = useState(false);

  function submit(event) {
    event.preventDefault();
    if (!name.trim() || !contact.trim() || !message.trim() || !accepted) return;
    const subject = kind === "partner" ? "ISTe | Запит на партнерство" : "ISTe | Запит на проведення турніру";
    const body = [
      "Тип запиту: " + (kind === "partner" ? "Партнерство" : "Турнір"),
      "Ім'я / організація: " + name.trim(),
      "Контакт для відповіді: " + contact.trim(),
      "",
      message.trim()
    ].join("\n");
    openEmail(subject, body);
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
        @media(max-width:760px){.iste-collaborate{padding:36px 16px 70px}.iste-collaborate .cards,.iste-collaborate .two{grid-template-columns:1fr}}
      `}</style>
      <p className="eyebrow">ISTe Esports · Для брендів, клубів та команд</p>
      <h1>Станьте партнером ISTe</h1>
      <p className="intro">Розвиваємо ігрову спільноту, проводимо змагальні активності та створюємо цифрові продукти. Запрошуємо до співпраці бренди, комп'ютерні клуби й організаторів подій.</p>
      <div className="actions">
        <a className="btn" href="#request">Запропонувати співпрацю</a>
        <a className="btn secondary" href={DISCORD} target="_blank" rel="noopener noreferrer">Приєднатися до Discord</a>
        <Link className="btn secondary" to="/tournaments">Турніри ISTe</Link>
      </div>
      <section aria-label="Формати співпраці" className="cards">
        {packages.map(item => <article className="card" key={item.title}><h3>{item.title}</h3><p>{item.description}</p></article>)}
      </section>
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
          <form onSubmit={submit}>
            <label>Тип звернення<select value={kind} onChange={event => setKind(event.target.value)}><option value="partner">Партнерство / реклама</option><option value="tournament">Організація турніру</option></select></label>
            <label>Ім'я або компанія<input required maxLength={120} value={name} onChange={event => setName(event.target.value)} /></label>
            <label>Email, Telegram або Discord<input required maxLength={180} value={contact} onChange={event => setContact(event.target.value)} /></label>
            <label>{kind === "partner" ? "Опишіть ідею співпраці" : "Гра, дата, кількість команд і формат"}<textarea required maxLength={2500} value={message} onChange={event => setMessage(event.target.value)} /></label>
            <label className="check"><input type="checkbox" checked={accepted} onChange={event => setAccepted(event.target.checked)} required />Погоджуюсь передати вказані контактні дані команді ISTe для відповіді на запит.</label>
            <button type="submit" className="btn">Підготувати лист</button>
          </form>
          <p className="notice">Кнопка відкриває ваш поштовий застосунок із підготовленою заявкою. Для фактичного відправлення підтвердіть надсилання листа. Дані не зберігаються на сайті.</p>
          <p className="notice">Або напишіть напряму: <a href={"mailto:" + EMAIL}>{EMAIL}</a></p>
        </section>
      </div>
    </main>
  );
}
