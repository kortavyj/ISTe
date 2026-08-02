import "./Contacts.css";

const contactTopics = [
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
];

const officialChannels = [
  {
    name: "Telegram",
    description: "Новости команды и быстрый контакт",
    href: "https://t.me/ISTesport",
  },
  {
    name: "Discord",
    description: "Сообщество ISTe и игровые вопросы",
    href: "https://discord.gg/AzpCxEgxye",
  },
  {
    name: "Twitch",
    description: "Прямые трансляции команды",
    href: "https://www.twitch.tv/kortavyj",
  },
  {
    name: "YouTube",
    description: "Видео, записи и игровые моменты",
    href: "https://www.youtube.com/@Hell_Hound_Game",
  },
  {
    name: "Steam",
    description: "Официальная группа сообщества",
    href: "https://steamcommunity.com/groups/IceSaberTeam",
  },
];

function ExternalArrow() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true">
      <path d="M6 14 14 6M8 6h6v6" />
    </svg>
  );
}

export default function Contacts() {
  return (
    <section className="contacts-page">
      <div className="contacts-glow" aria-hidden="true" />

      <div className="contacts-shell">
        <header className="contacts-hero">
          <p className="contacts-eyebrow">ISTe contacts</p>
          <h1>Связаться с командой</h1>
          <p>
            Выберите подходящий официальный канал. Мы разделили обращения по
            темам, чтобы предложение быстрее попало к нужному человеку.
          </p>

          <div className="contacts-hero-actions">
            <a
              className="contacts-primary-button"
              href="https://t.me/ISTesport"
              target="_blank"
              rel="noopener noreferrer"
            >
              Telegram команды
              <ExternalArrow />
            </a>
            <a
              className="contacts-secondary-button"
              href="https://discord.gg/AzpCxEgxye"
              target="_blank"
              rel="noopener noreferrer"
            >
              Discord сообщества
              <ExternalArrow />
            </a>
          </div>
        </header>

        <div className="contacts-topic-list">
          {contactTopics.map((topic) => (
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
            <p>Официальные площадки</p>
            <h2 id="channels-title">Все каналы ISTe</h2>
          </div>

          <div className="contacts-channel-grid">
            {officialChannels.map((channel) => (
              <a
                className="contacts-channel"
                href={channel.href}
                key={channel.name}
                target="_blank"
                rel="noopener noreferrer"
              >
                <span className="contacts-channel-mark" aria-hidden="true">
                  {channel.name.slice(0, 1)}
                </span>
                <span>
                  <strong>{channel.name}</strong>
                  <small>{channel.description}</small>
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
            <h2>Безопасность общения</h2>
            <p>
              Представители ISTe не запрашивают пароль, код подтверждения или
              данные банковской карты. Проверяйте адрес площадки перед отправкой
              любой информации.
            </p>
          </div>
        </aside>
      </div>
    </section>
  );
}
