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
  "ct",
  "t",
  "bomb",
  "he",
  "molotov",
  "smoke",
  "flash",
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

const EFFECT_MARKERS = new Set([
  "smoke",
  "flash",
  "he",
  "molotov",
]);

const DEFAULT_EFFECT_SIZE = 30;

function clamp(value, min, max) {
  return Math.min(
    max,
    Math.max(min, value),
  );
}

function isEffectMarker(item) {
  return (
    item?.type === "marker" &&
    EFFECT_MARKERS.has(item.marker)
  );
}

function getEffectSize(item) {
  if (!isEffectMarker(item)) {
    return 0;
  }

  return Number(item.effectSize) ||
    DEFAULT_EFFECT_SIZE;
}

function translateItem(
  item,
  dx,
  dy,
) {
  if (!item) return item;

  if (item.type === "marker" ||
      item.type === "text") {
    return {
      ...item,
      x: clamp(
        Number(item.x) + dx,
        0,
        1000,
      ),
      y: clamp(
        Number(item.y) + dy,
        0,
        1000,
      ),
    };
  }

  if (item.type === "circle") {
    return {
      ...item,
      cx: clamp(
        Number(item.cx) + dx,
        0,
        1000,
      ),
      cy: clamp(
        Number(item.cy) + dy,
        0,
        1000,
      ),
    };
  }

  if (item.type === "arrow") {
    return {
      ...item,
      x1: item.x1 + dx,
      y1: item.y1 + dy,
      x2: item.x2 + dx,
      y2: item.y2 + dy,
    };
  }

  if (item.type === "path") {
    return {
      ...item,
      points: item.points.map(
        (point) => ({
          x: point.x + dx,
          y: point.y + dy,
        }),
      ),
    };
  }

  if (item.type === "area") {
    return {
      ...item,
      x1: item.x1 + dx,
      y1: item.y1 + dy,
      x2: item.x2 + dx,
      y2: item.y2 + dy,
    };
  }

  return item;
}

function cloneWithOffset(
  item,
  offset = 24,
) {
  return translateItem(
    {
      ...item,
      id: makeId(),
    },
    offset,
    offset,
  );
}

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
    area: "Область",
    label: "Текст мітки",
    labelPlaceholder: "Наприклад: execute",
    objects: "Об'єкти",
    undo: "Скасувати",
    redo: "Повернути",
    remove: "Видалити вибране",
    clear: "Очистити карту",
    copy: "Копіювати",
    paste: "Вставити",
    quickActions: "Швидкі дії",
    selectedObject: "Вибраний об'єкт",
    size: "Розмір",
    moveHint: "Перетягуйте вибраний об'єкт прямо по карті.",
    centerBoard: "Центрувати",
    zoomIn: "Збільшити",
    zoomOut: "Зменшити",
    fullscreen: "На весь екран",
    exitFullscreen: "Вийти з повного екрана",
    confirmClear: "Очистити всі об'єкти на карті?",
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
      area: "Область",
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
    area: "Area",
    label: "Text label",
    labelPlaceholder: "Example: execute",
    objects: "Objects",
    undo: "Undo",
    redo: "Redo",
    remove: "Delete selected",
    clear: "Clear board",
    copy: "Copy",
    paste: "Paste",
    quickActions: "Quick actions",
    selectedObject: "Selected object",
    size: "Size",
    moveHint: "Drag the selected object directly on the map.",
    centerBoard: "Center board",
    zoomIn: "Zoom in",
    zoomOut: "Zoom out",
    fullscreen: "Fullscreen",
    exitFullscreen: "Exit fullscreen",
    confirmClear: "Clear all objects from the map?",
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
      area: "Area",
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
  onPointerDown,
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
        onPointerDown(event, item);
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

