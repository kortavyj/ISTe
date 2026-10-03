import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { useAuth } from "../auth/AuthContext.jsx";
import useOfficialRoster from "../hooks/useOfficialRoster.js";
import { useLanguage } from "../i18n/LanguageContext.jsx";
import { makeQrMatrix } from "../lib/qrCode.js";
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
const ROUND_CLOCK_START = 115;
const ROUND_CLOCK_END = 0;

const ROUND_CLOCK_TICKS = [
  115,
  90,
  60,
  30,
  0,
];

const DEFAULT_STAGES = Object.freeze([
  {
    id: "spawn",
    name: "Spawn",
    duration: 3,
  },
  {
    id: "setup",
    name: "Setup",
    duration: 3,
  },
  {
    id: "execute",
    name: "Execute",
    duration: 3,
  },
  {
    id: "postplant",
    name: "Post-plant",
    duration: 3,
  },
]);

const PRESET_TEMPLATES = Object.freeze([
  {
    id: "preset-default",
    title: "Default",
    stages: [
      { id: "spawn", name: "Spawn", duration: 4 },
      { id: "setup", name: "Setup", duration: 6 },
      { id: "execute", name: "Execute", duration: 5 },
      { id: "postplant", name: "Post-plant", duration: 5 },
    ],
  },
  {
    id: "preset-fast-a",
    title: "Fast A",
    stages: [
      { id: "spawn", name: "Spawn", duration: 2 },
      { id: "setup", name: "Setup", duration: 3 },
      { id: "execute", name: "Execute", duration: 4 },
      { id: "postplant", name: "Post-plant", duration: 5 },
    ],
  },
  {
    id: "preset-b-execute",
    title: "B Execute",
    stages: [
      { id: "spawn", name: "Spawn", duration: 3 },
      { id: "setup", name: "Setup", duration: 6 },
      { id: "execute", name: "Execute", duration: 5 },
      { id: "postplant", name: "Post-plant", duration: 6 },
    ],
  },
  {
    id: "preset-eco",
    title: "Eco",
    stages: [
      { id: "spawn", name: "Spawn", duration: 3 },
      { id: "setup", name: "Setup", duration: 4 },
      { id: "execute", name: "Execute", duration: 4 },
      { id: "postplant", name: "Post-plant", duration: 4 },
    ],
  },
  {
    id: "preset-anti-eco",
    title: "Anti-eco",
    stages: [
      { id: "spawn", name: "Spawn", duration: 3 },
      { id: "setup", name: "Setup", duration: 6 },
      { id: "execute", name: "Execute", duration: 5 },
      { id: "postplant", name: "Post-plant", duration: 5 },
    ],
  },
  {
    id: "preset-pistol",
    title: "Pistol",
    stages: [
      { id: "spawn", name: "Spawn", duration: 3 },
      { id: "setup", name: "Setup", duration: 4 },
      { id: "execute", name: "Execute", duration: 5 },
      { id: "postplant", name: "Post-plant", duration: 6 },
    ],
  },
  {
    id: "preset-retake",
    title: "Retake",
    stages: [
      { id: "spawn", name: "Positions", duration: 3 },
      { id: "setup", name: "Setup", duration: 5 },
      { id: "execute", name: "Retake", duration: 6 },
      { id: "postplant", name: "Defuse", duration: 4 },
    ],
  },
]);

const LOCALIZED_PRESET_TITLES = {
  uk: {
    "preset-default": "Базовий",
    "preset-fast-a": "Швидкий A",
    "preset-b-execute": "Вихід B",
    "preset-eco": "Еко",
    "preset-anti-eco": "Анти-еко",
    "preset-pistol": "Пістолетний",
    "preset-retake": "Ретейк",
  },
  en: {
    "preset-default": "Default",
    "preset-fast-a": "Fast A",
    "preset-b-execute": "B Execute",
    "preset-eco": "Eco",
    "preset-anti-eco": "Anti-eco",
    "preset-pistol": "Pistol",
    "preset-retake": "Retake",
  },
};

const LOCALIZED_STAGE_NAMES = {
  uk: {
    Spawn: "Старт",
    Setup: "Підготовка",
    Execute: "Вихід",
    "Post-plant": "Після встановлення",
    Positions: "Позиції",
    Retake: "Ретейк",
    Defuse: "Розмінування",
  },
  en: {
    Spawn: "Spawn",
    Setup: "Setup",
    Execute: "Execute",
    "Post-plant": "Post-plant",
    Positions: "Positions",
    Retake: "Retake",
    Defuse: "Defuse",
  },
};

function localizedPresetTitle(
  template,
  language,
) {
  return (
    LOCALIZED_PRESET_TITLES[
      language
    ]?.[template?.id] ||
    template?.title ||
    ""
  );
}

function localizedStageName(
  stage,
  language,
) {
  const raw =
    String(
      stage?.name || "",
    );

  return (
    LOCALIZED_STAGE_NAMES[
      language
    ]?.[raw] ||
    raw
  );
}

const PLAYER_COLORS = [
  "#82b7ff",
  "#f2d56b",
  "#7ce094",
  "#ef8795",
  "#be82ff",
];

function cloneStages(
  stages = DEFAULT_STAGES,
) {
  return stages.map((stage) => ({
    id: String(stage.id),
    name: String(stage.name),
    duration:
      Math.max(
        1,
        Number(stage.duration) || 3,
      ),
  }));
}

function utilityPrefix(type) {
  if (type === "smoke") return "S";
  if (type === "flash") return "F";
  if (type === "he") return "HE";
  if (type === "molotov") return "M";
  return "";
}

function nextUtilityLabel(
  items,
  type,
) {
  const prefix =
    utilityPrefix(type);

  if (!prefix) return "";

  const count =
    items.filter(
      (item) =>
        item.type === "marker" &&
        item.marker === type,
    ).length + 1;

  return `${prefix}${count}`;
}

function playerColor(
  playerId,
  roster,
) {
  const index =
    Math.max(
      0,
      roster.findIndex(
        (player) =>
          player.playerId ===
          playerId,
      ),
    );

  return PLAYER_COLORS[
    index % PLAYER_COLORS.length
  ];
}

function normalizeTiming(value) {
  const text =
    String(value || "")
      .trim();

  if (!text) return "";

  return /^\d:[0-5]\d$/.test(text)
    ? text
    : "";
}

function timingToSeconds(value) {
  const normalized =
    normalizeTiming(value);

  if (!normalized) {
    return null;
  }

  const [
    minutes,
    seconds,
  ] = normalized
    .split(":")
    .map(Number);

  return (
    minutes * 60 +
    seconds
  );
}

function formatRoundClock(value) {
  if (
    !Number.isFinite(value)
  ) {
    return "";
  }

  const seconds =
    Math.max(
      0,
      Math.round(value),
    );

  return `${Math.floor(
    seconds / 60,
  )}:${String(
    seconds % 60,
  ).padStart(2, "0")}`;
}

function roundClockToPercent(
  seconds,
) {
  const clamped =
    clamp(
      Number(seconds),
      ROUND_CLOCK_END,
      ROUND_CLOCK_START,
    );

  return (
    (
      ROUND_CLOCK_START -
      clamped
    ) /
      (
        ROUND_CLOCK_START -
        ROUND_CLOCK_END
      )
  ) * 100;
}

function percentToRoundClock(
  percent,
) {
  const normalized =
    clamp(
      Number(percent) || 0,
      0,
      100,
    ) / 100;

  return Math.round(
    ROUND_CLOCK_START -
      (
        ROUND_CLOCK_START -
        ROUND_CLOCK_END
      ) *
        normalized,
  );
}

function isTimingItem(
  item,
) {
  return Boolean(
    item &&
      (
        item.type === "route" ||
        isEffectMarker(item) ||
        (
          item.type === "marker" &&
          (
            item.marker === "t" ||
            item.marker === "ct"
          )
        )
      ),
  );
}

function timingItemLabel(
  item,
  copy,
) {
  if (!item) return "";

  if (
    isEffectMarker(item)
  ) {
    return (
      item.utilityLabel ||
      copy.markerNames[
        item.marker
      ] ||
      item.marker
    );
  }

  if (
    item.type === "route"
  ) {
    return (
      item.playerName ||
      copy.route
    );
  }

  if (
    item.type === "marker"
  ) {
    return (
      item.playerName ||
      item.label ||
      copy.markerLabels[
        item.marker
      ] ||
      item.marker
    );
  }

  return item.type;
}

function routeMetrics(points) {
  if (
    !Array.isArray(points) ||
    points.length < 2
  ) {
    return {
      total: 0,
      segments: [],
    };
  }

  const segments = [];
  let total = 0;

  for (
    let index = 1;
    index < points.length;
    index += 1
  ) {
    const start =
      points[index - 1];
    const end =
      points[index];
    const length =
      Math.hypot(
        end.x - start.x,
        end.y - start.y,
      );

    segments.push({
      start,
      end,
      length,
      from: total,
      to:
        total + length,
    });

    total += length;
  }

  return {
    total,
    segments,
  };
}

function routePointAtProgress(
  points,
  progress,
) {
  if (
    !Array.isArray(points) ||
    !points.length
  ) {
    return {
      x: 0,
      y: 0,
    };
  }

  if (
    points.length === 1
  ) {
    return points[0];
  }

  const {
    total,
    segments,
  } = routeMetrics(points);

  if (!total) {
    return points[0];
  }

  const distance =
    clamp(
      progress,
      0,
      1,
    ) * total;

  const segment =
    segments.find(
      (entry) =>
        distance <= entry.to,
    ) ||
    segments[
      segments.length - 1
    ];

  const local =
    segment.length
      ? clamp(
          (
            distance -
            segment.from
          ) /
            segment.length,
          0,
          1,
        )
      : 0;

  return {
    x:
      segment.start.x +
      (
        segment.end.x -
        segment.start.x
      ) *
        local,
    y:
      segment.start.y +
      (
        segment.end.y -
        segment.start.y
      ) *
        local,
  };
}

