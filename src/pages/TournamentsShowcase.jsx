import { Link } from "react-router-dom";
import { useLanguage } from "../i18n/LanguageContext.jsx";
import "./TournamentsShowcase.css";

const DISCORD = "https://discord.gg/AzpCxEgxye";
const copy = {
  uk: {
    title: "ТУРНІРИ CS2",
    eyebrow: "ISTesport / CS2",
    intro: "Скоро на платформі ISTe. Ми готуємо серію турнірів, які об'єднають команди, гравців і нашу спільноту.",
    discord: "Слідкувати в Discord",
    notify: "Дізнатися першими",
    statusTitle: "ТУРНІРИ НЕЗАБАРОМ",
    statusDescription: "Підготовка першої серії змагань триває. Слідкуй за анонсами в наших соціальних мережах і Discord.",
    formats: "ФОРМАТИ ТУРНІРІВ",
    cards: [
      { title: "Відкриті турніри", description: "Доступні для всіх команд. Ідеальний старт для нових складів." },
      { title: "Командні кубки", description: "Багатоетапні турніри з більшою конкуренцією та статусом." },
      { title: "Події спільноти", description: "Тематичні змагання, шоуматчі та активності для учасників ISTe." },
    ],
    followTitle: "БУДЬ У КУРСІ",
    followDescription: "Приєднуйся до нашого Discord, щоб не пропустити анонси турнірів, реєстрацію та важливі новини.",
    followButton: "Перейти в Discord",
    request: "Запропонувати проведення турніру",
    note: "Реєстрація ще не відкрита. Дати та призові фонди будуть оголошені окремо.",
  },
  ru: {
    title: "ТУРНИРЫ CS2",
    eyebrow: "ISTesport / CS2",
    intro: "Скоро на платформе ISTe. Мы готовим серию турниров, объединяющих команды, игроков и наше сообщество.",
    discord: "Следить в Discord",
    notify: "Узнать первыми",
    statusTitle: "ТУРНИРЫ СКОРО",
    statusDescription: "Подготовка первой серии соревнований продолжается. Следи за анонсами в наших соцсетях и Discord.",
    formats: "ФОРМАТЫ ТУРНИРОВ",
    cards: [
      { title: "Открытые турниры", description: "Доступны всем командам. Хороший старт для новых составов." },
      { title: "Командные кубки", description: "Многоэтапные турниры с более высокой конкуренцией и статусом." },
      { title: "События сообщества", description: "Тематические соревнования, шоу-матчи и активности участников ISTe." },
    ],
    followTitle: "БУДЬ В КУРСЕ",
    followDescription: "Присоединяйся к нашему Discord, чтобы не пропустить анонсы, регистрацию и важные новости.",
    followButton: "Перейти в Discord",
    request: "Предложить проведение турнира",
    note: "Регистрация ещё не открыта. Даты и призовые фонды будут объявлены отдельно.",
  },
  en: {
    title: "CS2 TOURNAMENTS",
    eyebrow: "ISTesport / CS2",
    intro: "Coming to ISTe. We're preparing a series of events bringing teams, players and our community together.",
    discord: "Follow on Discord",
    notify: "Be first to know",
    statusTitle: "TOURNAMENTS COMING SOON",
    statusDescription: "We're preparing the first series of competitions. Follow updates on our social channels and Discord.",
    formats: "TOURNAMENT FORMATS",
    cards: [
      { title: "Open tournaments", description: "Accessible to all teams. A great start for new rosters." },
      { title: "Team cups", description: "Multi-stage tournaments with stronger competition and prestige." },
      { title: "Community events", description: "Themed events, showmatches and activities for the ISTe community." },
    ],
    followTitle: "STAY IN THE LOOP",
    followDescription: "Join our Discord for tournament announcements, registration details and important updates.",
    followButton: "Go to Discord",
    request: "Propose hosting a tournament",
    note: "Registration is not open yet. Dates and prizes will be announced separately.",
  },
};

function TournamentIcon({ kind }) {
  if (kind === 0) return <svg viewBox="0 0 32 32" fill="none" aria-hidden="true"><circle cx="11" cy="11" r="4" /><circle cx="23" cy="11" r="4" /><path d="M3 26v-4c0-4 3-6 8-6s8 2 8 6v4M18 17c5-1 11 1 11 6v3H22" /></svg>;
  if (kind === 1) return <svg viewBox="0 0 32 32" fill="none" aria-hidden="true"><path d="M8 5h16v10a8 8 0 0 1-16 0V5ZM8 8H3v5c0 4 3 6 7 6M24 8h5v5c0 4-3 6-7 6M16 23v5m-7 0h14" /></svg>;
  return <svg viewBox="0 0 32 32" fill="none" aria-hidden="true"><path d="M17 2 7 17h8l-2 13 12-18h-9l1-10Z" /></svg>;
}