function TacticalObjectIcon({ type }) {
  if (type === "ct" || type === "t") {
    return (
      <span
        className={
          `tactics-team-dot tactics-team-dot--${type}`
        }
        aria-hidden="true"
      />
    );
  }

  if (type === "bomb") {
    return (
      <span
        className="tactics-c4-icon"
        aria-hidden="true"
      >
        C4
      </span>
    );
  }

  if (type === "he") {
    return (
      <svg
        className="tactics-grenade-icon tactics-grenade-icon--he"
        viewBox="0 0 32 32"
        aria-hidden="true"
      >
        <path
          fill="currentColor"
          d="M13 3h7v4h2l3 5-1 10-4 6h-8l-4-6-1-10 3-5h3V3Zm2 2v4h3V5h-3Zm-3 8-2 2 1 7 2 3h6l2-3 1-7-2-2h-8Z"
        />
      </svg>
    );
  }

  if (type === "molotov") {
    return (
      <svg
        className="tactics-grenade-icon tactics-grenade-icon--molotov"
        viewBox="0 0 32 32"
        aria-hidden="true"
      >
        <path
          fill="currentColor"
          d="M13 2h7v5l2 3v3l4 5-2 11H9L7 18l5-6V9l1-2V2Zm2 3v4h3V5h-3Zm-2 8-3 6 1 7h11l1-7-4-6h-6Z"
        />
        <path
          fill="currentColor"
          d="M20 4c3-4 7-1 5 2 3 0 4 4 1 5 1-3-2-4-4-2 1-3-1-5-2-5Z"
        />
      </svg>
    );
  }

  if (type === "smoke") {
    return (
      <svg
        className="tactics-grenade-icon tactics-grenade-icon--smoke"
        viewBox="0 0 32 32"
        aria-hidden="true"
      >
        <path
          fill="currentColor"
          d="M12 2h8v4l3 4v16a4 4 0 0 1-4 4h-6a4 4 0 0 1-4-4V10l3-4V2Zm2 3v3h4V5h-4Zm-2 7v3h8v-3h-8Zm0 6v3h8v-3h-8Z"
        />
      </svg>
    );
  }

  return (
    <svg
      className="tactics-grenade-icon tactics-grenade-icon--flash"
      viewBox="0 0 32 32"
      aria-hidden="true"
    >
      <path
        fill="currentColor"
        d="M13 2h7v4l3 4v17a3 3 0 0 1-3 3h-8a3 3 0 0 1-3-3V10l4-4V2Zm2 3v3h3V5h-3Zm-3 7v4h8v-4h-8Zm0 7v3h8v-3h-8Zm2 6a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Zm5 0a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z"
      />
    </svg>
  );
}

