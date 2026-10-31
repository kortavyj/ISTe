const SOURCES = [
  "https://raw.githubusercontent.com/johan/world.geo.json/master/countries.geo.json",
  "https://cdn.jsdelivr.net/gh/johan/world.geo.json@master/countries.geo.json",
];
export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }
  res.setHeader("Cache-Control", "public, s-maxage=86400, stale-while-revalidate=604800");
  for (const source of SOURCES) {
    try {
      const response = await fetch(source, { signal: AbortSignal.timeout(8000) });
      if (!response.ok) continue;
      const data = await response.json();
      if (data?.type !== "FeatureCollection" || !Array.isArray(data.features) || data.features.length < 100) continue;
      return res.status(200).json(data);
    } catch (error) {
      console.error("World map source unavailable", source, error?.message);
    }
  }
  return res.status(503).json({ error: "Map data temporarily unavailable" });
}