function routePointsAtProgress(
  points,
  progress,
) {
  if (
    !Array.isArray(points) ||
    points.length < 2
  ) {
    return points || [];
  }

  const {
    total,
    segments,
  } = routeMetrics(points);

  if (!total) {
    return [
      points[0],
    ];
  }

  const distance =
    clamp(
      progress,
      0,
      1,
    ) * total;

  const result = [
    points[0],
  ];

  for (
    const segment of segments
  ) {
    if (
      distance >= segment.to
    ) {
      result.push(
        segment.end,
      );
      continue;
    }

    if (
      distance >
      segment.from
    ) {
      const local =
        (
          distance -
          segment.from
        ) /
        segment.length;

      result.push({
        x:
          segment.start.x +
          (
            segment.end.x -
            segment.start.x
          ) *
            local,
        y:
          segment.start.y +
          (
            segment.end.y -
            segment.start.y
          ) *
            local,
      });
    }

    break;
  }

  return result;
}

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

  if (
    item.type === "path" ||
    item.type === "route"
  ) {
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
    openTactic: "Відкрити",
    duplicateTactic: "Дублювати",
    duplicatedOk: "Копію тактики створено.",
    duplicateFailed: "Не вдалося дублювати тактику.",
    makeTeam: "Зробити командною",
    makePrivate: "Зробити приватною",
    visibilityUpdated: "Доступ до тактики оновлено.",
    visibilityUpdateFailed: "Не вдалося змінити доступ.",
    adminTools: "Керування",
    adminAll: "Усі",
    adminTeam: "Командні",
    adminPrivate: "Приватні",
    adminMine: "Мої",
    byAuthor: "Автор",
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
    stages: "Етапи раунду",
    previousStage: "Попередній етап",
    nextStage: "Наступний етап",
    play: "Відтворити",
    pause: "Пауза",
    playbackSpeed: "Швидкість",
    roundClock: "Таймер раунду",
    stageProgress: "Прогрес етапу",
    timingEditor: "Таймлайн раунду",
    timingEditorHint: "Перетягуйте події по шкалі 1:55 → 0:00. Виберіть маршрут, гравця або гранату й натисніть на шкалу, щоб призначити час.",
    timingUntimed: "Без таймінгу",
    timingSelectedHint: "Клік по шкалі призначить час вибраному об'єкту",
    timingNoSelectionHint: "Виберіть об'єкт на карті або перетягніть подію",
    route: "Маршрут",
    roster: "Гравець ISTe",
    noPlayer: "Без прив'язки",
    playerRole: "Роль",
    timing: "Таймінг",
    timingPlaceholder: "1:35",
    from: "Звідки",
    fromPlaceholder: "Наприклад: T Ramp",
    purpose: "Завдання",
    purposePlaceholder: "Наприклад: перекрити CT",
    utilityNumber: "Номер гранати",
    templates: "Шаблони",
    presetTemplates: "Готові",
    customTemplates: "Мої",
    noCustomTemplates: "Власних шаблонів поки немає.",
    saveAsTemplate: "Зберегти як шаблон",
    savingTemplate: "Збереження...",
    templateSaved: "Шаблон збережено.",
    templateApplied: "Шаблон застосовано. Збережіть його як нову тактику.",
    deleteTemplate: "Видалити шаблон",
    presentation: "Презентація",
    exitPresentation: "Вийти з презентації",
    presentationHint: "← → етапи · Space Play/Pause · Esc вихід",
    share: "Поділитися",
    shareTitle: "Приватне посилання",
    shareSaveFirst: "Спочатку збережіть тактику, щоб створити посилання.",
    shareExpiry: "Термін дії",
    expiry24h: "24 години",
    expiry7d: "7 днів",
    expiry30d: "30 днів",
    expiryNever: "Без обмеження",
    createShare: "Створити посилання",
    creatingShare: "Створення...",
    copyShare: "Копіювати",
    copiedShare: "Скопійовано",
    revokeShare: "Відкликати",
    noShares: "Активних посилань поки немає.",
    shareLoadFailed: "Не вдалося завантажити посилання.",
    shareCreateFailed: "Не вдалося створити посилання.",
    shareRevokeFailed: "Не вдалося відкликати посилання.",
    shareViewOnly: "Лише перегляд",
    expires: "Діє до",
    neverExpires: "Безстроково",
    exportPdf: "PDF",
    pdfHint: "Відкриється системне вікно друку. Оберіть «Зберегти як PDF».",
    printUtility: "Гранати та таймінги",
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
      route: "Маршрут",
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
    openTactic: "Open",
    duplicateTactic: "Duplicate",
    duplicatedOk: "Tactic copy created.",
    duplicateFailed: "Could not duplicate the tactic.",
    makeTeam: "Make team-visible",
    makePrivate: "Make private",
    visibilityUpdated: "Tactic visibility updated.",
    visibilityUpdateFailed: "Could not update visibility.",
    adminTools: "Management",
    adminAll: "All",
    adminTeam: "Team",
    adminPrivate: "Private",
    adminMine: "Mine",
    byAuthor: "Author",
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
    stages: "Round stages",
    previousStage: "Previous stage",
    nextStage: "Next stage",
    play: "Play",
    pause: "Pause",
    playbackSpeed: "Speed",
    roundClock: "Round timer",
    stageProgress: "Stage progress",
    timingEditor: "Round timeline",
    timingEditorHint: "Drag events across the 1:55 → 0:00 ruler. Select a route, player or utility and click the ruler to assign its time.",
    timingUntimed: "Untimed",
    timingSelectedHint: "Click the ruler to assign time to the selected object",
    timingNoSelectionHint: "Select an object on the map or drag an event",
    route: "Route",
    roster: "ISTe player",
    noPlayer: "Unassigned",
    playerRole: "Role",
    timing: "Timing",
    timingPlaceholder: "1:35",
    from: "From",
    fromPlaceholder: "Example: T Ramp",
    purpose: "Purpose",
    purposePlaceholder: "Example: block CT",
    utilityNumber: "Utility number",
    templates: "Templates",
    presetTemplates: "Presets",
    customTemplates: "My templates",
    noCustomTemplates: "No custom templates yet.",
    saveAsTemplate: "Save as template",
    savingTemplate: "Saving...",
    templateSaved: "Template saved.",
    templateApplied: "Template applied. Save it as a new tactic.",
    deleteTemplate: "Delete template",
    presentation: "Presentation",
    exitPresentation: "Exit presentation",
    presentationHint: "← → stages · Space Play/Pause · Esc exit",
    share: "Share",
    shareTitle: "Private share link",
    shareSaveFirst: "Save the tactic first to create a share link.",
    shareExpiry: "Expiry",
    expiry24h: "24 hours",
    expiry7d: "7 days",
    expiry30d: "30 days",
    expiryNever: "Never",
    createShare: "Create link",
    creatingShare: "Creating...",
    copyShare: "Copy",
    copiedShare: "Copied",
    revokeShare: "Revoke",
    noShares: "No active share links yet.",
    shareLoadFailed: "Could not load share links.",
    shareCreateFailed: "Could not create share link.",
    shareRevokeFailed: "Could not revoke share link.",
    shareViewOnly: "View only",
    expires: "Expires",
    neverExpires: "Never expires",
    exportPdf: "PDF",
    pdfHint: "The system print dialog will open. Choose “Save as PDF”.",
    printUtility: "Utility and timings",
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
      route: "Route",
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
    const tooltip = [
      item.utilityLabel,
      item.playerName,
      item.timing,
      item.from,
      item.purpose,
    ]
      .filter(Boolean)
      .join(" · ");

    return (
      <g
        className={
          item.playbackVisible
            ? "tactics-playback-utility"
            : undefined
        }
      >
        <title>{tooltip}</title>

        <EffectMarker
          item={item}
          selected={selected}
          common={common}
        />

        {item.utilityLabel ? (
          <g
            transform={
              `translate(${item.x + getEffectSize(item) * 0.48} ${item.y - getEffectSize(item) * 0.48})`
            }
            pointerEvents="none"
          >
            <circle
              r="12"
              fill="rgba(10,13,18,0.94)"
              stroke="#ffffff"
              strokeWidth="2"
            />
            <text
              y="4"
              textAnchor="middle"
              fill="#ffffff"
              fontSize="9"
              fontWeight="1000"
            >
              {item.utilityLabel}
            </text>
          </g>
        ) : null}
      </g>
    );
  }

  if (item.type === "route") {
    if (
      !Array.isArray(item.points) ||
      item.points.length < 2
    ) {
      return null;
    }

    const first =
      item.points[0];

    const routeProgress =
      Number.isFinite(
        item.playbackProgress,
      )
        ? clamp(
            item.playbackProgress,
            0,
            1,
          )
        : 1;

    const animated =
      Number.isFinite(
        item.playbackProgress,
      );

    const partialPoints =
      routePointsAtProgress(
        item.points,
        routeProgress,
      );

    const movingPoint =
      routePointAtProgress(
        item.points,
        routeProgress,
      );

    const labelPoint =
      animated
        ? movingPoint
        : first;

    const baseOpacity =
      Number.isFinite(
        item.opacity,
      )
        ? item.opacity
        : 0.92;

    return (
      <g {...common}>
        {animated ? (
          <polyline
            points={item.points
              .map(
                (point) =>
                  `${point.x},${point.y}`,
              )
              .join(" ")}
            fill="none"
            stroke={item.color}
            strokeWidth="6"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray="13 10"
            opacity={
              baseOpacity * 0.2
            }
            pointerEvents="none"
          />
        ) : null}

        {partialPoints.length >
        1 ? (
          <polyline
            points={partialPoints
              .map(
                (point) =>
                  `${point.x},${point.y}`,
              )
              .join(" ")}
            fill="none"
            stroke={item.color}
            strokeWidth={
              selected ? 11 : 8
            }
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity={baseOpacity}
          />
        ) : null}

        {item.points.map(
          (point, index) => (
            <circle
              key={
                `${item.id}-point-${index}`
              }
              cx={point.x}
              cy={point.y}
              r={index === 0 ? 7 : 4}
              fill={item.color}
              stroke="#101419"
              strokeWidth="3"
              opacity={
                animated
                  ? 0.34
                  : 1
              }
              pointerEvents="none"
            />
          ),
        )}

        <circle
          className={
            animated
              ? "tactics-route-player"
              : undefined
          }
          cx={movingPoint.x}
          cy={movingPoint.y}
          r={animated ? 12 : 10}
          fill={item.color}
          stroke="#ffffff"
          strokeWidth="3"
          pointerEvents="none"
        />

        {item.playerName ? (
          <g
            transform={
              `translate(${labelPoint.x + 15} ${labelPoint.y - 15})`
            }
            pointerEvents="none"
          >
            <rect
              x="0"
              y="-17"
              width={
                Math.max(
                  54,
                  item.playerName.length * 8 + 18,
                )
              }
              height="25"
              rx="8"
              fill="rgba(9,12,16,0.92)"
              stroke={item.color}
              strokeWidth="2"
            />
            <text
              x="9"
              y="0"
              fill="#ffffff"
              fontSize="13"
              fontWeight="900"
            >
              {item.playerName}
            </text>
          </g>
        ) : null}
      </g>
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
  if (item.type === "route") {
    if (
      !Array.isArray(item.points) ||
      item.points.length < 2
    ) {
      return;
    }

    context.globalAlpha =
      Number.isFinite(item.opacity)
        ? item.opacity
        : 0.92;
    context.strokeStyle =
      item.color || "#82b7ff";
    context.fillStyle =
      item.color || "#82b7ff";
    context.lineWidth =
      8 * scale;
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

    item.points.forEach(
      (point, index) => {
        context.beginPath();
        context.arc(
          point.x * scale,
          point.y * scale,
          (index === 0 ? 7 : 4) * scale,
          0,
          Math.PI * 2,
        );
        context.fill();
      },
    );

    context.globalAlpha = 1;
    return;
  }

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

function QrCode({
  value,
}) {
  const path =
    useMemo(() => {
      if (!value) {
        return "";
      }

      const matrix =
        makeQrMatrix(
          value,
        );

      const commands = [];

      matrix.forEach(
        (row, y) => {
          row.forEach(
            (dark, x) => {
              if (!dark) {
                return;
              }

              commands.push(
                `M${x + 4} ${y + 4}h1v1h-1z`,
              );
            },
          );
        },
      );

      return commands.join("");
    }, [value]);

  return (
    <svg
      className="tactics-share-qr"
      viewBox="0 0 45 45"
      role="img"
      aria-label="QR"
      shapeRendering="crispEdges"
    >
      <rect
        width="45"
        height="45"
        fill="#ffffff"
      />
      <path
        d={path}
        fill="#080b0f"
      />
    </svg>
  );
}

function TacticPrintReport({
  title,
  mapName,
  radarUrl,
  stages,
  items,
  copy,
  language,
}) {
  return (
    <div className="tactics-print-report">
      {stages.map(
        (stage, index) => {
          const stageItems =
            items.filter(
              (item) =>
                (
                  item.stageId ||
                  "setup"
                ) ===
                stage.id,
            );

          const utility =
            stageItems.filter(
              (item) =>
                isEffectMarker(
                  item,
                ),
            );

          return (
            <section
              className="tactics-print-page"
              key={
                stage.id
              }
            >
              <header>
                <div>
                  <span>
                    ISTe ·{" "}
                    {mapName}
                  </span>
                  <h1>
                    {title ||
                      mapName}
                  </h1>
                </div>

                <strong>
                  {String(
                    index + 1,
                  ).padStart(
                    2,
                    "0",
                  )}
                  {" · "}
                  {localizedStageName(
                    stage,
                    language,
                  )}
                </strong>
              </header>

              <div className="tactics-print-board">
                <img
                  src={radarUrl}
                  alt={mapName}
                />

                <svg
                  viewBox="0 0 1000 1000"
                  preserveAspectRatio="none"
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

                  {stageItems.map(
                    (item) => (
                      <BoardItem
                        key={
                          item.id
                        }
                        item={
                          item
                        }
                        selected={
                          false
                        }
                        onItemPointerDown={
                          () => {}
                        }
                        copy={
                          copy
                        }
                      />
                    ),
                  )}
                </svg>
              </div>

              <div className="tactics-print-utility">
                <h2>
                  {copy.printUtility}
                </h2>

                {utility.length ? (
                  <table>
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>
                          {copy.roster}
                        </th>
                        <th>
                          {copy.timing}
                        </th>
                        <th>
                          {copy.from}
                        </th>
                        <th>
                          {copy.purpose}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {utility.map(
                        (item) => (
                          <tr
                            key={
                              item.id
                            }
                          >
                            <td>
                              {item.utilityLabel ||
                                "—"}
                            </td>
                            <td>
                              {item.playerName ||
                                "—"}
                            </td>
                            <td>
                              {item.timing ||
                                "—"}
                            </td>
                            <td>
                              {item.from ||
                                "—"}
                            </td>
                            <td>
                              {item.purpose ||
                                "—"}
                            </td>
                          </tr>
                        ),
                      )}
                    </tbody>
                  </table>
                ) : (
                  <p>—</p>
                )}
              </div>
            </section>
          );
        },
      )}
    </div>
  );
}

export default function PlayerTactics() {
  const { language } =
    useLanguage();

  const {
    user,
    profile,
    role,
  } = useAuth();

  const c =
    COPY[language] || COPY.uk;

  const {
    stats: rosterStats,
  } = useOfficialRoster();

  const roster =
    useMemo(
      () =>
        (Array.isArray(
          rosterStats?.roster,
        )
          ? rosterStats.roster
          : []
        ).filter(
          (player) =>
            !player.rosterStatus ||
            player.rosterStatus === "main" ||
            player.rosterStatus === "substitute",
        ),
      [rosterStats?.roster],
    );

  const [tactics, setTactics] =
    useState([]);
  const [templates, setTemplates] =
    useState([]);
  const [searchQuery, setSearchQuery] =
    useState("");
  const [adminFilter, setAdminFilter] =
    useState("all");
  const [openMenuId, setOpenMenuId] =
    useState("");
  const [actionTacticId, setActionTacticId] =
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
  const [stages, setStages] =
    useState(() =>
      cloneStages(),
    );
  const [activeStageId, setActiveStageId] =
    useState("spawn");
  const [isPlaying, setIsPlaying] =
    useState(false);
  const [playbackProgress, setPlaybackProgress] =
    useState(0);
  const [playbackSpeed, setPlaybackSpeed] =
    useState(1);
  const [presentationMode, setPresentationMode] =
    useState(false);
  const [savingTemplate, setSavingTemplate] =
    useState(false);
  const [shareOpen, setShareOpen] =
    useState(false);
  const [shares, setShares] =
    useState([]);
  const [shareExpiry, setShareExpiry] =
    useState("7d");
  const [shareLoading, setShareLoading] =
    useState(false);
  const [shareCreating, setShareCreating] =
    useState(false);
  const [copiedShareId, setCopiedShareId] =
    useState("");
  const [selectedPlayerId, setSelectedPlayerId] =
    useState("");
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
  const playbackFrameRef =
    useRef(null);
  const playbackProgressRef =
    useRef(0);
  const timingTrackRef =
    useRef(null);
  const timingDragRef =
    useRef(null);

  const currentMap =
    MAPS[mapId] || MAPS.mirage;

  const radarUrl =
    mapId === "nuke" &&
    layer === "lower" &&
    currentMap.lowerRadar
      ? currentMap.lowerRadar
      : currentMap.radar;


  const isTacticsManager =
    [
      "game_manager",
      "admin",
      "owner",
    ].includes(role);

  const canManageTactic =
    (tactic) =>
      Boolean(
        tactic &&
          (
            tactic.authorId ===
              user?.id ||
            isTacticsManager
          ),
      );

  const liveEnabled =
    Boolean(activeId) &&
    visibility === "team";

  useEffect(() => {
    if (!openMenuId) {
      return undefined;
    }

    function closeMenu(
      event,
    ) {
      if (
        event.type === "keydown" &&
        event.key !== "Escape"
      ) {
        return;
      }

      if (
        event.type === "pointerdown" &&
        event.target.closest?.(
          ".tactics-saved-menu-wrap",
        )
      ) {
        return;
      }

      setOpenMenuId("");
    }

    document.addEventListener(
      "pointerdown",
      closeMenu,
    );
    document.addEventListener(
      "keydown",
      closeMenu,
    );

    return () => {
      document.removeEventListener(
        "pointerdown",
        closeMenu,
      );
      document.removeEventListener(
        "keydown",
        closeMenu,
      );
    };
  }, [openMenuId]);

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
            Array.isArray(
              payload.stages,
            ) &&
            payload.stages.length
          ) {
            setStages(
              cloneStages(
                payload.stages,
              ),
            );
          }

          if (
            typeof payload.activeStageId ===
              "string"
          ) {
            setActiveStageId(
              payload.activeStageId,
            );
            playbackProgressRef.current =
              0;
            setPlaybackProgress(0);
            setIsPlaying(false);
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
              stages,
              activeStageId,
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
    stages,
    activeStageId,
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

        const entries =
          Array.isArray(result.tactics)
            ? result.tactics
            : [];

        setTactics(
          entries.filter(
            (entry) =>
              entry.boardState
                ?.isTemplate !== true,
          ),
        );

        setTemplates(
          entries.filter(
            (entry) =>
              entry.boardState
                ?.isTemplate === true,
          ),
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

    const clone = {
      ...cloneWithOffset(
        structuredClone(
          clipboardItem,
        ),
      ),
      stageId:
        activeStageId,
    };

    commitItems(
      [...items, clone],
      clone.id,
    );
  }

  function clearBoard() {
    const stageItems =
      items.filter(
        (item) =>
          (item.stageId ||
            "setup") ===
          activeStageId,
      );

    if (
      !stageItems.length ||
      !window.confirm(
        c.confirmClear,
      )
    ) {
      return;
    }

    commitItems(
      items.filter(
        (item) =>
          (item.stageId ||
            "setup") !==
          activeStageId,
      ),
    );
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

  function timingSecondsFromClientX(
    clientX,
  ) {
    const rect =
      timingTrackRef.current
        ?.getBoundingClientRect();

    if (
      !rect ||
      !rect.width
    ) {
      return null;
    }

    const percent =
      clamp(
        (
          (
            clientX -
            rect.left
          ) /
            rect.width
        ) *
          100,
        0,
        100,
      );

    return percentToRoundClock(
      percent,
    );
  }

  function applyItemTiming(
    itemId,
    seconds,
    snapshot = null,
  ) {
    if (
      !itemId ||
      !Number.isFinite(
        seconds,
      )
    ) {
      return;
    }

    const timing =
      formatRoundClock(
        seconds,
      );

    if (snapshot) {
      setItems(
        snapshot.map(
          (item) =>
            item.id === itemId
              ? {
                  ...item,
                  timing,
                }
              : item,
        ),
      );

      return;
    }

    commitItems(
      items.map(
        (item) =>
          item.id === itemId
            ? {
                ...item,
                timing,
              }
            : item,
      ),
      itemId,
    );
  }

  function handleTimingTrackPointerDown(
    event,
  ) {
    if (
      event.button !== undefined &&
      event.button !== 0
    ) {
      return;
    }

    if (
      event.target !==
      event.currentTarget
    ) {
      return;
    }

    const seconds =
      timingSecondsFromClientX(
        event.clientX,
      );

    if (
      !Number.isFinite(
        seconds,
      )
    ) {
      return;
    }

    setIsPlaying(false);

    const selected =
      items.find(
        (item) =>
          item.id ===
          selectedId,
      );

    if (
      selected &&
      isTimingItem(
        selected,
      )
    ) {
      applyItemTiming(
        selected.id,
        seconds,
      );

      return;
    }

    setStagePlaybackProgress(
      roundClockToPercent(
        seconds,
      ) / 100,
    );
  }

  function beginTimingDrag(
    event,
    item,
  ) {
    if (
      event.button !== undefined &&
      event.button !== 0
    ) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    setIsPlaying(false);
    setSelectedId(
      item.id,
    );

    timingDragRef.current = {
      id: item.id,
      snapshot: items,
    };

    event.currentTarget
      .setPointerCapture?.(
        event.pointerId,
      );

    const seconds =
      timingSecondsFromClientX(
        event.clientX,
      );

    if (
      Number.isFinite(
        seconds,
      )
    ) {
      applyItemTiming(
        item.id,
        seconds,
        items,
      );
    }
  }

  function moveTimingDrag(
    event,
  ) {
    const drag =
      timingDragRef.current;

    if (!drag) return;

    const seconds =
      timingSecondsFromClientX(
        event.clientX,
      );

    if (
      !Number.isFinite(
        seconds,
      )
    ) {
      return;
    }

    applyItemTiming(
      drag.id,
      seconds,
      drag.snapshot,
    );
  }

  function finishTimingDrag() {
    const drag =
      timingDragRef.current;

    if (!drag) return;

    timingDragRef.current =
      null;

    setPast(
      (current) => [
        ...current,
        drag.snapshot,
      ],
    );

    setFuture([]);
  }

  function setStagePlaybackProgress(
    value,
  ) {
    const next =
      clamp(
        Number(value) || 0,
        0,
        1,
      );

    playbackProgressRef.current =
      next;

    setPlaybackProgress(
      next,
    );
  }

  function togglePlayback() {
    if (isPlaying) {
      setIsPlaying(false);
      return;
    }

    if (
      playbackProgressRef.current >=
      0.999
    ) {
      setStagePlaybackProgress(0);
    }

    setSelectedId("");
    setDraft(null);
    setIsPlaying(true);
  }

  function selectStage(
    stageId,
  ) {
    if (
      !stages.some(
        (stage) =>
          stage.id === stageId,
      )
    ) {
      return;
    }

    setActiveStageId(stageId);
    setIsPlaying(false);
    setStagePlaybackProgress(0);
    setSelectedId("");
    setDraft(null);
    setPast([]);
    setFuture([]);
  }

  function moveStage(direction) {
    const index =
      stages.findIndex(
        (stage) =>
          stage.id ===
          activeStageId,
      );

    const nextIndex =
      clamp(
        index + direction,
        0,
        stages.length - 1,
      );

    selectStage(
      stages[nextIndex]?.id ||
        stages[0]?.id,
    );
  }

  useEffect(() => {
    if (!isPlaying) {
      if (
        playbackFrameRef.current
      ) {
        window.cancelAnimationFrame(
          playbackFrameRef.current,
        );

        playbackFrameRef.current =
          null;
      }

      return undefined;
    }

    const index =
      stages.findIndex(
        (stage) =>
          stage.id ===
          activeStageId,
      );

    const current =
      stages[index];

    if (!current) {
      setIsPlaying(false);
      return undefined;
    }

    const durationMs =
      Math.max(
        500,
        (
          Math.max(
            1,
            Number(
              current.duration,
            ) || 3,
          ) *
          1000
        ) /
          playbackSpeed,
      );

    const startProgress =
      playbackProgressRef.current;

    const startedAt =
      performance.now();

    function tick(now) {
      const elapsed =
        now - startedAt;

      const next =
        startProgress +
        (
          elapsed /
          durationMs
        ) *
          (
            1 -
            startProgress
          );

      if (next >= 1) {
        if (
          index >=
          stages.length - 1
        ) {
          setStagePlaybackProgress(
            1,
          );
          setIsPlaying(false);
          playbackFrameRef.current =
            null;
          return;
        }

        setStagePlaybackProgress(
          0,
        );
        setActiveStageId(
          stages[
            index + 1
          ].id,
        );
        setSelectedId("");
        playbackFrameRef.current =
          null;
        return;
      }

      setStagePlaybackProgress(
        next,
      );

      playbackFrameRef.current =
        window.requestAnimationFrame(
          tick,
        );
    }

    playbackFrameRef.current =
      window.requestAnimationFrame(
        tick,
      );

    return () => {
      if (
        playbackFrameRef.current
      ) {
        window.cancelAnimationFrame(
          playbackFrameRef.current,
        );

        playbackFrameRef.current =
          null;
      }
    };
  }, [
    activeStageId,
    isPlaying,
    playbackSpeed,
    stages,
  ]);

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
    setStages(
      cloneStages(),
    );
    setActiveStageId(
      "spawn",
    );
    setIsPlaying(false);
    setStagePlaybackProgress(0);
    setPresentationMode(false);
    setShareOpen(false);
    setShares([]);
    setSelectedPlayerId("");
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

    const savedStages =
      Array.isArray(state.stages) &&
      state.stages.length
        ? cloneStages(
            state.stages,
          )
        : cloneStages();

    const legacy =
      !Array.isArray(
        state.stages,
      );

    const loadedItems =
      Array.isArray(state.items)
        ? state.items.map(
            (item) => ({
              ...item,
              stageId:
                item.stageId ||
                "setup",
            }),
          )
        : [];

    setStages(savedStages);
    setActiveStageId(
      state.activeStageId ||
        (legacy
          ? "setup"
          : savedStages[0]?.id ||
            "spawn"),
    );
    setIsPlaying(false);
    setStagePlaybackProgress(0);
    setShareOpen(false);
    setShares([]);
    setItems(
      loadedItems,
    );

    setError("");
    setNotice("");
    resetHistory();
  }

  function applyTemplate(
    template,
  ) {
    const state =
      template.boardState || {};

    const templateStages =
      Array.isArray(
        template.stages,
      )
        ? cloneStages(
            template.stages,
          )
        : Array.isArray(
              state.stages,
            ) &&
            state.stages.length
          ? cloneStages(
              state.stages,
            )
          : cloneStages();

    const templateItems =
      Array.isArray(
        state.items,
      )
        ? state.items.map(
            (item) => ({
              ...structuredClone(
                item,
              ),
              id: makeId(),
            }),
          )
        : [];

    setActiveId("");
    setTitle(
      localizedPresetTitle(
        template,
        language,
      ),
    );
    setMapId(
      template.mapId ||
        mapId ||
        "mirage",
    );
    setVisibility("team");
    setLayer(
      state.layer ||
        "upper",
    );
    setStages(
      templateStages,
    );
    setActiveStageId(
      templateStages[0]?.id ||
        "spawn",
    );
    setItems(
      templateItems,
    );
    setIsPlaying(false);
    setStagePlaybackProgress(0);
    setPresentationMode(false);
    setSelectedId("");
    setSelectedPlayerId("");
    setTool("select");
    resetHistory();
    setError("");
    setNotice(
      c.templateApplied,
    );
  }

  async function saveAsTemplate() {
    if (!title.trim()) {
      setError(c.titleRequired);
      setNotice("");
      return;
    }

    setSavingTemplate(true);
    setError("");
    setNotice("");

    try {
      await apiRequest(
        "save",
        {
          method: "POST",
          body: {
            id: "",
            title:
              title.trim(),
            mapId,
            visibility:
              "private",
            boardState: {
              items,
              stages,
              activeStageId,
              layer,
              isTemplate: true,
              sourceTacticId:
                activeId || "",
            },
          },
        },
      );

      setNotice(
        c.templateSaved,
      );

      await loadTactics();
    } catch {
      setError(
        c.saveFailed,
      );
    } finally {
      setSavingTemplate(false);
    }
  }

  async function deleteTemplate(
    template,
  ) {
    if (
      !template?.id ||
      !window.confirm(
        `${c.deleteTemplate}: ${template.title}?`,
      )
    ) {
      return;
    }

    setError("");
    setNotice("");

    try {
      await apiRequest(
        "delete",
        {
          method: "POST",
          body: {
            id: template.id,
          },
        },
      );

      await loadTactics();
    } catch {
      setError(
        c.deleteFailed,
      );
    }
  }

  function enterPresentation() {
    setSelectedId("");
    setDraft(null);
    setTool("select");
    setStagePlaybackProgress(0);
    setPresentationMode(true);
  }

  function exitPresentation() {
    setIsPlaying(false);
    setPresentationMode(false);
  }

  function shareUrl(
    token,
  ) {
    return `${window.location.origin}/tactics/share/${token}`;
  }

  async function loadShares() {
    if (!activeId) {
      return;
    }

    setShareLoading(true);

    try {
      const result =
        await apiRequest(
          "share-list",
          {
            method: "POST",
            body: {
              id: activeId,
            },
          },
        );

      setShares(
        Array.isArray(
          result.shares,
        )
          ? result.shares
          : [],
      );
    } catch {
      setError(
        c.shareLoadFailed,
      );
    } finally {
      setShareLoading(false);
    }
  }

  async function openShareDialog() {
    if (!activeId) {
      setError(
        c.shareSaveFirst,
      );
      setNotice("");
      return;
    }

    setError("");
    setShareOpen(true);
    await loadShares();
  }

  async function createShare() {
    if (!activeId) {
      return;
    }

    setShareCreating(true);
    setError("");

    try {
      const result =
        await apiRequest(
          "share-create",
          {
            method: "POST",
            body: {
              id: activeId,
              expiresIn:
                shareExpiry,
            },
          },
        );

      setShares(
        (current) => [
          result.share,
          ...current,
        ],
      );
    } catch {
      setError(
        c.shareCreateFailed,
      );
    } finally {
      setShareCreating(false);
    }
  }

  async function revokeShare(
    shareId,
  ) {
    try {
      await apiRequest(
        "share-revoke",
        {
          method: "POST",
          body: {
            shareId,
          },
        },
      );

      setShares(
        (current) =>
          current.filter(
            (share) =>
              share.id !==
              shareId,
          ),
      );
    } catch {
      setError(
        c.shareRevokeFailed,
      );
    }
  }

  async function copyShare(
    share,
  ) {
    const url =
      shareUrl(
        share.token,
      );

    try {
      await navigator
        .clipboard
        .writeText(url);

      setCopiedShareId(
        share.id,
      );

      window.setTimeout(
        () => {
          setCopiedShareId(
            "",
          );
        },
        1600,
      );
    } catch {
      setError(
        c.shareLoadFailed,
      );
    }
  }

  function exportPdf() {
    setNotice(
      c.pdfHint,
    );

    window.setTimeout(
      () => {
        window.print();
      },
      80,
    );
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
                stages,
                activeStageId,
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

      items
        .filter(
          (item) =>
            (item.stageId ||
              "setup") ===
            activeStageId,
        )
        .forEach((item) => {
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

  async function deleteTacticById(
    tactic,
  ) {
    if (
      !tactic?.id ||
      !canManageTactic(
        tactic,
      )
    ) {
      return;
    }

    if (
      !window.confirm(
        `${c.confirmDelete}\n\n${tactic.title}`,
      )
    ) {
      return;
    }

    setActionTacticId(
      tactic.id,
    );
    setOpenMenuId("");
    setError("");
    setNotice("");

    try {
      await apiRequest(
        "delete",
        {
          method: "POST",
          body: {
            id: tactic.id,
          },
        },
      );

      if (
        activeId ===
        tactic.id
      ) {
        createNew();
      }

      setNotice(
        c.deletedOk,
      );

      await loadTactics();
    } catch {
      setError(
        c.deleteFailed,
      );
    } finally {
      setActionTacticId(
        "",
      );
    }
  }

  async function duplicateTactic(
    tactic,
  ) {
    if (!tactic?.id) {
      return;
    }

    setActionTacticId(
      tactic.id,
    );
    setOpenMenuId("");
    setError("");
    setNotice("");

    try {
      const result =
        await apiRequest(
          "save",
          {
            method: "POST",
            body: {
              id: "",
              title:
                `${tactic.title} ${language === "en" ? "copy" : "копія"}`
                  .slice(
                    0,
                    100,
                  ),
              mapId:
                tactic.mapId,
              visibility:
                "private",
              boardState:
                structuredClone(
                  tactic.boardState || {
                    items: [],
                    layer: "upper",
                  },
                ),
            },
          },
        );

      await loadTactics();

      setNotice(
        c.duplicatedOk,
      );

      if (
        result?.tactic
      ) {
        openTactic(
          result.tactic,
        );
      }
    } catch {
      setError(
        c.duplicateFailed,
      );
    } finally {
      setActionTacticId(
        "",
      );
    }
  }

  async function quickSetVisibility(
    tactic,
    nextVisibility,
  ) {
    if (
      !tactic?.id ||
      !canManageTactic(
        tactic,
      )
    ) {
      return;
    }

    setActionTacticId(
      tactic.id,
    );
    setOpenMenuId("");
    setError("");
    setNotice("");

    try {
      await apiRequest(
        "save",
        {
          method: "POST",
          body: {
            id:
              tactic.id,
            title:
              tactic.title,
            mapId:
              tactic.mapId,
            visibility:
              nextVisibility,
            boardState:
              tactic.boardState || {
                items: [],
                layer: "upper",
              },
          },
        },
      );

      if (
        activeId ===
        tactic.id
      ) {
        setVisibility(
          nextVisibility,
        );
      }

      setNotice(
        c.visibilityUpdated,
      );

      await loadTactics();
    } catch {
      setError(
        c.visibilityUpdateFailed,
      );
    } finally {
      setActionTacticId(
        "",
      );
    }
  }

async function deleteTactic() {
    if (!activeTactic) {
      return;
    }

    setDeleting(true);

    try {
      await deleteTacticById(
        activeTactic,
      );
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
          stageId:
            activeStageId,
          utilityLabel:
            EFFECT_MARKERS.has(
              markerType,
            )
              ? nextUtilityLabel(
                  items,
                  markerType,
                )
              : "",
          playerId:
            selectedPlayerId,
          playerName:
            roster.find(
              (player) =>
                player.playerId ===
                selectedPlayerId,
            )?.displayName ||
            roster.find(
              (player) =>
                player.playerId ===
                selectedPlayerId,
            )?.nickname ||
            "",
          playerRole:
            roster.find(
              (player) =>
                player.playerId ===
                selectedPlayerId,
            )?.role || "",
          timing: "",
          from: "",
          purpose: "",
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
            stageId:
              activeStageId,
            utilityLabel:
              EFFECT_MARKERS.has(type)
                ? nextUtilityLabel(
                    items,
                    type,
                  )
                : "",
            playerId:
              selectedPlayerId,
            playerName:
              roster.find(
                (player) =>
                  player.playerId ===
                  selectedPlayerId,
              )?.displayName ||
              roster.find(
                (player) =>
                  player.playerId ===
                  selectedPlayerId,
              )?.nickname ||
              "",
            playerRole:
              roster.find(
                (player) =>
                  player.playerId ===
                  selectedPlayerId,
              )?.role || "",
            timing: "",
            from: "",
            purpose: "",
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
            stageId:
              activeStageId,
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
        stageId:
          activeStageId,
        points: [point],
      });
    }

    if (tool === "route") {
      const player =
        roster.find(
          (entry) =>
            entry.playerId ===
            selectedPlayerId,
        );

      setDraft({
        id: makeId(),
        type: "route",
        color:
          selectedPlayerId
            ? playerColor(
                selectedPlayerId,
                roster,
              )
            : color,
        opacity: 0.95,
        stageId:
          activeStageId,
        playerId:
          selectedPlayerId,
        playerName:
          player?.displayName ||
          player?.nickname ||
          "",
        playerRole:
          player?.role || "",
        timing: "",
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
        stageId:
          activeStageId,
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
        stageId:
          activeStageId,
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
        stageId:
          activeStageId,
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

    if (
      draft.type === "path" ||
      draft.type === "route"
    ) {
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
      draft.type === "path" ||
      draft.type === "route"
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

      if (
        presentationMode &&
        !isTyping
      ) {
        if (
          event.key ===
          "Escape"
        ) {
          event.preventDefault();
          exitPresentation();
          return;
        }

        if (
          event.key ===
          "ArrowLeft"
        ) {
          event.preventDefault();
          setIsPlaying(false);
          moveStage(-1);
          return;
        }

        if (
          event.key ===
          "ArrowRight"
        ) {
          event.preventDefault();
          setIsPlaying(false);
          moveStage(1);
          return;
        }

        if (
          event.code === "Space"
        ) {
          event.preventDefault();
          togglePlayback();
          return;
        }
      }

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
          m: "route",
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

  const stageItems =
    items.filter(
      (item) =>
        (item.stageId ||
          "setup") ===
        activeStageId,
    );

  const timingEligibleItems =
    stageItems.filter(
      isTimingItem,
    );

  const timingEvents =
    timingEligibleItems
      .map((item) => ({
        item,
        seconds:
          timingToSeconds(
            item.timing,
          ),
      }))
      .filter(
        (entry) =>
          Number.isFinite(
            entry.seconds,
          ),
      )
      .sort(
        (left, right) =>
          right.seconds -
          left.seconds,
      );

  const untimedItems =
    timingEligibleItems.filter(
      (item) =>
        !Number.isFinite(
          timingToSeconds(
            item.timing,
          ),
        ),
    );

  const stageTimingValues =
    stageItems
      .map(
        (item) =>
          timingToSeconds(
            item.timing,
          ),
      )
      .filter(
        (value) =>
          Number.isFinite(value),
      );

  const stageClockStart =
    stageTimingValues.length
      ? Math.min(
          115,
          Math.max(
            ...stageTimingValues,
          ) + 2,
        )
      : null;

  const stageClockEnd =
    stageTimingValues.length
      ? Math.max(
          0,
          Math.min(
            ...stageTimingValues,
          ) - 2,
        )
      : null;

  const playbackClockSeconds =
    Number.isFinite(
      stageClockStart,
    ) &&
    Number.isFinite(
      stageClockEnd,
    )
      ? stageClockStart -
        (
          stageClockStart -
          stageClockEnd
        ) *
          playbackProgress
      : null;

  const timelinePlayheadPercent =
    Number.isFinite(
      playbackClockSeconds,
    )
      ? roundClockToPercent(
          playbackClockSeconds,
        )
      : playbackProgress * 100;

  const playbackPreview =
    isPlaying ||
    playbackProgress > 0;

  const playbackItems =
    stageItems
      .filter((item) => {
        if (!playbackPreview) {
          return true;
        }

        if (
          item.type ===
          "route"
        ) {
          return true;
        }

        const timing =
          timingToSeconds(
            item.timing,
          );

        if (
          !Number.isFinite(
            timing,
          ) ||
          !Number.isFinite(
            playbackClockSeconds,
          )
        ) {
          return true;
        }

        return (
          playbackClockSeconds <=
          timing
        );
      })
      .map((item) => {
        if (
          !playbackPreview
        ) {
          return item;
        }

        if (
          item.type ===
          "route"
        ) {
          const timing =
            timingToSeconds(
              item.timing,
            );

          let routeProgress =
            playbackProgress;

          if (
            Number.isFinite(
              timing,
            ) &&
            Number.isFinite(
              stageClockStart,
            ) &&
            Number.isFinite(
              stageClockEnd,
            ) &&
            stageClockStart !==
              stageClockEnd
          ) {
            const trigger =
              clamp(
                (
                  stageClockStart -
                  timing
                ) /
                  (
                    stageClockStart -
                    stageClockEnd
                  ),
                0,
                0.95,
              );

            routeProgress =
              playbackProgress <=
              trigger
                ? 0
                : clamp(
                    (
                      playbackProgress -
                      trigger
                    ) /
                      (
                        1 -
                        trigger
                      ),
                    0,
                    1,
                  );
          }

          return {
            ...item,
            playbackProgress:
              routeProgress,
          };
        }

        if (
          isEffectMarker(
            item,
          )
        ) {
          return {
            ...item,
            playbackVisible:
              true,
          };
        }

        return item;
      });

  const visibleItems =
    draft &&
    !playbackPreview
      ? [
          ...playbackItems,
          draft,
        ]
      : playbackItems;

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
    {
      id: "route",
      label: c.route,
      icon: "⌁",
      shortcut: "M",
    },
  ];

  const selectedItem =
    items.find(
      (item) =>
        item.id === selectedId,
    ) || null;

  const selectedRosterPlayer =
    roster.find(
      (player) =>
        player.playerId ===
        selectedPlayerId,
    ) || null;

  const filteredTactics =
    useMemo(() => {
      const query =
        searchQuery
          .trim()
          .toLowerCase();

      return tactics.filter(
        (tactic) => {
          if (
            isTacticsManager
          ) {
            if (
              adminFilter ===
                "team" &&
              tactic.visibility !==
                "team"
            ) {
              return false;
            }

            if (
              adminFilter ===
                "private" &&
              tactic.visibility !==
                "private"
            ) {
              return false;
            }

            if (
              adminFilter ===
                "mine" &&
              tactic.authorId !==
                user?.id
            ) {
              return false;
            }
          }

          if (!query) {
            return true;
          }

          const mapName =
            MAPS[tactic.mapId]
              ?.name || "";

          const authorName =
            tactic.author
              ?.displayName ||
            tactic.author
              ?.username ||
            "";

          return [
            tactic.title,
            mapName,
            authorName,
            tactic.visibility,
          ].some((value) =>
            String(value || "")
              .toLowerCase()
              .includes(query),
          );
        },
      );
    }, [
      adminFilter,
      isTacticsManager,
      searchQuery,
      tactics,
      user?.id,
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
    <section
      className={[
        "tactics-page",
        "tactics-page--v3",
        presentationMode
          ? "tactics-page--presentation"
          : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div className="tactics-shell tactics-shell--v3">
        {presentationMode ? (
          <div className="tactics-presentation-bar">
            <div>
              <strong>
                {title.trim() ||
                  currentMap.name}
              </strong>
              <span>
                {currentMap.name}
                {" · "}
                {localizedStageName(
                  stages.find(
                    (stage) =>
                      stage.id ===
                      activeStageId,
                  ),
                  language,
                ) ||
                  activeStageId}
              </span>
            </div>

            <small>
              {c.presentationHint}
            </small>

            <button
              type="button"
              onClick={
                exitPresentation
              }
            >
              ×
              <span>
                {c.exitPresentation}
              </span>
            </button>
          </div>
        ) : null}

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

            {isTacticsManager ? (
              <div className="tactics-admin-filters">
                <span>{c.adminTools}</span>
                <div>
                  {[
                    ["all", c.adminAll],
                    ["team", c.adminTeam],
                    ["private", c.adminPrivate],
                    ["mine", c.adminMine],
                  ].map(
                    ([
                      value,
                      label,
                    ]) => (
                      <button
                        type="button"
                        key={value}
                        className={
                          adminFilter ===
                          value
                            ? "active"
                            : ""
                        }
                        onClick={() =>
                          setAdminFilter(
                            value,
                          )
                        }
                      >
                        {label}
                      </button>
                    ),
                  )}
                </div>
              </div>
            ) : null}

            <div className="tactics-saved-list tactics-saved-list--v3">
              {loading ? (
                <div className="tactics-empty">
                  ...
                </div>
              ) : filteredTactics.length ? (
                filteredTactics.map(
                  (tactic) => {
                    const manageable =
                      canManageTactic(
                        tactic,
                      );

                    const authorName =
                      tactic.author
                        ?.displayName ||
                      tactic.author
                        ?.username ||
                      "";

                    return (
                      <div
                        key={
                          tactic.id
                        }
                        className="tactics-saved-row"
                      >
                        <button
                          type="button"
                          className={
                            tactic.id === activeId
                              ? "tactics-saved-item tactics-saved-item--active tactics-saved-item--v3"
                              : "tactics-saved-item tactics-saved-item--v3"
                          }
                          onClick={() =>
                            openTactic(
                              tactic,
                            )
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

                            <span className="tactics-saved-meta">
                              <i
                                className={
                                  tactic.visibility ===
                                  "private"
                                    ? "private"
                                    : "team"
                                }
                              >
                                {tactic.visibility ===
                                "private"
                                  ? c.private
                                  : c.team}
                              </i>

                              {isTacticsManager &&
                              authorName ? (
                                <em>
                                  {c.byAuthor}:{" "}
                                  {authorName}
                                </em>
                              ) : null}
                            </span>
                          </span>
                        </button>

                        <div className="tactics-saved-menu-wrap">
                          <button
                            type="button"
                            className="tactics-saved-more"
                            aria-expanded={
                              openMenuId ===
                              tactic.id
                            }
                            aria-label={
                              c.adminTools
                            }
                            onClick={(event) => {
                              event.stopPropagation();
                              setOpenMenuId(
                                (current) =>
                                  current ===
                                  tactic.id
                                    ? ""
                                    : tactic.id,
                              );
                            }}
                          >
                            •••
                          </button>

                          {openMenuId ===
                          tactic.id ? (
                            <div
                              className="tactics-saved-menu"
                              role="menu"
                            >
                              <button
                                type="button"
                                onClick={() => {
                                  setOpenMenuId(
                                    "",
                                  );
                                  openTactic(
                                    tactic,
                                  );
                                }}
                              >
                                <span>↗</span>
                                {c.openTactic}
                              </button>

                              <button
                                type="button"
                                disabled={
                                  actionTacticId ===
                                  tactic.id
                                }
                                onClick={() =>
                                  duplicateTactic(
                                    tactic,
                                  )
                                }
                              >
                                <span>⧉</span>
                                {c.duplicateTactic}
                              </button>

                              {manageable ? (
                                <button
                                  type="button"
                                  disabled={
                                    actionTacticId ===
                                    tactic.id
                                  }
                                  onClick={() =>
                                    quickSetVisibility(
                                      tactic,
                                      tactic.visibility ===
                                        "private"
                                        ? "team"
                                        : "private",
                                    )
                                  }
                                >
                                  <span>
                                    {tactic.visibility ===
                                    "private"
                                      ? "◉"
                                      : "◌"}
                                  </span>
                                  {tactic.visibility ===
                                  "private"
                                    ? c.makeTeam
                                    : c.makePrivate}
                                </button>
                              ) : null}

                              {manageable ? (
                                <button
                                  type="button"
                                  className="danger"
                                  disabled={
                                    actionTacticId ===
                                    tactic.id
                                  }
                                  onClick={() =>
                                    deleteTacticById(
                                      tactic,
                                    )
                                  }
                                >
                                  <span>×</span>
                                  {c.delete}
                                </button>
                              ) : null}
                            </div>
                          ) : null}
                        </div>
                      </div>
                    );
                  },
                )
              ) : (
                <div className="tactics-empty">
                  {searchQuery.trim()
                    ? c.noSearchResults
                    : c.emptySaved}
                </div>
              )}
            </div>

            <div className="tactics-template-section">
              <div className="tactics-template-head">
                <span>
                  {c.templates}
                </span>

                <button
                  type="button"
                  disabled={
                    savingTemplate
                  }
                  onClick={
                    saveAsTemplate
                  }
                  title={
                    c.saveAsTemplate
                  }
                >
                  {savingTemplate
                    ? "…"
                    : "+"}
                </button>
              </div>

              <small className="tactics-template-label">
                {c.presetTemplates}
              </small>

              <div className="tactics-template-grid">
                {PRESET_TEMPLATES.map(
                  (template) => (
                    <button
                      type="button"
                      key={
                        template.id
                      }
                      onClick={() =>
                        applyTemplate(
                          template,
                        )
                      }
                    >
                      {localizedPresetTitle(
                        template,
                        language,
                      )}
                    </button>
                  ),
                )}
              </div>

              <small className="tactics-template-label">
                {c.customTemplates}
              </small>

              <div className="tactics-custom-template-list">
                {templates.length ? (
                  templates.map(
                    (template) => (
                      <div
                        key={
                          template.id
                        }
                        className="tactics-custom-template-row"
                      >
                        <button
                          type="button"
                          className="tactics-custom-template-use"
                          onClick={() =>
                            applyTemplate(
                              template,
                            )
                          }
                        >
                          <strong>
                            {template.title}
                          </strong>
                          <small>
                            {MAPS[
                              template.mapId
                            ]?.name ||
                              template.mapId}
                          </small>
                        </button>

                        <button
                          type="button"
                          className="tactics-custom-template-delete"
                          onClick={() =>
                            deleteTemplate(
                              template,
                            )
                          }
                          title={
                            c.deleteTemplate
                          }
                        >
                          ×
                        </button>
                      </div>
                    ),
                  )
                ) : (
                  <span className="tactics-template-empty">
                    {c.noCustomTemplates}
                  </span>
                )}
              </div>
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

                <button
                  type="button"
                  className="tactics-export tactics-action-template"
                  disabled={
                    savingTemplate
                  }
                  onClick={
                    saveAsTemplate
                  }
                  title={
                    c.saveAsTemplate
                  }
                >
                  <span aria-hidden="true">◇</span>
                  {savingTemplate
                    ? c.savingTemplate
                    : c.saveAsTemplate}
                </button>

                <button
                  type="button"
                  className="tactics-export tactics-action-pdf"
                  onClick={
                    exportPdf
                  }
                  title={
                    c.pdfHint
                  }
                >
                  <span aria-hidden="true">▤</span>
                  {c.exportPdf}
                </button>

                <button
                  type="button"
                  className="tactics-export tactics-action-share"
                  onClick={
                    openShareDialog
                  }
                >
                  <span aria-hidden="true">⌁</span>
                  {c.share}
                </button>

                <button
                  type="button"
                  className="tactics-export tactics-action-presentation"
                  onClick={
                    enterPresentation
                  }
                >
                  <span aria-hidden="true">▶</span>
                  {c.presentation}
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

            <div className="tactics-timeline">
              <div className="tactics-timeline-head">
                <strong>{c.stages}</strong>

                <div className="tactics-playback-controls">
                  <button
                    type="button"
                    onClick={() =>
                      moveStage(-1)
                    }
                    disabled={
                      stages.findIndex(
                        (stage) =>
                          stage.id ===
                          activeStageId,
                      ) <= 0
                    }
                    title={
                      c.previousStage
                    }
                  >
                    ←
                  </button>

                  <button
                    type="button"
                    className={
                      isPlaying
                        ? "active"
                        : ""
                    }
                    onClick={
                      togglePlayback
                    }
                  >
                    {isPlaying
                      ? "Ⅱ"
                      : "▶"}
                    <span>
                      {isPlaying
                        ? c.pause
                        : c.play}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      moveStage(1)
                    }
                    disabled={
                      stages.findIndex(
                        (stage) =>
                          stage.id ===
                          activeStageId,
                      ) >=
                      stages.length - 1
                    }
                    title={
                      c.nextStage
                    }
                  >
                    →
                  </button>
                </div>
              </div>

              <div className="tactics-playback-strip">
                <div className="tactics-playback-clock">
                  <span>
                    {Number.isFinite(
                      playbackClockSeconds,
                    )
                      ? c.roundClock
                      : c.stageProgress}
                  </span>
                  <strong>
                    {Number.isFinite(
                      playbackClockSeconds,
                    )
                      ? formatRoundClock(
                          playbackClockSeconds,
                        )
                      : `${Math.round(
                          playbackProgress *
                            100,
                        )}%`}
                  </strong>
                </div>

                <input
                  className="tactics-playback-scrubber"
                  type="range"
                  min="0"
                  max="1000"
                  step="1"
                  value={
                    Math.round(
                      playbackProgress *
                        1000,
                    )
                  }
                  onChange={(event) => {
                    setIsPlaying(
                      false,
                    );
                    setStagePlaybackProgress(
                      Number(
                        event.target.value,
                      ) /
                        1000,
                    );
                  }}
                  aria-label={
                    c.stageProgress
                  }
                />

                <div className="tactics-playback-speed">
                  <span>
                    {c.playbackSpeed}
                  </span>

                  {[1, 2, 4].map(
                    (speed) => (
                      <button
                        type="button"
                        key={
                          speed
                        }
                        className={
                          playbackSpeed ===
                          speed
                            ? "active"
                            : ""
                        }
                        onClick={() =>
                          setPlaybackSpeed(
                            speed,
                          )
                        }
                      >
                        {speed}×
                      </button>
                    ),
                  )}
                </div>
              </div>

              <div className="tactics-timing-editor">
                <div className="tactics-timing-editor-head">
                  <div>
                    <strong>
                      {c.timingEditor}
                    </strong>
                    <small>
                      {c.timingEditorHint}
                    </small>
                  </div>

                  <span>
                    {untimedItems.length
                      ? `${c.timingUntimed}: ${untimedItems.length}`
                      : selectedItem &&
                          isTimingItem(
                            selectedItem,
                          )
                        ? c.timingSelectedHint
                        : c.timingNoSelectionHint}
                  </span>
                </div>

                <div className="tactics-timing-ruler">
                  {ROUND_CLOCK_TICKS.map(
                    (seconds) => (
                      <span
                        key={
                          seconds
                        }
                        style={{
                          left:
                            `${roundClockToPercent(seconds)}%`,
                        }}
                      >
                        {formatRoundClock(
                          seconds,
                        )}
                      </span>
                    ),
                  )}
                </div>

                <div
                  ref={
                    timingTrackRef
                  }
                  className="tactics-timing-track"
                  onPointerDown={
                    handleTimingTrackPointerDown
                  }
                >
                  {ROUND_CLOCK_TICKS.map(
                    (seconds) => (
                      <i
                        key={
                          seconds
                        }
                        className="tactics-timing-gridline"
                        style={{
                          left:
                            `${roundClockToPercent(seconds)}%`,
                        }}
                        aria-hidden="true"
                      />
                    ),
                  )}

                  <i
                    className="tactics-timing-playhead"
                    style={{
                      left:
                        `${timelinePlayheadPercent}%`,
                    }}
                    aria-hidden="true"
                  />

                  {timingEvents.map(
                    ({
                      item,
                      seconds,
                    }) => (
                      <button
                        type="button"
                        key={
                          item.id
                        }
                        className={[
                          "tactics-timing-event",
                          selectedId ===
                          item.id
                            ? "active"
                            : "",
                          `tactics-timing-event--${item.marker || item.type}`,
                        ]
                          .filter(Boolean)
                          .join(" ")}
                        style={{
                          left:
                            `${roundClockToPercent(seconds)}%`,
                        }}
                        onPointerDown={(event) =>
                          beginTimingDrag(
                            event,
                            item,
                          )
                        }
                        onPointerMove={
                          moveTimingDrag
                        }
                        onPointerUp={
                          finishTimingDrag
                        }
                        onPointerCancel={
                          finishTimingDrag
                        }
                        onDoubleClick={() =>
                          setSelectedId(
                            item.id,
                          )
                        }
                        title={
                          `${timingItemLabel(item, c)} · ${formatRoundClock(seconds)}`
                        }
                      >
                        <strong>
                          {timingItemLabel(
                            item,
                            c,
                          )}
                        </strong>
                        <small>
                          {formatRoundClock(
                            seconds,
                          )}
                        </small>
                      </button>
                    ),
                  )}
                </div>
              </div>

              <div className="tactics-stage-track">
                {stages.map(
                  (stage, index) => {
                    const count =
                      items.filter(
                        (item) =>
                          (item.stageId ||
                            "setup") ===
                          stage.id,
                      ).length;

                    return (
                      <button
                        type="button"
                        key={stage.id}
                        className={
                          stage.id ===
                          activeStageId
                            ? "active"
                            : ""
                        }
                        onClick={() => {
                          setIsPlaying(
                            false,
                          );
                          selectStage(
                            stage.id,
                          );
                        }}
                      >
                        <span>
                          {String(
                            index + 1,
                          ).padStart(
                            2,
                            "0",
                          )}
                        </span>
                        <strong>
                          {localizedStageName(
                            stage,
                            language,
                          )}
                        </strong>
                        <small>
                          {count}
                        </small>
                      </button>
                    );
                  },
                )}
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

            <section className="tactics-panel-card tactics-roster-card">
              <div className="tactics-panel-title">
                <span aria-hidden="true">◉</span>
                <strong>{c.roster}</strong>
              </div>

              <select
                className="tactics-roster-select"
                value={
                  selectedPlayerId
                }
                onChange={(event) =>
                  setSelectedPlayerId(
                    event.target.value,
                  )
                }
              >
                <option value="">
                  {c.noPlayer}
                </option>

                {roster.map(
                  (player) => (
                    <option
                      key={
                        player.playerId
                      }
                      value={
                        player.playerId
                      }
                    >
                      {player.displayName ||
                        player.nickname}
                      {player.role
                        ? ` · ${player.role}`
                        : ""}
                    </option>
                  ),
                )}
              </select>

              {selectedRosterPlayer ? (
                <div className="tactics-roster-current">
                  <span
                    style={{
                      background:
                        playerColor(
                          selectedRosterPlayer.playerId,
                          roster,
                        ),
                    }}
                  />
                  <div>
                    <strong>
                      {selectedRosterPlayer.displayName ||
                        selectedRosterPlayer.nickname}
                    </strong>
                    <small>
                      {c.playerRole}:{" "}
                      {selectedRosterPlayer.role ||
                        "RIFLER"}
                    </small>
                  </div>
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

                {(selectedItem.type === "route" ||
                  selectedItem.marker === "t" ||
                  selectedItem.marker === "ct" ||
                  isEffectMarker(selectedItem)) ? (
                  <div className="tactics-object-meta">
                    <label>
                      <span>{c.roster}</span>
                      <select
                        value={
                          selectedItem.playerId ||
                          ""
                        }
                        onChange={(event) => {
                          const player =
                            roster.find(
                              (entry) =>
                                entry.playerId ===
                                event.target.value,
                            );

                          patchSelectedItem({
                            playerId:
                              event.target.value,
                            playerName:
                              player?.displayName ||
                              player?.nickname ||
                              "",
                            playerRole:
                              player?.role ||
                              "",
                            ...(selectedItem.type ===
                            "route"
                              ? {
                                  color:
                                    event.target.value
                                      ? playerColor(
                                          event.target.value,
                                          roster,
                                        )
                                      : selectedItem.color,
                                }
                              : {}),
                          });
                        }}
                      >
                        <option value="">
                          {c.noPlayer}
                        </option>
                        {roster.map(
                          (player) => (
                            <option
                              key={
                                player.playerId
                              }
                              value={
                                player.playerId
                              }
                            >
                              {player.displayName ||
                                player.nickname}
                              {player.role
                                ? ` · ${player.role}`
                                : ""}
                            </option>
                          ),
                        )}
                      </select>
                    </label>

                    <label>
                      <span>{c.timing}</span>
                      <input
                        value={
                          selectedItem.timing ||
                          ""
                        }
                        placeholder={
                          c.timingPlaceholder
                        }
                        maxLength="4"
                        onChange={(event) =>
                          patchSelectedItem({
                            timing:
                              event.target.value,
                          })
                        }
                        onBlur={(event) =>
                          patchSelectedItem({
                            timing:
                              normalizeTiming(
                                event.target.value,
                              ),
                          })
                        }
                      />
                    </label>

                    {isEffectMarker(
                      selectedItem,
                    ) ? (
                      <>
                        <label>
                          <span>
                            {c.utilityNumber}
                          </span>
                          <input
                            value={
                              selectedItem.utilityLabel ||
                              ""
                            }
                            readOnly
                          />
                        </label>

                        <label>
                          <span>{c.from}</span>
                          <input
                            value={
                              selectedItem.from ||
                              ""
                            }
                            placeholder={
                              c.fromPlaceholder
                            }
                            onChange={(event) =>
                              patchSelectedItem({
                                from:
                                  event.target.value.slice(
                                    0,
                                    60,
                                  ),
                              })
                            }
                          />
                        </label>

                        <label className="tactics-object-meta--full">
                          <span>
                            {c.purpose}
                          </span>
                          <textarea
                            rows="2"
                            value={
                              selectedItem.purpose ||
                              ""
                            }
                            placeholder={
                              c.purposePlaceholder
                            }
                            onChange={(event) =>
                              patchSelectedItem({
                                purpose:
                                  event.target.value.slice(
                                    0,
                                    140,
                                  ),
                              })
                            }
                          />
                        </label>
                      </>
                    ) : null}
                  </div>
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

        {shareOpen ? (
          <div
            className="tactics-share-backdrop"
            role="presentation"
            onMouseDown={(event) => {
              if (
                event.target ===
                event.currentTarget
              ) {
                setShareOpen(
                  false,
                );
              }
            }}
          >
            <section
              className="tactics-share-dialog"
              role="dialog"
              aria-modal="true"
              aria-label={
                c.shareTitle
              }
            >
              <header>
                <div>
                  <span>
                    {c.shareViewOnly}
                  </span>
                  <h2>
                    {c.shareTitle}
                  </h2>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setShareOpen(
                      false,
                    )
                  }
                  aria-label={
                    c.exitPresentation
                  }
                >
                  ×
                </button>
              </header>

              <div className="tactics-share-create">
                <label>
                  <span>
                    {c.shareExpiry}
                  </span>
                  <select
                    value={
                      shareExpiry
                    }
                    onChange={(event) =>
                      setShareExpiry(
                        event.target.value,
                      )
                    }
                  >
                    <option value="24h">
                      {c.expiry24h}
                    </option>
                    <option value="7d">
                      {c.expiry7d}
                    </option>
                    <option value="30d">
                      {c.expiry30d}
                    </option>
                    <option value="never">
                      {c.expiryNever}
                    </option>
                  </select>
                </label>

                <button
                  type="button"
                  disabled={
                    shareCreating
                  }
                  onClick={
                    createShare
                  }
                >
                  {shareCreating
                    ? c.creatingShare
                    : c.createShare}
                </button>
              </div>

              <div className="tactics-share-list">
                {shareLoading ? (
                  <div className="tactics-share-empty">
                    ...
                  </div>
                ) : shares.length ? (
                  shares.map(
                    (share) => {
                      const url =
                        shareUrl(
                          share.token,
                        );

                      return (
                        <article
                          key={
                            share.id
                          }
                          className="tactics-share-card"
                        >
                          <div className="tactics-share-card-qr">
                            <QrCode
                              value={
                                url
                              }
                            />
                          </div>

                          <div className="tactics-share-card-main">
                            <strong>
                              {c.shareViewOnly}
                            </strong>

                            <code>
                              {url}
                            </code>

                            <small>
                              {c.expires}
                              {": "}
                              {share.expiresAt
                                ? new Date(
                                    share.expiresAt,
                                  ).toLocaleString(
                                    language === "en"
                                      ? "en-US"
                                      : "uk-UA",
                                  )
                                : c.neverExpires}
                            </small>

                            <div>
                              <button
                                type="button"
                                onClick={() =>
                                  copyShare(
                                    share,
                                  )
                                }
                              >
                                {copiedShareId ===
                                share.id
                                  ? c.copiedShare
                                  : c.copyShare}
                              </button>

                              <button
                                type="button"
                                className="danger"
                                onClick={() =>
                                  revokeShare(
                                    share.id,
                                  )
                                }
                              >
                                {c.revokeShare}
                              </button>
                            </div>
                          </div>
                        </article>
                      );
                    },
                  )
                ) : (
                  <div className="tactics-share-empty">
                    {c.noShares}
                  </div>
                )}
              </div>
            </section>
          </div>
        ) : null}

        <TacticPrintReport
          title={
            title.trim()
          }
          mapName={
            currentMap.name
          }
          radarUrl={
            radarUrl
          }
          stages={
            stages
          }
          items={
            items
          }
          copy={
            c
          }
          language={
            language
          }
        />
      </div>
    </section>
  );
}
