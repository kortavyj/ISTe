import {
  useEffect,
  useMemo,
  useState,
} from "react";

import { useLanguage } from "../i18n/LanguageContext.jsx";

import "./OwnerDiscord.css";

const DISCORD_CLIENT_ID = "1545183724218359848";
const DISCORD_INSTALL_URL =
  `https://discord.com/oauth2/authorize?client_id=${DISCORD_CLIENT_ID}`;

const copy = {
  uk: {
    intro:
      "Панель власника ISTe Bot. Публічне встановлення доступне кожному через /discord, а тут залишаються перевірка серверів і керування глобальними slash-командами.",
    installCheck: "Встановлення та перевірка",
    credentials: "Потрібні Discord credentials",
    verified: "Сервер перевірено",
    ready: "Бот готовий до встановлення",
    add: "Додати ISTe Bot",
    publicPage: "Публічна сторінка",
    serverId: "Discord Server ID — лише для перевірки власником",
    serverIdHelp:
      "Встановлення більше не потребує Server ID. Це поле потрібне лише для перевірки конкретного сервера через панель власника.",
    verify: "Перевірити сервер",
    commands: "Slash-команди",
    register: "Зареєструвати команди глобально",
    endpoint: "Interactions Endpoint URL",
    publicInstall: "Публічне встановлення",
    publicInstallText:
      "Будь-який користувач може відкрити istesport.com/discord і додати ISTe Bot на сервер, де він має право керувати сервером. Bot Token ніколи не потрапляє у браузер.",
    directLink: "Відкрити пряме посилання Discord",
    opened:
      "Відкрито офіційне вікно Discord. Виберіть сервер, на який хочете додати ISTe Bot.",
    found: "ISTe Bot знайдено на сервері.",
    verifyFailed: "Перевірка не пройшла.",
    registered: "Slash-команди зареєстровано глобально.",
    registerFailed: "Не вдалося зареєструвати slash-команди.",
    loadFailed: "Не вдалося завантажити ISTe Bot.",
    requestFailed: "Не вдалося виконати запит.",
  },
  ru: {
    intro:
      "Панель владельца ISTe Bot. Публичная установка доступна каждому через /discord, а здесь остаются проверка серверов и управление глобальными slash-командами.",
    installCheck: "Установка и проверка",
    credentials: "Нужны Discord credentials",
    verified: "Сервер проверен",
    ready: "Бот готов к установке",
    add: "Добавить ISTe Bot",
    publicPage: "Публичная страница",
    serverId: "Discord Server ID — только для проверки владельцем",
    serverIdHelp:
      "Установка больше не требует Server ID. Это поле нужно только для проверки конкретного сервера через панель владельца.",
    verify: "Проверить сервер",
    commands: "Slash-команды",
    register: "Зарегистрировать команды глобально",
    endpoint: "Interactions Endpoint URL",
    publicInstall: "Публичная установка",
    publicInstallText:
      "Любой пользователь может открыть istesport.com/discord и добавить ISTe Bot на сервер, где у него есть право управлять сервером. Bot Token никогда не попадает в браузер.",
    directLink: "Открыть прямую ссылку Discord",
    opened:
      "Открылось официальное окно Discord. Выберите сервер, на который хотите добавить ISTe Bot.",
    found: "ISTe Bot найден на сервере.",
    verifyFailed: "Проверка не прошла.",
    registered: "Slash-команды зарегистрированы глобально.",
    registerFailed: "Не удалось зарегистрировать slash-команды.",
    loadFailed: "Не удалось загрузить ISTe Bot.",
    requestFailed: "Не удалось выполнить запрос.",
  },
  en: {
    intro:
      "ISTe Bot owner panel. Public installation is available to everyone through /discord, while server verification and global slash-command management stay here.",
    installCheck: "Installation and verification",
    credentials: "Discord credentials required",
    verified: "Server verified",
    ready: "Bot ready to install",
    add: "Add ISTe Bot",
    publicPage: "Public page",
    serverId: "Discord Server ID — owner verification only",
    serverIdHelp:
      "Installation no longer requires a Server ID. This field is only used to verify a specific server from the owner panel.",
    verify: "Verify server",
    commands: "Slash commands",
    register: "Register commands globally",
    endpoint: "Interactions Endpoint URL",
    publicInstall: "Public installation",
    publicInstallText:
      "Anyone can open istesport.com/discord and add ISTe Bot to a server they are allowed to manage. The Bot Token never reaches the browser.",
    directLink: "Open direct Discord link",
    opened:
      "The official Discord window was opened. Choose the server where you want to add ISTe Bot.",
    found: "ISTe Bot was found on the server.",
    verifyFailed: "Server verification failed.",
    registered: "Slash commands were registered globally.",
    registerFailed: "Failed to register slash commands.",
    loadFailed: "Failed to load ISTe Bot.",
    requestFailed: "The request failed.",
  },
};

async function apiRequest(
  action,
  {
    method = "GET",
    body = null,
    guildId = "",
  } = {},
) {
  const params = new URLSearchParams({
    module: "discord",
    action,
  });

  if (guildId) {
    params.set("guildId", guildId);
  }

  const options = {
    method,
    credentials: "include",
    cache: "no-store",
    headers: {
      Accept: "application/json",
    },
  };

  if (body) {
    options.headers["Content-Type"] = "application/json";
    options.body = JSON.stringify(body);
  }

  const response = await fetch(
    `/api/owner?${params.toString()}`,
    options,
  );

  const result = await response
    .json()
    .catch(() => null);

  if (!response.ok || result?.ok !== true) {
    throw new Error(
      result?.message || "REQUEST_FAILED",
    );
  }

  return result;
}

