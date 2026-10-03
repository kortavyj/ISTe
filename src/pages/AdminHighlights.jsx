import {
  useEffect,
  useMemo,
  useState,
} from "react";

import isteLogo from "../assets/logos/iste-logo.png";
import {
  getHighlightThumbnail,
  localizeHighlight,
} from "../lib/highlights.js";
import { useLanguage } from "../i18n/LanguageContext.jsx";

import "./AdminHighlights.css";

const EMPTY = {
  id: "",
  titleUk: "",
  titleEn: "",
  descriptionUk: "",
  descriptionEn: "",
  videoUrl: "",
  thumbnailUrl: "",
  highlightType:
    "highlight",
  playerFaceitId: "",
  playerName: "",
  matchLabel: "",
  matchDate: "",
  featured: false,
  published: false,
  sortOrder: 0,
};

const copy = {
  uk: {
    eyebrow: "ISTe MEDIA CONTROL",
    title: "Хайлайти",
    intro:
      "Керування кліпами, MVP, ACE, clutch та збірками найкращих моментів ISTe.",
    create: "Новий хайлайт",
    edit: "Редагування",
    titleUk: "Назва українською",
    titleEn: "Назва англійською",
    descriptionUk:
      "Опис українською",
    descriptionEn:
      "Опис англійською",
    videoUrl: "Посилання на відео",
    thumbnailUrl:
      "Посилання на прев'ю",
    uploadThumbnail:
      "Завантажити прев'ю",
    uploading: "Завантаження...",
    type: "Тип",
    player: "Гравець",
    noPlayer: "Без прив'язки",
    match: "Матч / подія",
    matchDate: "Дата матчу",
    featured: "Featured",
    published: "Опубліковано",
    sortOrder:
      "Порядок відображення",
    save: "Зберегти",
    saving: "Збереження...",
    delete: "Видалити",
    cancel: "Очистити форму",
    saved: "Хайлайт збережено.",
    deleted: "Хайлайт видалено.",
    confirmDelete:
      "Видалити цей хайлайт?",
    loadFailed:
      "Не вдалося завантажити хайлайти.",
    saveFailed:
      "Не вдалося зберегти хайлайт.",
    deleteFailed:
      "Не вдалося видалити хайлайт.",
    uploadFailed:
      "Не вдалося завантажити прев'ю.",
    imageHint:
      "JPG, PNG або WEBP до 2 MB.",
    list: "Усі хайлайти",
    empty:
      "Хайлайтів поки немає.",
    publishedLabel:
      "На сайті",
    draftLabel: "Чернетка",
    typeHighlight: "Highlight",
    typeClutch: "Clutch",
    typeAce: "ACE",
    typeMvp: "MVP",
    typeBest:
      "Best moments",
  },
  en: {
    eyebrow: "ISTe MEDIA CONTROL",
    title: "Highlights",
    intro:
      "Manage ISTe clips, MVPs, ACEs, clutches and best-moments compilations.",
    create: "New highlight",
    edit: "Editing",
    titleUk: "Ukrainian title",
    titleEn: "English title",
    descriptionUk:
      "Ukrainian description",
    descriptionEn:
      "English description",
    videoUrl: "Video URL",
    thumbnailUrl:
      "Thumbnail URL",
    uploadThumbnail:
      "Upload thumbnail",
    uploading: "Uploading...",
    type: "Type",
    player: "Player",
    noPlayer: "No player",
    match: "Match / event",
    matchDate: "Match date",
    featured: "Featured",
    published: "Published",
    sortOrder: "Display order",
    save: "Save",
    saving: "Saving...",
    delete: "Delete",
    cancel: "Clear form",
    saved: "Highlight saved.",
    deleted: "Highlight deleted.",
    confirmDelete:
      "Delete this highlight?",
    loadFailed:
      "Could not load highlights.",
    saveFailed:
      "Could not save highlight.",
    deleteFailed:
      "Could not delete highlight.",
    uploadFailed:
      "Could not upload thumbnail.",
    imageHint:
      "JPG, PNG or WEBP up to 2 MB.",
    list: "All highlights",
    empty:
      "No highlights yet.",
    publishedLabel:
      "Published",
    draftLabel: "Draft",
    typeHighlight: "Highlight",
    typeClutch: "Clutch",
    typeAce: "ACE",
    typeMvp: "MVP",
    typeBest:
      "Best moments",
  },
};

