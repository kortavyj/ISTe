import { useCallback, useEffect, useMemo, useState } from "react";

import { useLanguage } from "../i18n/LanguageContext.jsx";

import "./OwnerRoster.css";

const STATUS_OPTIONS = [
  "main",
  "substitute",
  "trial",
  "benched",
  "inactive",
  "left",
];

const ROLE_OPTIONS = [
  "IGL",
  "AWP",
  "RIFLER",
  "ENTRY",
  "SUPPORT",
  "LURKER",
  "COACH",
];

const copy = {
  uk: {
    eyebrow: "ISTe CONTROL CENTER",
    title: "Roster Manager",
    intro:
      "Офіційний склад ISTe керується тут. FACEIT використовується як джерело статистики, але не вирішує, хто є гравцем команди.",
    loading: "Завантаження складу...",
    retry: "Повторити",
    import: "Імпортувати FACEIT",
    importing: "Імпорт...",
    add: "Додати гравця",
    save: "Зберегти",
    saving: "Збереження...",
    setupTitle: "Потрібно підключити базу Roster Manager",
    setupText:
      "Код уже підготовлений. Застосуй SQL міграцію в Supabase, після цього панель стане повністю редагованою.",
    previewText:
      "Нижче показаний поточний FACEIT склад тільки для перегляду.",
    main: "Основний склад",
    substitutes: "Заміна",
    other: "Інші статуси",
    captain: "Капітан",
    visible: "На публічному сайті",
    nickname: "FACEIT nickname",
    displayName: "Ім'я на сайті",
    realName: "Ім'я (legacy)",
    realNameUk: "Ім'я українською",
    realNameEn: "Ім'я англійською",
    role: "Роль",
    status: "Статус",
    order: "Порядок",
    country: "Країна",
    faceit: "FACEIT URL",
    faceitId: "FACEIT Player ID",
    faceitStats: "Статистика FACEIT",
    faceitStatsHint:
      "Якщо гравець є в синхронізованих даних FACEIT, сайт бере актуальні значення автоматично. Поля нижче використовуються як резервні значення.",
    level: "Level",
    elo: "ELO",
    winRate: "Winrate %",
    kd: "K/D",
    portrait: "Фото гравця",
    portraitUrl: "URL фото",
    uploadPhoto: "Завантажити фото",
    uploadingPhoto: "Завантаження...",
    photoHint: "JPG, PNG або WEBP до 1.5 MB.",
    photoUploaded: "Фото завантажено. Збережіть картку гравця.",
    photoUploadFailed: "Не вдалося завантажити фото.",
    socials: "Соціальні мережі",
    twitch: "Twitch",
    telegram: "Telegram",
    instagram: "Instagram",
    steam: "Steam",
    tiktok: "TikTok",
    strengths: "Сильні сторони",
    notes: "Опис / внутрішня інформація",
    empty: "Гравців поки немає.",
    newPlayer: "Новий гравець",
    requestFailed: "Не вдалося виконати запит.",
    loadFailed: "Не вдалося завантажити Roster Manager.",
    saved: "{{name}} збережено.",
    saveFailed: "Не вдалося зберегти гравця.",
    imported: "FACEIT: імпортовано {{count}} записів.",
    importFailed: "Не вдалося імпортувати FACEIT.",
    previewNote: "Попередній перегляд даних FACEIT.",
    statusLabels: {
      main: "ОСНОВНИЙ",
      substitute: "ЗАМІНА",
      trial: "ТЕСТ",
      benched: "ЗАПАС",
      inactive: "НЕАКТИВНИЙ",
      left: "ВИБУВ",
    },
  },
  en: {
    eyebrow: "ISTe CONTROL CENTER",
    title: "Roster Manager",
    intro:
      "The official ISTe roster is managed here. FACEIT provides statistics, but it does not decide who belongs to the team.",
    loading: "Loading roster...",
    retry: "Retry",
    import: "Import FACEIT",
    importing: "Importing...",
    add: "Add player",
    save: "Save",
    saving: "Saving...",
    setupTitle: "Roster Manager database setup required",
    setupText:
      "The code is ready. Apply the Supabase SQL migration to enable full roster editing.",
    previewText:
      "The current FACEIT roster is shown below as a read-only preview.",
    main: "Main roster",
    substitutes: "Substitutes",
    other: "Other statuses",
    captain: "Captain",
    visible: "Public website",
    nickname: "FACEIT nickname",
    displayName: "Display name",
    realName: "Real name (legacy)",
    realNameUk: "Ukrainian name",
    realNameEn: "English name",
    role: "Role",
    status: "Status",
    order: "Order",
    country: "Country",
    faceit: "FACEIT URL",
    faceitId: "FACEIT Player ID",
    faceitStats: "FACEIT statistics",
    faceitStatsHint:
      "If the player exists in synchronized FACEIT data, the site uses live values automatically. The fields below are fallback values.",
    level: "Level",
    elo: "ELO",
    winRate: "Winrate %",
    kd: "K/D",
    portrait: "Player photo",
    portraitUrl: "Photo URL",
    uploadPhoto: "Upload photo",
    uploadingPhoto: "Uploading...",
    photoHint: "JPG, PNG or WEBP up to 1.5 MB.",
    photoUploaded: "Photo uploaded. Save the player card.",
    photoUploadFailed: "Could not upload the photo.",
    socials: "Social media",
    twitch: "Twitch",
    telegram: "Telegram",
    instagram: "Instagram",
    steam: "Steam",
    tiktok: "TikTok",
    strengths: "Strengths",
    notes: "Description / internal notes",
    empty: "No players yet.",
    newPlayer: "New player",
    requestFailed: "Request failed.",
    loadFailed: "Could not load Roster Manager.",
    saved: "{{name}} saved.",
    saveFailed: "Could not save player.",
    imported: "FACEIT: imported {{count}} records.",
    importFailed: "Could not import FACEIT.",
    previewNote: "FACEIT data preview.",
    statusLabels: {
      main: "MAIN",
      substitute: "SUBSTITUTE",
      trial: "TRIAL",
      benched: "BENCHED",
      inactive: "INACTIVE",
      left: "LEFT",
    },
  },
};

