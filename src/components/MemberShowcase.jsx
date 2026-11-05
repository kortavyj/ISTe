import { useCallback, useEffect, useState } from "react";
import { supabase } from "../lib/supabase.js";
import { useLanguage } from "../i18n/LanguageContext.jsx";

import "./MemberShowcase.css";

const COPY = {
  uk: {
    heading: "Вітрина учасника", subtitle: "Твій простір для історій, робіт та ідей",
    empty: "Вітрина ще порожня", emptyDescription: "Додай фото, розкажи про себе або поділися своєю роботою.",
    edit: "Оформити вітрину", change: "Редагувати", cancel: "Скасувати", save: "Опублікувати", saving: "Зберігаємо…",
    title: "Заголовок (необов’язково)", titlePlaceholder: "Мій проєкт, улюблена гра, досягнення…",
    body: "Текст вітрини", bodyPlaceholder: "Поділись своєю історією, ідеями або роботами…",
    image: "Зображення", imageAdd: "Додати зображення", imageReplace: "Замінити фото", imageRemove: "Прибрати фото",
    uploading: "Завантажуємо зображення…", imageInvalid: "Оберіть JPG, PNG або WebP до 8 МБ.",
    imageLarge: "Зображення завелике після обробки. Спробуй інше.",
    imageSaveHint: "Щоб опублікувати фото, натисни «Опублікувати».",
    delete: "Видалити вітрину", deleteConfirm: "Видалити вітрину разом з усіма коментарями?",
    comments: "Коментарі", noComments: "Коментарів поки немає. Будь першим.",
    commentPlaceholder: "Напиши коментар…", commentSend: "Надіслати", sending: "Надсилаємо…",
    commentDelete: "Видалити", commentDeleteConfirm: "Видалити цей коментар?",
    commentHint: "Коментарі доступні учасникам ISTe. До 600 символів.",
    loadError: "Не вдалося завантажити вітрину.", requestError: "Не вдалося виконати дію.",
    saved: "Вітрину оновлено.", commentSaved: "Коментар опубліковано.", deleted: "Вітрину видалено.",
    emptySubmission: "Додай текст або зображення.", imageAlt: "Зображення вітрини учасника",
    commentsDisabled: "Коментарі з’являться після публікації вітрини.",
  },
  en: {
    heading: "Member showcase", subtitle: "Your space for stories, projects and ideas",
    empty: "No showcase yet", emptyDescription: "Add a picture, share your story or feature your work.",
    edit: "Create showcase", change: "Edit showcase", cancel: "Cancel", save: "Publish", saving: "Saving…",
    title: "Title (optional)", titlePlaceholder: "My project, favorite game, achievement…",
    body: "Showcase text", bodyPlaceholder: "Share a story, an idea or your work…",
    image: "Image", imageAdd: "Add image", imageReplace: "Replace image", imageRemove: "Remove image",
    uploading: "Uploading image…", imageInvalid: "Choose JPG, PNG or WebP up to 8 MB.",
    imageLarge: "The image is still too large. Choose another one.",
    imageSaveHint: "Press Publish to save the uploaded image.",
    delete: "Delete showcase", deleteConfirm: "Delete your showcase and all its comments?",
    comments: "Comments", noComments: "No comments yet. Be the first.",
    commentPlaceholder: "Write a comment…", commentSend: "Post comment", sending: "Posting…",
    commentDelete: "Delete", commentDeleteConfirm: "Delete this comment?",
    commentHint: "Only ISTe members can comment. Up to 600 characters.",
    loadError: "Could not load showcase.", requestError: "Could not complete the action.",
    saved: "Showcase updated.", commentSaved: "Comment published.", deleted: "Showcase deleted.",
    emptySubmission: "Add text or an image.", imageAlt: "Member showcase image",
    commentsDisabled: "Comments will be available once the showcase is published.",
  },
};

async function showcaseRequest(action, body = {}) {
  const response = await fetch("/api/member-showcase", {
    method: "POST",
    credentials: "include",
    cache: "no-store",
    headers: { Accept: "application/json", "Content-Type": "application/json" },
    body: JSON.stringify({ action, ...body }),
  });
  const result = await response.json().catch(() => null);
  if (!response.ok || result?.ok !== true) {
    throw Object.assign(new Error(result?.message || "REQUEST_FAILED"), {
      code: result?.error || "REQUEST_FAILED",
    });
  }
  return result;
}

async function normalizeShowcaseImage(file) {
  const bitmap = await createImageBitmap(file);
  try {
    const maxSize = 1280;
    const scale = Math.min(1, maxSize / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    const context = canvas.getContext("2d");
    if (!context) throw new Error("IMAGE_PROCESSING_FAILED");
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const image = await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.78));
    if (!image || image.size > 1_500_000) throw new Error("IMAGE_TOO_LARGE");
    return image;
  } finally {
    bitmap.close();
  }
}

function initials(name) {
  return String(name || "ISTe").trim().slice(0, 2).toUpperCase();
}

