export default function Contacts() {
  return (
    <section className="page">
      <div className="page-content">
        <p className="page-eyebrow">CONTACTS</p>
        <h1 className="page-title">Контакты ISTe</h1>
        <p className="page-description">
          Для связи с командой используйте официальные страницы YouTube и Twitch. Дополнительные контакты будут добавлены после их утверждения.
        </p>
        <div className="page-actions">
          <a
            className="page-link"
            href="https://www.youtube.com/@Hell_Hound_Game"
            target="_blank"
            rel="noreferrer"
          >
            YOUTUBE
          </a>
          <a
            className="page-link page-link-secondary"
            href="https://www.twitch.tv/hell_hound_tw"
            target="_blank"
            rel="noreferrer"
          >
            TWITCH
          </a>
        </div>
      </div>
    </section>
  );
}