function createDraft() {
  return {
    id: "",
    faceitPlayerId: "",
    nickname: "",
    displayName: "",
    realName: "",
    realNameUk: "",
    realNameEn: "",
    status: "trial",
    role: "RIFLER",
    isCaptain: false,
    sortOrder: 100,
    country: "ua",
    faceitUrl: "",
    portraitUrl: "",
    socials: [],
    faceitLevelOverride: "",
    faceitEloOverride: "",
    faceitWinRateOverride: "",
    faceitKdOverride: "",
    notes: "",
    strengths: [],
    publicVisible: false,
  };
}

function normalizeFaceitPreview(player, index, previewNote) {
  return {
    id: `faceit-${player.playerId || player.nickname || index}`,
    faceitPlayerId: player.playerId || "",
    nickname: player.nickname || "",
    displayName: player.nickname || "",
    realName: "",
    realNameUk: "",
    realNameEn: "",
    status: "trial",
    role: String(player.role || "RIFLER").toUpperCase(),
    isCaptain: false,
    sortOrder: 200 + index * 10,
    country: player.country || "",
    faceitUrl: player.faceitUrl || "",
    portraitUrl: player.avatar || "",
    socials: [],
    faceitLevelOverride:
      Number.isFinite(player.level)
        ? player.level
        : "",
    faceitEloOverride:
      Number.isFinite(player.elo)
        ? player.elo
        : "",
    faceitWinRateOverride:
      Number.isFinite(player.winRate)
        ? player.winRate
        : "",
    faceitKdOverride:
      Number.isFinite(player.kd)
        ? player.kd
        : "",
    notes: previewNote,
    strengths: [],
    publicVisible: false,
    readOnly: true,
    level: player.level,
    elo: player.elo,
  };
}

async function readJson(response, fallbackMessage) {
  const result = await response.json().catch(() => null);

  if (!response.ok || result?.ok !== true) {
    throw new Error(
      fallbackMessage,
    );
  }

  return result;
}

