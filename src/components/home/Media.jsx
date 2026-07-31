import isteLogo from "../../assets/logos/iste-logo.png";

import "./Media.css";

const mediaItems = [
  {
    title: "CS2: играю ногами",
    description: "Запись трансляции на YouTube",
    type: "YOUTUBE",
    href: "https://www.youtube.com/watch?v=hWELtNPkou0",
    image: "https://i.ytimg.com/vi/hWELtNPkou0/maxresdefault.jpg",
  },
  {
    title: "Все видео Hell Hound Game",
    description: "Клипы, записи матчей и новые трансляции",
    type: "КАНАЛ",
    href: "https://www.youtube.com/@Hell_Hound_Game",
    image: isteLogo,
    isBrandCard: true,
  },
  {
    title: "Стримы KORTAVYJ",
    description: "Прямые эфиры и записи на Twitch",
    type: "TWITCH",
    href: "https://www.twitch.tv/kortavyj",
    image:
      "https://static-cdn.jtvnw.net/previews-ttv/live_user_kortavyj-1280x720.jpg",
  },
];

export default function Media() {
  return (
    <section className="section media-section" id="media">
      <header className="section-header">
        <p className="section-tag">MEDIA</p>
        <h2 className="section-title">МЕДИА ISTe</h2>
        <p className="media-intro">
          Реальные трансляции, записи матчей и видео команды
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
