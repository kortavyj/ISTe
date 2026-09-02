import { useLanguage } from "../i18n/LanguageContext.jsx";
import founderPhoto from "../assets/history/evgeniy_kortavyj.webp";

import "./History.css";

const COPY = {
  uk: {
    eyebrow: "ІСТОРІЯ ISTe",
    titleName: "Євгеній,",
    titleAccent: " творець і засновник ISTe",
    lead:
      "Відомий в інтернеті під ніком Kortavyj, Євгеній — засновник і власник ISTe, стример і музикант. Він розвиває власний проєкт, що об’єднує кіберспорт, ігрову спільноту, медіа, контент і командні змагання.",
    factsAria: "Інформація про засновника ISTe",
    facts: [
      { value: "21", label: "вік" },
      { value: "Дніпро", label: "Україна" },
      { value: "Kortavyj", label: "медійний нік" },
      { value: "ISTe", label: "засновник і власник" },
    ],
    imageAlt: "Євгеній Kortavyj, засновник і власник ISTe",
    founderLabel: "ЗАСНОВНИК ISTe",
    storyEyebrow: "ЗАСНОВНИК ПРОЄКТУ",
    storyTitle: "Від особистого захоплення до власної компанії",
    story: [
      "Євгеній живе у Дніпрі, Україна. Інтерес до змагальних ігор, стримінгу, музики та створення контенту поступово привів його до ідеї заснувати ISTe. Він хотів створити не просто ігрову команду, а повноцінну компанію з власним упізнаваним стилем, офіційними майданчиками та активною спільнотою.",
      "Сьогодні Євгеній особисто займається розвитком ISTe, формуванням команди, підготовкою новин, турнірів, розіграшів і медіаконтенту. Проєкт перебуває на початку свого шляху, але вже має власну візуальну айдентику, офіційні майданчики та плани щодо подальшого розширення.",
      "Для Євгенія ISTe є особистим проєктом, створеним з нуля. Його головна мета — побудувати сильну кіберспортивну спільноту, де гравці зможуть розвиватися, знаходити команду, брати участь у змаганнях і ставати частиною спільної історії.",
    ],
    missionAria: "Головна ідея ISTe",
    mission:
      "Євгеній створив ISTe, щоб перетворити особисте захоплення іграми та медіа на повноцінну компанію і простір для розвитку інших гравців.",
  },
  ru: {
    eyebrow: "ИСТОРИЯ ISTe",
    titleName: "Евгений,",
    titleAccent: " создатель и основатель ISTe",
    lead:
      "Известный в интернете под ником Kortavyj, Евгений — основатель и владелец ISTe, стример и музыкант. Он развивает собственный проект, объединяющий киберспорт, игровое сообщество, медиа, контент и командные соревнования.",
    factsAria: "Информация об основателе ISTe",
    facts: [
      { value: "21", label: "возраст" },
      { value: "Днепр", label: "Украина" },
      { value: "Kortavyj", label: "медийный ник" },
      { value: "ISTe", label: "основатель и владелец" },
    ],
    imageAlt: "Евгений Kortavyj, основатель и владелец ISTe",
    founderLabel: "ОСНОВАТЕЛЬ ISTe",
    storyEyebrow: "ОСНОВАТЕЛЬ ПРОЕКТА",
    storyTitle: "От личного увлечения к собственной компании",
    story: [
      "Евгений живёт в Днепре, Украина. Интерес к соревновательным играм, стримингу, музыке и созданию контента постепенно привёл его к идее основать ISTe. Он хотел создать не просто игровую команду, а полноценную компанию со своим узнаваемым стилем, официальными площадками и активным сообществом.",
      "Сегодня Евгений лично занимается развитием ISTe, формированием команды, подготовкой новостей, турниров, розыгрышей и медиаконтента. Проект находится в начале своего пути, но уже имеет собственную визуальную айдентику, официальные площадки и планы по дальнейшему расширению.",
      "Для Евгения ISTe является личным проектом, созданным с нуля. Его основная цель состоит в том, чтобы построить сильное киберспортивное сообщество, где игроки смогут развиваться, находить команду, участвовать в соревнованиях и становиться частью общей истории.",
    ],
    missionAria: "Главная идея ISTe",
    mission:
      "Евгений создал ISTe, чтобы превратить личное увлечение играми и медиа в полноценную компанию и пространство для развития других игроков.",
  },
  en: {
    eyebrow: "ISTe HISTORY",
    titleName: "Yevhenii,",
    titleAccent: " creator and founder of ISTe",
    lead:
      "Known online as Kortavyj, Yevhenii is the founder and owner of ISTe, a streamer and musician. He is developing his own project that brings together esports, gaming community, media, content and team competition.",
    factsAria: "Information about the founder of ISTe",
    facts: [
      { value: "21", label: "age" },
      { value: "Dnipro", label: "Ukraine" },
      { value: "Kortavyj", label: "media nickname" },
      { value: "ISTe", label: "founder and owner" },
    ],
    imageAlt: "Yevhenii Kortavyj, founder and owner of ISTe",
    founderLabel: "FOUNDER OF ISTe",
    storyEyebrow: "PROJECT FOUNDER",
    storyTitle: "From a personal passion to his own company",
    story: [
      "Yevhenii lives in Dnipro, Ukraine. His interest in competitive gaming, streaming, music and content creation gradually led him to the idea of founding ISTe. He wanted to build not just a gaming team, but a full company with its own recognizable style, official platforms and an active community.",
      "Today Yevhenii personally works on the development of ISTe, team building, news, tournaments, giveaways and media content. The project is still at the beginning of its journey, but it already has its own visual identity, official platforms and plans for further growth.",
      "For Yevhenii, ISTe is a personal project built from scratch. His main goal is to create a strong esports community where players can grow, find a team, compete and become part of a shared story.",
    ],
    missionAria: "The main idea of ISTe",
    mission:
      "Yevhenii created ISTe to turn a personal passion for gaming and media into a full company and a space where other players can develop.",
  },
};

export default function History() {
  const { language } = useLanguage();
  const copy = COPY[language] || COPY.uk;

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
          <p className="history-hero__eyebrow">{copy.eyebrow}</p>

          <h1 id="history-title">
            {copy.titleName}
            <span>{copy.titleAccent}</span>
          </h1>

          <p className="history-hero__lead">{copy.lead}</p>

          <div
            className="history-hero__facts"
            aria-label={copy.factsAria}
          >
            {copy.facts.map((fact) => (
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
              alt={copy.imageAlt}
              loading="eager"
            />
          </div>

          <figcaption>
            <span>KORTAVYJ</span>
            <strong>{copy.founderLabel}</strong>
          </figcaption>
        </figure>
      </section>

      <section
        className="history-story"
        aria-labelledby="founder-story-title"
      >
        <header className="history-story__header">
          <p>{copy.storyEyebrow}</p>
          <h2 id="founder-story-title">{copy.storyTitle}</h2>
        </header>

        <div className="history-story__content">
          {copy.story.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>
      </section>

      <section className="history-mission" aria-label={copy.missionAria}>
        <span className="history-mission__mark" aria-hidden="true">
          “
        </span>
        <p>{copy.mission}</p>
        <span className="history-mission__signature">
          EVGENIY · KORTAVYJ
        </span>
      </section>
    </main>
  );
}
