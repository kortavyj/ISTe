import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { useAuth } from "../auth/AuthContext.jsx";
import { supabase } from "../lib/supabase.js";

import "./AdminNews.css";

const STATUS_NAMES = {
  draft: "Черновик",
  published: "Опубликовано",
  archived: "В архиве",
};

const IMAGE_BUCKET = "news-images";
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

const ALLOWED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

const EMPTY_FORM = {
  title: "",
  slug: "",
  excerpt: "",
  content: "",
  coverUrl: "",
  category: "Команда",
  status: "draft",
  isFeatured: false,
};

const transliteration = {
  а: "a",
  б: "b",
  в: "v",
  г: "g",
  д: "d",
  е: "e",
  ё: "e",
  ж: "zh",
  з: "z",
  и: "i",
  й: "y",
  к: "k",
  л: "l",
  м: "m",
  н: "n",
  о: "o",
  п: "p",
  р: "r",
  с: "s",
  т: "t",
  у: "u",
  ф: "f",
  х: "h",
  ц: "ts",
  ч: "ch",
  ш: "sh",
  щ: "sch",
  ъ: "",
  ы: "y",
  ь: "",
  э: "e",
  ю: "yu",
  я: "ya",
};

function slugify(value) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .split("")
    .map(
      (symbol) =>
        transliteration[symbol] ??
        symbol,
    )
    .join("")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 180);
}

/**
 * Принимаем только обычные HTTP(S)-адреса.
 * javascript:, data:, file:, blob: и любые неизвестные схемы
 * из пользовательского поля прямой ссылки не проходят.
 *
 * blob: используется отдельно только для локального предпросмотра
 * File -> URL.createObjectURL() и никогда не берётся из текстового поля.
 */
function normalizeRemoteImageUrl(value) {
  const source = String(value ?? "").trim();

  if (!source) {
    return "";
  }

  try {
    const parsed = new URL(source);

    if (
      parsed.protocol !== "https:" &&
      parsed.protocol !== "http:"
    ) {
      return "";
    }

    if (
      parsed.username ||
      parsed.password
    ) {
      return "";
    }

    return parsed.href;
  } catch {
    return "";
  }
}

function formatDate(value) {
  if (!value) {
    return "Не указано";
  }

  const date = new Date(value);

  if (
    Number.isNaN(date.getTime())
  ) {
    return "Не указано";
  }

  return new Intl.DateTimeFormat(
    "ru-RU",
    {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    },
  ).format(date);
}

function createApiError(
  result,
  fallback,
) {
  const error = new Error(
    result?.message || fallback,
  );

  error.code =
    result?.error ||
    "REQUEST_FAILED";

  return error;
}

async function apiRequest(body) {
  const response = await fetch(
    "/api/auth/session",
    {
      method: "POST",
      credentials: "include",
      cache: "no-store",
      headers: {
        Accept: "application/json",
        "Content-Type":
          "application/json",
      },
      body: JSON.stringify(body),
    },
  );

  let result;

  try {
    result = await response.json();
  } catch {
    throw new Error(
      "Сервер вернул некорректный ответ.",
    );
  }

  if (
    !response.ok ||
    result?.ok !== true
  ) {
    throw createApiError(
      result,
      "Не удалось выполнить запрос.",
    );
  }

  return result;
}

function getErrorMessage(error) {
  const code = String(
    error?.code || "",
  );

  const known = {
    AUTH_REQUIRED:
      "Нужно повторно войти в аккаунт.",
    ACCOUNT_BLOCKED:
      "Аккаунт заблокирован.",
    STAFF_REQUIRED:
      "У аккаунта нет доступа к управлению новостями.",
    ADMIN_REQUIRED:
      "Удалять новости может только администратор или владелец.",
    NEWS_SLUG_TAKEN:
      "Новость с таким адресом уже существует. Измени поле URL адрес.",
    NEWS_EDIT_FORBIDDEN:
      "Редактор может изменять только собственные черновики.",
    NEWS_PERMISSION_DENIED:
      "У текущего аккаунта недостаточно прав для этого действия.",
    NEWS_UPLOAD_URL_FAILED:
      "Не удалось подготовить загрузку изображения.",
    INVALID_COVER_URL:
      "Для обложки разрешена только корректная ссылка http:// или https://.",
  };

  return (
    known[code] ||
    error?.message ||
    "Не удалось выполнить действие."
  );
}

