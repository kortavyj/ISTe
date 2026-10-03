import {
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  useParams,
} from "react-router-dom";

import { useLanguage } from "../i18n/LanguageContext.jsx";

import "./SharedTactic.css";

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

const COPY = {
  uk: {
    eyebrow: "ISTe TACTICAL SHARE",
    loading: "Завантаження тактики...",
    unavailable: "Посилання недоступне або вже відкликане.",
    expired: "Термін дії цього посилання завершився.",
    viewOnly: "Лише перегляд",
    stages: "Етапи раунду",
    utility: "Гранати",
    emptyUtility: "На цьому етапі гранат немає.",
    number: "#",
    player: "Гравець",
    type: "Тип",
    time: "Час",
    from: "Звідки",
    purpose: "Завдання",
    play: "Відтворити",
    pause: "Пауза",
  },
  en: {
    eyebrow: "ISTe TACTICAL SHARE",
    loading: "Loading tactic...",
    unavailable: "This link is unavailable or has been revoked.",
    expired: "This link has expired.",
    viewOnly: "View only",
    stages: "Round stages",
    utility: "Utility",
    emptyUtility: "No utility on this stage.",
    number: "#",
    player: "Player",
    type: "Type",
    time: "Time",
    from: "From",
    purpose: "Purpose",
    play: "Play",
    pause: "Pause",
  },
};

function effectSize(item) {
  return Number(
    item.effectSize,
  ) || 30;
}

