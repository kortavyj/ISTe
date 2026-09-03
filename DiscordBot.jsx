import { useEffect, useMemo, useState } from "react";
import "./OwnerDiscord.css";

const DISCORD_CLIENT_ID = "1545183724218359848";
const DISCORD_INSTALL_URL =
  `https://discord.com/oauth2/authorize?client_id=${DISCORD_CLIENT_ID}`;

async function apiRequest(action, { method = "GET", body = null, guildId = "" } = {}) {
  const params = new URLSearchParams({ module: "discord", action });
  if (guildId) params.set("guildId", guildId);

  const options = {
    method,
    credentials: "include",
    cache: "no-store",
    headers: { Accept: "application/json" },
  };

  if (body) {
    options.headers["Content-Type"] = "application/json";
    options.body = JSON.stringify(body);
  }

  const response = await fetch(`/api/owner?${params.toString()}`, options);
  const result = await response.json().catch(() => null);

  if (!response.ok || result?.ok !== true) {
    throw new Error(result?.message || "Не удалось выполнить запрос.");
  }

  return result;
}

export default function OwnerDiscord() {
  const [status, setStatus] = useState(null);
  const [guildId, setGuildId] = useState("");
  const [busy, setBusy] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const commands = useMemo(
    () => (status?.commands || []).map((name) => `/${name}`),
    [status],
  );

  async function load(nextGuildId = guildId) {
    setError("");
    try {
      const result = await apiRequest("status", { guildId: nextGuildId });
      setStatus(result);
      if (result.guild?.guild_id) setGuildId(result.guild.guild_id);
    } catch (loadError) {
      setError(loadError?.message || "Не удалось загрузить ISTe Bot.");
    }
  }

  useEffect(() => {
    void load("");
  }, []);

  function connectBot() {
    setError("");
    setMessage(
      "Открылось официальное окно Discord. Выберите сервер, на который хотите добавить ISTe Bot.",
    );

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
      setMessage("ISTe Bot найден на сервере.");
    } catch (actionError) {
      setError(actionError?.message || "Проверка не прошла.");
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
      await apiRequest("register-commands", {
        method: "POST",
        body: {},
      });
      setMessage("Slash-команды зарегистрированы глобально.");
    } catch (actionError) {
      setError(actionError?.message || "Не удалось зарегистрировать команды.");
    } finally {
      setBusy("");
    }
  }

  const configured =
    status?.configured?.clientId &&
    status?.configured?.botToken;

  const connected = Boolean(status?.guild?.active);

  return (
    <section className="owner-discord-page">
      <div className="owner-discord-shell">
        <header className="owner-discord-header">
          <div>
            <h1>ISTe Discord Bot</h1>
            <p>
              Панель владельца ISTe Bot. Публичная установка доступна каждому
              через /discord, а здесь остаются проверка серверов и управление
              глобальными slash-командами.
            </p>
          </div>
        </header>

        {error ? <div className="owner-discord-alert owner-discord-error">{error}</div> : null}
        {message ? <div className="owner-discord-alert owner-discord-success">{message}</div> : null}

        <div className="owner-discord-grid">
          <article className="owner-discord-card">
            <div className="owner-discord-card-head">
              <h2>Установка и проверка</h2>
              <span className={`owner-discord-status ${connected ? "is-online" : ""}`}>
                <i />
                {!configured
                  ? "Нужны Discord credentials"
                  : connected
                    ? "Сервер проверен"
                    : "Бот готов к установке"}
              </span>
            </div>

            {status?.guild?.guild_name ? (
              <div className="owner-discord-guild">
                <strong>{status.guild.guild_name}</strong>
                <span>ID {status.guild.guild_id}</span>
              </div>
            ) : null}

            <div className="owner-discord-actions">
              <button
                type="button"
                className="owner-discord-primary"
                onClick={connectBot}
              >
                Добавить ISTe Bot
              </button>

              <a
                href="/discord"
                className="owner-discord-secondary"
              >
                Публичная страница
              </a>
            </div>

            <label className="owner-discord-field" style={{ marginTop: 22 }}>
              <span>Discord Server ID — только для проверки владельцем</span>
              <input
                type="text"
                inputMode="numeric"
                value={guildId}
                onChange={(event) =>
                  setGuildId(event.target.value.replace(/\D/g, "").slice(0, 20))
                }
                placeholder="123456789012345678"
              />
              <small>
                Установка больше не требует Server ID. Это поле нужно только,
                если вы хотите проверить конкретный сервер через панель владельца.
              </small>
            </label>

            <div className="owner-discord-actions">
              <button
                type="button"
                className="owner-discord-secondary"
                onClick={verifyBot}
                disabled={!guildId || Boolean(busy) || !status?.configured?.botToken}
              >
                Проверить сервер
              </button>
            </div>
          </article>

          <article className="owner-discord-card">
            <div className="owner-discord-card-head">
              <h2>Slash-команды</h2>
            </div>

            <div className="owner-discord-commands">
              {commands.map((command) => <code key={command}>{command}</code>)}
            </div>

            <button
              type="button"
              className="owner-discord-secondary owner-discord-wide"
              onClick={registerCommands}
              disabled={!configured || Boolean(busy)}
            >
              Зарегистрировать команды глобально
            </button>

            <div className="owner-discord-endpoint">
              <span>Interactions Endpoint URL</span>
              <code>{status?.interactionUrl || "—"}</code>
            </div>
          </article>
        </div>

        <aside className="owner-discord-setup">
          <h2>Публичная установка</h2>
          <p>
            Любой пользователь может открыть istesport.com/discord и добавить
            ISTe Bot на сервер, где у него есть право управлять сервером.
            Bot Token при этом никогда не попадает в браузер.
          </p>
          <a
            href={DISCORD_INSTALL_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="owner-discord-secondary"
          >
            Открыть прямую ссылку Discord
          </a>
        </aside>
      </div>
    </section>
  );
}
