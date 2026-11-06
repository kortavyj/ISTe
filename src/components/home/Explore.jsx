import { Link } from "react-router-dom";
import { useLanguage } from "../../i18n/LanguageContext.jsx";

import "./Explore.css";

const CONTENT = {
  uk: {
    kicker: "ISTe / СПІЛЬНОТА",
    title: "Знайди своє місце в ISTe",
    description: "Слідкуй за турнірами CS2, відкривай нашу команду та дізнавайся про події кіберспортивної спільноти.",
    tournaments: ["Турніри CS2", "Переглядай змагання, турнірні сітки та інформацію про участь."],
    academy: ["ISTe Academy", "Познайомся з гравцями академічного складу та їхніми ролями."],
    news: ["Новини ISTe", "Читайте про команду, співпрацю, матчі та нові проєкти."],
    discord: ["Спільнота Discord", "Приєднуйся до розмов і слідкуй за оновленнями ISTe."],
    open: "Відкрити",
  },
  ru: {
    kicker: "ISTe / СООБЩЕСТВО",
    title: "Найди своё место в ISTe",
    description: "Следи за турнирами CS2, знакомься с нашей командой и узнавай о событиях киберспортивного сообщества.",
    tournaments: ["Турниры CS2", "Смотри соревнования, турнирные сетки и информацию об участии."],
    academy: ["ISTe Academy", "Знакомься с игроками академического состава и их ролями."],
    news: ["Новости ISTe", "Читай о команде, сотрудничестве, матчах и новых проектах."],
    discord: ["Сообщество Discord", "Присоединяйся к обсуждениям и следи за обновлениями ISTe."],
    open: "Открыть",
  },
  en: {
    kicker: "ISTe / COMMUNITY",
    title: "Find your place in ISTe",
    description: "Follow CS2 tournaments, get to know our team and explore the esports community.",
    tournaments: ["CS2 tournaments", "Explore competitions, brackets and participation information."],
    academy: ["ISTe Academy", "Meet academy roster players and discover their roles."],
    news: ["ISTe news", "Read about the team, partnerships, matches and projects."],
    discord: ["Discord community", "Join conversations and follow ISTe updates."],
    open: "Explore",
  },
};

const ITEMS = [
  { key: "tournaments", to: "/tournaments", glyph: "01" },
  { key: "academy", to: "/team/academy", glyph: "02" },
  { key: "news", to: "/news", glyph: "03" },
  { key: "discord", href: "https://discord.gg/AzpCxEgxye", glyph: "04" },
];

export default function Explore() {
  const { language } = useLanguage();
  const copy = CONTENT[language] || CONTENT.uk;

  return (
    <section className="iste-explore" aria-labelledby="iste-explore-title">
      <div className="iste-explore-inner">
        <header className="iste-explore-head">
          <span className="iste-explore-kicker">{copy.kicker}</span>
          <h2 id="iste-explore-title">{copy.title}</h2>
          <p>{copy.description}</p>
        </header>
        <div className="iste-explore-grid">
          {ITEMS.map((item) => {
            const [title, description] = copy[item.key];
            const inner = (
              <>
                <span className="iste-explore-number" aria-hidden="true">{item.glyph}</span>
                <h3>{title}</h3>
                <p>{description}</p>
                <span className="iste-explore-more">{copy.open} <span aria-hidden="true">↗</span></span>
              </>
            );
            return item.to
              ? <Link className="iste-explore-card" key={item.key} to={item.to}>{inner}</Link>
              : <a className="iste-explore-card" key={item.key} href={item.href} target="_blank" rel="noopener noreferrer">{inner}</a>;
          })}
        </div>
      </div>
    </section>
  );
}
