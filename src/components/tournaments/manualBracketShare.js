const ALLOWED_SIZES = [2,4,8,16,32];
const MAPS = new Set(["Ancient","Anubis","Dust2","Inferno","Mirage","Nuke","Overpass","Train","Vertigo"]);
const MAX_JSON = 60000;
const bytesToBase64Url = bytes => {
  let str = "";
  for (const byte of bytes) str += String.fromCharCode(byte);
  return btoa(str).replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/,"");
};
const base64UrlToBytes = input => Uint8Array.from(atob(input.replace(/-/g,"+").replace(/_/g,"/")), x => x.charCodeAt(0));

export function validateSharedBracket(value) {
  if (!value || value.v !== 1 || typeof value.title !== "string" || value.title.length > 100
    || !ALLOWED_SIZES.includes(value.size) || ![1,3,5].includes(value.bestOf)
    || !Array.isArray(value.entries) || value.entries.length !== value.size
    || value.entries.some(x => typeof x !== "string" || x.length < 2 || x.length > 60)
    || !value.results || typeof value.results !== "object" || Array.isArray(value.results)) {
    throw new Error("Недопустимый формат турнирной сетки.");
  }
  const names = new Set(value.entries.map(n => n.toLocaleLowerCase()));
  if (names.size !== value.size) throw new Error("Повторяющиеся команды в сетке.");
  if (Object.keys(value.results).length > value.size - 1) throw new Error("Слишком много матчей.");
  const rounds = Math.log2(value.size), need = Math.floor(value.bestOf/2)+1;
  for (const [key,r] of Object.entries(value.results)) {
    const m = /^(\d+)-(\d+)$/.exec(key);
    if (!m || +m[1] >= rounds || +m[2] >= value.size / (2 ** (+m[1]+1))
      || !r || typeof r.winner !== "string" || !value.entries.includes(r.winner)
      || !Array.isArray(r.maps) || r.maps.length < need || r.maps.length > value.bestOf) throw new Error("Некорректный результат матча.");
    let a = 0,b = 0;const used = new Set();
    for (const map of r.maps) {
      if (!map || !MAPS.has(map.name) || used.has(map.name)
        || !Number.isInteger(map.a) || !Number.isInteger(map.b)
        || map.a < 0 || map.b < 0 || map.a > 99 || map.b > 99 || map.a === map.b
        || a >= need || b >= need) throw new Error("Некорректный счёт.");
      used.add(map.name);a+=Number(map.a>map.b);b+=Number(map.b>map.a);
    }
    if (r.scoreA !== a || r.scoreB !== b || Math.max(a,b) !== need) throw new Error("Неверный итог матча.");
  }
  return value;
}
export async function createShareLink(tournament) {
  const value = validateSharedBracket({v:1,title:tournament.title.trim() || "ISTe Tournament",size:tournament.size,bestOf:tournament.bestOf,entries:tournament.entries,results:tournament.results});
  const raw = new TextEncoder().encode(JSON.stringify(value));
  if (raw.length > MAX_JSON) throw new Error("Слишком большой турнир для ссылки.");
  let bytes = raw;
  let prefix = "r";
  if (typeof CompressionStream !== "undefined") {
    const stream = new Blob([raw]).stream().pipeThrough(new CompressionStream("gzip"));
    bytes = new Uint8Array(await new Response(stream).arrayBuffer());
    prefix = "z";
  }
  const token = prefix + bytesToBase64Url(bytes);
  if (token.length > 12000) throw new Error("Ссылка получилась слишком длинной. Используйте экспорт JSON.");
  return `${window.location.origin}/tournaments/share#s=${token}`;
}
export async function readSharedBracket(token) {
  if (!token || token.length > 12000 || !/^[rz][A-Za-z0-9_-]+$/.test(token)) throw new Error("Некорректная ссылка.");
  const mode = token[0];
  let bytes = base64UrlToBytes(token.slice(1));
  if (mode === "z") {
    if (typeof DecompressionStream === "undefined") throw new Error("Этот браузер не поддерживает распаковку сетки.");
    const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream("gzip"));
    bytes = new Uint8Array(await new Response(stream).arrayBuffer());
  }
  if (bytes.length > MAX_JSON) throw new Error("Данные сетки слишком большие.");
  return validateSharedBracket(JSON.parse(new TextDecoder().decode(bytes)));
}
