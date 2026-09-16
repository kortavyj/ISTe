import { useLanguage } from "../i18n/LanguageContext.jsx";

import "./DiscordBot.css";

const DISCORD_CLIENT_ID = "1545183724218359848";
const DISCORD_INSTALL_URL =
  `https://discord.com/oauth2/authorize?client_id=${DISCORD_CLIENT_ID}`;

const copy = {
  uk: {
    title: "ISTe Bot для вашого Discord",
    intro:
      "Корисний бот для будь-якого Discord-сервера: інформація про сервер і користувачів, аватари, опитування, приватні голосові кімнати, базова модерація та інтеграції ISTe.",
    add: "Додати ISTe Bot",
    site: "На сайт ISTe",
    note:
      "Встановлення проходить через офіційне вікно Discord. Для модераційних команд і приватних кімнат сервер сам контролює права доступу.",
    commandsTitle: "Команди ISTe Bot",
    categories: {
      utility: "Утиліти",
      community: "Спільнота",
      voice: "Приватні голосові кімнати",
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

      "room setup":
        "Створити категорію та канал для автоматичних приватних голосових кімнат",
      "room invite":
        "Надати вибраному учаснику доступ до вашої приватної кімнати",
      "room remove":
        "Забрати в учасника доступ до вашої приватної кімнати",
      "room rename":
        "Змінити назву вашої приватної голосової кімнати",
      "room limit":
        "Встановити максимальну кількість учасників у кімнаті",
      "room transfer":
        "Передати право власника приватної кімнати іншому учаснику",
      "room info":
        "Показати інформацію про вашу активну приватну кімнату",
      "room delete":
        "Видалити вашу приватну кімнату вручну",

      clear: "Видалення 1-100 останніх повідомлень",
      timeout: "Тимчасовий тайм-аут учасника",
      site: "Офіційний сайт ISTe",
      rules: "Правила ISTe Discord",
      team: "Поточний склад ISTe",
      matches: "Останні матчі ISTe",
      news: "Останні новини ISTe",
      help: "Повний список команд",
    },
    voiceHintTitle: "Як працюють приватні кімнати",
    voiceHintText:
      "Після налаштування адміністратором користувач заходить у канал «➕ Створити приватний». ISTe Bot автоматично створює приховану голосову кімнату, переносить туди власника та видаляє кімнату, коли виходить останній учасник.",
    multiTitle: "Один бот — багато серверів",
    multiText:
      "ISTe Bot не прив'язаний до одного Discord-сервера. Його може встановити будь-яка спільнота або команда.",
    secureTitle: "Права контролює Discord",
    secureText:
      "Команди модерації доступні лише тим, хто має відповідні права. Для приватних кімнат боту потрібні Manage Channels та Move Members. Administrator для бота не потрібен.",
    linkedTitle: "UA / RU / EN",
    linkedText:
      "Відповіді бота автоматично локалізуються українською, російською або англійською мовою.",
  },

  ru: {
    title: "ISTe Bot для вашего Discord",
    intro:
      "Полезный бот для любого Discord-сервера: информация о сервере и пользователях, аватары, опросы, приватные голосовые комнаты, базовая модерация и интеграции ISTe.",
    add: "Добавить ISTe Bot",
    site: "На сайт ISTe",
    note:
      "Установка проходит через официальное окно Discord. Для модерационных команд и приватных комнат сервер сам контролирует права доступа.",
    commandsTitle: "Команды ISTe Bot",
    categories: {
      utility: "Утилиты",
      community: "Сообщество",
      voice: "Приватные голосовые комнаты",
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

      "room setup":
        "Создать категорию и канал для автоматических приватных голосовых комнат",
      "room invite":
        "Выдать выбранному участнику доступ к вашей приватной комнате",
      "room remove":
        "Забрать у участника доступ к вашей приватной комнате",
      "room rename":
        "Изменить название вашей приватной голосовой комнаты",
      "room limit":
        "Установить максимальное количество участников в комнате",
      "room transfer":
        "Передать владение приватной комнатой другому участнику",
      "room info":
        "Показать информацию о вашей активной приватной комнате",
      "room delete":
        "Удалить вашу приватную комнату вручную",

      clear: "Удаление 1-100 последних сообщений",
      timeout: "Временный тайм-аут участника",
      site: "Официальный сайт ISTe",
      rules: "Правила ISTe Discord",
      team: "Текущий состав ISTe",
      matches: "Последние матчи ISTe",
      news: "Последние новости ISTe",
      help: "Полный список команд",
    },
    voiceHintTitle: "Как работают приватные комнаты",
    voiceHintText:
      "После настройки администратором пользователь заходит в канал «➕ Створити приватний». ISTe Bot автоматически создаёт скрытую голосовую комнату, переносит туда владельца и удаляет комнату, когда выходит последний участник.",
    multiTitle: "Один бот — много серверов",
    multiText:
      "ISTe Bot не привязан к одному Discord-серверу. Его может установить любое сообщество или команда.",
    secureTitle: "Права контролирует Discord",
    secureText:
      "Команды модерации доступны только тем, у кого есть соответствующие права. Для приватных комнат боту нужны Manage Channels и Move Members. Administrator боту не нужен.",
    linkedTitle: "UA / RU / EN",
    linkedText:
      "Ответы бота автоматически локализуются на украинский, русский или английский язык.",
  },

  en: {
    title: "ISTe Bot for your Discord",
    intro:
      "A useful bot for any Discord server: server and member information, avatars, polls, temporary private voice rooms, basic moderation and ISTe integrations.",
    add: "Add ISTe Bot",
    site: "Go to ISTe",
    note:
      "Installation uses Discord's official authorization screen. Discord permissions control moderation commands and private voice rooms.",
    commandsTitle: "ISTe Bot commands",
    categories: {
      utility: "Utilities",
      community: "Community",
      voice: "Private voice rooms",
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

      "room setup":
        "Create the category and trigger channel for temporary private rooms",
      "room invite":
        "Give a selected member access to your private room",
      "room remove":
        "Remove a member's access to your private room",
      "room rename":
        "Rename your private voice room",
      "room limit":
        "Set the maximum number of members in your room",
      "room transfer":
        "Transfer ownership of your private room to another member",
      "room info":
        "Show information about your active private room",
      "room delete":
        "Delete your private room manually",

      clear: "Delete 1-100 recent messages",
      timeout: "Temporarily timeout a member",
      site: "Official ISTe website",
      rules: "ISTe Discord rules",
      team: "Current ISTe roster",
      matches: "Latest ISTe matches",
      news: "Latest ISTe news",
      help: "Full command list",
    },
    voiceHintTitle: "How private rooms work",
    voiceHintText:
      "After an administrator configures the system, a member joins «➕ Створити приватний». ISTe Bot automatically creates a hidden voice room, moves the owner into it and deletes the room after the last participant leaves.",
    multiTitle: "One bot — many servers",
    multiText:
      "ISTe Bot is not tied to one Discord server. Any community or team can install it.",
    secureTitle: "Discord controls permissions",
    secureText:
      "Moderation commands are only available to members with the required permissions. Private rooms require Manage Channels and Move Members for the bot. Administrator is not required.",
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
    key: "voice",
    commands: [
      "room setup",
      "room invite",
      "room remove",
      "room rename",
      "room limit",
      "room transfer",
      "room info",
      "room delete",
    ],
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
            <strong>{c.voiceHintTitle}</strong>
            <p>{c.voiceHintText}</p>
          </div>

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
