import isteLogo from "../../assets/logos/iste-logo.png";

import "./Media.css";

const mediaItems = [
  {
    title: "Стримы KORTAVYJ",
    description: "Прямые эфиры и записи трансляций ISTe на Twitch",
    type: "TWITCH",
    href: "https://www.twitch.tv/kortavyj",
    image:
      "https://static-cdn.jtvnw.net/previews-ttv/live_user_kortavyj-1280x720.jpg",
  },
  {
    title: "Новости ISTe",
    description: "Анонсы матчей, обновления состава и новости команды",
    type: "TELEGRAM",
    href: "https://t.me/ISTesport",
    image: isteLogo,
    isBrandCard: true,
  },
  {
    title: "Сообщество ISTe",
    description: "Общение с игроками и участниками сообщества",
    type: "DISCORD",
    href: "https://discord.gg/AzpCxEgxye",
    image: isteLogo,
    isBrandCard: true,
  },
  {
    title: "Группа ISTe",
    description: "Официальная группа Ice Saber Team в Steam",
    type: "STEAM",
    href: "https://steamcommunity.com/groups/IceSaberTeam",
    image: isteLogo,
    isBrandCard: true,
  },
];

export default function Media() {
  return (
    <section className="section media-section" id="media">
      <header className="section-header">
        <p className="section-tag">ISTe ONLINE</p>
        <h2 className="section-title">МЕДИА И СООБЩЕСТВО</h2>
        <p className="media-intro">
          Только официальные площадки, связанные с ISTe
        </p>
      </header>

      <div className="media-grid">
        {mediaItems.map((item) => (
          <a
            className={`media-card${item.isBrandCard ? " media-card-brand" : ""}`}
            href={item.href}
            key={item.href}
            target="_blank"
            rel="noreferrer"
            aria-label={`${item.title}. Открыть в новой вкладке`}
          >
            <img
              src={item.image}
              alt=""
              loading="lazy"
              onError={(event) => {
                event.currentTarget.src = isteLogo;
                event.currentTarget.classList.add("media-image-fallback");
              }}
            />

            <div className="media-overlay">
              <div className="media-meta">
                <span className="media-type">{item.type}</span>
                <span className="media-open" aria-hidden="true">
                  ↗
                </span>
              </div>

              <div className="media-copy">
                <h3>{item.title}</h3>
                <p>{item.description}</p>
              </div>
            </div>
          </a>
        ))}
      </div>
    </section>
  );
}
