import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import { useLanguage } from "../i18n/LanguageContext.jsx";

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

const COPY = {
  uk: {
    eyebrow: "ISTe PLAYER HUB",
    title: "Тактична дошка",
    intro:
      "Плани раундів, розстановки, гранати та командні нотатки на точних радарах CS2.",
    newTactic: "Нова тактика",
    saved: "Збережені тактики",
    emptySaved: "Збережених тактик поки немає.",
    titleLabel: "Назва тактики",
    titlePlaceholder: "Наприклад: Mirage T pistol B split",
    visibility: "Доступ",
    team: "Команда",
    private: "Лише я",
    save: "Зберегти",
    saving: "Збереження...",
    delete: "Видалити",
    deleting: "Видалення...",
    map: "Карта",
    layer: "Поверх",
    upper: "Верхній",
    lower: "Нижній",
    tools: "Інструменти",
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
  },
  en: {
    eyebrow: "ISTe PLAYER HUB",
    title: "Tactical Board",
    intro:
      "Round plans, setups, utility and team notes on accurate CS2 radars.",
    newTactic: "New tactic",
    saved: "Saved tactics",
    emptySaved: "No saved tactics yet.",
    titleLabel: "Tactic title",
    titlePlaceholder: "Example: Mirage T pistol B split",
    visibility: "Visibility",
    team: "Team",
    private: "Only me",
    save: "Save",
    saving: "Saving...",
    delete: "Delete",
    deleting: "Deleting...",
    map: "Map",
    layer: "Floor",
    upper: "Upper",
    lower: "Lower",
    tools: "Tools",
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
  },
};

