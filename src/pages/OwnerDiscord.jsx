import { useEffect, useMemo, useState } from "react";
import "./OwnerDiscord.css";

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

  async function connectBot() {
    if (!guildId || busy) return;

    setBusy("connect");
    setError("");
    setMessage("");

    try {
      const result = await apiRequest("prepare-install", {
        method: "POST",
        body: { guildId },
      });

      window.open(result.installUrl, "_blank", "noopener,noreferrer");
      setMessage("Discord открыл окно установки. После добавления бота вернись сюда и нажми «Проверить».");
    } catch (actionError) {
      setError(actionError?.message || "Не удалось открыть установку.");
    } finally {
      setBusy("");
    }
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
      setMessage("Slash-команды зарегистрированы.");
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
              Подключение Discord-сервера прямо из панели владельца ISTe.
              В V1 бот получает slash-команды, данные состава, матчей, новостей и ссылку на сайт.
            </p>
          </div>
        </header>

        {error ? <div className="owner-discord-alert owner-discord-error">{error}</div> : null}
        {message ? <div className="owner-discord-alert owner-discord-success">{message}</div> : null}

        <div className="owner-discord-grid">
          <article className="owner-discord-card">
            <div className="owner-discord-card-head">
              <h2>Подключение</h2>
              <span className={`owner-discord-status ${connected ? "is-online" : ""}`}>
                <i />
                {!configured
                  ? "Нужны Discord credentials"
                  : connected
                    ? "Бот подключён"
                    : "Ожидает подключения"}
              </span>
            </div>

            {status?.guild?.guild_name ? (
              <div className="owner-discord-guild">
                <strong>{status.guild.guild_name}</strong>
                <span>ID {status.guild.guild_id}</span>
              </div>
            ) : null}

            <label className="owner-discord-field">
              <span>Discord Server ID</span>
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
                Discord → Settings → Advanced → Developer Mode → ПКМ по серверу → Copy Server ID.
              </small>
            </label>

            <div className="owner-discord-actions">
              <button
                type="button"
                className="owner-discord-primary"
                onClick={connectBot}
                disabled={!guildId || Boolean(busy) || !status?.configured?.clientId}
              >
                Подключить бота
              </button>

              <button
                type="button"
                className="owner-discord-secondary"
                onClick={verifyBot}
                disabled={!guildId || Boolean(busy) || !status?.configured?.botToken}
              >
                Проверить
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
              Зарегистрировать команды
            </button>

            <div className="owner-discord-endpoint">
              <span>Interactions Endpoint URL</span>
              <code>{status?.interactionUrl || "—"}</code>
            </div>
          </article>
        </div>

        <aside className="owner-discord-setup">
          <h2>Что нужно настроить один раз</h2>
          <p>
            В Discord Developer Portal создаётся приложение ISTe Bot.
            Public Key добавляется в Supabase Edge Function secrets.
            Client ID и Bot Token добавляются в Vercel Environment Variables.
            Bot Token нельзя хранить в GitHub или клиентском коде.
          </p>
          <a
            href="https://discord.com/developers/applications"
            target="_blank"
            rel="noopener noreferrer"
            className="owner-discord-secondary"
          >
            Discord Developer Portal
          </a>
        </aside>
      </div>
    </section>
  );
}
