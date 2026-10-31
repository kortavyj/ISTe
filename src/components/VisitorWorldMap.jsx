import { useEffect, useMemo, useRef, useState } from "react";

const GEO_SOURCE = "https://raw.githubusercontent.com/johan/world.geo.json/master/countries.geo.json";
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
function constrain(next) {
  const w = Math.max(100, Math.min(WIDTH, next.w));
  const h = w * HEIGHT / WIDTH;
  return { w, h, x: Math.min(WIDTH - w, Math.max(0, next.x)), y: Math.min(HEIGHT - h, Math.max(0, next.y)) };
}
export default function VisitorWorldMap() {
  const [features, setFeatures] = useState([]);
  const [error, setError] = useState("");
  const [viewport, setViewport] = useState(HOME);
  const [focused, setFocused] = useState(null);
  const [hovered, setHovered] = useState(null);
  const pointer = useRef(null);
  const svgRef = useRef(null);
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
  })), [features]);
  function zoom(factor, centerX = viewport.x + viewport.w / 2, centerY = viewport.y + viewport.h / 2) {
    setViewport(current => {
      const w = current.w / factor;
      const h = w * HEIGHT / WIDTH;
      const rx = (centerX - current.x) / current.w;
      const ry = (centerY - current.y) / current.h;
      return constrain({ x: centerX - rx * w, y: centerY - ry * h, w, h });
    });
  }
  function onWheel(event) {
    event.preventDefault();
    const bounds = svgRef.current?.getBoundingClientRect();
    if (!bounds) return;
    const cx = viewport.x + (event.clientX - bounds.left) / bounds.width * viewport.w;
    const cy = viewport.y + (event.clientY - bounds.top) / bounds.height * viewport.h;
    zoom(event.deltaY < 0 ? 1.22 : 1 / 1.22, cx, cy);
  }
  function down(event) {
    if (event.button !== 0 && event.pointerType === "mouse") return;
    pointer.current = { x: event.clientX, y: event.clientY, viewport };
    event.currentTarget.setPointerCapture(event.pointerId);
  }
  function move(event) {
    if (!pointer.current) return;
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return;
    const start = pointer.current;
    setViewport(constrain({ ...start.viewport, x: start.viewport.x - (event.clientX - start.x) * start.viewport.w / rect.width, y: start.viewport.y - (event.clientY - start.y) * start.viewport.h / rect.height }));
  }
  function stop() { pointer.current = null; }
  const active = focused || hovered;
  return (
    <div className="iste-real-map">
      <div className="iste-real-map-toolbar">
        <span>Країни відвідувачів · 31.10.2026</span>
        <div className="iste-map-controls">
          <button type="button" onClick={() => zoom(1.5)} aria-label="Збільшити карту">+</button>
          <button type="button" onClick={() => zoom(1 / 1.5)} aria-label="Зменшити карту">−</button>
          <button type="button" onClick={() => {setViewport(HOME);setFocused(null);}} aria-label="Початковий масштаб">↺</button>
        </div>
      </div>
      <div className="iste-real-map-stage">
        {error ? <p role="alert" className="iste-map-fallback">{error}</p> : !features.length ? <p className="iste-map-fallback">Завантаження мапи світу…</p> : null}
        <svg ref={svgRef} viewBox={`${viewport.x} ${viewport.y} ${viewport.w} ${viewport.h}`} role="img" aria-label="Інтерактивна карта світу з географією відвідувань ISTe" onWheel={onWheel} onPointerDown={down} onPointerMove={move} onPointerUp={stop} onPointerCancel={stop} onLostPointerCapture={stop} style={{ touchAction: "none", cursor: pointer.current ? "grabbing" : "grab" }}>
          <rect width={WIDTH} height={HEIGHT} fill="#11151f" />
          {shapes.map(shape => <path key={shape.id} d={shape.path} fill="#302735" stroke="#6e5266" strokeWidth={Math.max(0.25, viewport.w / WIDTH * .8)} fillRule="evenodd" />)}
          {LOCATIONS.map(item => {
            const [x, y] = project([item.lon, item.lat]);
            const activePoint = active?.iso === item.iso;
            return <g key={item.iso} onPointerEnter={() => setHovered(item)} onPointerLeave={() => setHovered(null)} onClick={() => setFocused(item)} style={{ cursor: "pointer" }}>
              <circle cx={x} cy={y} r={Math.max(2.5, viewport.w / WIDTH * (8 + Math.sqrt(item.count)))} fill="#fb3555" opacity=".2"/>
              <circle cx={x} cy={y} r={Math.max(1.7, viewport.w / WIDTH * (3.5 + Math.sqrt(item.count) * .55))} fill={activePoint ? "#fff" : "#ff4263"} stroke="#fff" strokeWidth={Math.max(.5, viewport.w / WIDTH)} />
              <title>{item.name}: {item.count}</title>
            </g>;
          })}
        </svg>
        {active && <div className="iste-map-tooltip" role="status"><strong>{active.name}</strong><span>{active.count} · значення з наданої статистики</span></div>}
      </div>
      <p className="iste-map-legend">Колесо миші або кнопки змінюють масштаб. Перетягніть карту для переміщення, натисніть на маркер для деталей. Точки позначають країни, а не адреси відвідувачів.</p>
      <style>{`
        .iste-real-map{margin-top:13px;border:1px solid #593247;border-radius:13px;overflow:hidden;background:#12121b}
        .iste-real-map-toolbar{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:10px 12px;color:#dbbece;font-size:12px}
        .iste-map-controls{display:flex;gap:5px}.iste-map-controls button{min-width:30px;height:30px;cursor:pointer;background:#2a1b29;border:1px solid #784054;color:white;border-radius:7px;font-size:18px}
        .iste-map-controls button:hover,.iste-map-controls button:focus-visible{background:#bd2448}
        .iste-real-map-stage{position:relative;aspect-ratio:2/1;background:#11151f;overflow:hidden}
        .iste-real-map-stage svg{display:block;width:100%;height:100%;user-select:none}
        .iste-map-tooltip{position:absolute;pointer-events:none;bottom:12px;left:12px;display:grid;gap:3px;background:#180f1eec;border:1px solid #ff4b6b;border-radius:10px;padding:10px 13px;color:#fff;box-shadow:0 8px 26px #0008}
        .iste-map-tooltip span{font-size:11px;color:#e4b9c8}.iste-map-fallback{position:absolute;inset:0;display:grid;place-items:center;text-align:center;color:#d0b6c4;padding:20px}
        .iste-map-legend{font-size:11px!important;color:#bbaab8!important;line-height:1.5!important;margin:0!important;padding:10px 12px}
      `}</style>
    </div>
  );
}