function ArenaArtwork() {
  return (
    <div className="ts-arena ts-bracket-hero" aria-hidden="true">
      <div className="ts-bracket-atmosphere" />
      <svg className="ts-bracket-svg" viewBox="0 0 620 350" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="ts-line" x1="190" y1="0" x2="475" y2="0" gradientUnits="userSpaceOnUse">
            <stop stopColor="#ef344e" stopOpacity=".4"/>
            <stop offset=".55" stopColor="#ed2945" stopOpacity=".9"/>
            <stop offset="1" stopColor="#fc3853" stopOpacity=".8"/>
          </linearGradient>
          <linearGradient id="ts-slot" x1="0" y1="0" x2="1" y2="1">
            <stop stopColor="#262026" stopOpacity=".95"/>
            <stop offset="1" stopColor="#0a090d" stopOpacity=".97"/>
          </linearGradient>
          <radialGradient id="ts-final-glow">
            <stop stopColor="#e7203e" stopOpacity=".24"/>
            <stop offset="1" stopColor="#e7203e" stopOpacity="0"/>
          </radialGradient>
          <filter id="ts-connect-glow"><feGaussianBlur stdDeviation="4"/></filter>
        </defs>
        <circle cx="532" cy="169" r="106" fill="url(#ts-final-glow)" />
        <g className="ts-bracket-connection" stroke="url(#ts-line)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <path d="M190 55 H220 V88 H270 M190 117 H220 V88 M190 233 H220 V265 H270 M190 295 H220 V265"/>
          <path d="M384 88 H411 V176 H471 M384 265 H411 V176"/>
        </g>
        <g stroke="#db3047" strokeWidth="2" opacity=".32" filter="url(#ts-connect-glow)">
          <path d="M220 88H270 M220 265H270 M411 176H471"/>
        </g>
        {[{x:49,y:36},{x:49,y:98},{x:49,y:214},{x:49,y:276}].map(({x,y},i)=>(
          <g key={i}>
            <rect x={x} y={y} width="141" height="38" rx="8" fill="url(#ts-slot)" stroke="#ad3044" strokeOpacity=".55"/>
            <path d={`M${x+12} ${y+13}H${x+44}M${x+12} ${y+22}H${x+67}`} stroke="#dc6576" strokeOpacity=".22" strokeWidth="3" strokeLinecap="round"/>
            <rect x={x+113} y={y+13} width="15" height="11" rx="3" fill="#5c2430" fillOpacity=".45"/>
          </g>
        ))}
        {[{x:270,y:69},{x:270,y:246}].map(({x,y},i)=>(
          <g key={i}>
            <rect x={x} y={y} width="114" height="38" rx="8" fill="url(#ts-slot)" stroke="#c3324a" strokeOpacity=".67"/>
            <path d={`M${x+12} ${y+14}H${x+38}M${x+12} ${y+23}H${x+63}`} stroke="#dc6576" strokeOpacity=".24" strokeWidth="3" strokeLinecap="round"/>
          </g>
        ))}
        <rect x="471" y="124" width="113" height="104" rx="14" fill="#1c080e" stroke="#e62c46" strokeWidth="1.6"/>
        <rect x="478" y="131" width="99" height="90" rx="9" stroke="#e62c46" strokeOpacity=".18"/>
        <g transform="translate(503 142)" stroke="#ff4861" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <path d="M13 7H49V27C49 39 41 46 31 46S13 39 13 27V7Z"/>
          <path d="M13 12H4V21C4 32 10 35 16 35M49 12H58V21C58 32 52 35 46 35"/>
          <path d="M31 46V55M20 57H42"/>
          <path d="m31 15 3 7 8 1-6 5 2 8-7-4-7 4 2-8-6-5 8-1Z" fill="#fa354d" fillOpacity=".34" strokeWidth="1.3"/>
        </g>
        <path d="M496 204H560" stroke="#f02c47" strokeOpacity=".36" strokeWidth="1"/>
        <g stroke="#e82842" strokeOpacity=".18">
          <path d="M15 310H208M218 327H405M420 21H602"/>
        </g>
      </svg>
    </div>
  );
}

export default function TournamentsShowcase() {
  const { language } = useLanguage();
  const t = copy[language] || copy.uk;
  return (
    <section className="ts-page ts-preview-page">
      <div className="ts-preview-shell">
        <header className="ts-preview-hero">
          <ArenaArtwork />
          <div className="ts-preview-hero-content">
            <span className="ts-preview-kicker">{t.eyebrow}</span>
            <h1>{t.title}</h1>
            <p>{t.intro}</p>
            <div className="ts-preview-actions">
              <a href={DISCORD} target="_blank" rel="noopener noreferrer" className="ts-preview-primary"><span aria-hidden="true">◈</span>{t.discord}</a>
              <a href="#tournament-status" className="ts-preview-secondary"><svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 17h14l-2-3V9a5 5 0 0 0-10 0v5l-2 3ZM10 20h4" /></svg>{t.notify}</a>
            </div>
          </div>
        </header>

        <section id="tournament-status" className="ts-preview-announcement">
          <div className="ts-preview-announcement-copy">
            <span className="ts-preview-section-mark" aria-hidden="true">//</span>
            <div>
              <h2>{t.statusTitle}</h2>
              <p>{t.statusDescription}</p>
            </div>
          </div>
          <div className="ts-preview-flag" aria-hidden="true"><span className="ts-preview-flag-pole" /><div className="ts-preview-flag-cloth"><img src="/iste-brush-vector.svg" alt="" /></div></div>
        </section>

        <section className="ts-preview-formats" aria-labelledby="ts-formats-heading">
          <h2 id="ts-formats-heading"><span aria-hidden="true">//</span>{t.formats}</h2>
          <div className="ts-preview-format-grid">
            {t.cards.map((item, i) => <article className={"ts-preview-format ts-preview-format--" + i} key={item.title}>
              <span className="ts-preview-format-photo" aria-hidden="true" />
              <TournamentIcon kind={i} />
              <h3>{item.title}</h3>
              <p>{item.description}</p>
            </article>)}
          </div>
        </section>

        <section className="ts-preview-community">
          <div className="ts-preview-community-copy">
            <h2><span aria-hidden="true">//</span>{t.followTitle}</h2>
            <p>{t.followDescription}</p>
          </div>
          <a href={DISCORD} target="_blank" rel="noopener noreferrer">{t.followButton}<span aria-hidden="true">→</span></a>
        </section>


      </div>
    </section>
  );
}