function readableDate(value, language) {
  const date = new Date(value);
  if (!value || Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat(language === "en" ? "en-GB" : "uk-UA", {
    day: "numeric", month: "short", year: "numeric",
  }).format(date);
}

export default function MemberShowcase({ targetAccountNumber, ownerView = false }) {
  const { language } = useLanguage();
  const copy = COPY[language] || COPY.uk;
  const [showcase, setShowcase] = useState(null);
  const [comments, setComments] = useState([]);
  const [isOwner, setIsOwner] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [imagePath, setImagePath] = useState(null);
  const [imageUrl, setImageUrl] = useState(null);
  const [commentDraft, setCommentDraft] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const loadShowcase = useCallback(async () => {
    const result = await showcaseRequest("showcase-get", targetAccountNumber
      ? { accountNumber: targetAccountNumber } : {});
    setShowcase(result.showcase);
    setComments(result.comments || []);
    setIsOwner(result.isOwner === true);
    return result;
  }, [targetAccountNumber]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    setMessage("");
    setShowcase(null);
    setComments([]);
    showcaseRequest("showcase-get", targetAccountNumber
      ? { accountNumber: targetAccountNumber } : {})
      .then((result) => {
        if (!active) return;
        setShowcase(result.showcase);
        setComments(result.comments || []);
        setIsOwner(result.isOwner === true);
        setTitle(result.showcase?.title || "");
        setBody(result.showcase?.body || "");
        setImagePath(result.showcase?.imagePath || null);
        setImageUrl(result.showcase?.imageUrl || null);
        setEditing(false);
      })
      .catch(() => { if (active) setError(copy.loadError); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [targetAccountNumber, copy.loadError]);

  function startEditing() {
    setTitle(showcase?.title || "");
    setBody(showcase?.body || "");
    setImagePath(showcase?.imagePath || null);
    setImageUrl(showcase?.imageUrl || null);
    setError("");
    setMessage("");
    setEditing(true);
  }

  async function uploadImage(event) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size > 8 * 1024 * 1024) {
      setError(copy.imageInvalid);
      return;
    }
    setUploading(true);
    setError("");
    try {
      const image = await normalizeShowcaseImage(file);
      const upload = await showcaseRequest("showcase-image-upload", {
        fileSize: image.size, fileType: "image/jpeg",
      });
      const { error: uploadError } = await supabase.storage.from("member-showcase")
        .uploadToSignedUrl(upload.path, upload.token, image, { contentType: "image/jpeg" });
      if (uploadError) throw uploadError;
      const publicUrl = supabase.storage.from("member-showcase").getPublicUrl(upload.path).data?.publicUrl;
      setImagePath(upload.path);
      setImageUrl(publicUrl || null);
      setMessage(copy.imageSaveHint);
    } catch (cause) {
      setError(cause?.message === "IMAGE_TOO_LARGE" ? copy.imageLarge : copy.requestError);
    } finally {
      setUploading(false);
    }
  }

  async function save(event) {
    event.preventDefault();
    if (!body.trim() && !imagePath) { setError(copy.emptySubmission); return; }
    setBusy(true);
    setError("");
    try {
      await showcaseRequest("showcase-save", { title, body, imagePath });
      await loadShowcase();
      setEditing(false);
      setMessage(copy.saved);
    } catch (cause) {
      setError(cause.message || copy.requestError);
    } finally { setBusy(false); }
  }

  async function removeShowcase() {
    if (!window.confirm(copy.deleteConfirm)) return;
    setBusy(true);
    setError("");
    try {
      await showcaseRequest("showcase-delete");
      await loadShowcase();
      setEditing(false);
      setTitle("");
      setBody("");
      setImagePath(null);
      setImageUrl(null);
      setMessage(copy.deleted);
    } catch (cause) {
      setError(cause.message || copy.requestError);
    } finally { setBusy(false); }
  }

  async function addComment(event) {
    event.preventDefault();
    if (commentDraft.trim().length < 2 || commentDraft.trim().length > 600) return;
    setBusy(true);
    setError("");
    try {
      await showcaseRequest("showcase-comment-add", {
        ...(targetAccountNumber ? { accountNumber: targetAccountNumber } : {}),
        text: commentDraft,
      });
      setCommentDraft("");
      await loadShowcase();
      setMessage(copy.commentSaved);
    } catch (cause) {
      setError(cause.message || copy.requestError);
    } finally { setBusy(false); }
  }

  async function removeComment(commentId) {
    if (!window.confirm(copy.commentDeleteConfirm)) return;
    setBusy(true);
    setError("");
    try {
      await showcaseRequest("showcase-comment-delete", { commentId });
      await loadShowcase();
    } catch (cause) {
      setError(cause.message || copy.requestError);
    } finally { setBusy(false); }
  }

  return (
    <section className="member-showcase" aria-labelledby="member-showcase-heading">
      <header className="member-showcase-header">
        <div>
          <span className="member-showcase-kicker">ISTe COMMUNITY</span>
          <h2 id="member-showcase-heading">{copy.heading}</h2>
          {ownerView && <p>{copy.subtitle}</p>}
        </div>
        {isOwner && !editing && !loading && (
          <button type="button" className="member-showcase-edit" onClick={startEditing}>
            {showcase ? copy.change : copy.edit}
          </button>
        )}
      </header>

      {message && <p className="member-showcase-message" role="status">{message}</p>}
      {error && <p className="member-showcase-error" role="alert">{error}</p>}
      {loading ? <p className="member-showcase-loading" role="status">…</p> : (
        <>
          {isOwner && editing ? (
            <form className="member-showcase-form" onSubmit={save}>
              <label>
                <span>{copy.title}</span>
                <input type="text" value={title} onChange={(event) => setTitle(event.target.value)}
                  maxLength={100} placeholder={copy.titlePlaceholder} disabled={busy || uploading}/>
              </label>
              <label>
                <span>{copy.body}</span>
                <textarea value={body} onChange={(event) => setBody(event.target.value)}
                  maxLength={3000} rows={6} placeholder={copy.bodyPlaceholder} disabled={busy || uploading}/>
                <small>{body.length}/3000</small>
              </label>
              <div className="member-showcase-editor-image">
                <span>{copy.image}</span>
                {imageUrl && <img src={imageUrl} alt={copy.imageAlt} />}
                <div className="member-showcase-image-controls">
                  <label className="member-showcase-upload">
                    {uploading ? copy.uploading : imagePath ? copy.imageReplace : copy.imageAdd}
                    <input type="file" accept="image/jpeg,image/png,image/webp"
                      onChange={uploadImage} disabled={busy || uploading}/>
                  </label>
                  {imagePath && <button type="button" onClick={() => {
                    setImagePath(null); setImageUrl(null);
                  }} disabled={busy || uploading}>{copy.imageRemove}</button>}
                </div>
              </div>
              <div className="member-showcase-form-actions">
                <button className="member-showcase-submit" type="submit" disabled={busy || uploading}>
                  {busy ? copy.saving : copy.save}
                </button>
                <button type="button" onClick={() => setEditing(false)} disabled={busy || uploading}>{copy.cancel}</button>
                {showcase && <button type="button" className="member-showcase-danger"
                  onClick={removeShowcase} disabled={busy || uploading}>{copy.delete}</button>}
              </div>
            </form>
          ) : showcase ? (
            <article className="member-showcase-content">
              {showcase.imageUrl && <img className="member-showcase-cover"
                src={showcase.imageUrl} alt={showcase.title || copy.imageAlt} loading="lazy"/>}
              <div className="member-showcase-story">
                {showcase.title && <h3>{showcase.title}</h3>}
                {showcase.body && <p>{showcase.body}</p>}
                <time dateTime={showcase.updatedAt}>{readableDate(showcase.updatedAt, language)}</time>
              </div>
            </article>
          ) : (
            <div className="member-showcase-empty">
              <span aria-hidden="true">✦</span>
              <h3>{copy.empty}</h3>
              <p>{isOwner ? copy.emptyDescription : ""}</p>
              {isOwner && <button type="button" onClick={startEditing}>{copy.edit}</button>}
            </div>
          )}
          <section className="member-comments" aria-labelledby="member-comments-heading">
            <header>
              <h3 id="member-comments-heading">{copy.comments}</h3>
              <span>{comments.length}</span>
            </header>
            {showcase ? (
              <>
                {comments.length ? (
                  <div className="member-comments-list">
                    {comments.map((comment) => (
                      <article className="member-comment" key={comment.id}>
                        <div className="member-comment-avatar">
                          {comment.authorAvatar ? <img src={comment.authorAvatar} alt="" loading="lazy"/> :
                            <span>{initials(comment.authorName)}</span>}
                        </div>
                        <div className="member-comment-main">
                          <div className="member-comment-meta">
                            <strong>{comment.authorName}</strong>
                            {comment.authorVerified && <span className="member-comment-verified" title="ISTe verified">✓</span>}
                            <time dateTime={comment.createdAt}>{readableDate(comment.createdAt, language)}</time>
                            {comment.canDelete && <button type="button" disabled={busy} onClick={() => removeComment(comment.id)}>
                              {copy.commentDelete}
                            </button>}
                          </div>
                          <p>{comment.body}</p>
                        </div>
                      </article>
                    ))}
                  </div>
                ) : <p className="member-comments-empty">{copy.noComments}</p>}
                <form className="member-comment-form" onSubmit={addComment}>
                  <label htmlFor="member-comment-input">{copy.commentPlaceholder}</label>
                  <textarea id="member-comment-input" maxLength={600} rows={3} value={commentDraft}
                    onChange={(event) => setCommentDraft(event.target.value)}
                    placeholder={copy.commentPlaceholder} disabled={busy}/>
                  <div>
                    <small>{copy.commentHint} {commentDraft.length}/600</small>
                    <button type="submit" disabled={busy || commentDraft.trim().length < 2 || commentDraft.trim().length > 600}>
                      {busy ? copy.sending : copy.commentSend}
                    </button>
                  </div>
                </form>
              </>
            ) : <p className="member-comments-empty">{copy.commentsDisabled}</p>}
          </section>
        </>
      )}
    </section>
  );
}