function PlayerEditor({
  player,
  disabled,
  onChange,
  onSave,
  onUploadPhoto,
  saving,
  uploadingPhoto,
  c,
}) {
  const strengthsText = Array.isArray(player.strengths)
    ? player.strengths.join(", ")
    : "";

  function patch(field, value) {
    onChange({
      ...player,
      [field]: value,
    });
  }

  function socialValue(type) {
    return (
      player.socials?.find(
        (item) =>
          item.type === type,
      )?.url || ""
    );
  }

  function patchSocial(
    type,
    url,
  ) {
    const next = [
      ...(Array.isArray(
        player.socials,
      )
        ? player.socials
        : []
      ).filter(
        (item) =>
          item.type !== type,
      ),
    ];

    const normalized =
      url.trim();

    if (normalized) {
      next.push({
        type,
        url: normalized,
      });
    }

    patch(
      "socials",
      next,
    );
  }

  return (
    <article
      className={[
        "owner-roster-card",
        player.isCaptain ? "owner-roster-card--captain" : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div className="owner-roster-card__top">
        <div className="owner-roster-card__identity">
          <div className="owner-roster-card__portrait">
            {player.portraitUrl ? (
              <img
                src={
                  player.portraitUrl
                }
                alt=""
              />
            ) : (
              <span>
                {(player.displayName ||
                  player.nickname ||
                  "?")
                  .slice(0, 1)
                  .toUpperCase()}
              </span>
            )}
          </div>

          <div>
          <span className="owner-roster-card__status">
            {c.statusLabels[player.status] || player.status}
          </span>
          <h2>{player.displayName || player.nickname || c.newPlayer}</h2>
          <p>
            {player.nickname || "FACEIT"}
            {Number.isFinite(player.level) ? ` · LVL ${player.level}` : ""}
            {Number.isFinite(player.elo) ? ` · ${player.elo} ELO` : ""}
          </p>
          </div>
        </div>

        <div className="owner-roster-card__flags">
          <label>
            <input
              type="checkbox"
              checked={player.isCaptain === true}
              disabled={disabled}
              onChange={(event) =>
                patch("isCaptain", event.target.checked)
              }
            />
            {c.captain}
          </label>

          <label>
            <input
              type="checkbox"
              checked={player.publicVisible !== false}
              disabled={disabled}
              onChange={(event) =>
                patch("publicVisible", event.target.checked)
              }
            />
            {c.visible}
          </label>
        </div>
      </div>

      <div className="owner-roster-grid">
        <label>
          <span>{c.faceitId}</span>
          <input
            value={
              player.faceitPlayerId ||
              ""
            }
            disabled={disabled}
            onChange={(event) =>
              patch(
                "faceitPlayerId",
                event.target.value,
              )
            }
          />
        </label>

        <label>
          <span>{c.nickname}</span>
          <input
            value={player.nickname}
            disabled={disabled}
            onChange={(event) => patch("nickname", event.target.value)}
          />
        </label>

        <label>
          <span>{c.displayName}</span>
          <input
            value={player.displayName}
            disabled={disabled}
            onChange={(event) => patch("displayName", event.target.value)}
          />
        </label>

        <label>
          <span>{c.realNameUk}</span>
          <input
            value={player.realNameUk || ""}
            disabled={disabled}
            onChange={(event) => patch("realNameUk", event.target.value)}
          />
        </label>

        <label>
          <span>{c.realNameEn}</span>
          <input
            value={player.realNameEn || ""}
            disabled={disabled}
            onChange={(event) => patch("realNameEn", event.target.value)}
          />
        </label>

        <label>
          <span>{c.role}</span>
          <select
            value={player.role}
            disabled={disabled}
            onChange={(event) => patch("role", event.target.value)}
          >
            {ROLE_OPTIONS.map((role) => (
              <option key={role} value={role}>
                {role}
              </option>
            ))}
          </select>
        </label>

        <label>
          <span>{c.status}</span>
          <select
            value={player.status}
            disabled={disabled}
            onChange={(event) => patch("status", event.target.value)}
          >
            {STATUS_OPTIONS.map((value) => (
              <option key={value} value={value}>
                {c.statusLabels[value] || value}
              </option>
            ))}
          </select>
        </label>

        <label>
          <span>{c.order}</span>
          <input
            type="number"
            value={player.sortOrder}
            disabled={disabled}
            onChange={(event) =>
              patch("sortOrder", Number(event.target.value))
            }
          />
        </label>

        <label>
          <span>{c.country}</span>
          <input
            maxLength={2}
            value={player.country}
            disabled={disabled}
            onChange={(event) =>
              patch("country", event.target.value.toLowerCase())
            }
          />
        </label>

        <label className="owner-roster-grid__wide">
          <span>{c.faceit}</span>
          <input
            value={player.faceitUrl}
            disabled={disabled}
            onChange={(event) => patch("faceitUrl", event.target.value)}
          />
        </label>

        <section className="owner-roster-extra owner-roster-grid__full">
          <div className="owner-roster-extra__head">
            <div>
              <strong>{c.faceitStats}</strong>
              <span>{c.faceitStatsHint}</span>
            </div>
          </div>

          <div className="owner-roster-stats-grid">
            {[
              ["faceitLevelOverride", c.level, "1", "10", "1"],
              ["faceitEloOverride", c.elo, "0", "10000", "1"],
              ["faceitWinRateOverride", c.winRate, "0", "100", "0.01"],
              ["faceitKdOverride", c.kd, "0", "10", "0.01"],
            ].map(
              ([
                field,
                label,
                min,
                max,
                step,
              ]) => (
                <label key={field}>
                  <span>{label}</span>
                  <input
                    type="number"
                    min={min}
                    max={max}
                    step={step}
                    value={
                      player[field] ??
                      ""
                    }
                    disabled={disabled}
                    onChange={(event) =>
                      patch(
                        field,
                        event.target.value,
                      )
                    }
                  />
                </label>
              ),
            )}
          </div>
        </section>

        <section className="owner-roster-extra owner-roster-grid__full">
          <div className="owner-roster-extra__head">
            <div>
              <strong>{c.portrait}</strong>
              <span>{c.photoHint}</span>
            </div>
          </div>

          <div className="owner-roster-photo-fields">
            <label>
              <span>{c.portraitUrl}</span>
              <input
                value={
                  player.portraitUrl ||
                  ""
                }
                disabled={disabled}
                onChange={(event) =>
                  patch(
                    "portraitUrl",
                    event.target.value,
                  )
                }
              />
            </label>

            <label className="owner-roster-upload">
              <span>
                {uploadingPhoto
                  ? c.uploadingPhoto
                  : c.uploadPhoto}
              </span>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                disabled={
                  disabled ||
                  uploadingPhoto
                }
                onChange={(event) => {
                  const file =
                    event.target
                      .files?.[0];

                  if (file) {
                    onUploadPhoto(
                      player,
                      file,
                    );
                  }

                  event.target.value =
                    "";
                }}
              />
            </label>
          </div>
        </section>

        <section className="owner-roster-extra owner-roster-grid__full">
          <div className="owner-roster-extra__head">
            <strong>{c.socials}</strong>
          </div>

          <div className="owner-roster-social-grid">
            {[
              ["twitch", c.twitch],
              ["telegram", c.telegram],
              ["instagram", c.instagram],
              ["steam", c.steam],
              ["tiktok", c.tiktok],
            ].map(
              ([type, label]) => (
                <label key={type}>
                  <span>{label}</span>
                  <input
                    type="url"
                    placeholder="https://"
                    value={
                      socialValue(
                        type,
                      )
                    }
                    disabled={disabled}
                    onChange={(event) =>
                      patchSocial(
                        type,
                        event.target.value,
                      )
                    }
                  />
                </label>
              ),
            )}
          </div>
        </section>

        <label className="owner-roster-grid__wide">
          <span>{c.strengths}</span>
          <input
            value={strengthsText}
            disabled={disabled}
            onChange={(event) =>
              patch(
                "strengths",
                event.target.value
                  .split(",")
                  .map((item) => item.trim())
                  .filter(Boolean),
              )
            }
          />
        </label>

        <label className="owner-roster-grid__full">
          <span>{c.notes}</span>
          <textarea
            rows="4"
            value={player.notes}
            disabled={disabled}
            onChange={(event) => patch("notes", event.target.value)}
          />
        </label>
      </div>

      {!disabled ? (
        <div className="owner-roster-card__actions">
          <button
            type="button"
            disabled={saving}
            onClick={() => onSave(player)}
          >
            {saving ? c.saving : c.save}
          </button>
        </div>
      ) : null}
    </article>
  );
}

export default function OwnerRoster() {
  const { language } = useLanguage();
  const c = copy[language] || copy.uk;

  const [players, setPlayers] = useState([]);
  const [setupRequired, setSetupRequired] = useState(false);
  const [migration, setMigration] = useState("");
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState("");
  const [importing, setImporting] = useState(false);
  const [uploadingPhotoId, setUploadingPhotoId] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const loadRoster = useCallback(async () => {
    setLoading(true);
    setError("");
    setNotice("");

    try {
      const response = await fetch(
        "/api/owner?module=roster&action=list",
        {
          credentials: "include",
          cache: "no-store",
          headers: { Accept: "application/json" },
        },
      );

      const result = await readJson(
        response,
        c.requestFailed,
      );

      setSetupRequired(result.setupRequired === true);
      setMigration(result.migration || "");

      if (result.setupRequired === true) {
        const faceitResponse = await fetch("/data/faceit-stats.json", {
          cache: "no-store",
        });

        const stats = await faceitResponse.json();
        const faceitRoster = Array.isArray(stats?.roster) ? stats.roster : [];

        setPlayers(
          faceitRoster.map((player, index) =>
            normalizeFaceitPreview(
              player,
              index,
              c.previewNote,
            ),
          ),
        );
      } else {
        setPlayers(Array.isArray(result.players) ? result.players : []);
      }
    } catch (loadError) {
      setError(loadError?.message || c.loadFailed);
    } finally {
      setLoading(false);
    }
  }, [c]);

  useEffect(() => {
    void loadRoster();
  }, [loadRoster]);

  const groups = useMemo(
    () => ({
      main: players.filter((player) => player.status === "main"),
      substitute: players.filter(
        (player) => player.status === "substitute",
      ),
      other: players.filter(
        (player) =>
          player.status !== "main" &&
          player.status !== "substitute",
      ),
    }),
    [players],
  );

  function updatePlayer(nextPlayer) {
    setPlayers((current) =>
      current.map((player) =>
        player.id === nextPlayer.id ? nextPlayer : player,
      ),
    );
  }

  async function fileToBase64(
    file,
  ) {
    const buffer =
      await file.arrayBuffer();

    let binary = "";
    const bytes =
      new Uint8Array(
        buffer,
      );
    const chunkSize =
      0x8000;

    for (
      let offset = 0;
      offset < bytes.length;
      offset += chunkSize
    ) {
      binary +=
        String.fromCharCode(
          ...bytes.subarray(
            offset,
            offset +
              chunkSize,
          ),
        );
    }

    return btoa(binary);
  }

  async function uploadPhoto(
    player,
    file,
  ) {
    if (
      ![
        "image/jpeg",
        "image/png",
        "image/webp",
      ].includes(file.type)
    ) {
      setError(
        c.photoUploadFailed,
      );
      return;
    }

    if (
      file.size >
      1_572_864
    ) {
      setError(
        c.photoHint,
      );
      return;
    }

    setUploadingPhotoId(
      player.id,
    );
    setError("");
    setNotice("");

    try {
      const response =
        await fetch(
          "/api/owner?module=roster&action=upload-photo",
          {
            method: "POST",
            credentials: "include",
            headers: {
              Accept:
                "application/json",
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify({
              fileName:
                file.name,
              mimeType:
                file.type,
              data:
                await fileToBase64(
                  file,
                ),
            }),
          },
        );

      const result =
        await readJson(
          response,
          c.photoUploadFailed,
        );

      updatePlayer({
        ...player,
        portraitUrl:
          result.portraitUrl,
      });

      setNotice(
        c.photoUploaded,
      );
    } catch {
      setError(
        c.photoUploadFailed,
      );
    } finally {
      setUploadingPhotoId(
        "",
      );
    }
  }

  async function savePlayer(player) {
    setSavingId(player.id || "new");
    setError("");
    setNotice("");

    try {
      const response = await fetch(
        "/api/owner?module=roster&action=save",
        {
          method: "POST",
          credentials: "include",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ...player,
            id:
              typeof player.id === "string" &&
              player.id.startsWith("new-")
                ? ""
                : player.id,
          }),
        },
      );

      const result = await readJson(
        response,
        c.requestFailed,
      );
      const saved = result.player;

      setPlayers((current) => {
        const exists = current.some((item) => item.id === player.id);

        if (!exists) {
          return [...current, saved];
        }

        return current.map((item) =>
          item.id === player.id ? saved : item,
        );
      });

      setNotice(
        c.saved.replace(
          "{{name}}",
          saved.displayName,
        ),
      );
    } catch (saveError) {
      setError(saveError?.message || c.saveFailed);
    } finally {
      setSavingId("");
    }
  }

  function addPlayer() {
    const draft = {
      ...createDraft(),
      id: `new-${Date.now()}`,
    };

    setPlayers((current) => [...current, draft]);
  }

  async function importFaceit() {
    setImporting(true);
    setError("");
    setNotice("");

    try {
      const faceitResponse = await fetch("/data/faceit-stats.json", {
        cache: "no-store",
      });

      const stats = await faceitResponse.json();

      const response = await fetch(
        "/api/owner?module=roster&action=import-faceit",
        {
          method: "POST",
          credentials: "include",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            players: Array.isArray(stats?.roster) ? stats.roster : [],
          }),
        },
      );

      const result = await readJson(
        response,
        c.requestFailed,
      );
      setNotice(
        c.imported.replace(
          "{{count}}",
          String(result.imported || 0),
        ),
      );
      await loadRoster();
    } catch (importError) {
      setError(importError?.message || c.importFailed);
    } finally {
      setImporting(false);
    }
  }

  function renderGroup(title, items) {
    if (!items.length) return null;

    return (
      <section className="owner-roster-group">
        <header>
          <h2>{title}</h2>
          <span>{items.length}</span>
        </header>

        <div className="owner-roster-list">
          {items.map((player) => (
            <PlayerEditor
              key={player.id}
              player={player}
              disabled={setupRequired || player.readOnly === true}
              onChange={updatePlayer}
              onSave={savePlayer}
              onUploadPhoto={uploadPhoto}
              saving={savingId === player.id}
              uploadingPhoto={
                uploadingPhotoId ===
                player.id
              }
              c={c}
            />
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="owner-roster-page">
      <div className="owner-roster-shell">
        <header className="owner-roster-header">
          <div>
            <span>{c.eyebrow}</span>
            <h1>{c.title}</h1>
            <p>{c.intro}</p>
          </div>

          <div className="owner-roster-toolbar">
            <button
              type="button"
              className="owner-roster-button owner-roster-button--ghost"
              disabled={loading || setupRequired || importing}
              onClick={importFaceit}
            >
              {importing ? c.importing : c.import}
            </button>

            <button
              type="button"
              className="owner-roster-button"
              disabled={setupRequired}
              onClick={addPlayer}
            >
              {c.add}
            </button>
          </div>
        </header>

        {setupRequired ? (
          <div className="owner-roster-setup">
            <strong>{c.setupTitle}</strong>
            <p>{c.setupText}</p>
            {migration ? <code>{migration}</code> : null}
            <small>{c.previewText}</small>
          </div>
        ) : null}

        {error ? (
          <div className="owner-roster-message owner-roster-message--error">
            <span>{error}</span>
            <button type="button" onClick={loadRoster}>
              {c.retry}
            </button>
          </div>
        ) : null}

        {notice ? (
          <div className="owner-roster-message owner-roster-message--success">
            {notice}
          </div>
        ) : null}

        {loading ? (
          <div className="owner-roster-loading">{c.loading}</div>
        ) : players.length ? (
          <>
            {renderGroup(c.main, groups.main)}
            {renderGroup(c.substitutes, groups.substitute)}
            {renderGroup(c.other, groups.other)}
          </>
        ) : (
          <div className="owner-roster-loading">{c.empty}</div>
        )}
      </div>
    </section>
  );
}
