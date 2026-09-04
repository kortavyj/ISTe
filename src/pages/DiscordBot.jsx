import { useLanguage } from "../i18n/LanguageContext.jsx";

import "./DiscordBot.css";

const DISCORD_CLIENT_ID = "1545183724218359848";
const DISCORD_INSTALL_URL =
  `https://discord.com/oauth2/authorize?client_id=${DISCORD_CLIENT_ID}`;

const copy = {
  uk: {
    title: "ISTe Bot для вашого Discord",
    intro:
      "Корисний бот для будь-якого Discord-сервера: інформація про сервер і користувачів, аватари, опитування, базова модерація та інтеграції ISTe.",
    add: "Додати ISTe Bot",
    site: "На сайт ISTe",
    note:
      "Встановлення проходить через офіційне вікно Discord. Для модераційних команд сервер сам контролює права доступу.",
    commandsTitle: "Команди ISTe Bot",
    categories: {
      utility: "Утиліти",
      community: "Спільнота",
      moderation: "Модерація",
      iste: "ISTe",
    },
    commands: {
      ping: "Перевірка роботи та швидкості відповіді",
      server: "Інформація про Discord-сервер",
      user: "Інформація про учасника сервера",
      avatar: "Великий аватар користувача",
      bot: "Інформація та можливості ISTe Bot",
      invite: "Посилання для встановлення бота",
      poll: "Вбудоване опитування Discord до 5 варіантів",
      clear: "Видалення 1-100 останніх повідомлень",
      timeout: "Тимчасовий тайм-аут учасника",
      site: "Офіційний сайт ISTe",
      rules: "Правила ISTe Discord",
      team: "Поточний склад ISTe",
      matches: "Останні матчі ISTe",
      news: "Останні новини ISTe",
      help: "Повний список команд",
    },
    multiTitle: "Один бот — багато серверів",
    multiText:
      "ISTe Bot не прив'язаний до одного Discord-сервера. Його може встановити будь-яка спільнота або команда.",
    secureTitle: "Права контролює Discord",
    secureText:
      "Команди модерації доступні лише тим, хто має відповідні права. Administrator для бота не потрібен.",
    linkedTitle: "UA / RU / EN",
    linkedText:
      "Відповіді бота автоматично локалізуються українською, російською або англійською мовою.",
  },
  ru: {
    title: "ISTe Bot для вашего Discord",
    intro:
      "Полезный бот для любого Discord-сервера: информация о сервере и пользователях, аватары, опросы, базовая модерация и интеграции ISTe.",
    add: "Добавить ISTe Bot",
    site: "На сайт ISTe",
    note:
      "Установка проходит через официальное окно Discord. Для модерационных команд сервер сам контролирует права доступа.",
    commandsTitle: "Команды ISTe Bot",
    categories: {
      utility: "Утилиты",
      community: "Сообщество",
      moderation: "Модерация",
      iste: "ISTe",
    },
    commands: {
      ping: "Проверка работы и скорости ответа",
      server: "Информация о Discord-сервере",
      user: "Информация об участнике сервера",
      avatar: "Большой аватар пользователя",
      bot: "Информация и возможности ISTe Bot",
      invite: "Ссылка для установки бота",
      poll: "Встроенный опрос Discord до 5 вариантов",
      clear: "Удаление 1-100 последних сообщений",
      timeout: "Временный тайм-аут участника",
      site: "Официальный сайт ISTe",
      rules: "Правила ISTe Discord",
      team: "Текущий состав ISTe",
      matches: "Последние матчи ISTe",
      news: "Последние новости ISTe",
      help: "Полный список команд",
    },
    multiTitle: "Один бот — много серверов",
    multiText:
      "ISTe Bot не привязан к одному Discord-серверу. Его может установить любое сообщество или команда.",
    secureTitle: "Права контролирует Discord",
    secureText:
      "Команды модерации доступны только тем, у кого есть соответствующие права. Administrator боту не нужен.",
    linkedTitle: "UA / RU / EN",
    linkedText:
      "Ответы бота автоматически локализуются на украинский, русский или английский язык.",
  },
  en: {
    title: "ISTe Bot for your Discord",
    intro:
      "A useful bot for any Discord server: server and member information, avatars, polls, basic moderation and ISTe integrations.",
    add: "Add ISTe Bot",
    site: "Go to ISTe",
    note:
      "Installation uses Discord's official authorization screen. Discord permissions control access to moderation commands.",
    commandsTitle: "ISTe Bot commands",
    categories: {
      utility: "Utilities",
      community: "Community",
      moderation: "Moderation",
      iste: "ISTe",
    },
    commands: {
      ping: "Check bot status and response time",
      server: "Discord server information",
      user: "Information about a server member",
      avatar: "View a user's large avatar",
      bot: "ISTe Bot information and capabilities",
      invite: "Bot installation link",
      poll: "Native Discord poll with up to 5 options",
      clear: "Delete 1-100 recent messages",
      timeout: "Temporarily timeout a member",
      site: "Official ISTe website",
      rules: "ISTe Discord rules",
      team: "Current ISTe roster",
      matches: "Latest ISTe matches",
      news: "Latest ISTe news",
      help: "Full command list",
    },
    multiTitle: "One bot — many servers",
    multiText:
      "ISTe Bot is not tied to one Discord server. Any community or team can install it.",
    secureTitle: "Discord controls permissions",
    secureText:
      "Moderation commands are only available to members with the required permissions. The bot does not need Administrator.",
    linkedTitle: "UA / RU / EN",
    linkedText:
      "Bot responses are automatically localized to Ukrainian, Russian or English.",
  },
};

const commandGroups = [
  {
    key: "utility",
    commands: ["ping", "server", "user", "avatar", "bot", "invite"],
  },
  {
    key: "community",
    commands: ["poll"],
  },
  {
    key: "moderation",
    commands: ["clear", "timeout"],
  },
  {
    key: "iste",
    commands: ["site", "rules", "team", "matches", "news", "help"],
  },
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

              <a className="discord-bot-secondary" href="/">
                {c.site}
              </a>
            </div>

            <p className="discord-bot-note">{c.note}</p>
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

          <div className="discord-bot-command-groups">
            {commandGroups.map((group) => (
              <section className="discord-bot-command-group" key={group.key}>
                <h3>{c.categories[group.key]}</h3>

                <div className="discord-bot-command-list">
                  {group.commands.map((name) => (
                    <div className="discord-bot-command" key={name}>
                      <code>/{name}</code>
                      <span>{c.commands[name]}</span>
                    </div>
                  ))}
                </div>
              </section>
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
