import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { useAuth } from "../auth/AuthContext.jsx";
import { useLanguage } from "../i18n/LanguageContext.jsx";
import { supabase } from "../lib/supabase.js";

import "./PlayerTactics.css";

const MAPS = {
  mirage: {
    name: "Mirage",
    radar: "https://raw.githubusercontent.com/MurkyYT/cs2-map-icons/main/images/radars/de_mirage_radar_psd.png",
  },
  ancient: {
    name: "Ancient",
    radar: "https://raw.githubusercontent.com/MurkyYT/cs2-map-icons/main/images/radars/de_ancient_radar_psd.png",
  },
  inferno: {
    name: "Inferno",
    radar: "https://raw.githubusercontent.com/MurkyYT/cs2-map-icons/main/images/radars/de_inferno_radar_psd.png",
  },
  nuke: {
    name: "Nuke",
    radar: "https://raw.githubusercontent.com/MurkyYT/cs2-map-icons/main/images/radars/de_nuke_radar_psd.png",
    lowerRadar: "https://raw.githubusercontent.com/MurkyYT/cs2-map-icons/main/images/radars/de_nuke_lower_radar_psd.png",
  },
  anubis: {
    name: "Anubis",
    radar: "https://raw.githubusercontent.com/MurkyYT/cs2-map-icons/main/images/radars/de_anubis_radar_psd.png",
  },
  dust2: {
    name: "Dust II",
    radar: "https://raw.githubusercontent.com/MurkyYT/cs2-map-icons/main/images/radars/de_dust2_radar_psd.png",
  },
  cache: {
    name: "Cache",
    radar: "https://raw.githubusercontent.com/MurkyYT/cs2-map-icons/main/images/radars/de_cache_radar_psd.png",
  },
};

const COLORS = [
  "#f2d56b",
  "#8cbcff",
  "#7ce094",
  "#e69386",
  "#d65375",
  "#8742ad",
  "#48a8c5",
  "#ffffff",
];

const MARKERS = [
  "t",
  "ct",
  "bomb",
  "smoke",
  "flash",
  "he",
  "molotov",
];

const STROKE_SIZES = {
  thin: 5,
  medium: 8,
  thick: 13,
};

const FONT_SIZES = {
  thin: 28,
  medium: 34,
  thick: 42,
};

const MARKER_SIZES = {
  small: 18,
  medium: 24,
  large: 32,
};

const COPY = {
  uk: {
    eyebrow: "ISTe PLAYER HUB",
    title: "Тактична дошка",
    intro:
      "Плани раундів, розстановки, гранати та командні нотатки на точних радарах CS2.",
    newTactic: "Нова тактика",
    saved: "Збережені тактики",
    searchPlaceholder: "Пошук тактик...",
    emptySaved: "Збережених тактик поки немає.",
    noSearchResults: "За цим запитом тактик не знайдено.",
    updatedNow: "щойно",
    updatedMinutes: "{{count}} хв тому",
    updatedHours: "{{count}} год тому",
    updatedDays: "{{count}} дн тому",
    titleLabel: "Назва тактики",
    titlePlaceholder: "Наприклад: Mirage T pistol B split",
    visibility: "Доступ",
    team: "Команда",
    private: "Лише я",
    save: "Зберегти",
    saving: "Збереження...",
    download: "Завантажити PNG",
    downloading: "Створення PNG...",
    downloadFailed: "Не вдалося створити PNG.",
    downloadOk: "PNG тактики завантажено.",
    live: "LIVE",
    liveConnected: "Спільна дошка активна",
    liveConnecting: "Підключення...",
    liveOffline: "Офлайн",
    liveUsers: "Онлайн: {{count}}",
    liveHint: "Зміни видно команді в реальному часі. Збереження в Supabase виконується кнопкою «Зберегти».",
    liveSaveFirst: "Збережіть командну тактику, щоб увімкнути спільну дошку.",
    delete: "Видалити",
    deleting: "Видалення...",
    map: "Карта",
    layer: "Поверх",
    upper: "Верхній",
    lower: "Нижній",
    tools: "Інструменти",
    toolsHint: "Оберіть дію для роботи з картою",
    mapHint: "Активна карта та поверх",
    appearance: "Вигляд",
    appearanceHint: "Колір, товщина та прозорість",
    stroke: "Товщина",
    opacity: "Прозорість",
    thin: "Тонка",
    medium: "Середня",
    thick: "Товста",
    customColor: "Свій колір",
    players: "Гравці",
    utility: "Гранати та C4",
    markerSize: "Розмір об'єкта",
    small: "Малий",
    large: "Великий",
    objectLabel: "Підпис об'єкта",
    objectLabelPlaceholder: "Наприклад: DRONI",
    history: "Історія та вибір",
    historyHint: "Швидкі дії з поточним планом",
    keyboard: "Гарячі клавіші",
    select: "Вибір",
    draw: "Олівець",
    arrow: "Стрілка",
    circle: "Коло",
    text: "Текст",
    marker: "Об'єкт",
    label: "Текст мітки",
    labelPlaceholder: "Наприклад: execute",
    objects: "Об'єкти",
    undo: "Скасувати",
    redo: "Повернути",
    remove: "Видалити вибране",
    clear: "Очистити карту",
    colors: "Кольори",
    selected: "Вибрано",
    noSelection: "Нічого",
    loadFailed: "Не вдалося завантажити тактики.",
    saveFailed: "Не вдалося зберегти тактику.",
    deleteFailed: "Не вдалося видалити тактику.",
    savedOk: "Тактику збережено.",
    deletedOk: "Тактику видалено.",
    titleRequired: "Вкажіть назву тактики.",
    accessDenied: "Доступ до тактичної дошки мають лише гравці ISTe.",
    confirmDelete: "Видалити цю тактику?",
    markerLabels: {
      t: "T",
      ct: "CT",
      bomb: "C4",
      smoke: "SMK",
      flash: "FL",
      he: "HE",
      molotov: "MOL",
    },
    markerNames: {
      t: "Терорист",
      ct: "Спецпризначенець",
      bomb: "Бомба C4",
      smoke: "Димова",
      flash: "Світлова",
      he: "Осколкова",
      molotov: "Молотов",
    },
    itemTypes: {
      path: "Лінія",
      arrow: "Стрілка",
      circle: "Коло",
      text: "Текст",
      marker: "Об'єкт",
    },
  },
  en: {
    eyebrow: "ISTe PLAYER HUB",
    title: "Tactical Board",
    intro:
      "Round plans, setups, utility and team notes on accurate CS2 radars.",
    newTactic: "New tactic",
    saved: "Saved tactics",
    searchPlaceholder: "Search tactics...",
    emptySaved: "No saved tactics yet.",
    noSearchResults: "No tactics match this search.",
    updatedNow: "just now",
    updatedMinutes: "{{count}} min ago",
    updatedHours: "{{count}} hr ago",
    updatedDays: "{{count}} d ago",
    titleLabel: "Tactic title",
    titlePlaceholder: "Example: Mirage T pistol B split",
    visibility: "Visibility",
    team: "Team",
    private: "Only me",
    save: "Save",
    saving: "Saving...",
    download: "Download PNG",
    downloading: "Creating PNG...",
    downloadFailed: "Could not create the PNG.",
    downloadOk: "Tactic PNG downloaded.",
    live: "LIVE",
    liveConnected: "Shared board is active",
    liveConnecting: "Connecting...",
    liveOffline: "Offline",
    liveUsers: "Online: {{count}}",
    liveHint: "Changes are visible to the team in real time. Use “Save” to persist them in Supabase.",
    liveSaveFirst: "Save the team tactic to enable the shared board.",
    delete: "Delete",
    deleting: "Deleting...",
    map: "Map",
    layer: "Floor",
    upper: "Upper",
    lower: "Lower",
    tools: "Tools",
    toolsHint: "Choose an action for the map",
    mapHint: "Active map and floor",
    appearance: "Appearance",
    appearanceHint: "Color, thickness and opacity",
    stroke: "Thickness",
    opacity: "Opacity",
    thin: "Thin",
    medium: "Medium",
    thick: "Thick",
    customColor: "Custom color",
    players: "Players",
    utility: "Utility and C4",
    markerSize: "Object size",
    small: "Small",
    large: "Large",
    objectLabel: "Object label",
    objectLabelPlaceholder: "Example: DRONI",
    history: "History and selection",
    historyHint: "Quick actions for the current plan",
    keyboard: "Shortcuts",
    select: "Select",
    draw: "Pencil",
    arrow: "Arrow",
    circle: "Circle",
    text: "Text",
    marker: "Object",
    label: "Text label",
    labelPlaceholder: "Example: execute",
    objects: "Objects",
    undo: "Undo",
    redo: "Redo",
    remove: "Delete selected",
    clear: "Clear board",
    colors: "Colors",
    selected: "Selected",
    noSelection: "Nothing",
    loadFailed: "Could not load tactics.",
    saveFailed: "Could not save the tactic.",
    deleteFailed: "Could not delete the tactic.",
    savedOk: "Tactic saved.",
    deletedOk: "Tactic deleted.",
    titleRequired: "Enter a tactic title.",
    accessDenied: "Tactical Board access is available only to ISTe players.",
    confirmDelete: "Delete this tactic?",
    markerLabels: {
      t: "T",
      ct: "CT",
      bomb: "C4",
      smoke: "SMK",
      flash: "FL",
      he: "HE",
      molotov: "MOL",
    },
    markerNames: {
      t: "Terrorist",
      ct: "Counter-Terrorist",
      bomb: "C4 bomb",
      smoke: "Smoke",
      flash: "Flash",
      he: "HE grenade",
      molotov: "Molotov",
    },
    itemTypes: {
      path: "Line",
      arrow: "Arrow",
      circle: "Circle",
      text: "Text",
      marker: "Object",
    },
  },
};

