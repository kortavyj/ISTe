import "./History.css";

const founderPhoto = "/evgeniy-kortavyj.webp";

const founderFacts = [
  { value: "21", label: "год" },
  { value: "Днепр", label: "Украина" },
  { value: "Kortavyj", label: "медийный ник" },
  { value: "ISTe", label: "основатель и владелец" },
];

export default function History() {
  return (
    <main className="history-page">
      <div
        className="history-page__glow history-page__glow--top"
        aria-hidden="true"
      />
      <div
        className="history-page__glow history-page__glow--bottom"
        aria-hidden="true"
      />

      <section className="history-hero" aria-labelledby="history-title">
        <div className="history-hero__copy">
          <p className="history-hero__eyebrow">ИСТОРИЯ ISTe</p>

          <h1 id="history-title">
            Евгений,
            <span> создатель и основатель ISTe</span>
          </h1>

          <p className="history-hero__lead">
            Известный в интернете под ником Kortavyj, Евгений — основатель и
            владелец ISTe, стример и музыкант. Он развивает собственный проект,
            объединяющий киберспорт, игровое сообщество, медиа, контент и
            командные соревнования.
          </p>

          <div
            className="history-hero__facts"
            aria-label="Информация о создателе ISTe"
          >
            {founderFacts.map((fact) => (
              <div
                className="history-fact"
                key={`${fact.value}-${fact.label}`}
              >
                <strong>{fact.value}</strong>
                <span>{fact.label}</span>
              </div>
            ))}
          </div>
        </div>

        <figure className="history-founder-photo">
          <div className="history-founder-photo__frame">
            <img
              src={founderPhoto}
              alt="Евгений Kortavyj, основатель и владелец ISTe Esports"
              loading="eager"
              width="800"
              height="800"
            />
          </div>

          <figcaption>
            <span>KORTAVYJ</span>
            <strong>FOUNDER OF ISTe</strong>
          </figcaption>
        </figure>
      </section>

      <section
        className="history-story"
        aria-labelledby="founder-story-title"
      >
        <header className="history-story__header">
          <p>ОСНОВАТЕЛЬ ПРОЕКТА</p>
          <h2 id="founder-story-title">
            От личного увлечения к собственной компании
          </h2>
        </header>

        <div className="history-story__content">
          <p>
            Евгений живёт в Днепре, Украина. Интерес к соревновательным играм,
            стримингу, музыке и созданию контента постепенно привёл его к идее
            основать ISTe. Он хотел создать не просто игровую команду, а
            полноценную компанию со своим узнаваемым стилем, официальными
            площадками и активным сообществом.
          </p>

          <p>
            Сегодня Евгений лично занимается развитием ISTe, формированием
            команды, подготовкой новостей, турниров, розыгрышей и
            медиаконтента. Проект находится в начале своего пути, но уже имеет
            собственную визуальную айдентику, официальные площадки и планы по
            дальнейшему расширению.
          </p>

          <p>
            Для Евгения ISTe является личным проектом, созданным с нуля. Его
            основная цель состоит в том, чтобы построить сильное
            киберспортивное сообщество, где игроки смогут развиваться, находить
            команду, участвовать в соревнованиях и становиться частью общей
            истории.
          </p>
        </div>
      </section>

      <section className="history-mission" aria-label="Главная идея ISTe">
        <span className="history-mission__mark" aria-hidden="true">
          “
        </span>
        <p>
          Евгений создал ISTe, чтобы превратить личное увлечение играми и медиа
          в полноценную компанию и пространство для развития других игроков.
        </p>
        <span className="history-mission__signature">
          EVGENIY · KORTAVYJ
        </span>
      </section>
    </main>
  );
}