async function request(
  action,
  {
    method = "GET",
    body = null,
  } = {},
) {
  const options = {
    method,
    credentials: "include",
    cache: "no-store",
    headers: {
      Accept:
        "application/json",
    },
  };

  if (body) {
    options.headers[
      "Content-Type"
    ] =
      "application/json";

    options.body =
      JSON.stringify(body);
  }

  const response =
    await fetch(
      `/api/owner?module=highlights&action=${encodeURIComponent(
        action,
      )}`,
      options,
    );

  const result =
    await response
      .json()
      .catch(
        () => null,
      );

  if (
    !response.ok ||
    result?.ok !== true
  ) {
    throw new Error(
      result?.message ||
        "REQUEST_FAILED",
    );
  }

  return result;
}

async function fileToBase64(
  file,
) {
  const buffer =
    await file.arrayBuffer();

  let binary = "";
  const bytes =
    new Uint8Array(buffer);
  const chunk =
    0x8000;

  for (
    let index = 0;
    index < bytes.length;
    index += chunk
  ) {
    binary +=
      String.fromCharCode(
        ...bytes.subarray(
          index,
          index + chunk,
        ),
      );
  }

  return btoa(binary);
}

function toInputDateTime(
  value,
) {
  if (!value) return "";

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return "";
  }

  const shifted =
    new Date(
      date.getTime() -
      date.getTimezoneOffset() *
        60000,
    );

  return shifted
    .toISOString()
    .slice(0, 16);
}