export default function AdminNews() {
  const { user, role } = useAuth();

  const canManageAll =
    role === "admin" ||
    role === "owner";

  const [posts, setPosts] =
    useState([]);

  const [form, setForm] =
    useState(EMPTY_FORM);

  const [
    editingId,
    setEditingId,
  ] = useState(null);

  const [
    slugTouched,
    setSlugTouched,
  ] = useState(false);

  const [
    editorOpen,
    setEditorOpen,
  ] = useState(false);

  const [search, setSearch] =
    useState("");

  const [
    statusFilter,
    setStatusFilter,
  ] = useState("all");

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [
    deletingId,
    setDeletingId,
  ] = useState(null);

  const [
    errorMessage,
    setErrorMessage,
  ] = useState("");

  const [
    successMessage,
    setSuccessMessage,
  ] = useState("");

  const [
    coverFile,
    setCoverFile,
  ] = useState(null);

  /*
   * SECURITY:
   * coverPreview содержит ТОЛЬКО blob URL,
   * созданный браузером из выбранного локального File.
   *
   * Ввод из поля "прямая ссылка" никогда напрямую
   * не попадает в <img src={coverPreview}>.
   */
  const [
    coverPreview,
    setCoverPreview,
  ] = useState("");

  const [
    originalCoverUrl,
    setOriginalCoverUrl,
  ] = useState("");

  const coverPreviewObjectUrlRef =
    useRef("");

  const releaseCoverPreview =
    useCallback(() => {
      if (
        coverPreviewObjectUrlRef.current
      ) {
        URL.revokeObjectURL(
          coverPreviewObjectUrlRef.current,
        );

        coverPreviewObjectUrlRef.current =
          "";
      }
    }, []);

  const resetCoverState =
    useCallback(
      (url = "") => {
        releaseCoverPreview();
        setCoverFile(null);

        // Не рендерим удалённый URL в live preview.
        // Это разрывает DOM-XSS taint path,
        // найденный CodeQL.
        setCoverPreview("");

        setOriginalCoverUrl(
          normalizeRemoteImageUrl(url),
        );
      },
      [releaseCoverPreview],
    );

  useEffect(
    () => () => {
      releaseCoverPreview();
    },
    [releaseCoverPreview],
  );

  const loadPosts = useCallback(
    async () => {
      setLoading(true);
      setErrorMessage("");

      try {
        const result =
          await apiRequest({
            action: "news-list",
          });

        setPosts(
          Array.isArray(result.posts)
            ? result.posts
            : [],
        );
      } catch (error) {
        setPosts([]);
        setErrorMessage(
          getErrorMessage(error),
        );
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    void loadPosts();
  }, [loadPosts]);

  const filteredPosts = useMemo(
    () => {
      const query = search
        .trim()
        .toLowerCase();

      return posts.filter(
        (post) => {
          const matchesStatus =
            statusFilter === "all" ||
            post.status ===
              statusFilter;

          const matchesSearch =
            !query ||
            [
              post.title,
              post.excerpt,
              post.category,
              post.slug,
            ]
              .filter(Boolean)
              .some((value) =>
                String(value)
                  .toLowerCase()
                  .includes(query),
              );

          return (
            matchesStatus &&
            matchesSearch
          );
        },
      );
    },
    [
      posts,
      search,
      statusFilter,
    ],
  );

  const summary = useMemo(
    () => ({
      all: posts.length,
      draft: posts.filter(
        (post) =>
          post.status === "draft",
      ).length,
      published: posts.filter(
        (post) =>
          post.status ===
          "published",
      ).length,
      archived: posts.filter(
        (post) =>
          post.status ===
          "archived",
      ).length,
    }),
    [posts],
  );

  function canEditPost(post) {
    if (canManageAll) {
      return true;
    }

    return (
      role === "editor" &&
      post.author_id === user?.id &&
      post.status === "draft"
    );
  }

  function updateForm(
    field,
    value,
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function handleTitleChange(event) {
    const title =
      event.target.value;

    setForm((current) => ({
      ...current,
      title,
      slug: slugTouched
        ? current.slug
        : slugify(title),
    }));
  }

  function handleSlugChange(event) {
    setSlugTouched(true);

    updateForm(
      "slug",
      slugify(event.target.value),
    );
  }

  function handleCoverUrlChange(
    event,
  ) {
    const value =
      event.target.value;

    releaseCoverPreview();
    setCoverFile(null);

    /*
     * ВАЖНО:
     * Не делаем setCoverPreview(value).
     * Пользовательский текст не должен становиться src
     * DOM-элемента до проверки.
     */
    setCoverPreview("");

    updateForm("coverUrl", value);
  }

  function handleCoverFileChange(
    event,
  ) {
    const file =
      event.target.files?.[0] ??
      null;

    event.target.value = "";

    if (!file) {
      return;
    }

    setErrorMessage("");
    setSuccessMessage("");

    if (
      !ALLOWED_IMAGE_TYPES.has(
        file.type,
      )
    ) {
      setErrorMessage(
        "Выбери изображение JPEG, PNG, WEBP или GIF.",
      );
      return;
    }

    if (
      file.size >
      MAX_IMAGE_SIZE
    ) {
      setErrorMessage(
        "Размер изображения не должен превышать 5 МБ.",
      );
      return;
    }

    releaseCoverPreview();

    const objectUrl =
      URL.createObjectURL(file);

    coverPreviewObjectUrlRef.current =
      objectUrl;

    setCoverFile(file);
    setCoverPreview(objectUrl);
  }

  function removeCover() {
    releaseCoverPreview();
    setCoverFile(null);
    setCoverPreview("");
    updateForm("coverUrl", "");
  }

  async function removeTemporaryUpload(
    path,
  ) {
    if (!path) {
      return;
    }

    try {
      await apiRequest({
        action:
          "news-remove-upload",
        path,
      });
    } catch {
      // Сервер запишет ошибку в журнал.
    }
  }

  async function uploadCoverImage(
    file,
    validatedRemoteUrl,
  ) {
    if (!file) {
      return {
        url:
          validatedRemoteUrl ||
          null,
        path: null,
      };
    }

    const signed =
      await apiRequest({
        action:
          "news-create-upload",
        fileType: file.type,
        fileSize: file.size,
      });

    const {
      error: uploadError,
    } = await supabase.storage
      .from(IMAGE_BUCKET)
      .uploadToSignedUrl(
        signed.path,
        signed.token,
        file,
        {
          cacheControl: "3600",
          contentType: file.type,
        },
      );

    if (uploadError) {
      await removeTemporaryUpload(
        signed.path,
      );

      throw uploadError;
    }

    return {
      url: signed.publicUrl,
      path: signed.path,
    };
  }

  function openCreate() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    resetCoverState();
    setSlugTouched(false);
    setErrorMessage("");
    setSuccessMessage("");
    setEditorOpen(true);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  function openEdit(post) {
    if (!canEditPost(post)) {
      setErrorMessage(
        "У тебя нет прав на редактирование этой новости.",
      );
      return;
    }

    const savedCoverUrl =
      normalizeRemoteImageUrl(
        post.cover_url,
      );

    setEditingId(post.id);

    setForm({
      title: post.title ?? "",
      slug: post.slug ?? "",
      excerpt:
        post.excerpt ?? "",
      content:
        post.content ?? "",
      coverUrl: savedCoverUrl,
      category:
        post.category ??
        "Команда",
      status:
        post.status ?? "draft",
      isFeatured:
        Boolean(
          post.is_featured,
        ),
    });

    resetCoverState(savedCoverUrl);

    setSlugTouched(true);
    setErrorMessage("");
    setSuccessMessage("");
    setEditorOpen(true);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  function closeEditor() {
    if (saving) {
      return;
    }

    setEditorOpen(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
    resetCoverState();
    setSlugTouched(false);
  }

  async function handleSave(event) {
    event.preventDefault();

    setSaving(true);
    setErrorMessage("");
    setSuccessMessage("");

    const title =
      form.title.trim();

    const slug = slugify(
      form.slug || form.title,
    );

    const content =
      form.content.trim();

    const category =
      form.category.trim();

    const excerpt =
      form.excerpt.trim();

    const rawCoverUrl =
      form.coverUrl.trim();

    const validatedCoverUrl =
      rawCoverUrl
        ? normalizeRemoteImageUrl(
            rawCoverUrl,
          )
        : "";

    if (
      title.length < 5 ||
      title.length > 160
    ) {
      setErrorMessage(
        "Название должно содержать от 5 до 160 символов.",
      );
      setSaving(false);
      return;
    }

    if (slug.length < 3) {
      setErrorMessage(
        "URL адрес новости должен содержать минимум 3 символа.",
      );
      setSaving(false);
      return;
    }

    if (content.length < 20) {
      setErrorMessage(
        "Полный текст должен содержать минимум 20 символов.",
      );
      setSaving(false);
      return;
    }

    if (
      category.length < 2 ||
      category.length > 60
    ) {
      setErrorMessage(
        "Категория должна содержать от 2 до 60 символов.",
      );
      setSaving(false);
      return;
    }

    if (excerpt.length > 320) {
      setErrorMessage(
        "Краткое описание не должно превышать 320 символов.",
      );
      setSaving(false);
      return;
    }

    if (
      !coverFile &&
      rawCoverUrl &&
      !validatedCoverUrl
    ) {
      setErrorMessage(
        "Для обложки укажи корректную ссылку, начинающуюся с http:// или https://.",
      );
      setSaving(false);
      return;
    }

    let uploadedPath = null;

    try {
      const uploadedCover =
        await uploadCoverImage(
          coverFile,
          validatedCoverUrl,
        );

      uploadedPath =
        uploadedCover.path;

      await apiRequest({
        action: "news-save",
        postId: editingId,
        title,
        slug,
        excerpt,
        content,
        category,
        coverUrl:
          uploadedCover.url || "",
        originalCoverUrl,
        status: canManageAll
          ? form.status
          : "draft",
        isFeatured: canManageAll
          ? form.isFeatured
          : false,
      });

      setSuccessMessage(
        editingId
          ? "Новость успешно обновлена."
          : "Новость успешно создана.",
      );

      setEditorOpen(false);
      setEditingId(null);
      setForm(EMPTY_FORM);
      resetCoverState();
      setSlugTouched(false);

      await loadPosts();
    } catch (error) {
      if (uploadedPath) {
        await removeTemporaryUpload(
          uploadedPath,
        );
      }

      setErrorMessage(
        getErrorMessage(error),
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(
    post,
  ) {
    if (!canManageAll) {
      return;
    }

    const confirmed =
      window.confirm(
        `Удалить новость «${post.title}» без возможности восстановления?`,
      );

    if (!confirmed) {
      return;
    }

    setDeletingId(post.id);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      await apiRequest({
        action: "news-delete",
        postId: post.id,
      });

      setSuccessMessage(
        "Новость удалена.",
      );

      await loadPosts();
    } catch (error) {
      setErrorMessage(
        getErrorMessage(error),
      );
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <section className="admin-news-page">
      <div className="admin-news-shell">
        <header className="admin-news-header">
          <div>
            <p className="page-eyebrow">
              ISTE CONTENT CENTER
            </p>

            <h1>
              Управление новостями
            </h1>

            <p>
              Создание, редактирование и
              публикация материалов
              команды.
            </p>
          </div>

          <button
            className="admin-news-primary"
            type="button"
            onClick={openCreate}
          >
            Создать новость
          </button>
        </header>

        <div className="admin-news-summary">
          <button
            type="button"
            className={
              statusFilter === "all"
                ? "is-active"
                : ""
            }
            onClick={() =>
              setStatusFilter("all")
            }
          >
            <strong>
              {summary.all}
            </strong>
            <span>
              Все материалы
            </span>
          </button>

          <button
            type="button"
            className={
              statusFilter === "draft"
                ? "is-active"
                : ""
            }
            onClick={() =>
              setStatusFilter("draft")
            }
          >
            <strong>
              {summary.draft}
            </strong>
            <span>Черновики</span>
          </button>

          <button
            type="button"
            className={
              statusFilter ===
              "published"
                ? "is-active"
                : ""
            }
            onClick={() =>
              setStatusFilter(
                "published",
              )
            }
          >
            <strong>
              {summary.published}
            </strong>
            <span>
              Опубликовано
            </span>
          </button>

          <button
            type="button"
            className={
              statusFilter ===
              "archived"
                ? "is-active"
                : ""
            }
            onClick={() =>
              setStatusFilter(
                "archived",
              )
            }
          >
            <strong>
              {summary.archived}
            </strong>
            <span>В архиве</span>
          </button>
        </div>

        {errorMessage ? (
          <div className="admin-news-message admin-news-message-error">
            {errorMessage}
          </div>
        ) : null}

        {successMessage ? (
          <div className="admin-news-message admin-news-message-success">
            {successMessage}
          </div>
        ) : null}

        {editorOpen ? (
          <div className="admin-news-editor">
            <div className="admin-news-editor-head">
              <div>
                <p className="page-eyebrow">
                  {editingId
                    ? "EDIT MATERIAL"
                    : "NEW MATERIAL"}
                </p>

                <h2>
                  {editingId
                    ? "Редактирование новости"
                    : "Новая новость"}
                </h2>
              </div>

              <button
                className="admin-news-close"
                type="button"
                onClick={closeEditor}
                aria-label="Закрыть редактор"
              >
                ×
              </button>
            </div>

            <form
              className="admin-news-form"
              onSubmit={handleSave}
            >
              <label className="admin-news-field admin-news-field-wide">
                <span>Название</span>

                <input
                  type="text"
                  value={form.title}
                  onChange={
                    handleTitleChange
                  }
                  minLength={5}
                  maxLength={160}
                  required
                  disabled={saving}
                />
              </label>

              <label className="admin-news-field">
                <span>URL адрес</span>

                <input
                  type="text"
                  value={form.slug}
                  onChange={
                    handleSlugChange
                  }
                  minLength={3}
                  maxLength={180}
                  required
                  disabled={saving}
                />

                <small>
                  Только латинские
                  буквы, цифры и дефисы.
                </small>
              </label>

              <label className="admin-news-field">
                <span>Категория</span>

                <input
                  type="text"
                  value={form.category}
                  onChange={(event) =>
                    updateForm(
                      "category",
                      event.target.value,
                    )
                  }
                  minLength={2}
                  maxLength={60}
                  required
                  disabled={saving}
                />
              </label>

              <label className="admin-news-field admin-news-field-wide">
                <span>
                  Краткое описание
                </span>

                <textarea
                  value={form.excerpt}
                  onChange={(event) =>
                    updateForm(
                      "excerpt",
                      event.target.value,
                    )
                  }
                  maxLength={320}
                  rows={3}
                  disabled={saving}
                />

                <small>
                  {form.excerpt.length}
                  {" "}из 320 символов
                </small>
              </label>

              <label className="admin-news-field admin-news-field-wide">
                <span>
                  Полный текст
                </span>

                <textarea
                  value={form.content}
                  onChange={(event) =>
                    updateForm(
                      "content",
                      event.target.value,
                    )
                  }
                  minLength={20}
                  rows={12}
                  required
                  disabled={saving}
                />
              </label>

              <div className="admin-news-field admin-news-field-wide">
                <span>
                  Обложка новости
                </span>

                <div className="admin-news-cover-editor">
                  <div className="admin-news-cover-preview">
                    {coverPreview ? (
                      <img
                        src={coverPreview}
                        alt="Предпросмотр выбранной локальной обложки"
                      />
                    ) : (
                      <span>ISTe</span>
                    )}
                  </div>

                  <div className="admin-news-cover-controls">
                    <div className="admin-news-cover-actions">
                      <label className="admin-news-upload-button">
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp,image/gif"
                          onChange={
                            handleCoverFileChange
                          }
                          disabled={saving}
                        />

                        {coverFile
                          ? "Выбрать другое"
                          : "Выбрать изображение"}
                      </label>

                      <button
                        className="admin-news-secondary"
                        type="button"
                        onClick={removeCover}
                        disabled={
                          saving ||
                          (
                            !coverPreview &&
                            !form.coverUrl.trim()
                          )
                        }
                      >
                        Удалить обложку
                      </button>
                    </div>

                    <p>
                      JPEG, PNG, WEBP или
                      GIF. Максимальный
                      размер 5 МБ.
                    </p>

                    {coverFile ? (
                      <div className="admin-news-selected-file">
                        <strong>
                          {coverFile.name}
                        </strong>

                        <span>
                          {(
                            coverFile.size /
                            1024 /
                            1024
                          ).toFixed(2)}
                          {" "}МБ
                        </span>
                      </div>
                    ) : null}

                    <label className="admin-news-field">
                      <span>
                        Или вставь прямую
                        ссылку
                      </span>

                      <input
                        type="url"
                        value={
                          form.coverUrl
                        }
                        onChange={
                          handleCoverUrlChange
                        }
                        maxLength={1000}
                        placeholder="https://..."
                        disabled={saving}
                      />

                      <small>
                        В целях безопасности
                        удалённая ссылка не
                        отображается в live
                        preview до сохранения.
                        Разрешены только
                        http:// и https://.
                      </small>
                    </label>
                  </div>
                </div>
              </div>

              {canManageAll ? (
                <>
                  <label className="admin-news-field">
                    <span>Статус</span>

                    <select
                      value={form.status}
                      onChange={(event) =>
                        updateForm(
                          "status",
                          event.target.value,
                        )
                      }
                      disabled={saving}
                    >
                      <option value="draft">
                        Черновик
                      </option>

                      <option value="published">
                        Опубликовано
                      </option>

                      <option value="archived">
                        В архиве
                      </option>
                    </select>
                  </label>

                  <label className="admin-news-checkbox">
                    <input
                      type="checkbox"
                      checked={
                        form.isFeatured
                      }
                      onChange={(event) =>
                        updateForm(
                          "isFeatured",
                          event.target.checked,
                        )
                      }
                      disabled={saving}
                    />

                    <span>
                      <strong>
                        Закрепить новость
                      </strong>

                      <small>
                        Материал будет
                        выделен на
                        странице новостей.
                      </small>
                    </span>
                  </label>
                </>
              ) : (
                <div className="admin-news-editor-note">
                  Редактор может сохранить
                  материал только как
                  черновик. Публикацию
                  выполняет администратор
                  или владелец.
                </div>
              )}

              <div className="admin-news-form-actions">
                <button
                  className="admin-news-secondary"
                  type="button"
                  onClick={closeEditor}
                  disabled={saving}
                >
                  Отмена
                </button>

                <button
                  className="admin-news-primary"
                  type="submit"
                  disabled={saving}
                >
                  {saving
                    ? "Сохраняем..."
                    : editingId
                      ? "Сохранить изменения"
                      : "Создать новость"}
                </button>
              </div>
            </form>
          </div>
        ) : null}

        <div className="admin-news-toolbar">
          <label>
            <span className="sr-only">
              Поиск по новостям
            </span>

            <input
              type="search"
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value,
                )
              }
              placeholder="Поиск по названию, категории или адресу"
            />
          </label>

          <button
            className="admin-news-secondary"
            type="button"
            onClick={() =>
              void loadPosts()
            }
            disabled={loading}
          >
            {loading
              ? "Обновляем..."
              : "Обновить"}
          </button>
        </div>

        {loading ? (
          <div className="admin-news-loading">
            <span />
            Загружаем материалы...
          </div>
        ) : null}

        {!loading &&
        filteredPosts.length === 0 ? (
          <div className="admin-news-empty">
            <h2>
              Материалов не найдено
            </h2>

            <p>
              Создай первую новость или
              измени параметры поиска.
            </p>
          </div>
        ) : null}

        {!loading &&
        filteredPosts.length > 0 ? (
          <div className="admin-news-list">
            {filteredPosts.map(
              (post) => {
                const editable =
                  canEditPost(post);

                const safeCoverUrl =
                  normalizeRemoteImageUrl(
                    post.cover_url,
                  );

                return (
                  <article
                    className="admin-news-card"
                    key={post.id}
                  >
                    <div className="admin-news-card-cover">
                      {safeCoverUrl ? (
                        <img
                          src={safeCoverUrl}
                          alt=""
                          loading="lazy"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <span>ISTe</span>
                      )}
                    </div>

                    <div className="admin-news-card-body">
                      <div className="admin-news-card-meta">
                        <span
                          className={`admin-news-status admin-news-status-${post.status}`}
                        >
                          {STATUS_NAMES[
                            post.status
                          ] ??
                            post.status}
                        </span>

                        <span>
                          {post.category}
                        </span>

                        {post.is_featured ? (
                          <b>
                            Закреплено
                          </b>
                        ) : null}
                      </div>

                      <h2>
                        {post.title}
                      </h2>

                      <p>
                        {post.excerpt ||
                          "Краткое описание не указано."}
                      </p>

                      <div className="admin-news-card-dates">
                        <span>
                          Изменено:{" "}
                          {formatDate(
                            post.updated_at,
                          )}
                        </span>

                        {post.published_at ? (
                          <span>
                            Опубликовано:{" "}
                            {formatDate(
                              post.published_at,
                            )}
                          </span>
                        ) : null}
                      </div>
                    </div>

                    <div className="admin-news-card-actions">
                      <button
                        className="admin-news-secondary"
                        type="button"
                        onClick={() =>
                          openEdit(post)
                        }
                        disabled={
                          !editable
                        }
                        title={
                          editable
                            ? "Редактировать новость"
                            : "Редактор может изменять только собственные черновики"
                        }
                      >
                        Редактировать
                      </button>

                      {canManageAll ? (
                        <button
                          className="admin-news-danger"
                          type="button"
                          onClick={() =>
                            void handleDelete(
                              post,
                            )
                          }
                          disabled={
                            deletingId ===
                            post.id
                          }
                        >
                          {deletingId ===
                          post.id
                            ? "Удаляем..."
                            : "Удалить"}
                        </button>
                      ) : null}
                    </div>
                  </article>
                );
              },
            )}
          </div>
        ) : null}
      </div>
    </section>
  );
}
