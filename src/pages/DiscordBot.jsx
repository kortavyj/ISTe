import { useLanguage } from "../i18n/LanguageContext.jsx";

import "./DiscordBot.css";

const DISCORD_CLIENT_ID = "1545183724218359848";
const DISCORD_INSTALL_URL =
  `https://discord.com/oauth2/authorize?client_id=${DISCORD_CLIENT_ID}`;

const copy = {
  uk: {
    title: "ISTe Bot для вашого Discord",
    intro:
      "Додайте офіційного бота ISTe на свій сервер. Discord сам запропонує вибрати сервер, де у вас є необхідні права.",
    add: "Додати ISTe Bot",
    site: "На сайт ISTe",
    note:
      "Для встановлення Discord вимагатиме право керування сервером. Токен бота користувачу не передається.",
    commandsTitle: "Команди V1",
    commands: {
      site: "Офіційний сайт ISTe",
      rules: "Правила сервера",
      team: "Поточний склад ISTe",
      matches: "Останні матчі",
      news: "Останні новини",
      help: "Список команд",
    },
    multiTitle: "Один бот — багато серверів",
    multiText:
      "ISTe Bot не прив'язаний до одного Discord-сервера. Його можна встановлювати в різні спільноти та команди.",
    secureTitle: "Безпечне встановлення",
    secureText:
      "Авторизація проходить безпосередньо на discord.com через офіційне посилання застосунку.",
    linkedTitle: "Пов'язаний з ISTe",
    linkedText:
      "Склад, матчі та новини бот отримує з інфраструктури ISTesport.",
  },
  ru: {
    title: "ISTe Bot для вашего Discord",
    intro:
      "Добавьте официального бота ISTe на свой сервер. Discord сам предложит выбрать сервер, где у вас есть необходимые права.",
    add: "Добавить ISTe Bot",
    site: "На сайт ISTe",
    note:
      "Для установки Discord потребует право управления сервером. Токен бота пользователю не передаётся.",
    commandsTitle: "Команды V1",
    commands: {
      site: "Официальный сайт ISTe",
      rules: "Правила сервера",
      team: "Текущий состав ISTe",
      matches: "Последние матчи",
      news: "Последние новости",
      help: "Список команд",
    },
    multiTitle: "Один бот — много серверов",
    multiText:
      "ISTe Bot не привязан к одному Discord-серверу. Его можно устанавливать в разные сообщества и команды.",
    secureTitle: "Безопасная установка",
    secureText:
      "Авторизация проходит непосредственно на discord.com через официальную ссылку приложения.",
    linkedTitle: "Связан с ISTe",
    linkedText:
      "Состав, матчи и новости бот получает из инфраструктуры ISTesport.",
  },
  en: {
    title: "ISTe Bot for your Discord",
    intro:
      "Add the official ISTe Bot to your server. Discord will let you choose a server where you have the required permissions.",
    add: "Add ISTe Bot",
    site: "Go to ISTe",
    note:
      "Discord requires Manage Server permission for installation. The bot token is never shared with users.",
    commandsTitle: "V1 commands",
    commands: {
      site: "Official ISTe website",
      rules: "Server rules",
      team: "Current ISTe roster",
      matches: "Latest matches",
      news: "Latest news",
      help: "Command list",
    },
    multiTitle: "One bot — many servers",
    multiText:
      "ISTe Bot is not tied to one Discord server. It can be installed by different communities and teams.",
    secureTitle: "Secure installation",
    secureText:
      "Authorization happens directly on discord.com through the official application link.",
    linkedTitle: "Connected to ISTe",
    linkedText:
      "The bot receives roster, match and news data from ISTesport infrastructure.",
  },
};

const commandNames = [
  "site",
  "rules",
  "team",
  "matches",
  "news",
  "help",
];

export default function DiscordBot() {
  const { language } = useLanguage();
  const c = copy[language] || copy.uk;

  return (
    <section className="discord-bot-page">
      <div className="discord-bot-shell">
        <div className="discord-bot-hero">
          <div className="discord-bot-copy">
            <h1>{c.title}</h1>
            <p>{c.intro}</p>

            <div className="discord-bot-actions">
              <a
                className="discord-bot-primary"
                href={DISCORD_INSTALL_URL}
                target="_blank"
                rel="noopener noreferrer"
              >
                {c.add}
              </a>

              <a
                className="discord-bot-secondary"
                href="/"
              >
                {c.site}
              </a>
            </div>

            <p className="discord-bot-note">
              {c.note}
            </p>
          </div>

          <div className="discord-bot-mark" aria-hidden="true">
            <div className="discord-bot-mark-ring">
              <span>ISTe</span>
            </div>
            <strong>DISCORD BOT</strong>
          </div>
        </div>

        <div className="discord-bot-command-section">
          <h2>{c.commandsTitle}</h2>

          <div className="discord-bot-command-list">
            {commandNames.map((name) => (
              <div
                className="discord-bot-command"
                key={name}
              >
                <code>/{name}</code>
                <span>{c.commands[name]}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="discord-bot-info">
          <div>
            <strong>{c.multiTitle}</strong>
            <p>{c.multiText}</p>
          </div>

          <div>
            <strong>{c.secureTitle}</strong>
            <p>{c.secureText}</p>
          </div>

          <div>
            <strong>{c.linkedTitle}</strong>
            <p>{c.linkedText}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
