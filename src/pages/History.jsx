import { Link } from "react-router-dom";

import logo from "../assets/logos/iste-logo.png";

import "./History.css";

const milestones = [
  {
    number: "01",
    title: "Начало идеи",
    text: "ISTe появилась как объединение игроков, которым было недостаточно просто участвовать в матчах. Команда создавалась вокруг дисциплины, взаимного уважения и общего стремления становиться сильнее.",
  },
  {
    number: "02",
    title: "Формирование состава",
    text: "Следующим этапом стал поиск игроков, способных работать как единое целое. Важными стали не только индивидуальный уровень, но и коммуникация, надёжность и готовность играть на результат.",
  },
  {
    number: "03",
    title: "Выход на FACEIT",
    text: "FACEIT стал основной соревновательной площадкой ISTe. Здесь команда собирает состав, участвует в матчах, отслеживает прогресс и постепенно формирует собственную игровую историю.",
  },
  {
    number: "04",
    title: "Развитие ISTe",
    text: "Сегодня ISTe продолжает развиваться как киберспортивный проект. Сайт объединяет состав, статистику, матчи, медиа и площадки команды в одном месте.",
  },
];

const principles = [
  "Командная игра выше личной статистики",
  "Спокойствие и дисциплина в каждом матче",
  "Постоянный разбор ошибок и развитие",
  "Уважение к соперникам и своей команде",
];

export default function History() {
  return (
    <section className="history-page">
      <div className="history-glow history-glow-one" aria-hidden="true" />
      <div className="history-glow history-glow-two" aria-hidden="true" />

      <div className="history-container">
        <header className="history-hero">
          <div className="history-logo-wrap" aria-hidden="true">
            <span className="history-logo-ring" />
            <img src={logo} alt="" className="history-logo" />
          </div>

          <div className="history-hero-copy">
            <p className="history-eyebrow">ISTe STORY</p>
            <h1>История команды</h1>
            <p className="history-lead">
              ISTe, Ice Saber Team, это киберспортивная команда, созданная вокруг
              общей цели, сильной коммуникации и желания расти вместе.
            </p>

            <div className="history-actions">
              <Link className="history-button history-button-primary" to="/team">
                Смотреть состав
              </Link>
              <Link className="history-button history-button-secondary" to="/matches">
                Матчи команды
              </Link>
            </div>
          </div>
        </header>

        <div className="history-divider" />

        <section className="history-section">
          <div className="history-section-heading">
            <p>ПУТЬ ISTe</p>
            <h2>Как формировалась команда</h2>
          </div>

          <div className="history-timeline">
            {milestones.map((milestone) => (
              <article className="history-card" key={milestone.number}>
                <span className="history-card-number">{milestone.number}</span>
                <div>
                  <h3>{milestone.title}</h3>
                  <p>{milestone.text}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="history-values">
          <div className="history-values-copy">
            <p className="history-eyebrow">НАШ ПОДХОД</p>
            <h2>Принципы ISTe</h2>
            <p>
              Команда строится не вокруг одного игрока. Результат появляется,
              когда каждый понимает свою роль, доверяет партнёрам и отвечает за
              собственные решения.
            </p>
          </div>

          <div className="history-principles">
            {principles.map((principle, index) => (
              <div className="history-principle" key={principle}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <p>{principle}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="history-finale">
          <p className="history-eyebrow">PLAY · COMPETE · WIN</p>
          <h2>История ISTe продолжается</h2>
          <p>
            Новые матчи, изменения состава и результаты команды автоматически
            появляются на сайте через интеграцию с FACEIT.
          </p>
          <a
            className="history-button history-button-primary"
            href="https://www.faceit.com/ru/teams/fe19e71d-c974-404c-a038-beb9a578fb61"
            target="_blank"
            rel="noreferrer"
          >
            Открыть команду FACEIT
          </a>
        </section>
      </div>
    </section>
  );
}