function EffectMarker({
  item,
  selected,
  common,
}) {
  const size = getEffectSize(item);
  const opacity =
    Number.isFinite(item.opacity)
      ? item.opacity
      : 1;

  const selection = selected ? (
    <circle
      r={size * 0.62}
      fill="none"
      stroke="#ff3345"
      strokeWidth="4"
      strokeDasharray="10 8"
      opacity="0.92"
      pointerEvents="none"
    />
  ) : null;

  if (item.marker === "smoke") {
    return (
      <g
        {...common}
        transform={`translate(${item.x} ${item.y})`}
        opacity={opacity}
        className={selected ? "tactics-effect tactics-effect--selected" : "tactics-effect"}
      >
        <circle r={size * 0.64} fill="transparent" pointerEvents="all" />
        <circle r={size * 0.5} fill="rgba(218,223,228,0.34)" filter="url(#tactics-smoke-soft)" pointerEvents="none" />
        <circle r={size * 0.36} fill="rgba(238,240,243,0.58)" filter="url(#tactics-smoke-core)" pointerEvents="none" />
        <circle r={size * 0.21} fill="rgba(255,255,255,0.4)" filter="url(#tactics-smoke-core)" pointerEvents="none" />
        {selection}
      </g>
    );
  }

  if (item.marker === "flash") {
    const rays = Array.from({ length: 8 }, (_, index) => index * 45);

    return (
      <g
        {...common}
        transform={`translate(${item.x} ${item.y})`}
        opacity={opacity}
        className="tactics-effect"
      >
        <circle r={size * 0.64} fill="transparent" pointerEvents="all" />
        <g filter="url(#tactics-flash-soft)" pointerEvents="none">
          <circle r={size * 0.18} fill="#ffffff" />
          {rays.map((angle, index) => (
            <path
              key={angle}
              d={`M 0 ${-size * 0.16} L ${size * 0.07} ${-size * (index % 2 ? 0.4 : 0.54)} L 0 ${-size * 0.66} L ${-size * 0.07} ${-size * (index % 2 ? 0.4 : 0.54)} Z`}
              fill="#ffffff"
              opacity={index % 2 ? 0.72 : 0.96}
              transform={`rotate(${angle})`}
            />
          ))}
        </g>
        {selection}
      </g>
    );
  }

  if (item.marker === "he") {
    const rays = Array.from({ length: 16 }, (_, index) => index * 22.5);

    return (
      <g
        {...common}
        transform={`translate(${item.x} ${item.y})`}
        opacity={opacity}
        className="tactics-effect"
      >
        <circle r={size * 0.65} fill="transparent" pointerEvents="all" />
        <g filter="url(#tactics-he-soft)" pointerEvents="none">
          <circle
            r={size * 0.11}
            fill="rgba(239,45,71,0.08)"
            stroke="#ef2d47"
            strokeWidth={size * 0.045}
          />
          {rays.map((angle, index) => (
            <line
              key={angle}
              x1="0"
              y1={-size * 0.23}
              x2="0"
              y2={-size * (index % 2 ? 0.41 : 0.57)}
              stroke="#ef2d47"
              strokeWidth={size * 0.045}
              strokeLinecap="round"
              transform={`rotate(${angle})`}
            />
          ))}
        </g>
        {selection}
      </g>
    );
  }

  const scale = size / 70;

  return (
    <g
      {...common}
      transform={`translate(${item.x} ${item.y}) scale(${scale})`}
      opacity={opacity}
      className="tactics-effect"
    >
      <path
        d="M-31 8 -26-20 -13-29 2-25 11-34 22-23 31-4 24 14 8 27 -13 31 -29 19 Z"
        fill="rgba(232,104,68,0.24)"
        stroke="#e98769"
        strokeWidth="3"
        filter="url(#tactics-molotov-soft)"
        pointerEvents="all"
      />
      <path
        d="M-26 8 -21-15 -9-22 2-19 9-27 17-17 24-3 18 10 6 20 -10 23 -23 15 Z"
        fill="rgba(232,118,82,0.13)"
        pointerEvents="none"
      />
      {selected ? (
        <circle
          r="44"
          fill="none"
          stroke="#ff3345"
          strokeWidth="4"
          strokeDasharray="10 8"
          vectorEffect="non-scaling-stroke"
          pointerEvents="none"
        />
      ) : null}
    </g>
  );
}