export default function AdminHighlights() {
  const {
    language,
  } = useLanguage();

  const c =
    copy[language] ||
    copy.uk;

  const [
    highlights,
    setHighlights,
  ] = useState([]);

  const [
    players,
    setPlayers,
  ] = useState([]);

  const [
    form,
    setForm,
  ] = useState(EMPTY);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    saving,
    setSaving,
  ] = useState(false);

  const [
    uploading,
    setUploading,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");

  const [
    notice,
    setNotice,
  ] = useState("");

  const typeOptions =
    useMemo(
      () => [
        [
          "highlight",
          c.typeHighlight,
        ],
        [
          "clutch",
          c.typeClutch,
        ],
        [
          "ace",
          c.typeAce,
        ],
        [
          "mvp",
          c.typeMvp,
        ],
        [
          "best_moments",
          c.typeBest,
        ],
      ],
      [c],
    );

  async function load() {
    setLoading(true);
    setError("");

    try {
      const [
        highlightResult,
        rosterResponse,
      ] =
        await Promise.all([
          request("list"),
          fetch(
            "/api/owner?module=public-roster",
            {
              cache:
                "no-store",
            },
          ),
        ]);

      const rosterResult =
        await rosterResponse
          .json()
          .catch(
            () => null,
          );

      setHighlights(
        Array.isArray(
          highlightResult
            .highlights,
        )
          ? highlightResult
              .highlights
          : [],
      );

      setPlayers(
        rosterResponse.ok &&
        Array.isArray(
          rosterResult
            ?.players,
        )
          ? rosterResult.players
          : [],
      );
    } catch {
      setError(
        c.loadFailed,
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  function patch(
    field,
    value,
  ) {
    setForm(
      (current) => ({
        ...current,
        [field]:
          value,
      }),
    );
  }

  function reset() {
    setForm(EMPTY);
    setError("");
    setNotice("");
  }

  function edit(
    highlight,
  ) {
    setForm({
      ...EMPTY,
      ...highlight,
      matchDate:
        toInputDateTime(
          highlight.matchDate,
        ),
    });

    setError("");
    setNotice("");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  async function save(
    event,
  ) {
    event.preventDefault();

    setSaving(true);
    setError("");
    setNotice("");

    try {
      const result =
        await request(
          "save",
          {
            method: "POST",
            body: {
              ...form,
              sortOrder:
                Number(
                  form.sortOrder,
                ) || 0,
              matchDate:
                form.matchDate
                  ? new Date(
                      form.matchDate,
                    )
                      .toISOString()
                  : "",
            },
          },
        );

      setNotice(
        c.saved,
      );

      setForm({
        ...EMPTY,
        ...result.highlight,
        matchDate:
          toInputDateTime(
            result.highlight
              ?.matchDate,
          ),
      });

      await load();
    } catch (
      saveError
    ) {
      setError(
        saveError?.message ||
        c.saveFailed,
      );
    } finally {
      setSaving(false);
    }
  }

  async function remove(
    highlight,
  ) {
    if (
      !window.confirm(
        `${c.confirmDelete}\n\n${highlight.titleUk || highlight.titleEn}`,
      )
    ) {
      return;
    }

    setError("");
    setNotice("");

    try {
      await request(
        "delete",
        {
          method: "POST",
          body: {
            id:
              highlight.id,
          },
        },
      );

      if (
        form.id ===
        highlight.id
      ) {
        reset();
      }

      setNotice(
        c.deleted,
      );

      await load();
    } catch {
      setError(
        c.deleteFailed,
      );
    }
  }

  async function uploadThumbnail(
    file,
  ) {
    if (
      !file ||
      ![
        "image/jpeg",
        "image/png",
        "image/webp",
      ].includes(
        file.type,
      ) ||
      file.size >
        2_097_152
    ) {
      setError(
        c.imageHint,
      );
      return;
    }

    setUploading(true);
    setError("");

    try {
      const result =
        await request(
          "upload-thumbnail",
          {
            method: "POST",
            body: {
              fileName:
                file.name,
              mimeType:
                file.type,
              data:
                await fileToBase64(
                  file,
                ),
            },
          },
        );

      patch(
        "thumbnailUrl",
        result.thumbnailUrl,
      );
    } catch {
      setError(
        c.uploadFailed,
      );
    } finally {
      setUploading(false);
    }
  }

  function selectPlayer(
    faceitId,
  ) {
    const player =
      players.find(
        (item) =>
          (
            item.faceitPlayerId ||
            item.nickname
          ) ===
          faceitId,
      );

    setForm(
      (current) => ({
        ...current,
        playerFaceitId:
          player
            ? faceitId
            : "",
        playerName:
          player
            ? player.displayName ||
              player.nickname
            : "",
      }),
    );
  }

  const preview =
    localizeHighlight(
      form,
      language,
    );

  return (
    <section className="admin-highlights-page">
      <div className="admin-highlights-shell">
        <header className="admin-highlights-header">
          <div>
            <span>
              {c.eyebrow}
            </span>
            <h1>
              {c.title}
            </h1>
            <p>
              {c.intro}
            </p>
          </div>

          <button
            type="button"
            onClick={reset}
          >
            + {c.create}
          </button>
        </header>

        {error ? (
          <div className="admin-highlights-message error">
            {error}
          </div>
        ) : null}

        {notice ? (
          <div className="admin-highlights-message success">
            {notice}
          </div>
        ) : null}

        <div className="admin-highlights-layout">
          <form
            className="admin-highlights-editor"
            onSubmit={save}
          >
            <div className="admin-highlights-editor-title">
              <span>
                {form.id
                  ? c.edit
                  : c.create}
              </span>
              <strong>
                {preview.title ||
                  c.create}
              </strong>
            </div>

            <div className="admin-highlights-preview">
              <img
                src={getHighlightThumbnail(
                  form,
                  isteLogo,
                )}
                alt=""
              />
              <span>▶</span>
            </div>

            <div className="admin-highlights-grid">
              <label>
                <span>
                  {c.titleUk}
                </span>
                <input
                  value={
                    form.titleUk
                  }
                  onChange={(event) =>
                    patch(
                      "titleUk",
                      event.target
                        .value,
                    )
                  }
                  required
                />
              </label>

              <label>
                <span>
                  {c.titleEn}
                </span>
                <input
                  value={
                    form.titleEn
                  }
                  onChange={(event) =>
                    patch(
                      "titleEn",
                      event.target
                        .value,
                    )
                  }
                  required
                />
              </label>

              <label>
                <span>
                  {c.type}
                </span>
                <select
                  value={
                    form.highlightType
                  }
                  onChange={(event) =>
                    patch(
                      "highlightType",
                      event.target
                        .value,
                    )
                  }
                >
                  {typeOptions.map(
                    ([
                      value,
                      label,
                    ]) => (
                      <option
                        key={value}
                        value={value}
                      >
                        {label}
                      </option>
                    ),
                  )}
                </select>
              </label>

              <label>
                <span>
                  {c.player}
                </span>
                <select
                  value={
                    form.playerFaceitId
                  }
                  onChange={(event) =>
                    selectPlayer(
                      event.target
                        .value,
                    )
                  }
                >
                  <option value="">
                    {c.noPlayer}
                  </option>
                  {players.map(
                    (player) => {
                      const value =
                        player.faceitPlayerId ||
                        player.nickname;

                      return (
                        <option
                          key={value}
                          value={value}
                        >
                          {player.displayName ||
                            player.nickname}
                        </option>
                      );
                    },
                  )}
                </select>
              </label>

              <label className="wide">
                <span>
                  {c.videoUrl}
                </span>
                <input
                  type="url"
                  value={
                    form.videoUrl
                  }
                  onChange={(event) =>
                    patch(
                      "videoUrl",
                      event.target
                        .value,
                    )
                  }
                  placeholder="https://youtube.com/..."
                  required
                />
              </label>

              <label className="wide">
                <span>
                  {c.thumbnailUrl}
                </span>
                <input
                  type="url"
                  value={
                    form.thumbnailUrl
                  }
                  onChange={(event) =>
                    patch(
                      "thumbnailUrl",
                      event.target
                        .value,
                    )
                  }
                  placeholder="https://..."
                />
              </label>

              <label className="admin-highlights-upload">
                <span>
                  {uploading
                    ? c.uploading
                    : c.uploadThumbnail}
                </span>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  disabled={
                    uploading
                  }
                  onChange={(event) => {
                    const file =
                      event.target
                        .files?.[0];

                    if (file) {
                      void uploadThumbnail(
                        file,
                      );
                    }

                    event.target.value =
                      "";
                  }}
                />
                <small>
                  {c.imageHint}
                </small>
              </label>

              <label>
                <span>
                  {c.match}
                </span>
                <input
                  value={
                    form.matchLabel
                  }
                  onChange={(event) =>
                    patch(
                      "matchLabel",
                      event.target
                        .value,
                    )
                  }
                  placeholder="ISTe vs ..."
                />
              </label>

              <label>
                <span>
                  {c.matchDate}
                </span>
                <input
                  type="datetime-local"
                  value={
                    form.matchDate
                  }
                  onChange={(event) =>
                    patch(
                      "matchDate",
                      event.target
                        .value,
                    )
                  }
                />
              </label>

              <label>
                <span>
                  {c.sortOrder}
                </span>
                <input
                  type="number"
                  min="-1000"
                  max="1000"
                  value={
                    form.sortOrder
                  }
                  onChange={(event) =>
                    patch(
                      "sortOrder",
                      event.target
                        .value,
                    )
                  }
                />
              </label>
            </div>

            <label className="admin-highlights-textarea">
              <span>
                {c.descriptionUk}
              </span>
              <textarea
                rows="3"
                maxLength="500"
                value={
                  form.descriptionUk
                }
                onChange={(event) =>
                  patch(
                    "descriptionUk",
                    event.target
                      .value,
                  )
                }
              />
            </label>

            <label className="admin-highlights-textarea">
              <span>
                {c.descriptionEn}
              </span>
              <textarea
                rows="3"
                maxLength="500"
                value={
                  form.descriptionEn
                }
                onChange={(event) =>
                  patch(
                    "descriptionEn",
                    event.target
                      .value,
                  )
                }
              />
            </label>

            <div className="admin-highlights-toggles">
              <label>
                <input
                  type="checkbox"
                  checked={
                    form.featured
                  }
                  onChange={(event) =>
                    patch(
                      "featured",
                      event.target
                        .checked,
                    )
                  }
                />
                <span>
                  {c.featured}
                </span>
              </label>

              <label>
                <input
                  type="checkbox"
                  checked={
                    form.published
                  }
                  onChange={(event) =>
                    patch(
                      "published",
                      event.target
                        .checked,
                    )
                  }
                />
                <span>
                  {c.published}
                </span>
              </label>
            </div>

            <div className="admin-highlights-actions">
              <button
                type="submit"
                className="primary"
                disabled={
                  saving ||
                  uploading
                }
              >
                {saving
                  ? c.saving
                  : c.save}
              </button>

              <button
                type="button"
                onClick={reset}
              >
                {c.cancel}
              </button>
            </div>
          </form>

          <aside className="admin-highlights-list">
            <header>
              <h2>{c.list}</h2>
              <span>
                {highlights.length}
              </span>
            </header>

            {loading ? (
              <div className="admin-highlights-empty">
                ...
              </div>
            ) : highlights.length ? (
              highlights.map(
                (highlight) => {
                  const item =
                    localizeHighlight(
                      highlight,
                      language,
                    );

                  return (
                    <article
                      key={
                        highlight.id
                      }
                      className={
                        form.id ===
                        highlight.id
                          ? "active"
                          : ""
                      }
                    >
                      <button
                        type="button"
                        className="admin-highlights-list-main"
                        onClick={() =>
                          edit(
                            highlight,
                          )
                        }
                      >
                        <img
                          src={getHighlightThumbnail(
                            highlight,
                            isteLogo,
                          )}
                          alt=""
                        />

                        <span>
                          <strong>
                            {item.title}
                          </strong>
                          <small>
                            {highlight.playerName ||
                              highlight.matchLabel ||
                              highlight.highlightType}
                          </small>
                          <i
                            className={
                              highlight.published
                                ? "published"
                                : ""
                            }
                          >
                            {highlight.published
                              ? c.publishedLabel
                              : c.draftLabel}
                          </i>
                        </span>
                      </button>

                      <button
                        type="button"
                        className="admin-highlights-delete"
                        onClick={() =>
                          remove(
                            highlight,
                          )
                        }
                      >
                        ×
                      </button>
                    </article>
                  );
                },
              )
            ) : (
              <div className="admin-highlights-empty">
                {c.empty}
              </div>
            )}
          </aside>
        </div>
      </div>
    </section>
  );
}
