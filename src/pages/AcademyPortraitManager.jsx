import { useEffect, useState } from "react";
import { ACADEMY_PLAYERS } from "../data/academyRoster.js";
import { useAuth } from "../auth/AuthContext.jsx";

const MAX_BYTES = 2_000_000;
function optimize(file, position) {
  return new Promise((resolve, reject) => {
    if (!file || !["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      reject(new Error("Оберіть JPG, PNG або WebP."));
      return;
    }
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Не вдалося прочитати файл. Спробуйте JPG."));
    reader.onload = () => {
      const image = new Image();
      image.onerror = () => reject(new Error("Браузер не зміг відкрити фото. Спробуйте JPG-версію."));
      image.onload = () => {
        try {
          if (!image.naturalWidth || !image.naturalHeight) throw new Error("Зображення не має розмірів.");
          const canvas = document.createElement("canvas");
          const width = 1000, height = 1250;
          canvas.width = width; canvas.height = height;
          const ctx = canvas.getContext("2d");
          if (!ctx) throw new Error("Не вдалося підготувати фото на цьому пристрої.");
          const scale = Math.max(width / image.naturalWidth, height / image.naturalHeight);
          const scaledWidth = image.naturalWidth * scale;
          const scaledHeight = image.naturalHeight * scale;
          const offsetX = (width - scaledWidth) / 2;
          const offsetY = (height - scaledHeight) * position / 100;
          ctx.drawImage(image, offsetX, offsetY, scaledWidth, scaledHeight);
          canvas.toBlob(
            blob => blob ? resolve(blob) : reject(new Error("Не вдалося зберегти оброблене фото.")),
            "image/jpeg", .9
          );
        } catch (error) { reject(error); }
      };
      image.src = String(reader.result || "");
    };
    reader.readAsDataURL(file);
  });
}

function asBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(",")[1] || "");
    reader.onerror = () => reject(new Error("Cannot read photo"));
    reader.readAsDataURL(blob);
  });
}

export default function AcademyPortraitManager() {
  const { role } = useAuth();
  const [nickname, setNickname] = useState(ACADEMY_PLAYERS[0]?.nickname || "");
  const [file, setFile] = useState(null);
  const [position, setPosition] = useState(20);
  const [preview, setPreview] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  useEffect(() => {
    if (!file) { setPreview(""); return undefined; }
    let cancelled = false;
    let current = "";
    setMessage("");
    optimize(file, position).then(blob => {
      if (!cancelled) { current = URL.createObjectURL(blob); setPreview(current); }
    }).catch(error => { if (!cancelled) setMessage(error.message || "Не вдалося обробити зображення."); });
    return () => { cancelled = true; if (current) URL.revokeObjectURL(current); };
  }, [file, position]);
  async function save() {
    if (!file || !nickname || busy || !preview) return;
    setBusy(true); setMessage("");
    try {
      const blob = await optimize(file, position);
      if (blob.size > MAX_BYTES) throw new Error("Зображення завелике. Спробуйте інше фото.");
      const response = await fetch("/api/owner?module=roster&action=academy-photo", {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ nickname, mimeType: "image/jpeg", data: await asBase64(blob) }),
      });
      const result = await response.json();
      if (!response.ok || !result.ok) throw new Error(result.message || "Завантаження не вдалося.");
      setMessage("Фото збережено! Картка гравця оновиться автоматично.");
      setFile(null);
    } catch (error) { setMessage(error.message || "Помилка завантаження."); }
    finally { setBusy(false); }
  }
  if (role !== "owner" && role !== "admin") return null;
  return (
    <section className="owner-roster-group" style={{ marginBottom: 32 }}>
      <header><h2>Фото ISTe Academy</h2><span>JPG / PNG / WebP</span></header>
      <div style={{ padding: 22, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 240px), 1fr))", gap: 24 }}>
        <div style={{ display: "grid", gap: 12, alignContent: "start" }}>
          <label>Гравець
            <select value={nickname} onChange={event => setNickname(event.target.value)}>
              {ACADEMY_PLAYERS.map(player => <option key={player.nickname} value={player.nickname}>{player.displayName}</option>)}
            </select>
          </label>
          <label>Фотографія
            <input type="file" accept="image/jpeg,image/png,image/webp" onChange={event => { setFile(event.target.files?.[0] || null); setMessage(""); }} />
          </label>
          <label>Вертикальне кадрування: {position}%
            <input type="range" min="0" max="100" value={position} onChange={event => setPosition(Number(event.target.value))} disabled={!file} />
          </label>
          <p>Фото автоматично підганяється під 1000 × 1250 пікселів. Перевірте, щоб обличчя та груди були видимі.</p>
          <button type="button" className="owner-roster-button" disabled={!file || busy || !preview} onClick={save}>{busy ? "Завантаження..." : "Зберегти фото гравця"}</button>
          {message && <p role="status">{message}</p>}
        </div>
        <div style={{ aspectRatio: "4 / 5", overflow: "hidden", borderRadius: 14, border: "1px solid #90232b", background: "#150506", display: "grid", placeItems: "center" }}>
          {preview ? <img src={preview} alt="Попередній перегляд фото гравця" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <span>Попередній перегляд</span>}
        </div>
      </div>
    </section>
  );
}