export default function OwnerDiscord() {
  const { language } = useLanguage();
  const c = copy[language] || copy.uk;

  const [status, setStatus] = useState(null);
  const [guildId, setGuildId] = useState("");
  const [busy, setBusy] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const commands = useMemo(
    () =>
      (status?.commands || []).map(
        (name) => `/${name}`,
      ),
    [status],
  );

  async function load(
    nextGuildId = guildId,
  ) {
    setError("");

    try {
      const result = await apiRequest(
        "status",
        {
          guildId: nextGuildId,
        },
      );

      setStatus(result);

      if (result.guild?.guild_id) {
        setGuildId(
          result.guild.guild_id,
        );
      }
    } catch {
      setError(c.loadFailed);
    }
  }

  useEffect(() => {
    void load("");
  }, []);

  function connectBot() {
    setError("");
    setMessage(c.opened);

    window.open(
      DISCORD_INSTALL_URL,
      "_blank",
      "noopener,noreferrer",
    );
  }

  async function verifyBot() {
    if (!guildId || busy) return;

    setBusy("verify");
    setError("");
    setMessage("");

    try {
      await apiRequest("verify", {
        method: "POST",
        body: { guildId },
      });

      await load(guildId);
      setMessage(c.found);
    } catch {
      setError(c.verifyFailed);
    } finally {
      setBusy("");
    }
  }

  async function registerCommands() {
    if (busy) return;

    setBusy("commands");
    setError("");
    setMessage("");

    try {
      await apiRequest(
        "register-commands",
        {
          method: "POST",
          body: {},
        },
      );

      setMessage(c.registered);
    } catch {
      setError(c.registerFailed);
    } finally {
      setBusy("");
    }
  }

  const configured =
    status?.configured?.clientId &&
    status?.configured?.botToken;

  const connected =
    Boolean(status?.guild?.active);

  return (
    <section className="owner-discord-page">
      <div className="owner-discord-shell">
        <header className="owner-discord-header">
          <div>
            <h1>ISTe Discord Bot</h1>
            <p>{c.intro}</p>
          </div>
        </header>

        {error ? (
          <div className="owner-discord-alert owner-discord-error">
            {error}
          </div>
        ) : null}

        {message ? (
          <div className="owner-discord-alert owner-discord-success">
            {message}
          </div>
        ) : null}

        <div className="owner-discord-grid">
          <article className="owner-discord-card">
            <div className="owner-discord-card-head">
              <h2>{c.installCheck}</h2>

              <span
                className={`owner-discord-status ${
                  connected ? "is-online" : ""
                }`}
              >
                <i />
                {!configured
                  ? c.credentials
                  : connected
                    ? c.verified
                    : c.ready}
              </span>
            </div>

            {status?.guild?.guild_name ? (
              <div className="owner-discord-guild">
                <strong>
                  {status.guild.guild_name}
                </strong>
                <span>
                  ID {status.guild.guild_id}
                </span>
              </div>
            ) : null}

            <div className="owner-discord-actions">
              <button
                type="button"
                className="owner-discord-primary"
                onClick={connectBot}
              >
                {c.add}
              </button>

              <a
                href="/discord"
                className="owner-discord-secondary"
              >
                {c.publicPage}
              </a>
            </div>

            <label
              className="owner-discord-field"
              style={{ marginTop: 22 }}
            >
              <span>{c.serverId}</span>

              <input
                type="text"
                inputMode="numeric"
                value={guildId}
                onChange={(event) =>
                  setGuildId(
                    event.target.value
                      .replace(/\D/g, "")
                      .slice(0, 20),
                  )
                }
                placeholder="123456789012345678"
              />

              <small>{c.serverIdHelp}</small>
            </label>

            <div className="owner-discord-actions">
              <button
                type="button"
                className="owner-discord-secondary"
                onClick={verifyBot}
                disabled={
                  !guildId ||
                  Boolean(busy) ||
                  !status?.configured?.botToken
                }
              >
                {c.verify}
              </button>
            </div>
          </article>

          <article className="owner-discord-card">
            <div className="owner-discord-card-head">
              <h2>{c.commands}</h2>
            </div>

            <div className="owner-discord-commands">
              {commands.map((command) => (
                <code key={command}>
                  {command}
                </code>
              ))}
            </div>

            <button
              type="button"
              className="owner-discord-secondary owner-discord-wide"
              onClick={registerCommands}
              disabled={
                !configured ||
                Boolean(busy)
              }
            >
              {c.register}
            </button>

            <div className="owner-discord-endpoint">
              <span>{c.endpoint}</span>
              <code>
                {status?.interactionUrl || "—"}
              </code>
            </div>
          </article>
        </div>

        <aside className="owner-discord-setup">
          <h2>{c.publicInstall}</h2>
          <p>{c.publicInstallText}</p>

          <a
            href={DISCORD_INSTALL_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="owner-discord-secondary"
          >
            {c.directLink}
          </a>
        </aside>
      </div>
    </section>
  );
}