function formatTacticAge(value, copy) {
  if (!value) return "";

  const timestamp =
    new Date(value).getTime();

  if (!Number.isFinite(timestamp)) {
    return "";
  }

  const minutes =
    Math.max(
      0,
      Math.floor(
        (Date.now() - timestamp) /
          60000,
      ),
    );

  if (minutes < 1) {
    return copy.updatedNow;
  }

  if (minutes < 60) {
    return copy.updatedMinutes.replace(
      "{{count}}",
      String(minutes),
    );
  }

  const hours =
    Math.floor(minutes / 60);

  if (hours < 24) {
    return copy.updatedHours.replace(
      "{{count}}",
      String(hours),
    );
  }

  const days =
    Math.floor(hours / 24);

  return copy.updatedDays.replace(
    "{{count}}",
    String(days),
  );
}

function makeId() {
  return `item-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 8)}`;
}

function markerFill(type) {
  if (type === "t") return "#efb74a";
  if (type === "ct") return "#6aa8ff";
  if (type === "smoke") return "#aeb7c2";
  if (type === "flash") return "#fff1a1";
  if (type === "he") return "#7bdc83";
  if (type === "molotov") return "#ff735f";
  if (type === "bomb") return "#e62c3d";
  return "#ffffff";
}

function pointFromEvent(event) {
  const rect =
    event.currentTarget
      .getBoundingClientRect();

  return {
    x: Math.max(
      0,
      Math.min(
        1000,
        ((event.clientX - rect.left) /
          rect.width) *
          1000,
      ),
    ),
    y: Math.max(
      0,
      Math.min(
        1000,
        ((event.clientY - rect.top) /
          rect.height) *
          1000,
      ),
    ),
  };
}

function ArrowShape({
  item,
  selected,
  onSelect,
}) {
  const dx = item.x2 - item.x1;
  const dy = item.y2 - item.y1;
  const length =
    Math.max(
      1,
      Math.hypot(dx, dy),
    );

  const ux = dx / length;
  const uy = dy / length;
  const strokeWidth =
    Number(item.strokeWidth) || 7;
  const opacity =
    Number.isFinite(item.opacity)
      ? item.opacity
      : 1;
  const size =
    18 + strokeWidth * 0.8;
  const wing =
    8 + strokeWidth * 0.45;

  const bx =
    item.x2 - ux * size;
  const by =
    item.y2 - uy * size;

  const p1 = `${item.x2},${item.y2}`;
  const p2 =
    `${bx - uy * wing},${by + ux * wing}`;
  const p3 =
    `${bx + uy * wing},${by - ux * wing}`;

  return (
    <g
      onPointerDown={(event) => {
        event.stopPropagation();
        onSelect(item.id);
      }}
    >
      <line
        x1={item.x1}
        y1={item.y1}
        x2={item.x2}
        y2={item.y2}
        stroke={item.color}
        strokeWidth={
          selected
            ? strokeWidth + 3
            : strokeWidth
        }
        strokeLinecap="round"
        opacity={opacity}
      />
      <polygon
        points={`${p1} ${p2} ${p3}`}
        fill={item.color}
        opacity={opacity}
      />
    </g>
  );
}

