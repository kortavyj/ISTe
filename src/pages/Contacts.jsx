import { useLanguage } from "../i18n/LanguageContext.jsx";

import "./Contacts.css";

const COPY = {
  uk: {
    eyebrow: "ISTe CONTACTS",
    title: "Зв’язатися з командою",
    intro:
      "Оберіть відповідний офіційний канал. Ми розділили звернення за темами, щоб пропозиція швидше потрапила до потрібної людини.",
    telegram: "Telegram команди",
    discord: "Discord спільноти",
    topics: [
      {
        number: "01",
        title: "Партнерство та співпраця",
        description:
          "Пропозиції від брендів, організаторів, студій і майбутніх партнерів команди.",
        action: "Написати на пошту",
        href: "mailto:istesport.official@gmail.com",
      },
      {
        number: "02",
        title: "Матчі та турніри",
        description:
          "Запрошення на матчі, турніри, ліги, кваліфікації та тренувальні ігри.",
        action: "Відкрити Discord",
        href: "https://discord.gg/AzpCxEgxye",
      },
      {
        number: "03",
        title: "Медіа та трансляції",
        description:
          "Спільні ефіри, інтерв’ю, відеоматеріали та інші медіапроєкти.",
        action: "Відкрити Twitch",
        href: "https://www.twitch.tv/kortavyj",
      },
    ],
  },
  ru: {
    eyebrow: "ISTe CONTACTS",
    title: "Связаться с командой",
    intro:
      "Выберите подходящий официальный канал. Мы разделили обращения по темам, чтобы предложение быстрее попало к нужному человеку.",
    telegram: "Telegram команды",
    discord: "Discord сообщества",
    topics: [
      {
        number: "01",
        title: "Партнёрство и сотрудничество",
        description:
          "Предложения от брендов, организаторов, студий и будущих партнёров команды.",
        action: "Написать на почту",
        href: "mailto:istesport.official@gmail.com",
      },
      {
        number: "02",
        title: "Матчи и турниры",
        description:
          "Приглашения на матчи, турниры, лиги, квалификации и тренировочные игры.",
        action: "Открыть Discord",
        href: "https://discord.gg/AzpCxEgxye",
      },
      {
        number: "03",
        title: "Медиа и трансляции",
        description:
          "Совместные эфиры, интервью, видеоматериалы и другие медиапроекты.",
        action: "Открыть Twitch",
        href: "https://www.twitch.tv/kortavyj",
      },
    ],
  },
  en: {
    eyebrow: "ISTe CONTACTS",
    title: "Contact the team",
    intro:
      "Choose the appropriate official channel. We separate requests by topic so your proposal reaches the right person faster.",
    telegram: "Team Telegram",
    discord: "Community Discord",
    topics: [
      {
        number: "01",
        title: "Partnerships and cooperation",
        description:
          "Proposals from brands, organizers, studios and future team partners.",
        action: "Send email",
        href: "mailto:istesport.official@gmail.com",
      },
      {
        number: "02",
        title: "Matches and tournaments",
        description:
          "Invitations to matches, tournaments, leagues, qualifiers and practice games.",
        action: "Open Discord",
        href: "https://discord.gg/AzpCxEgxye",
      },
      {
        number: "03",
        title: "Media and broadcasts",
        description:
          "Joint streams, interviews, video content and other media projects.",
        action: "Open Twitch",
        href: "https://www.twitch.tv/kortavyj",
      },
    ],
  },
};

function ExternalArrow() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true">
      <path d="M6 14 14 6M8 6h6v6" />
    </svg>
  );
}

export default function Contacts() {
  const { language } = useLanguage();
  const copy = COPY[language] || COPY.uk;

  return (
    <section className="contacts-page">
      <div className="contacts-glow" aria-hidden="true" />

      <div className="contacts-shell">
        <header className="contacts-hero">
          <p className="contacts-eyebrow">{copy.eyebrow}</p>
          <h1>{copy.title}</h1>
          <p>{copy.intro}</p>

          <div className="contacts-hero-actions">
            <a
              className="contacts-primary-button"
              href="https://t.me/ISTesport"
              target="_blank"
              rel="noopener noreferrer"
            >
              {copy.telegram}
              <ExternalArrow />
            </a>
            <a
              className="contacts-secondary-button"
              href="https://discord.gg/AzpCxEgxye"
              target="_blank"
              rel="noopener noreferrer"
            >
              {copy.discord}
              <ExternalArrow />
            </a>
          </div>
        </header>

        <div className="contacts-topic-list">
          {copy.topics.map((topic) => (
            <article className="contacts-topic" key={topic.number}>
              <span className="contacts-topic-number">{topic.number}</span>
              <div>
                <h2>{topic.title}</h2>
                <p>{topic.description}</p>
              </div>
              <a
                href={topic.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`${topic.action}: ${topic.title}`}
              >
                {topic.action}
                <ExternalArrow />
              </a>
            </article>
          ))}
        </div>

      </div>
    </section>
  );
}