function SharedItem({
  item,
}) {
  const opacity =
    Number.isFinite(
      item.opacity,
    )
      ? item.opacity
      : 1;

  if (
    item.type === "route" &&
    Array.isArray(
      item.points,
    ) &&
    item.points.length > 1
  ) {
    const first =
      item.points[0];

    return (
      <g opacity={opacity}>
        <polyline
          points={item.points
            .map(
              (point) =>
                `${point.x},${point.y}`,
            )
            .join(" ")}
          fill="none"
          stroke={
            item.color ||
            "#82b7ff"
          }
          strokeWidth="8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {item.points.map(
          (point, index) => (
            <circle
              key={
                `${item.id}-${index}`
              }
              cx={point.x}
              cy={point.y}
              r={
                index === 0
                  ? 8
                  : 5
              }
              fill={
                item.color ||
                "#82b7ff"
              }
              stroke="#0b0f14"
              strokeWidth="3"
            />
          ),
        )}

        {item.playerName ? (
          <g
            transform={
              `translate(${first.x + 12} ${first.y - 15})`
            }
          >
            <rect
              x="0"
              y="-18"
              width={
                Math.max(
                  55,
                  item.playerName
                    .length *
                    8 +
                    18,
                )
              }
              height="26"
              rx="8"
              fill="rgba(8,11,15,.9)"
              stroke={
                item.color ||
                "#82b7ff"
              }
              strokeWidth="2"
            />
            <text
              x="9"
              y="0"
              fill="#fff"
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

  if (
    item.type === "path" &&
    Array.isArray(
      item.points,
    ) &&
    item.points.length > 1
  ) {
    return (
      <polyline
        points={item.points
          .map(
            (point) =>
              `${point.x},${point.y}`,
          )
          .join(" ")}
        fill="none"
        stroke={
          item.color ||
          "#fff"
        }
        strokeWidth={
          Number(
            item.strokeWidth,
          ) || 7
        }
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={opacity}
      />
    );
  }

  if (
    item.type === "arrow"
  ) {
    return (
      <line
        x1={item.x1}
        y1={item.y1}
        x2={item.x2}
        y2={item.y2}
        stroke={
          item.color ||
          "#fff"
        }
        strokeWidth={
          Number(
            item.strokeWidth,
          ) || 7
        }
        strokeLinecap="round"
        markerEnd="url(#shared-arrow)"
        opacity={opacity}
      />
    );
  }

  if (
    item.type === "circle"
  ) {
    return (
      <circle
        cx={item.cx}
        cy={item.cy}
        r={item.r}
        fill="none"
        stroke={
          item.color ||
          "#fff"
        }
        strokeWidth={
          Number(
            item.strokeWidth,
          ) || 7
        }
        opacity={opacity}
      />
    );
  }

  if (
    item.type === "area"
  ) {
    const x =
      Math.min(
        item.x1,
        item.x2,
      );
    const y =
      Math.min(
        item.y1,
        item.y2,
      );
    const width =
      Math.abs(
        item.x2 -
          item.x1,
      );
    const height =
      Math.abs(
        item.y2 -
          item.y1,
      );

    return (
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        rx="14"
        fill={
          item.color ||
          "#fff"
        }
        fillOpacity="0.16"
        stroke={
          item.color ||
          "#fff"
        }
        strokeWidth="4"
        strokeDasharray="12 10"
        opacity={opacity}
      />
    );
  }

  if (
    item.type === "text"
  ) {
    return (
      <text
        x={item.x}
        y={item.y}
        fill={
          item.color ||
          "#fff"
        }
        fontSize={
          Number(
            item.fontSize,
          ) || 32
        }
        fontWeight="900"
        opacity={opacity}
      >
        {item.text}
      </text>
    );
  }

  if (
    item.type !== "marker"
  ) {
    return null;
  }

  const x =
    Number(item.x) || 0;
  const y =
    Number(item.y) || 0;
  const size =
    effectSize(item);

  if (
    item.marker === "smoke"
  ) {
    return (
      <g
        transform={
          `translate(${x} ${y})`
        }
        opacity={opacity}
      >
        <circle
          r={size * 0.52}
          fill="rgba(218,223,228,.34)"
          filter="url(#shared-smoke)"
        />
        <circle
          r={size * 0.33}
          fill="rgba(245,247,249,.62)"
          filter="url(#shared-smoke-core)"
        />
        {item.utilityLabel ? (
          <UtilityBadge
            value={
              item.utilityLabel
            }
            size={size}
          />
        ) : null}
      </g>
    );
  }

  if (
    item.marker === "flash"
  ) {
    return (
      <g
        transform={
          `translate(${x} ${y})`
        }
        opacity={opacity}
      >
        <g
          filter="url(#shared-flash)"
        >
          <circle
            r={size * 0.18}
            fill="#fff"
          />
          {Array.from(
            {
              length: 8,
            },
            (
              _,
              index,
            ) => (
              <line
                key={index}
                x1="0"
                y1={
                  -size *
                  0.18
                }
                x2="0"
                y2={
                  -size *
                  (
                    index %
                      2
                      ? 0.48
                      : 0.65
                  )
                }
                stroke="#fff"
                strokeWidth="4"
                strokeLinecap="round"
                transform={
                  `rotate(${index * 45})`
                }
              />
            ),
          )}
        </g>
        {item.utilityLabel ? (
          <UtilityBadge
            value={
              item.utilityLabel
            }
            size={size}
          />
        ) : null}
      </g>
    );
  }

  if (
    item.marker === "he"
  ) {
    return (
      <g
        transform={
          `translate(${x} ${y})`
        }
        opacity={opacity}
      >
        <g
          filter="url(#shared-he)"
        >
          {Array.from(
            {
              length: 12,
            },
            (
              _,
              index,
            ) => (
              <line
                key={index}
                x1="0"
                y1={
                  -size *
                  0.12
                }
                x2="0"
                y2={
                  -size *
                  (
                    index %
                      2
                      ? 0.48
                      : 0.64
                  )
                }
                stroke="#ef2d47"
                strokeWidth="4"
                strokeLinecap="round"
                transform={
                  `rotate(${index * 30})`
                }
              />
            ),
          )}
          <circle
            r={size * 0.12}
            fill="#ef2d47"
          />
        </g>
        {item.utilityLabel ? (
          <UtilityBadge
            value={
              item.utilityLabel
            }
            size={size}
          />
        ) : null}
      </g>
    );
  }

  if (
    item.marker ===
    "molotov"
  ) {
    return (
      <g
        transform={
          `translate(${x} ${y})`
        }
        opacity={opacity}
      >
        <path
          d={
            `M ${-size * .52} ${size * .08}
             C ${-size * .48} ${-size * .35}, ${-size * .18} ${-size * .55}, 0 ${-size * .38}
             C ${size * .18} ${-size * .58}, ${size * .5} ${-size * .25}, ${size * .48} ${size * .06}
             C ${size * .55} ${size * .34}, ${size * .16} ${size * .53}, ${-size * .08} ${size * .4}
             C ${-size * .3} ${size * .55}, ${-size * .58} ${size * .35}, ${-size * .52} ${size * .08} Z`
          }
          fill="#ef744e"
          stroke="#ff9a65"
          strokeWidth="4"
          filter="url(#shared-molotov)"
        />
        {item.utilityLabel ? (
          <UtilityBadge
            value={
              item.utilityLabel
            }
            size={size}
          />
        ) : null}
      </g>
    );
  }

  const fill =
    item.marker === "ct"
      ? "#83afe9"
      : item.marker === "t"
        ? "#e7cf72"
        : "#e31d47";

  return (
    <g
      transform={
        `translate(${x} ${y})`
      }
      opacity={opacity}
    >
      {item.marker ===
      "bomb" ? (
        <rect
          x="-19"
          y="-10"
          width="38"
          height="20"
          rx="4"
          fill={fill}
        />
      ) : (
        <circle
          r={
            Number(
              item.markerSize,
            ) || 24
          }
          fill={fill}
          stroke="rgba(255,255,255,.6)"
          strokeWidth="3"
        />
      )}

      <text
        y="5"
        textAnchor="middle"
        fill="#101318"
        fontSize={
          item.marker ===
          "bomb"
            ? "12"
            : "14"
        }
        fontWeight="1000"
      >
        {item.marker ===
        "bomb"
          ? "C4"
          : item.label ||
            (
              item.marker ===
              "ct"
                ? "CT"
                : "T"
            )}
      </text>
    </g>
  );
}

function UtilityBadge({
  value,
  size,
}) {
  return (
    <g
      transform={
        `translate(${size * .5} ${-size * .5})`
      }
    >
      <circle
        r="12"
        fill="rgba(8,11,15,.94)"
        stroke="#fff"
        strokeWidth="2"
      />
      <text
        y="4"
        textAnchor="middle"
        fill="#fff"
        fontSize="9"
        fontWeight="1000"
      >
        {value}
      </text>
    </g>
  );
}

export default function SharedTactic() {
  const {
    token,
  } = useParams();

  const {
    language,
  } = useLanguage();

  const c =
    COPY[language] ||
    COPY.uk;

  const [tactic, setTactic] =
    useState(null);
  const [loading, setLoading] =
    useState(true);
  const [error, setError] =
    useState("");
  const [activeStageId, setActiveStageId] =
    useState("");
  const [isPlaying, setIsPlaying] =
    useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError("");

      try {
        const response =
          await fetch(
            `/api/owner?module=tactic-share&token=${encodeURIComponent(token || "")}`,
            {
              cache: "no-store",
              headers: {
                Accept:
                  "application/json",
              },
            },
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
            result?.error ||
              "TACTIC_SHARE_NOT_FOUND",
          );
        }

        if (cancelled) {
          return;
        }

        setTactic(
          result.tactic,
        );

        const stages =
          Array.isArray(
            result.tactic
              ?.boardState
              ?.stages,
          ) &&
          result.tactic
            .boardState
            .stages
            .length
            ? result.tactic
                .boardState
                .stages
            : [
                {
                  id:
                    "setup",
                  name:
                    "Setup",
                  duration:
                    4,
                },
              ];

        setActiveStageId(
          result.tactic
            ?.boardState
            ?.activeStageId ||
            stages[0].id,
        );
      } catch (
        loadError
      ) {
        if (cancelled) {
          return;
        }

        setError(
          loadError
            ?.message ===
            "TACTIC_SHARE_EXPIRED"
            ? c.expired
            : c.unavailable,
        );
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [
    c.expired,
    c.unavailable,
    token,
  ]);

  const state =
    tactic?.boardState ||
    {};

  const stages =
    useMemo(
      () =>
        Array.isArray(
          state.stages,
        ) &&
        state.stages.length
          ? state.stages
          : [
              {
                id: "setup",
                name: "Setup",
                duration: 4,
              },
            ],
      [state.stages],
    );

  const items =
    Array.isArray(
      state.items,
    )
      ? state.items
      : [];

  const activeItems =
    items.filter(
      (item) =>
        (
          item.stageId ||
          "setup"
        ) ===
        activeStageId,
    );

  const utility =
    activeItems.filter(
      (item) =>
        item.type ===
          "marker" &&
        [
          "smoke",
          "flash",
          "he",
          "molotov",
        ].includes(
          item.marker,
        ),
    );

  useEffect(() => {
    if (!isPlaying) {
      return undefined;
    }

    const index =
      stages.findIndex(
        (stage) =>
          stage.id ===
          activeStageId,
      );

    const stage =
      stages[index];

    if (!stage) {
      setIsPlaying(false);
      return undefined;
    }

    const timer =
      window.setTimeout(
        () => {
          if (
            index >=
            stages.length - 1
          ) {
            setIsPlaying(false);
            return;
          }

          setActiveStageId(
            stages[
              index + 1
            ].id,
          );
        },
        Math.max(
          1,
          Number(
            stage.duration,
          ) || 3,
        ) *
          1000,
      );

    return () =>
      window.clearTimeout(
        timer,
      );
  }, [
    activeStageId,
    isPlaying,
    stages,
  ]);

  if (loading) {
    return (
      <section className="shared-tactic-page">
        <div className="shared-tactic-state">
          {c.loading}
        </div>
      </section>
    );
  }

  if (
    error ||
    !tactic
  ) {
    return (
      <section className="shared-tactic-page">
        <div className="shared-tactic-state shared-tactic-state--error">
          {error ||
            c.unavailable}
        </div>
      </section>
    );
  }

  const map =
    MAPS[
      tactic.mapId
    ] ||
    MAPS.mirage;

  const radar =
    tactic.mapId ===
      "nuke" &&
    state.layer ===
      "lower" &&
    map.lowerRadar
      ? map.lowerRadar
      : map.radar;

  return (
    <section className="shared-tactic-page">
      <div className="shared-tactic-shell">
        <header className="shared-tactic-header">
          <div>
            <span>
              {c.eyebrow}
            </span>
            <h1>
              {tactic.title}
            </h1>
            <p>
              {map.name}
              {" · "}
              {c.viewOnly}
            </p>
          </div>

          <button
            type="button"
            className={
              isPlaying
                ? "active"
                : ""
            }
            onClick={() =>
              setIsPlaying(
                (current) =>
                  !current,
              )
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
        </header>

        <div className="shared-tactic-layout">
          <div className="shared-tactic-board-column">
            <div className="shared-tactic-board">
              <img
                src={radar}
                alt={map.name}
                draggable="false"
              />

              <svg
                viewBox="0 0 1000 1000"
                preserveAspectRatio="none"
              >
                <defs>
                  <marker
                    id="shared-arrow"
                    markerWidth="12"
                    markerHeight="12"
                    refX="10"
                    refY="6"
                    orient="auto"
                  >
                    <path
                      d="M0,0 L12,6 L0,12 z"
                      fill="context-stroke"
                    />
                  </marker>

                  <filter
                    id="shared-smoke"
                    x="-100%"
                    y="-100%"
                    width="300%"
                    height="300%"
                  >
                    <feGaussianBlur
                      stdDeviation="13"
                    />
                  </filter>

                  <filter
                    id="shared-smoke-core"
                    x="-100%"
                    y="-100%"
                    width="300%"
                    height="300%"
                  >
                    <feGaussianBlur
                      stdDeviation="7"
                    />
                  </filter>

                  <filter
                    id="shared-flash"
                    x="-100%"
                    y="-100%"
                    width="300%"
                    height="300%"
                  >
                    <feGaussianBlur
                      stdDeviation="2"
                      result="glow"
                    />
                    <feMerge>
                      <feMergeNode
                        in="glow"
                      />
                      <feMergeNode
                        in="SourceGraphic"
                      />
                    </feMerge>
                  </filter>

                  <filter
                    id="shared-he"
                    x="-100%"
                    y="-100%"
                    width="300%"
                    height="300%"
                  >
                    <feGaussianBlur
                      stdDeviation="1.5"
                      result="glow"
                    />
                    <feMerge>
                      <feMergeNode
                        in="glow"
                      />
                      <feMergeNode
                        in="SourceGraphic"
                      />
                    </feMerge>
                  </filter>

                  <filter
                    id="shared-molotov"
                    x="-90%"
                    y="-90%"
                    width="280%"
                    height="280%"
                  >
                    <feDropShadow
                      dx="0"
                      dy="0"
                      stdDeviation="4"
                      floodColor="#e98769"
                      floodOpacity=".5"
                    />
                  </filter>
                </defs>

                {activeItems.map(
                  (item) => (
                    <SharedItem
                      key={
                        item.id
                      }
                      item={
                        item
                      }
                    />
                  ),
                )}
              </svg>
            </div>

            <div className="shared-tactic-stages">
              <div className="shared-tactic-section-title">
                {c.stages}
              </div>

              <div className="shared-tactic-stage-grid">
                {stages.map(
                  (
                    stage,
                    index,
                  ) => (
                    <button
                      type="button"
                      key={
                        stage.id
                      }
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
                        setActiveStageId(
                          stage.id,
                        );
                      }}
                    >
                      <span>
                        {String(
                          index +
                            1,
                        ).padStart(
                          2,
                          "0",
                        )}
                      </span>
                      <strong>
                        {stage.name}
                      </strong>
                    </button>
                  ),
                )}
              </div>
            </div>
          </div>

          <aside className="shared-tactic-utility">
            <div className="shared-tactic-section-title">
              {c.utility}
            </div>

            {utility.length ? (
              <div className="shared-tactic-table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>
                        {c.number}
                      </th>
                      <th>
                        {c.player}
                      </th>
                      <th>
                        {c.type}
                      </th>
                      <th>
                        {c.time}
                      </th>
                      <th>
                        {c.from}
                      </th>
                      <th>
                        {c.purpose}
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
                            {String(
                              item.marker,
                            ).toUpperCase()}
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
              </div>
            ) : (
              <div className="shared-tactic-empty">
                {c.emptyUtility}
              </div>
            )}
          </aside>
        </div>
      </div>
    </section>
  );
}