function BoardItem({
  item,
  selected,
  onSelect,
  copy,
}) {
  const common = {
    onPointerDown: (event) => {
      event.stopPropagation();
      onSelect(item.id);
    },
  };

  if (item.type === "path") {
    return (
      <polyline
        {...common}
        points={item.points
          .map(
            (point) =>
              `${point.x},${point.y}`,
          )
          .join(" ")}
        fill="none"
        stroke={item.color}
        strokeWidth={
          selected
            ? (Number(item.strokeWidth) || 8) + 3
            : Number(item.strokeWidth) || 8
        }
        opacity={
          Number.isFinite(item.opacity)
            ? item.opacity
            : 1
        }
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    );
  }

  if (item.type === "arrow") {
    return (
      <ArrowShape
        item={item}
        selected={selected}
        onSelect={onSelect}
      />
    );
  }

  if (item.type === "circle") {
    return (
      <circle
        {...common}
        cx={item.cx}
        cy={item.cy}
        r={item.r}
        fill="rgba(0,0,0,0.08)"
        stroke={item.color}
        strokeWidth={
          selected
            ? (Number(item.strokeWidth) || 7) + 3
            : Number(item.strokeWidth) || 7
        }
        opacity={
          Number.isFinite(item.opacity)
            ? item.opacity
            : 1
        }
      />
    );
  }

  if (item.type === "text") {
    return (
      <text
        {...common}
        x={item.x}
        y={item.y}
        fill={item.color}
        fontSize={item.fontSize || 34}
        fontWeight="900"
        opacity={
          Number.isFinite(item.opacity)
            ? item.opacity
            : 1
        }
        paintOrder="stroke"
        stroke="#111827"
        strokeWidth="7"
      >
        {item.text}
      </text>
    );
  }

  if (item.type === "marker") {
    return (
      <g
        {...common}
        transform={`translate(${item.x} ${item.y})`}
      >
        <circle
          r={
            selected
              ? (item.markerSize || 24) + 4
              : item.markerSize || 24
          }
          fill={markerFill(item.marker)}
          stroke={
            selected
              ? "#ffffff"
              : "rgba(0,0,0,0.8)"
          }
          strokeWidth={selected ? 6 : 4}
          opacity={
            Number.isFinite(item.opacity)
              ? item.opacity
              : 1
          }
        />
        <text
          y="7"
          textAnchor="middle"
          fill="#0a0d12"
          fontSize={
            item.marker === "t" ||
            item.marker === "ct"
              ? "20"
              : "14"
          }
          fontWeight="1000"
        >
          {item.label ||
            copy.markerLabels[item.marker]}
        </text>
      </g>
    );
  }

  return null;
}