function BoardItem({
  item,
  selected,
  onItemPointerDown,
  copy,
}) {
  const common = {
    onPointerDown: (event) => {
      event.stopPropagation();
      onItemPointerDown(
        event,
        item,
      );
    },
  };

  if (isEffectMarker(item)) {
    return (
      <EffectMarker
        item={item}
        selected={selected}
        common={common}
      />
    );
  }

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
        onPointerDown={
          onItemPointerDown
        }
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

  if (item.type === "area") {
    const x =
      Math.min(item.x1, item.x2);
    const y =
      Math.min(item.y1, item.y2);
    const width =
      Math.abs(item.x2 - item.x1);
    const height =
      Math.abs(item.y2 - item.y1);

    return (
      <rect
        {...common}
        x={x}
        y={y}
        width={width}
        height={height}
        rx="14"
        fill={item.color}
        fillOpacity={
          (Number.isFinite(item.opacity)
            ? item.opacity
            : 1) * 0.18
        }
        stroke={item.color}
        strokeWidth={
          selected ? 8 : 5
        }
        strokeDasharray="14 9"
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
        transform={
          `translate(${item.x} ${item.y})`
        }
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
          pointerEvents="none"
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

  if (item.type === "area") {
    const x =
      Math.min(item.x1, item.x2) * scale;
    const y =
      Math.min(item.y1, item.y2) * scale;
    const width =
      Math.abs(item.x2 - item.x1) * scale;
    const height =
      Math.abs(item.y2 - item.y1) * scale;

    context.globalAlpha =
      Number.isFinite(item.opacity)
        ? item.opacity
        : 1;
    context.fillStyle =
      item.color;
    context.strokeStyle =
      item.color;
    context.lineWidth =
      5 * scale;
    context.setLineDash([
      14 * scale,
      9 * scale,
    ]);
    context.fillRect(
      x,
      y,
      width,
      height,
    );
    context.globalAlpha *= 0.18;
    context.fillRect(
      x,
      y,
      width,
      height,
    );
    context.globalAlpha =
      Number.isFinite(item.opacity)
        ? item.opacity
        : 1;
    context.strokeRect(
      x,
      y,
      width,
      height,
    );
    context.setLineDash([]);
    context.globalAlpha = 1;
    return;
  }

  if (item.type === "marker") {
    const x =
      item.x * scale;
    const y =
      item.y * scale;
    const opacityValue =
      Number.isFinite(item.opacity)
        ? item.opacity
        : 1;

    if (isEffectMarker(item)) {
      const size =
        getEffectSize(item) *
        scale;

      context.save();
      context.globalAlpha =
        opacityValue;

      if (item.marker === "smoke") {
        const gradient =
          context.createRadialGradient(
            x,
            y,
            size * 0.03,
            x,
            y,
            size * 0.58,
          );

        gradient.addColorStop(0, "rgba(255,255,255,0.78)");
        gradient.addColorStop(0.38, "rgba(238,240,243,0.64)");
        gradient.addColorStop(0.72, "rgba(205,211,217,0.3)");
        gradient.addColorStop(1, "rgba(180,187,195,0)");

        context.shadowColor = "rgba(238,241,244,0.55)";
        context.shadowBlur = size * 0.28;
        context.fillStyle = gradient;
        context.beginPath();
        context.arc(x, y, size * 0.6, 0, Math.PI * 2);
        context.fill();
      } else if (item.marker === "flash") {
        const gradient =
          context.createRadialGradient(
            x,
            y,
            0,
            x,
            y,
            size * 0.5,
          );

        gradient.addColorStop(0, "rgba(255,255,255,1)");
        gradient.addColorStop(0.24, "rgba(255,255,255,0.9)");
        gradient.addColorStop(1, "rgba(255,255,255,0)");

        context.fillStyle = gradient;
        context.fillRect(x - size, y - size, size * 2, size * 2);
        context.strokeStyle = "#ffffff";
        context.lineWidth = size * 0.05;
        context.lineCap = "round";
        context.shadowColor = "#ffffff";
        context.shadowBlur = size * 0.1;

        for (let index = 0; index < 8; index += 1) {
          const angle = index * Math.PI / 4;
          context.beginPath();
          context.moveTo(
            x + Math.cos(angle) * size * 0.18,
            y + Math.sin(angle) * size * 0.18,
          );
          context.lineTo(
            x + Math.cos(angle) * size * (index % 2 ? 0.42 : 0.61),
            y + Math.sin(angle) * size * (index % 2 ? 0.42 : 0.61),
          );
          context.stroke();
        }
      } else if (item.marker === "he") {
        context.strokeStyle = "#ef2d47";
        context.lineWidth = size * 0.045;
        context.lineCap = "round";
        context.shadowColor = "rgba(239,45,71,0.5)";
        context.shadowBlur = size * 0.08;

        context.beginPath();
        context.arc(x, y, size * 0.11, 0, Math.PI * 2);
        context.stroke();

        for (let index = 0; index < 16; index += 1) {
          const angle = index * Math.PI * 2 / 16;
          context.beginPath();
          context.moveTo(
            x + Math.cos(angle) * size * 0.23,
            y + Math.sin(angle) * size * 0.23,
          );
          context.lineTo(
            x + Math.cos(angle) * size * (index % 2 ? 0.41 : 0.57),
            y + Math.sin(angle) * size * (index % 2 ? 0.41 : 0.57),
          );
          context.stroke();
        }
      } else {
        context.fillStyle = "rgba(232,104,68,0.24)";
        context.strokeStyle = "#e98769";
        context.lineWidth = size * 0.043;
        context.shadowColor = "rgba(233,135,105,0.45)";
        context.shadowBlur = size * 0.08;

        const points = [
          [-0.44, 0.12], [-0.36, -0.28], [-0.18, -0.42],
          [0.02, -0.36], [0.16, -0.48], [0.32, -0.31],
          [0.44, -0.06], [0.34, 0.2], [0.12, 0.39],
          [-0.18, 0.44], [-0.42, 0.27],
        ];

        context.beginPath();
        points.forEach(([dx, dy], index) => {
          const px = x + dx * size;
          const py = y + dy * size;
          if (!index) context.moveTo(px, py);
          else context.lineTo(px, py);
        });
        context.closePath();
        context.fill();
        context.stroke();
      }

      context.restore();
      return;
    }

    const radius =
      (item.markerSize || 24) *
      scale;

    context.globalAlpha =
      opacityValue;
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
  const [clipboardItem, setClipboardItem] =
    useState(null);
  const [zoom, setZoom] =
    useState(1);
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
  const overlayRef =
    useRef(null);
  const boardStageRef =
    useRef(null);
  const dragRef =
    useRef(null);
  const inspectorHistoryRef =
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

  function commitItems(
    nextItems,
    nextSelectedId = "",
  ) {
    setPast((current) => [
      ...current,
      items,
    ]);
    setItems(nextItems);
    setFuture([]);
    setSelectedId(
      nextSelectedId,
    );
  }

  function boardPoint(
    event,
  ) {
    const rect =
      overlayRef.current
        ?.getBoundingClientRect();

    if (!rect) {
      return {
        x: 0,
        y: 0,
      };
    }

    return {
      x: clamp(
        ((event.clientX - rect.left) /
          rect.width) *
          1000,
        0,
        1000,
      ),
      y: clamp(
        ((event.clientY - rect.top) /
          rect.height) *
          1000,
        0,
        1000,
      ),
    };
  }

  function beginItemDrag(
    event,
    item,
  ) {
    setSelectedId(item.id);

    if (
      event?.clientX === undefined
    ) {
      return;
    }

    event.preventDefault?.();
    setTool("select");

    const start =
      boardPoint(event);

    dragRef.current = {
      id: item.id,
      start,
      snapshot: items,
    };

    overlayRef.current
      ?.setPointerCapture?.(
        event.pointerId,
      );
  }

  function beginInspectorEdit() {
    if (
      !inspectorHistoryRef.current
    ) {
      inspectorHistoryRef.current =
        items;
    }
  }

  function finishInspectorEdit() {
    const snapshot =
      inspectorHistoryRef.current;

    if (!snapshot) return;

    setPast((current) => [
      ...current,
      snapshot,
    ]);

    setFuture([]);
    inspectorHistoryRef.current =
      null;
  }

  function patchSelectedItem(
    patch,
  ) {
    if (!selectedId) return;

    setItems((current) =>
      current.map((item) =>
        item.id === selectedId
          ? {
              ...item,
              ...patch,
            }
          : item,
      ),
    );
  }

  function copySelected() {
    const selected =
      items.find(
        (item) =>
          item.id === selectedId,
      );

    if (!selected) return;

    setClipboardItem(
      structuredClone(selected),
    );
  }

  function pasteClipboard() {
    if (!clipboardItem) return;

    const clone =
      cloneWithOffset(
        structuredClone(
          clipboardItem,
        ),
      );

    commitItems(
      [...items, clone],
      clone.id,
    );
  }

  function clearBoard() {
    if (
      !items.length ||
      !window.confirm(
        c.confirmClear,
      )
    ) {
      return;
    }

    commitItems([]);
  }

  function zoomBoard(delta) {
    setZoom((current) =>
      clamp(
        Number(
          (
            current + delta
          ).toFixed(2),
        ),
        0.75,
        1.75,
      ),
    );
  }

  function centerBoard() {
    setZoom(1);
  }

  async function toggleFullscreen() {
    const element =
      boardStageRef.current;

    if (!element) return;

    if (
      document.fullscreenElement
    ) {
      await document
        .exitFullscreen?.();

      return;
    }

    await element
      .requestFullscreen?.();
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

    const id = makeId();

    commitItems(
      [
        ...items,
        {
          id,
          type: "marker",
          marker: markerType,
          label,
          x: point.x,
          y: point.y,
          markerSize:
            MARKER_SIZES[markerSize],
          effectSize:
            EFFECT_MARKERS.has(
              markerType,
            )
              ? DEFAULT_EFFECT_SIZE
              : undefined,
          opacity:
            opacity / 100,
        },
      ],
      id,
    );
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
      boardPoint(event);

    setSelectedId("");

    if (tool === "select") {
      return;
    }

    if (
      tool === "marker" ||
      tool === "smoke"
    ) {
      if (tool === "smoke") {
        setMarkerType("smoke");
      }

      const type =
        tool === "smoke"
          ? "smoke"
          : markerType;

      const count =
        items.filter(
          (item) =>
            item.type === "marker" &&
            item.marker === type,
        ).length + 1;

      const customLabel =
        objectLabel.trim();

      const label =
        customLabel
          ? customLabel.slice(0, 12)
          : type === "t" ||
              type === "ct"
            ? `${c.markerLabels[type]}${count}`
            : c.markerLabels[type];

      const id = makeId();

      commitItems(
        [
          ...items,
          {
            id,
            type: "marker",
            marker: type,
            label,
            x: point.x,
            y: point.y,
            markerSize:
              MARKER_SIZES[markerSize],
            effectSize:
              EFFECT_MARKERS.has(type)
                ? DEFAULT_EFFECT_SIZE
                : undefined,
            opacity:
              opacity / 100,
          },
        ],
        id,
      );

      return;
    }

    if (tool === "text") {
      const value =
        labelText.trim();

      if (!value) return;

      const id = makeId();

      commitItems(
        [
          ...items,
          {
            id,
            type: "text",
            text:
              value.slice(0, 60),
            x: point.x,
            y: point.y,
            color,
            fontSize:
              FONT_SIZES[
                strokeSize
              ],
            opacity:
              opacity / 100,
          },
        ],
        id,
      );

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

    if (tool === "area") {
      setDraft({
        id: makeId(),
        type: "area",
        color,
        opacity:
          opacity / 100,
        x1: point.x,
        y1: point.y,
        x2: point.x,
        y2: point.y,
      });
    }
  }

  function handlePointerMove(
    event,
  ) {
    if (dragRef.current) {
      const current =
        boardPoint(event);

      const {
        start,
        snapshot,
        id,
      } = dragRef.current;

      const dx =
        current.x - start.x;
      const dy =
        current.y - start.y;

      setItems(
        snapshot.map((item) =>
          item.id === id
            ? translateItem(
                item,
                dx,
                dy,
              )
            : item,
        ),
      );

      return;
    }

    if (!draft) return;

    const point =
      boardPoint(event);

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

      return;
    }

    if (draft.type === "area") {
      setDraft((current) => ({
        ...current,
        x2: point.x,
        y2: point.y,
      }));
    }
  }

  function handlePointerUp() {
    if (dragRef.current) {
      const {
        snapshot,
      } = dragRef.current;

      dragRef.current = null;

      setPast((current) => [
        ...current,
        snapshot,
      ]);

      setFuture([]);
      return;
    }

    if (!draft) return;

    const valid =
      draft.type === "path"
        ? draft.points.length > 1
        : draft.type === "arrow"
          ? Math.hypot(
              draft.x2 - draft.x1,
              draft.y2 - draft.y1,
            ) > 8
          : draft.type === "circle"
            ? draft.r > 8
            : Math.abs(
                  draft.x2 -
                    draft.x1,
                ) > 8 &&
              Math.abs(
                draft.y2 -
                  draft.y1,
              ) > 8;

    if (valid) {
      commitItems(
        [...items, draft],
        draft.id,
      );
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
          a: "arrow",
          c: "circle",
          t: "text",
          s: "smoke",
          r: "area",
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
        event.key.toLowerCase() === "c" &&
        !isTyping
      ) {
        event.preventDefault();
        copySelected();
      }

      if (
        (event.ctrlKey ||
          event.metaKey) &&
        event.key.toLowerCase() === "v" &&
        !isTyping
      ) {
        event.preventDefault();
        pasteClipboard();
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
      id: "smoke",
      label:
        c.markerNames.smoke,
      icon: "☁",
      shortcut: "S",
    },
    {
      id: "area",
      label: c.area,
      icon: "▧",
      shortcut: "R",
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

            <div
              className="tactics-board-stage"
              ref={boardStageRef}
            >
              <div className="tactics-board-glow" />

              <div className="tactics-board-controls">
                <button
                  type="button"
                  onClick={centerBoard}
                  title={c.centerBoard}
                  aria-label={c.centerBoard}
                >
                  ◎
                </button>

                <button
                  type="button"
                  onClick={() =>
                    zoomBoard(0.1)
                  }
                  title={c.zoomIn}
                  aria-label={c.zoomIn}
                >
                  +
                </button>

                <button
                  type="button"
                  onClick={() =>
                    zoomBoard(-0.1)
                  }
                  title={c.zoomOut}
                  aria-label={c.zoomOut}
                >
                  −
                </button>

                <button
                  type="button"
                  onClick={
                    toggleFullscreen
                  }
                  title={
                    document.fullscreenElement
                      ? c.exitFullscreen
                      : c.fullscreen
                  }
                  aria-label={
                    document.fullscreenElement
                      ? c.exitFullscreen
                      : c.fullscreen
                  }
                >
                  ⛶
                </button>
              </div>

              <div
                className="tactics-board-shell tactics-board-shell--v3"
                style={{
                  transform:
                    `scale(${zoom})`,
                }}
              >
                <img
                  className="tactics-radar"
                  src={radarUrl}
                  crossOrigin="anonymous"
                  alt={currentMap.name}
                  draggable="false"
                />

                <svg
                  ref={overlayRef}
                  className="tactics-overlay"
                  viewBox="0 0 1000 1000"
                  preserveAspectRatio="none"
                  onPointerDown={handlePointerDown}
                  onPointerMove={handlePointerMove}
                  onPointerUp={handlePointerUp}
                  onPointerCancel={handlePointerUp}
                >
                  <defs>
                    <filter id="tactics-smoke-soft" x="-100%" y="-100%" width="300%" height="300%">
                      <feGaussianBlur stdDeviation="13" />
                    </filter>
                    <filter id="tactics-smoke-core" x="-100%" y="-100%" width="300%" height="300%">
                      <feGaussianBlur stdDeviation="7" />
                    </filter>
                    <filter id="tactics-flash-soft" x="-100%" y="-100%" width="300%" height="300%">
                      <feGaussianBlur stdDeviation="2.5" result="glow" />
                      <feMerge>
                        <feMergeNode in="glow" />
                        <feMergeNode in="SourceGraphic" />
                      </feMerge>
                    </filter>
                    <filter id="tactics-he-soft" x="-100%" y="-100%" width="300%" height="300%">
                      <feGaussianBlur stdDeviation="1.6" result="glow" />
                      <feMerge>
                        <feMergeNode in="glow" />
                        <feMergeNode in="SourceGraphic" />
                      </feMerge>
                    </filter>
                    <filter id="tactics-molotov-soft" x="-90%" y="-90%" width="280%" height="280%">
                      <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="#e98769" floodOpacity="0.5" />
                    </filter>
                  </defs>

                  {visibleItems.map(
                    (item) => (
                      <BoardItem
                        key={item.id}
                        item={item}
                        selected={
                          item.id === selectedId
                        }
                        onItemPointerDown={
                          beginItemDrag
                        }
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
                    className={[
                      `tactics-object-button tactics-object-button--${type}`,
                      tool === "marker" &&
                      markerType === type
                        ? "active"
                        : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
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
                      <TacticalObjectIcon type={type} />
                    </span>
                  </button>
                ))}
              </div>
            </section>

            {selectedItem ? (
              <section className="tactics-panel-card tactics-selected-card">
                <div className="tactics-panel-title">
                  <span aria-hidden="true">◇</span>
                  <strong>{c.selectedObject}</strong>
                </div>

                <div className="tactics-selected-summary">
                  <span>
                    {isEffectMarker(selectedItem)
                      ? c.markerNames[selectedItem.marker]
                      : c.itemTypes[selectedItem.type] ||
                        c.markerNames[selectedItem.marker] ||
                        selectedItem.type}
                  </span>

                  <small>{c.moveHint}</small>
                </div>

                {(isEffectMarker(selectedItem) ||
                  selectedItem.type === "marker") ? (
                  <label className="tactics-selected-slider">
                    <span>
                      {c.size}
                      <strong>
                        {Math.round(
                          isEffectMarker(selectedItem)
                            ? getEffectSize(selectedItem)
                            : Number(selectedItem.markerSize) || 24,
                        )}
                      </strong>
                    </span>

                    <input
                      type="range"
                      min={
                        isEffectMarker(selectedItem)
                          ? "16"
                          : "14"
                      }
                      max={
                        isEffectMarker(selectedItem)
                          ? "90"
                          : "52"
                      }
                      step="1"
                      value={
                        isEffectMarker(selectedItem)
                          ? getEffectSize(selectedItem)
                          : Number(selectedItem.markerSize) || 24
                      }
                      onPointerDown={beginInspectorEdit}
                      onPointerUp={finishInspectorEdit}
                      onChange={(event) =>
                        patchSelectedItem(
                          isEffectMarker(selectedItem)
                            ? {
                                effectSize:
                                  Number(event.target.value),
                              }
                            : {
                                markerSize:
                                  Number(event.target.value),
                              },
                        )
                      }
                    />
                  </label>
                ) : null}

                <label className="tactics-selected-slider">
                  <span>
                    {c.opacity}
                    <strong>
                      {Math.round(
                        (
                          Number.isFinite(selectedItem.opacity)
                            ? selectedItem.opacity
                            : 1
                        ) * 100,
                      )}
                      %
                    </strong>
                  </span>

                  <input
                    type="range"
                    min="25"
                    max="100"
                    step="5"
                    value={
                      (
                        Number.isFinite(selectedItem.opacity)
                          ? selectedItem.opacity
                          : 1
                      ) * 100
                    }
                    onPointerDown={beginInspectorEdit}
                    onPointerUp={finishInspectorEdit}
                    onChange={(event) =>
                      patchSelectedItem({
                        opacity:
                          Number(event.target.value) / 100,
                      })
                    }
                  />
                </label>
              </section>
            ) : null}

            <section className="tactics-panel-card">
              <div className="tactics-panel-title">
                <span aria-hidden="true">⌘</span>
                <strong>{c.quickActions}</strong>
              </div>

              <div className="tactics-quick-actions">
                <button
                  type="button"
                  disabled={!selectedItem}
                  onClick={copySelected}
                >
                  <span>⧉</span>
                  {c.copy}
                </button>

                <button
                  type="button"
                  disabled={!clipboardItem}
                  onClick={pasteClipboard}
                >
                  <span>▣</span>
                  {c.paste}
                </button>

                <button
                  type="button"
                  className="tactics-clear-button"
                  disabled={!items.length}
                  onClick={clearBoard}
                >
                  <span>×</span>
                  {c.clear}
                </button>

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
              </div>
            </section>
          </aside>
        </div>
      </div>
    </section>
  );
}