function makeId() {
  return \`item-\${Date.now()}-\${Math.random()
    .toString(36)
    .slice(2, 8)}\`;
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
  const size = 22;
  const wing = 10;

  const bx =
    item.x2 - ux * size;
  const by =
    item.y2 - uy * size;

  const p1 = \`\${item.x2},\${item.y2}\`;
  const p2 =
    \`\${bx - uy * wing},\${by + ux * wing}\`;
  const p3 =
    \`\${bx + uy * wing},\${by - ux * wing}\`;

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
        strokeWidth={selected ? 10 : 7}
        strokeLinecap="round"
      />
      <polygon
        points={\`\${p1} \${p2} \${p3}\`}
        fill={item.color}
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
              \`\${point.x},\${point.y}\`,
          )
          .join(" ")}
        fill="none"
        stroke={item.color}
        strokeWidth={selected ? 11 : 8}
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
        strokeWidth={selected ? 10 : 7}
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
        fontSize="34"
        fontWeight="900"
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
        transform={\`translate(\${item.x} \${item.y})\`}
      >
        <circle
          r={selected ? 28 : 24}
          fill={markerFill(item.marker)}
          stroke={
            selected
              ? "#ffffff"
              : "rgba(0,0,0,0.8)"
          }
          strokeWidth={selected ? 6 : 4}
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

async function apiRequest(
  action,
  options = {},
) {
  const response = await fetch(
    \`/api/owner?module=tactics&action=\${action}\`,
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

  const c =
    COPY[language] || COPY.uk;

  const [tactics, setTactics] =
    useState([]);
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
  const [error, setError] =
    useState("");
  const [notice, setNotice] =
    useState("");

  const currentMap =
    MAPS[mapId] || MAPS.mirage;

  const radarUrl =
    mapId === "nuke" &&
    layer === "lower" &&
    currentMap.lowerRadar
      ? currentMap.lowerRadar
      : currentMap.radar;

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

    const label =
      markerType === "t" ||
      markerType === "ct"
        ? \`\${c.markerLabels[markerType]}\${count}\`
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
        points: [point],
      });
    }

    if (tool === "arrow") {
      setDraft({
        id: makeId(),
        type: "arrow",
        color,
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
      if (
        event.key === "Delete" ||
        event.key === "Backspace" &&
          document.activeElement?.tagName !==
            "INPUT"
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
    ["select", c.select],
    ["draw", c.draw],
    ["arrow", c.arrow],
    ["circle", c.circle],
    ["text", c.text],
    ["marker", c.marker],
  ];

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
    <section className="tactics-page">
      <div className="tactics-shell">
        <header className="tactics-header">
          <div>
            <span>{c.eyebrow}</span>
            <h1>{c.title}</h1>
            <p>{c.intro}</p>
          </div>

          <button
            type="button"
            className="tactics-primary"
            onClick={createNew}
          >
            {c.newTactic}
          </button>
        </header>

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

        <div className="tactics-layout">
          <aside className="tactics-sidebar">
            <div className="tactics-panel-heading">
              <h2>{c.saved}</h2>
              <span>{tactics.length}</span>
            </div>

            <div className="tactics-saved-list">
              {loading ? (
                <div className="tactics-empty">
                  ...
                </div>
              ) : tactics.length ? (
                tactics.map(
                  (tactic) => (
                    <button
                      type="button"
                      key={tactic.id}
                      className={
                        tactic.id ===
                        activeId
                          ? "tactics-saved-item tactics-saved-item--active"
                          : "tactics-saved-item"
                      }
                      onClick={() =>
                        openTactic(
                          tactic,
                        )
                      }
                    >
                      <strong>
                        {tactic.title}
                      </strong>
                      <span>
                        {MAPS[
                          tactic.mapId
                        ]?.name ||
                          tactic.mapId}
                        {" · "}
                        {tactic.visibility ===
                        "private"
                          ? c.private
                          : c.team}
                      </span>
                    </button>
                  ),
                )
              ) : (
                <div className="tactics-empty">
                  {c.emptySaved}
                </div>
              )}
            </div>
          </aside>

          <main className="tactics-workspace">
            <div className="tactics-workspace-top">
              <label>
                <span>{c.titleLabel}</span>
                <input
                  value={title}
                  maxLength={100}
                  placeholder={
                    c.titlePlaceholder
                  }
                  onChange={(event) =>
                    setTitle(
                      event.target.value,
                    )
                  }
                />
              </label>

              <label>
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

              <div className="tactics-save-actions">
                <button
                  type="button"
                  className="tactics-primary"
                  disabled={saving}
                  onClick={saveTactic}
                >
                  {saving
                    ? c.saving
                    : c.save}
                </button>

                {activeTactic ? (
                  <button
                    type="button"
                    className="tactics-danger"
                    disabled={deleting}
                    onClick={deleteTactic}
                  >
                    {deleting
                      ? c.deleting
                      : c.delete}
                  </button>
                ) : null}
              </div>
            </div>

            <div className="tactics-board-shell">
              <img
                className="tactics-radar"
                src={radarUrl}
                alt={currentMap.name}
                draggable="false"
              />

              <svg
                className="tactics-overlay"
                viewBox="0 0 1000 1000"
                preserveAspectRatio="none"
                onPointerDown={
                  handlePointerDown
                }
                onPointerMove={
                  handlePointerMove
                }
                onPointerUp={
                  handlePointerUp
                }
                onPointerCancel={
                  handlePointerUp
                }
              >
                {visibleItems.map(
                  (item) => (
                    <BoardItem
                      key={item.id}
                      item={item}
                      selected={
                        item.id ===
                        selectedId
                      }
                      onSelect={
                        setSelectedId
                      }
                      copy={c}
                    />
                  ),
                )}
              </svg>
            </div>
          </main>

          <aside className="tactics-tools">
            <section>
              <h2>{c.map}</h2>
              <select
                value={mapId}
                onChange={(event) => {
                  setMapId(
                    event.target.value,
                  );
                  setLayer("upper");
                }}
              >
                {Object.entries(
                  MAPS,
                ).map(
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

            <section>
              <h2>{c.tools}</h2>
              <div className="tactics-tool-grid">
                {tools.map(
                  ([id, label]) => (
                    <button
                      type="button"
                      key={id}
                      className={
                        tool === id
                          ? "active"
                          : ""
                      }
                      onClick={() =>
                        setTool(id)
                      }
                    >
                      {label}
                    </button>
                  ),
                )}
              </div>
            </section>

            <section>
              <h2>{c.colors}</h2>
              <div className="tactics-colors">
                {COLORS.map(
                  (value) => (
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
                  ),
                )}
              </div>
            </section>

            {tool === "text" ? (
              <section>
                <h2>{c.label}</h2>
                <input
                  value={labelText}
                  maxLength={60}
                  placeholder={
                    c.labelPlaceholder
                  }
                  onChange={(event) =>
                    setLabelText(
                      event.target.value,
                    )
                  }
                />
              </section>
            ) : null}

            {tool === "marker" ? (
              <section>
                <h2>{c.objects}</h2>
                <div className="tactics-marker-grid">
                  {MARKERS.map(
                    (type) => (
                      <button
                        type="button"
                        key={type}
                        className={
                          markerType ===
                          type
                            ? "active"
                            : ""
                        }
                        onClick={() =>
                          setMarkerType(
                            type,
                          )
                        }
                      >
                        <span
                          style={{
                            background:
                              markerFill(
                                type,
                              ),
                          }}
                        >
                          {
                            c.markerLabels[
                              type
                            ]
                          }
                        </span>
                      </button>
                    ),
                  )}
                </div>
              </section>
            ) : null}

            <section>
              <h2>
                {c.selected}:{" "}
                {selectedId
                  ? c.selected
                  : c.noSelection}
              </h2>

              <div className="tactics-history-actions">
                <button
                  type="button"
                  disabled={!past.length}
                  onClick={undo}
                >
                  {c.undo}
                </button>
                <button
                  type="button"
                  disabled={!future.length}
                  onClick={redo}
                >
                  {c.redo}
                </button>
                <button
                  type="button"
                  disabled={!selectedId}
                  onClick={
                    deleteSelected
                  }
                >
                  {c.remove}
                </button>
                <button
                  type="button"
                  disabled={!items.length}
                  onClick={() =>
                    commitItems([])
                  }
                >
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
