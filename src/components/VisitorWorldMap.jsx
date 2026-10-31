import { useEffect, useMemo, useState } from "react";

const GEO_SOURCE = "/api/world-map";
const WIDTH = 1000;
const HEIGHT = 500;
const HOME = { x: 0, y: 0, w: WIDTH, h: HEIGHT };
const LOCATIONS = [
  { name: "Україна", iso: "UKR", count: 43, lon: 31.2, lat: 48.4 },
  { name: "Німеччина", iso: "DEU", count: 3, lon: 10.5, lat: 51.2 },
  { name: "Чехія", iso: "CZE", count: 3, lon: 15.5, lat: 49.8 },
  { name: "Росія", iso: "RUS", count: 2, lon: 92, lat: 61 },
  { name: "Польща", iso: "POL", count: 1, lon: 19.1, lat: 52.1 },
  { name: "США", iso: "USA", count: 1, lon: -98.5, lat: 39.8 },
  { name: "Монголія", iso: "MNG", count: 1, lon: 103.8, lat: 46.8 },
  { name: "Нідерланди", iso: "NLD", count: 1, lon: 5.3, lat: 52.1 },
];
function project(point) {
  return [(point[0] + 180) / 360 * WIDTH, (90 - point[1]) / 180 * HEIGHT];
}
function polygonPath(rings) {
  return rings.map(ring => ring.map((coordinate, index) => {
    const [x, y] = project(coordinate);
    return (index ? "L" : "M") + x.toFixed(2) + "," + y.toFixed(2);
  }).join(" ") + "Z").join(" ");
}
function featurePath(feature) {
  const geometry = feature.geometry;
  if (!geometry) return "";
  if (geometry.type === "Polygon") return polygonPath(geometry.coordinates);
  if (geometry.type === "MultiPolygon") return geometry.coordinates.map(polygonPath).join(" ");
  return "";
}
function geometryBounds(geometry) {
  if (!geometry) return null;
  const polygons = geometry.type === "Polygon" ? [geometry.coordinates] : geometry.type === "MultiPolygon" ? geometry.coordinates : [];
  let minX = WIDTH, minY = HEIGHT, maxX = 0, maxY = 0;
  for (const polygon of polygons) for (const ring of polygon) for (const point of ring) {
    const [x, y] = project(point);
    minX = Math.min(minX, x); maxX = Math.max(maxX, x);
    minY = Math.min(minY, y); maxY = Math.max(maxY, y);
  }
  if (minX > maxX) return null;
  return { x: (minX + maxX) / 2, y: (minY + maxY) / 2, w: maxX - minX, h: maxY - minY };
}
function displayName(name) {
  const translated = {
    "Ukraine": "Україна", "Germany": "Німеччина", "Czech Republic": "Чехія",
    "Czechia": "Чехія", "Russia": "Росія", "Poland": "Польща",
    "United States of America": "США", "United States": "США",
    "Mongolia": "Монголія", "Netherlands": "Нідерланди"
  };
  return translated[name] || name;
}
export default function VisitorWorldMap() {
  const [features, setFeatures] = useState([]);
  const [error, setError] = useState("");
  const [hovered, setHovered] = useState(null);
  useEffect(() => {
    const controller = new AbortController();
    fetch(GEO_SOURCE, { signal: controller.signal })
      .then(response => { if (!response.ok) throw new Error("Map data unavailable"); return response.json(); })
      .then(data => { if (!Array.isArray(data.features)) throw new Error("Invalid map"); setFeatures(data.features); })
      .catch(err => { if (err.name !== "AbortError") setError("Не вдалося завантажити географічну карту. Спробуйте оновити сторінку."); });
    return () => controller.abort();
  }, []);
  const shapes = useMemo(() => features.map((feature, i) => ({
    id: feature.id || i,
    path: featurePath(feature),
    name: feature.properties?.name || "Країна",
    bounds: geometryBounds(feature.geometry)
  })), [features]);
  const focused = hovered?.bounds;
  const scale = focused ? Math.min(3.8, Math.max(1.45, Math.min(WIDTH / Math.max(95, focused.w * 2.5), HEIGHT / Math.max(70, focused.h * 2.5)))) : 1;
  const tx = focused ? WIDTH / 2 - focused.x * scale : 0;
  const ty = focused ? HEIGHT / 2 - focused.y * scale : 0;
  const activeCount = hovered ? LOCATIONS.find(c => c.name === displayName(hovered.name))?.count : undefined;
  return (
    <div className="iste-real-map">
      <div className="iste-real-map-toolbar"><span>Географія відвідувачів · 31.10.2026</span></div>
      <div className="iste-real-map-stage" onMouseLeave={() => setHovered(null)}>
        {error ? <p role="alert" className="iste-map-fallback">{error}</p> : !features.length ? <p className="iste-map-fallback">Завантаження мапи світу…</p> : null}
        <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} role="img" aria-label="Карта світу: наведіть курсор на країну для приближення й перегляду статистики">
          <rect width={WIDTH} height={HEIGHT} fill="#11151f"/>
          <g className="iste-map-geography" style={{transform: `translate(${tx}px, ${ty}px) scale(${scale})`}}>
            {shapes.map(shape => <path key={shape.id} d={shape.path} fill={hovered?.id === shape.id ? "#934056" : "#302735"} stroke={hovered?.id === shape.id ? "#ff7892" : "#6e5266"} strokeWidth={hovered?.id === shape.id ? 1.2 : .7} fillRule="evenodd" />)}
            {LOCATIONS.map(item => {
              const [x,y] = project([item.lon,item.lat]);
              return <g key={item.iso} style={{pointerEvents:"none"}}>
                <circle cx={x} cy={y} r={8 + Math.sqrt(item.count)} fill="#fb3555" opacity=".2"/>
                <circle cx={x} cy={y} r={3.5 + Math.sqrt(item.count) * .55} fill="#ff4263" stroke="#fff" strokeWidth=".8" />
              </g>;
            })}
          </g>
          <g className="iste-map-hit-regions">
            {shapes.map(shape => <path key={shape.id} d={shape.path} fill="transparent" stroke="none" onMouseEnter={() => setHovered(shape)} onFocus={() => setHovered(shape)} tabIndex={0} aria-label={displayName(shape.name)} />)}
          </g>
        </svg>
        {hovered && <div className="iste-map-tooltip" role="status"><strong>{displayName(hovered.name)}</strong><span>{activeCount === undefined ? "Немає даних за цей день" : `${activeCount} · показник зі статистики`}</span></div>}
      </div>
      <p className="iste-map-legend">Наведіть курсор на країну, щоб наблизити її та переглянути показники. Для мобільного перегляду торкніться країни. Дані за 31.10.2026.</p>
      <style>{`
        .iste-real-map{margin-top:13px;border:1px solid #593247;border-radius:13px;overflow:hidden;background:#12121b}
        .iste-real-map-toolbar{padding:12px 14px;color:#dbbece;font-size:12px}
        .iste-real-map-stage{position:relative;aspect-ratio:2/1;background:#11151f;overflow:hidden}
        .iste-real-map-stage svg{display:block;width:100%;height:100%}
        .iste-map-geography{transform-origin:0 0;transition:transform .38s cubic-bezier(.2,.75,.2,1)}
        .iste-map-hit-regions path{cursor:pointer;outline:none}
        .iste-map-hit-regions path:focus-visible{stroke:#ff718a;stroke-width:1.5}
        .iste-map-tooltip{position:absolute;pointer-events:none;top:50%;left:50%;transform:translate(-50%,-50%);display:grid;gap:3px;text-align:center;min-width:155px;background:#180f1eec;border:1px solid #ff4b6b;border-radius:10px;padding:10px 13px;color:#fff;box-shadow:0 8px 26px #0008}
        .iste-map-tooltip span{font-size:11px;color:#e4b9c8}
        .iste-map-fallback{position:absolute;inset:0;display:grid;place-items:center;text-align:center;color:#d0b6c4;padding:20px}
        .iste-map-legend{font-size:11px!important;color:#bbaab8!important;line-height:1.5!important;margin:0!important;padding:10px 12px}
        @media(prefers-reduced-motion:reduce){.iste-map-geography{transition:none}}
      `}</style>
    </div>
  );
}
