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
        action: "Написати в Telegram",
        href: "https://t.me/ISTesport",
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
    channelsEyebrow: "ОФІЦІЙНІ МАЙДАНЧИКИ",
    channelsTitle: "Усі канали ISTe",
    channels: [
      ["Telegram", "Новини команди та швидкий контакт", "https://t.me/ISTesport"],
      ["Discord", "Спільнота ISTe та ігрові питання", "https://discord.gg/AzpCxEgxye"],
      ["Twitch", "Прямі трансляції команди", "https://www.twitch.tv/kortavyj"],
      ["YouTube", "Відео, записи та ігрові моменти", "https://www.youtube.com/@Hell_Hound_Game"],
      ["Steam", "Офіційна група спільноти", "https://steamcommunity.com/groups/IceSaberTeam"],
    ],
    safetyTitle: "Безпека спілкування",
    safetyText:
      "Представники ISTe не запитують пароль, код підтвердження або дані банківської картки. Перевіряйте адресу майданчика перед надсиланням будь-якої інформації.",
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
        action: "Написать в Telegram",
        href: "https://t.me/ISTesport",
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
    channelsEyebrow: "ОФИЦИАЛЬНЫЕ ПЛОЩАДКИ",
    channelsTitle: "Все каналы ISTe",
    channels: [
      ["Telegram", "Новости команды и быстрый контакт", "https://t.me/ISTesport"],
      ["Discord", "Сообщество ISTe и игровые вопросы", "https://discord.gg/AzpCxEgxye"],
      ["Twitch", "Прямые трансляции команды", "https://www.twitch.tv/kortavyj"],
      ["YouTube", "Видео, записи и игровые моменты", "https://www.youtube.com/@Hell_Hound_Game"],
      ["Steam", "Официальная группа сообщества", "https://steamcommunity.com/groups/IceSaberTeam"],
    ],
    safetyTitle: "Безопасность общения",
    safetyText:
      "Представители ISTe не запрашивают пароль, код подтверждения или данные банковской карты. Проверяйте адрес площадки перед отправкой любой информации.",
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
        action: "Message on Telegram",
        href: "https://t.me/ISTesport",
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
    channelsEyebrow: "OFFICIAL PLATFORMS",
    channelsTitle: "All ISTe channels",
    channels: [
      ["Telegram", "Team news and quick contact", "https://t.me/ISTesport"],
      ["Discord", "ISTe community and gaming questions", "https://discord.gg/AzpCxEgxye"],
      ["Twitch", "Team live broadcasts", "https://www.twitch.tv/kortavyj"],
      ["YouTube", "Videos, recordings and gaming moments", "https://www.youtube.com/@Hell_Hound_Game"],
      ["Steam", "Official community group", "https://steamcommunity.com/groups/IceSaberTeam"],
    ],
    safetyTitle: "Communication safety",
    safetyText:
      "ISTe representatives will never ask for your password, verification code or bank card details. Check the platform address before sending any information.",
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

        <section className="contacts-channels" aria-labelledby="channels-title">
          <div className="contacts-section-heading">
            <p>{copy.channelsEyebrow}</p>
            <h2 id="channels-title">{copy.channelsTitle}</h2>
          </div>

          <div className="contacts-channel-grid">
            {copy.channels.map(([name, description, href]) => (
              <a
                className="contacts-channel"
                href={href}
                key={name}
                target="_blank"
                rel="noopener noreferrer"
              >
                <span className="contacts-channel-mark" aria-hidden="true">
                  {name.slice(0, 1)}
                </span>
                <span>
                  <strong>{name}</strong>
                  <small>{description}</small>
                </span>
                <ExternalArrow />
              </a>
            ))}
          </div>
        </section>

        <aside className="contacts-safety">
          <div className="contacts-safety-icon" aria-hidden="true">
            !
          </div>
          <div>
            <h2>{copy.safetyTitle}</h2>
            <p>{copy.safetyText}</p>
          </div>
        </aside>
      </div>
    </section>
  );
}