function sanitizeFileName(value) {
  return String(value || "iste-tactic")
    .trim()
    .replace(/[<>:"/\\|?*\u0000-\u001F]/g, "-")
    .replace(/\s+/g, "_")
    .replace(/_+/g, "_")
    .slice(0, 80) || "iste-tactic";
}

async function loadImageForCanvas(url) {
  const response = await fetch(url, {
    mode: "cors",
    cache: "force-cache",
  });

  if (!response.ok) {
    throw new Error("RADAR_IMAGE_LOAD_FAILED");
  }

  const blob = await response.blob();
  const objectUrl =
    URL.createObjectURL(blob);

  try {
    const image = new Image();
    image.decoding = "async";

    await new Promise(
      (resolve, reject) => {
        image.onload = resolve;
        image.onerror = () =>
          reject(
            new Error(
              "RADAR_IMAGE_DECODE_FAILED",
            ),
          );
        image.src = objectUrl;
      },
    );

    return image;
  } finally {
    URL.revokeObjectURL(
      objectUrl,
    );
  }
}

function drawArrowOnCanvas(
  context,
  item,
  scale,
) {
  const x1 = item.x1 * scale;
  const y1 = item.y1 * scale;
  const x2 = item.x2 * scale;
  const y2 = item.y2 * scale;

  const dx = x2 - x1;
  const dy = y2 - y1;
  const length =
    Math.max(
      1,
      Math.hypot(dx, dy),
    );

  const ux = dx / length;
  const uy = dy / length;
  const strokeWidth =
    Number(item.strokeWidth) || 7;
  const headLength =
    (18 + strokeWidth * 0.8) * scale;
  const headWidth =
    (8 + strokeWidth * 0.45) * scale;

  context.globalAlpha =
    Number.isFinite(item.opacity)
      ? item.opacity
      : 1;
  context.strokeStyle =
    item.color;
  context.fillStyle =
    item.color;
  context.lineWidth =
    strokeWidth * scale;
  context.lineCap = "round";

  context.beginPath();
  context.moveTo(x1, y1);
  context.lineTo(x2, y2);
  context.stroke();

  const bx =
    x2 - ux * headLength;
  const by =
    y2 - uy * headLength;

  context.beginPath();
  context.moveTo(x2, y2);
  context.lineTo(
    bx - uy * headWidth,
    by + ux * headWidth,
  );
  context.lineTo(
    bx + uy * headWidth,
    by - ux * headWidth,
  );
  context.closePath();
  context.fill();
  context.globalAlpha = 1;
}

function drawBoardItemOnCanvas(
  context,
  item,
  scale,
  copy,
) {
  if (item.type === "path") {
    if (
      !Array.isArray(item.points) ||
      item.points.length < 2
    ) {
      return;
    }

    context.globalAlpha =
      Number.isFinite(item.opacity)
        ? item.opacity
        : 1;
    context.strokeStyle =
      item.color;
    context.lineWidth =
      (Number(item.strokeWidth) || 8) * scale;
    context.lineCap = "round";
    context.lineJoin = "round";

    context.beginPath();
    context.moveTo(
      item.points[0].x * scale,
      item.points[0].y * scale,
    );

    item.points
      .slice(1)
      .forEach((point) => {
        context.lineTo(
          point.x * scale,
          point.y * scale,
        );
      });

    context.stroke();
    context.globalAlpha = 1;
    return;
  }

  if (item.type === "arrow") {
    drawArrowOnCanvas(
      context,
      item,
      scale,
    );
    return;
  }

  if (item.type === "circle") {
    context.globalAlpha =
      Number.isFinite(item.opacity)
        ? item.opacity
        : 1;
    context.strokeStyle =
      item.color;
    context.lineWidth =
      (Number(item.strokeWidth) || 7) * scale;

    context.beginPath();
    context.arc(
      item.cx * scale,
      item.cy * scale,
      item.r * scale,
      0,
      Math.PI * 2,
    );
    context.stroke();
    context.globalAlpha = 1;
    return;
  }

  if (item.type === "text") {
    const fontSize =
      (item.fontSize || 34) * scale;

    context.globalAlpha =
      Number.isFinite(item.opacity)
        ? item.opacity
        : 1;
    context.font =
      `900 ${fontSize}px Arial, sans-serif`;
    context.textBaseline =
      "alphabetic";
    context.lineJoin =
      "round";
    context.strokeStyle =
      "#111827";
    context.lineWidth =
      7 * scale;
    context.fillStyle =
      item.color;

    context.strokeText(
      item.text,
      item.x * scale,
      item.y * scale,
    );

    context.fillText(
      item.text,
      item.x * scale,
      item.y * scale,
    );

    context.globalAlpha = 1;
    return;
  }

  if (item.type === "marker") {
    const x =
      item.x * scale;
    const y =
      item.y * scale;
    const radius =
      (item.markerSize || 24) * scale;

    context.globalAlpha =
      Number.isFinite(item.opacity)
        ? item.opacity
        : 1;
    context.fillStyle =
      markerFill(
        item.marker,
      );
    context.strokeStyle =
      "rgba(0,0,0,0.82)";
    context.lineWidth =
      4 * scale;

    context.beginPath();
    context.arc(
      x,
      y,
      radius,
      0,
      Math.PI * 2,
    );
    context.fill();
    context.stroke();

    const label =
      item.label ||
      copy.markerLabels[
        item.marker
      ] ||
      "";

    context.fillStyle =
      "#0a0d12";
    context.textAlign =
      "center";
    context.textBaseline =
      "middle";
    context.font =
      `1000 ${
        (
          item.marker === "t" ||
          item.marker === "ct"
        )
          ? 20
          : 14
      }px Arial, sans-serif`;

    context.save();
    context.scale(
      scale,
      scale,
    );
    context.fillText(
      label,
      item.x,
      item.y + 1,
    );
    context.restore();

    context.textAlign =
      "start";
    context.globalAlpha = 1;
  }
}


async function apiRequest(
  action,
  options = {},
) {
  const response = await fetch(
    `/api/owner?module=tactics&action=${action}`,
    {
      credentials: "include",
      cache: "no-store",
      headers: {
        Accept: "application/json",
        ...(options.body
          ? {
              "Content-Type":
                "application/json",
            }
          : {}),
      },
      ...options,
      ...(options.body
        ? {
            body: JSON.stringify(
              options.body,
            ),
          }
        : {}),
    },
  );

  const result =
    await response
      .json()
      .catch(() => null);

  if (
    !response.ok ||
    result?.ok !== true
  ) {
    const error =
      new Error(
        result?.error ||
          "REQUEST_FAILED",
      );

    error.code =
      result?.error ||
      "REQUEST_FAILED";

    throw error;
  }

  return result;
}

export default function PlayerTactics() {
  const { language } =
    useLanguage();

  const {
    user,
    profile,
  } = useAuth();

  const c =
    COPY[language] || COPY.uk;

  const [tactics, setTactics] =
    useState([]);
  const [searchQuery, setSearchQuery] =
    useState("");
  const [loading, setLoading] =
    useState(true);
  const [activeId, setActiveId] =
    useState("");
  const [title, setTitle] =
    useState("");
  const [mapId, setMapId] =
    useState("mirage");
  const [visibility, setVisibility] =
    useState("team");
  const [layer, setLayer] =
    useState("upper");
  const [items, setItems] =
    useState([]);
  const [past, setPast] =
    useState([]);
  const [future, setFuture] =
    useState([]);
  const [tool, setTool] =
    useState("select");
  const [color, setColor] =
    useState(COLORS[0]);
  const [markerType, setMarkerType] =
    useState("t");
  const [strokeSize, setStrokeSize] =
    useState("medium");
  const [markerSize, setMarkerSize] =
    useState("medium");
  const [opacity, setOpacity] =
    useState(100);
  const [objectLabel, setObjectLabel] =
    useState("");
  const [labelText, setLabelText] =
    useState("");
  const [draft, setDraft] =
    useState(null);
  const [selectedId, setSelectedId] =
    useState("");
  const [saving, setSaving] =
    useState(false);
  const [deleting, setDeleting] =
    useState(false);
  const [downloading, setDownloading] =
    useState(false);
  const [error, setError] =
    useState("");
  const [notice, setNotice] =
    useState("");
  const [liveStatus, setLiveStatus] =
    useState("offline");
  const [liveUsers, setLiveUsers] =
    useState(0);

  const liveChannelRef =
    useRef(null);
  const applyingRemoteRef =
    useRef(false);
  const broadcastTimerRef =
    useRef(null);

  const currentMap =
    MAPS[mapId] || MAPS.mirage;

  const radarUrl =
    mapId === "nuke" &&
    layer === "lower" &&
    currentMap.lowerRadar
      ? currentMap.lowerRadar
      : currentMap.radar;


  const liveEnabled =
    Boolean(activeId) &&
    visibility === "team";

  useEffect(() => {
    if (!liveEnabled || !user?.id) {
      setLiveStatus("offline");
      setLiveUsers(0);

      return undefined;
    }

    setLiveStatus("connecting");

    const channel =
      supabase.channel(
        `iste-tactic-${activeId}`,
        {
          config: {
            broadcast: {
              self: false,
            },
            presence: {
              key: user.id,
            },
          },
        },
      );

    liveChannelRef.current =
      channel;

    channel
      .on(
        "broadcast",
        {
          event: "board-state",
        },
        ({ payload }) => {
          if (
            !payload ||
            payload.senderId ===
              user.id
          ) {
            return;
          }

          applyingRemoteRef.current =
            true;

          if (
            Array.isArray(
              payload.items,
            )
          ) {
            setItems(
              payload.items,
            );
          }

          if (
            typeof payload.mapId ===
              "string" &&
            MAPS[payload.mapId]
          ) {
            setMapId(
              payload.mapId,
            );
          }

          if (
            payload.layer ===
              "upper" ||
            payload.layer ===
              "lower"
          ) {
            setLayer(
              payload.layer,
            );
          }

          setSelectedId("");
          setDraft(null);

          window.requestAnimationFrame(
            () => {
              applyingRemoteRef.current =
                false;
            },
          );
        },
      )
      .on(
        "presence",
        {
          event: "sync",
        },
        () => {
          const state =
            channel.presenceState();

          const total =
            Object.values(state)
              .flat()
              .length;

          setLiveUsers(total);
        },
      )
      .subscribe(
        async (status) => {
          if (
            status ===
            "SUBSCRIBED"
          ) {
            setLiveStatus(
              "connected",
            );

            await channel.track({
              userId: user.id,
              name:
                profile?.display_name ||
                profile?.username ||
                user.email ||
                "ISTe",
              joinedAt:
                new Date()
                  .toISOString(),
            });

            return;
          }

          if (
            status ===
              "CHANNEL_ERROR" ||
            status ===
              "TIMED_OUT" ||
            status === "CLOSED"
          ) {
            setLiveStatus(
              "offline",
            );
          }
        },
      );

    return () => {
      if (
        broadcastTimerRef.current
      ) {
        window.clearTimeout(
          broadcastTimerRef.current,
        );

        broadcastTimerRef.current =
          null;
      }

      liveChannelRef.current =
        null;

      void supabase.removeChannel(
        channel,
      );

      setLiveStatus("offline");
      setLiveUsers(0);
    };
  }, [
    activeId,
    liveEnabled,
    profile?.display_name,
    profile?.username,
    user?.email,
    user?.id,
  ]);

  useEffect(() => {
    if (
      !liveEnabled ||
      liveStatus !==
        "connected" ||
      !liveChannelRef.current ||
      applyingRemoteRef.current
    ) {
      return undefined;
    }

    if (
      broadcastTimerRef.current
    ) {
      window.clearTimeout(
        broadcastTimerRef.current,
      );
    }

    broadcastTimerRef.current =
      window.setTimeout(
        () => {
          const channel =
            liveChannelRef.current;

          if (!channel) return;

          void channel.send({
            type: "broadcast",
            event: "board-state",
            payload: {
              senderId:
                user?.id || "",
              items,
              mapId,
              layer,
              sentAt:
                Date.now(),
            },
          });
        },
        120,
      );

    return () => {
      if (
        broadcastTimerRef.current
      ) {
        window.clearTimeout(
          broadcastTimerRef.current,
        );

        broadcastTimerRef.current =
          null;
      }
    };
  }, [
    items,
    mapId,
    layer,
    liveEnabled,
    liveStatus,
    user?.id,
  ]);


  const loadTactics =
    useCallback(async () => {
      setLoading(true);
      setError("");

      try {
        const result =
          await apiRequest("list");

        setTactics(
          Array.isArray(result.tactics)
            ? result.tactics
            : [],
        );
      } catch (requestError) {
        setError(
          requestError?.code ===
            "TACTICS_ACCESS_REQUIRED"
            ? c.accessDenied
            : c.loadFailed,
        );
      } finally {
        setLoading(false);
      }
    }, [c.accessDenied, c.loadFailed]);

  useEffect(() => {
    void loadTactics();
  }, [loadTactics]);

  function commitItems(nextItems) {
    setPast((current) => [
      ...current,
      items,
    ]);
    setItems(nextItems);
    setFuture([]);
    setSelectedId("");
  }

  function undo() {
    if (!past.length) return;

    const previous =
      past[past.length - 1];

    setPast((current) =>
      current.slice(0, -1),
    );

    setFuture((current) => [
      items,
      ...current,
    ]);

    setItems(previous);
    setSelectedId("");
  }

  function redo() {
    if (!future.length) return;

    const next = future[0];

    setFuture((current) =>
      current.slice(1),
    );

    setPast((current) => [
      ...current,
      items,
    ]);

    setItems(next);
    setSelectedId("");
  }

  function resetHistory() {
    setPast([]);
    setFuture([]);
    setSelectedId("");
    setDraft(null);
  }

  function createNew() {
    setActiveId("");
    setTitle("");
    setMapId("mirage");
    setVisibility("team");
    setLayer("upper");
    setItems([]);
    setTool("select");
    setError("");
    setNotice("");
    resetHistory();
  }

  function openTactic(tactic) {
    setActiveId(tactic.id);
    setTitle(tactic.title);
    setMapId(tactic.mapId);
    setVisibility(
      tactic.visibility ||
        "team",
    );

    const state =
      tactic.boardState || {};

    setLayer(
      state.layer || "upper",
    );

    setItems(
      Array.isArray(state.items)
        ? state.items
        : [],
    );

    setError("");
    setNotice("");
    resetHistory();
  }

  async function saveTactic() {
    if (!title.trim()) {
      setError(c.titleRequired);
      setNotice("");
      return;
    }

    setSaving(true);
    setError("");
    setNotice("");

    try {
      const result =
        await apiRequest(
          "save",
          {
            method: "POST",
            body: {
              id: activeId,
              title: title.trim(),
              mapId,
              visibility,
              boardState: {
                items,
                layer,
              },
            },
          },
        );

      setActiveId(
        result.tactic.id,
      );

      setTitle(
        result.tactic.title,
      );

      setNotice(c.savedOk);

      await loadTactics();
    } catch {
      setError(c.saveFailed);
    } finally {
      setSaving(false);
    }
  }


  async function downloadBoardPng() {
    setDownloading(true);
    setError("");
    setNotice("");

    try {
      const image =
        await loadImageForCanvas(
          radarUrl,
        );

      const size = 2000;
      const scale = size / 1000;

      const canvas =
        document.createElement(
          "canvas",
        );

      canvas.width = size;
      canvas.height = size;

      const context =
        canvas.getContext(
          "2d",
          {
            alpha: false,
          },
        );

      if (!context) {
        throw new Error(
          "CANVAS_UNAVAILABLE",
        );
      }

      context.fillStyle =
        "#101419";
      context.fillRect(
        0,
        0,
        size,
        size,
      );

      const imageScale =
        Math.min(
          size / image.naturalWidth,
          size / image.naturalHeight,
        );

      const width =
        image.naturalWidth *
        imageScale;
      const height =
        image.naturalHeight *
        imageScale;

      const x =
        (size - width) / 2;
      const y =
        (size - height) / 2;

      context.filter =
        "saturate(0.72) brightness(0.86) contrast(1.06)";

      context.drawImage(
        image,
        x,
        y,
        width,
        height,
      );

      context.filter = "none";

      items.forEach((item) => {
        drawBoardItemOnCanvas(
          context,
          item,
          scale,
          c,
        );
      });

      context.fillStyle =
        "rgba(9, 12, 16, 0.86)";
      context.fillRect(
        0,
        size - 86,
        size,
        86,
      );

      context.fillStyle =
        "#ffffff";
      context.font =
        "900 30px Arial, sans-serif";
      context.textBaseline =
        "middle";

      const exportTitle =
        title.trim() ||
        currentMap.name;

      context.fillText(
        exportTitle.slice(
          0,
          70,
        ),
        34,
        size - 43,
      );

      context.textAlign =
        "right";
      context.fillStyle =
        "#ff3345";
      context.font =
        "900 24px Arial, sans-serif";

      context.fillText(
        `ISTe · ${currentMap.name}`,
        size - 34,
        size - 43,
      );

      const blob =
        await new Promise(
          (resolve, reject) => {
            canvas.toBlob(
              (value) => {
                if (value) {
                  resolve(value);
                } else {
                  reject(
                    new Error(
                      "PNG_ENCODE_FAILED",
                    ),
                  );
                }
              },
              "image/png",
              1,
            );
          },
        );

      const objectUrl =
        URL.createObjectURL(
          blob,
        );

      const anchor =
        document.createElement(
          "a",
        );

      const fileTitle =
        sanitizeFileName(
          title.trim() ||
            "iste-tactic",
        );

      anchor.href =
        objectUrl;
      anchor.download =
        `${fileTitle}_${mapId}_ISTe.png`;

      document.body.appendChild(
        anchor,
      );

      anchor.click();
      anchor.remove();

      window.setTimeout(
        () => {
          URL.revokeObjectURL(
            objectUrl,
          );
        },
        1000,
      );

      setNotice(
        c.downloadOk,
      );
    } catch (downloadError) {
      console.error(
        "Tactical Board PNG export error:",
        downloadError,
      );

      setError(
        c.downloadFailed,
      );
    } finally {
      setDownloading(false);
    }
  }

  async function deleteTactic() {
    if (!activeId) return;

    if (
      !window.confirm(
        c.confirmDelete,
      )
    ) {
      return;
    }

    setDeleting(true);
    setError("");
    setNotice("");

    try {
      await apiRequest(
        "delete",
        {
          method: "POST",
          body: {
            id: activeId,
          },
        },
      );

      createNew();
      setNotice(c.deletedOk);
      await loadTactics();
    } catch {
      setError(c.deleteFailed);
    } finally {
      setDeleting(false);
    }
  }

  function addMarker(point) {
    const count =
      items.filter(
        (item) =>
          item.type === "marker" &&
          item.marker === markerType,
      ).length + 1;

    const customLabel =
      objectLabel.trim();

    const label =
      customLabel
        ? customLabel.slice(0, 12)
        : markerType === "t" ||
            markerType === "ct"
          ? `${c.markerLabels[markerType]}${count}`
          : c.markerLabels[markerType];

    commitItems([
      ...items,
      {
        id: makeId(),
        type: "marker",
        marker: markerType,
        label,
        x: point.x,
        y: point.y,
        markerSize:
          MARKER_SIZES[markerSize],
        opacity:
          opacity / 100,
      },
    ]);
  }

  function handlePointerDown(
    event,
  ) {
    if (
      event.button !== undefined &&
      event.button !== 0
    ) {
      return;
    }

    const point =
      pointFromEvent(event);

    setSelectedId("");

    if (tool === "select") {
      return;
    }

    if (tool === "marker") {
      addMarker(point);
      return;
    }

    if (tool === "text") {
      const value =
        labelText.trim();

      if (!value) return;

      commitItems([
        ...items,
        {
          id: makeId(),
          type: "text",
          text: value.slice(0, 60),
          x: point.x,
          y: point.y,
          color,
          fontSize:
            FONT_SIZES[strokeSize],
          opacity:
            opacity / 100,
        },
      ]);

      return;
    }

    event.currentTarget
      .setPointerCapture?.(
        event.pointerId,
      );

    if (tool === "draw") {
      setDraft({
        id: makeId(),
        type: "path",
        color,
        strokeWidth:
          STROKE_SIZES[strokeSize],
        opacity:
          opacity / 100,
        points: [point],
      });
    }

    if (tool === "arrow") {
      setDraft({
        id: makeId(),
        type: "arrow",
        color,
        strokeWidth:
          STROKE_SIZES[strokeSize],
        opacity:
          opacity / 100,
        x1: point.x,
        y1: point.y,
        x2: point.x,
        y2: point.y,
      });
    }

    if (tool === "circle") {
      setDraft({
        id: makeId(),
        type: "circle",
        color,
        strokeWidth:
          STROKE_SIZES[strokeSize],
        opacity:
          opacity / 100,
        cx: point.x,
        cy: point.y,
        r: 0,
      });
    }
  }

  function handlePointerMove(
    event,
  ) {
    if (!draft) return;

    const point =
      pointFromEvent(event);

    if (draft.type === "path") {
      const last =
        draft.points[
          draft.points.length - 1
        ];

      if (
        Math.hypot(
          point.x - last.x,
          point.y - last.y,
        ) < 4
      ) {
        return;
      }

      setDraft((current) => ({
        ...current,
        points: [
          ...current.points,
          point,
        ],
      }));

      return;
    }

    if (draft.type === "arrow") {
      setDraft((current) => ({
        ...current,
        x2: point.x,
        y2: point.y,
      }));

      return;
    }

    if (draft.type === "circle") {
      setDraft((current) => ({
        ...current,
        r: Math.min(
          450,
          Math.hypot(
            point.x - current.cx,
            point.y - current.cy,
          ),
        ),
      }));
    }
  }

  function handlePointerUp() {
    if (!draft) return;

    const valid =
      draft.type === "path"
        ? draft.points.length > 1
        : draft.type === "arrow"
          ? Math.hypot(
              draft.x2 - draft.x1,
              draft.y2 - draft.y1,
            ) > 8
          : draft.r > 8;

    if (valid) {
      commitItems([
        ...items,
        draft,
      ]);
    }

    setDraft(null);
  }

  function deleteSelected() {
    if (!selectedId) return;

    commitItems(
      items.filter(
        (item) =>
          item.id !== selectedId,
      ),
    );
  }

  useEffect(() => {
    function onKeyDown(event) {
      const tag =
        document.activeElement?.tagName;

      const isTyping =
        tag === "INPUT" ||
        tag === "TEXTAREA" ||
        tag === "SELECT";

      if (!isTyping) {
        const shortcut =
          event.key.toLowerCase();

        const shortcutTool = {
          v: "select",
          p: "draw",
          a: "arrow",
          c: "circle",
          t: "text",
          o: "marker",
        }[shortcut];

        if (shortcutTool) {
          setTool(shortcutTool);
        }
      }

      if (
        (event.key === "Delete" ||
          event.key === "Backspace") &&
        !isTyping
      ) {
        deleteSelected();
      }

      if (
        (event.ctrlKey ||
          event.metaKey) &&
        event.key.toLowerCase() === "z"
      ) {
        event.preventDefault();

        if (event.shiftKey) {
          redo();
        } else {
          undo();
        }
      }
    }

    window.addEventListener(
      "keydown",
      onKeyDown,
    );

    return () =>
      window.removeEventListener(
        "keydown",
        onKeyDown,
      );
  });

  const visibleItems =
    draft
      ? [...items, draft]
      : items;

  const tools = [
    {
      id: "select",
      label: c.select,
      icon: "↖",
      shortcut: "V",
    },
    {
      id: "draw",
      label: c.draw,
      icon: "✎",
      shortcut: "P",
    },
    {
      id: "arrow",
      label: c.arrow,
      icon: "↗",
      shortcut: "A",
    },
    {
      id: "circle",
      label: c.circle,
      icon: "○",
      shortcut: "C",
    },
    {
      id: "text",
      label: c.text,
      icon: "T",
      shortcut: "T",
    },
    {
      id: "marker",
      label: c.marker,
      icon: "●",
      shortcut: "O",
    },
  ];

  const selectedItem =
    items.find(
      (item) =>
        item.id === selectedId,
    ) || null;

  const filteredTactics =
    useMemo(() => {
      const query =
        searchQuery
          .trim()
          .toLowerCase();

      if (!query) {
        return tactics;
      }

      return tactics.filter(
        (tactic) => {
          const mapName =
            MAPS[tactic.mapId]
              ?.name || "";

          return [
            tactic.title,
            mapName,
          ].some((value) =>
            String(value || "")
              .toLowerCase()
              .includes(query),
          );
        },
      );
    }, [
      searchQuery,
      tactics,
    ]);

  const activeTactic =
    useMemo(
      () =>
        tactics.find(
          (item) =>
            item.id === activeId,
        ) || null,
      [activeId, tactics],
    );

  return (
    <section className="tactics-page tactics-page--v3">
      <div className="tactics-shell tactics-shell--v3">
        {(error || notice) ? (
          <div
            className={
              error
                ? "tactics-message tactics-message--error"
                : "tactics-message tactics-message--success"
            }
          >
            {error || notice}
          </div>
        ) : null}

        <div className="tactics-livebar tactics-livebar--v3">
          <div
            className={[
              "tactics-live-status",
              liveStatus === "connected"
                ? "tactics-live-status--connected"
                : "",
            ]
              .filter(Boolean)
              .join(" ")}
          >
            <span
              className="tactics-live-dot"
              aria-hidden="true"
            />
            <strong>{c.live}</strong>
            <span>
              {!liveEnabled
                ? c.liveSaveFirst
                : liveStatus === "connected"
                  ? c.liveConnected
                  : liveStatus === "connecting"
                    ? c.liveConnecting
                    : c.liveOffline}
            </span>
          </div>

          {liveEnabled ? (
            <div className="tactics-live-meta">
              <strong>
                {c.liveUsers.replace(
                  "{{count}}",
                  String(liveUsers),
                )}
              </strong>
              <span>{c.liveHint}</span>
            </div>
          ) : null}
        </div>

        <div className="tactics-layout tactics-layout--v3">
          <aside className="tactics-sidebar tactics-sidebar--v3">
            <div className="tactics-sidebar-head">
              <div>
                <span>{c.saved}</span>
                <strong>{tactics.length}</strong>
              </div>

              <button
                type="button"
                className="tactics-icon-button tactics-icon-button--new"
                onClick={createNew}
                aria-label={c.newTactic}
                title={c.newTactic}
              >
                +
              </button>
            </div>

            <label className="tactics-search">
              <span aria-hidden="true">⌕</span>
              <input
                value={searchQuery}
                placeholder={c.searchPlaceholder}
                onChange={(event) =>
                  setSearchQuery(
                    event.target.value,
                  )
                }
              />
            </label>

            <div className="tactics-saved-list tactics-saved-list--v3">
              {loading ? (
                <div className="tactics-empty">
                  ...
                </div>
              ) : filteredTactics.length ? (
                filteredTactics.map(
                  (tactic) => (
                    <button
                      type="button"
                      key={tactic.id}
                      className={
                        tactic.id === activeId
                          ? "tactics-saved-item tactics-saved-item--active tactics-saved-item--v3"
                          : "tactics-saved-item tactics-saved-item--v3"
                      }
                      onClick={() =>
                        openTactic(tactic)
                      }
                    >
                      <span className="tactics-saved-icon">
                        ↗
                      </span>

                      <span className="tactics-saved-copy">
                        <strong>
                          {tactic.title}
                        </strong>
                        <small>
                          {MAPS[
                            tactic.mapId
                          ]?.name ||
                            tactic.mapId}
                          {formatTacticAge(
                            tactic.updatedAt,
                            c,
                          )
                            ? ` · ${formatTacticAge(
                                tactic.updatedAt,
                                c,
                              )}`
                            : ""}
                        </small>
                      </span>

                      <span className="tactics-saved-more">
                        •••
                      </span>
                    </button>
                  ),
                )
              ) : (
                <div className="tactics-empty">
                  {searchQuery.trim()
                    ? c.noSearchResults
                    : c.emptySaved}
                </div>
              )}
            </div>
          </aside>

          <main className="tactics-workspace tactics-workspace--v3">
            <div className="tactics-workspace-top tactics-workspace-top--v3">
              <label className="tactics-title-field">
                <span>{c.titleLabel}</span>
                <input
                  value={title}
                  maxLength={100}
                  placeholder={c.titlePlaceholder}
                  onChange={(event) =>
                    setTitle(
                      event.target.value,
                    )
                  }
                />
              </label>

              <label className="tactics-access-field">
                <span>{c.visibility}</span>
                <select
                  value={visibility}
                  onChange={(event) =>
                    setVisibility(
                      event.target.value,
                    )
                  }
                >
                  <option value="team">
                    {c.team}
                  </option>
                  <option value="private">
                    {c.private}
                  </option>
                </select>
              </label>

              <div className="tactics-save-actions tactics-save-actions--v3">
                <button
                  type="button"
                  className="tactics-primary tactics-action-save"
                  disabled={saving}
                  onClick={saveTactic}
                >
                  <span aria-hidden="true">▣</span>
                  {saving
                    ? c.saving
                    : c.save}
                </button>

                <button
                  type="button"
                  className="tactics-export tactics-action-export"
                  disabled={downloading}
                  onClick={downloadBoardPng}
                >
                  <span aria-hidden="true">▧</span>
                  {downloading
                    ? c.downloading
                    : c.download}
                </button>

                {activeTactic ? (
                  <button
                    type="button"
                    className="tactics-danger tactics-action-delete"
                    disabled={deleting}
                    onClick={deleteTactic}
                  >
                    <span aria-hidden="true">×</span>
                    {deleting
                      ? c.deleting
                      : c.delete}
                  </button>
                ) : null}
              </div>
            </div>

            <div className="tactics-board-stage">
              <div className="tactics-board-glow" />

              <div className="tactics-board-shell tactics-board-shell--v3">
                <img
                  className="tactics-radar"
                  src={radarUrl}
                  crossOrigin="anonymous"
                  alt={currentMap.name}
                  draggable="false"
                />

                <svg
                  className="tactics-overlay"
                  viewBox="0 0 1000 1000"
                  preserveAspectRatio="none"
                  onPointerDown={handlePointerDown}
                  onPointerMove={handlePointerMove}
                  onPointerUp={handlePointerUp}
                  onPointerCancel={handlePointerUp}
                >
                  {visibleItems.map(
                    (item) => (
                      <BoardItem
                        key={item.id}
                        item={item}
                        selected={
                          item.id === selectedId
                        }
                        onSelect={setSelectedId}
                        copy={c}
                      />
                    ),
                  )}
                </svg>
              </div>
            </div>
          </main>

          <aside className="tactics-tools tactics-tools--v3">
            <section className="tactics-panel-card tactics-map-card">
              <div className="tactics-panel-title">
                <span aria-hidden="true">⌘</span>
                <strong>{c.map}</strong>
              </div>

              <div
                className="tactics-map-preview"
                style={{
                  backgroundImage:
                    `linear-gradient(90deg, rgba(7,10,14,.08), rgba(7,10,14,.72)), url("${radarUrl}")`,
                }}
              >
                <select
                  value={mapId}
                  onChange={(event) => {
                    setMapId(
                      event.target.value,
                    );
                    setLayer("upper");
                  }}
                >
                  {Object.entries(MAPS).map(
                    ([id, map]) => (
                      <option
                        key={id}
                        value={id}
                      >
                        {map.name}
                      </option>
                    ),
                  )}
                </select>
              </div>

              {mapId === "nuke" ? (
                <div className="tactics-segmented">
                  <button
                    type="button"
                    className={
                      layer === "upper"
                        ? "active"
                        : ""
                    }
                    onClick={() =>
                      setLayer("upper")
                    }
                  >
                    {c.upper}
                  </button>
                  <button
                    type="button"
                    className={
                      layer === "lower"
                        ? "active"
                        : ""
                    }
                    onClick={() =>
                      setLayer("lower")
                    }
                  >
                    {c.lower}
                  </button>
                </div>
              ) : null}
            </section>

            <section className="tactics-panel-card">
              <div className="tactics-panel-title">
                <span aria-hidden="true">▦</span>
                <strong>{c.tools}</strong>
              </div>

              <div className="tactics-tool-grid tactics-tool-grid--compact">
                {tools.map((item) => (
                  <button
                    type="button"
                    key={item.id}
                    className={
                      tool === item.id
                        ? "active"
                        : ""
                    }
                    onClick={() =>
                      setTool(item.id)
                    }
                    title={`${item.label} · ${item.shortcut}`}
                  >
                    <span className="tactics-tool-icon">
                      {item.icon}
                    </span>
                    <span>
                      {item.label}
                    </span>
                    <kbd>{item.shortcut}</kbd>
                  </button>
                ))}
              </div>

              {tool !== "marker" ? (
                <div className="tactics-compact-settings">
                  <div className="tactics-size-switch">
                    {[
                      ["thin", c.thin],
                      ["medium", c.medium],
                      ["thick", c.thick],
                    ].map(([id, label]) => (
                      <button
                        type="button"
                        key={id}
                        className={
                          strokeSize === id
                            ? "active"
                            : ""
                        }
                        onClick={() =>
                          setStrokeSize(id)
                        }
                        title={label}
                      >
                        <i
                          style={{
                            height:
                              STROKE_SIZES[id],
                          }}
                        />
                      </button>
                    ))}
                  </div>

                  <label className="tactics-opacity-mini">
                    <span>{opacity}%</span>
                    <input
                      type="range"
                      min="25"
                      max="100"
                      step="5"
                      value={opacity}
                      onChange={(event) =>
                        setOpacity(
                          Number(
                            event.target.value,
                          ),
                        )
                      }
                    />
                  </label>
                </div>
              ) : null}

              {tool === "text" ? (
                <input
                  className="tactics-context-input"
                  value={labelText}
                  maxLength={60}
                  placeholder={c.labelPlaceholder}
                  onChange={(event) =>
                    setLabelText(
                      event.target.value,
                    )
                  }
                />
              ) : null}
            </section>

            <section className="tactics-panel-card">
              <div className="tactics-panel-title">
                <span aria-hidden="true">◉</span>
                <strong>{c.colors}</strong>
              </div>

              <div className="tactics-colors tactics-colors--round">
                {COLORS.map((value) => (
                  <button
                    type="button"
                    key={value}
                    aria-label={value}
                    className={
                      color === value
                        ? "active"
                        : ""
                    }
                    style={{
                      background: value,
                    }}
                    onClick={() =>
                      setColor(value)
                    }
                  />
                ))}

                <label
                  className="tactics-custom-color tactics-custom-color--round"
                  title={c.customColor}
                >
                  <input
                    type="color"
                    value={color}
                    onChange={(event) =>
                      setColor(
                        event.target.value,
                      )
                    }
                  />
                  <span>⌁</span>
                </label>
              </div>
            </section>

            <section className="tactics-panel-card">
              <div className="tactics-panel-title">
                <span aria-hidden="true">◎</span>
                <strong>{c.objects}</strong>
              </div>

              <div className="tactics-object-icons">
                {MARKERS.map((type) => (
                  <button
                    type="button"
                    key={type}
                    className={
                      tool === "marker" &&
                      markerType === type
                        ? "active"
                        : ""
                    }
                    onClick={() => {
                      setMarkerType(type);
                      setTool("marker");
                    }}
                    title={
                      c.markerNames[type]
                    }
                  >
                    <span
                      className={
                        `tactics-object-glyph tactics-object-glyph--${type}`
                      }
                    >
                      {type === "t"
                        ? "T"
                        : type === "ct"
                          ? "CT"
                          : type === "bomb"
                            ? "C4"
                            : type === "smoke"
                              ? "☁"
                              : type === "flash"
                                ? "✦"
                                : type === "he"
                                  ? "✹"
                                  : "♨"}
                    </span>
                  </button>
                ))}
              </div>

              {tool === "marker" ? (
                <div className="tactics-marker-settings">
                  <div className="tactics-size-switch tactics-size-switch--markers">
                    {[
                      ["small", c.small],
                      ["medium", c.medium],
                      ["large", c.large],
                    ].map(([id, label]) => (
                      <button
                        type="button"
                        key={id}
                        className={
                          markerSize === id
                            ? "active"
                            : ""
                        }
                        onClick={() =>
                          setMarkerSize(id)
                        }
                      >
                        {label}
                      </button>
                    ))}
                  </div>

                  <input
                    className="tactics-context-input"
                    value={objectLabel}
                    maxLength={12}
                    placeholder={
                      c.objectLabelPlaceholder
                    }
                    onChange={(event) =>
                      setObjectLabel(
                        event.target.value,
                      )
                    }
                  />
                </div>
              ) : null}
            </section>

            <section className="tactics-panel-card">
              <div className="tactics-panel-title">
                <span aria-hidden="true">⌘</span>
                <strong>{c.history}</strong>
              </div>

              <div className="tactics-quick-actions">
                <button
                  type="button"
                  disabled={!past.length}
                  onClick={undo}
                >
                  <span>↶</span>
                  {c.undo}
                </button>

                <button
                  type="button"
                  disabled={!future.length}
                  onClick={redo}
                >
                  <span>↷</span>
                  {c.redo}
                </button>

                <button
                  type="button"
                  disabled={!selectedId}
                  onClick={deleteSelected}
                >
                  <span>⌫</span>
                  {c.remove}
                </button>

                <button
                  type="button"
                  className="tactics-clear-button"
                  disabled={!items.length}
                  onClick={() =>
                    commitItems([])
                  }
                >
                  <span>×</span>
                  {c.clear}
                </button>
              </div>
            </section>
          </aside>
        </div>
      </div>
    </section>
  );
}
