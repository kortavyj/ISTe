import { readFile, mkdir, writeFile } from "node:fs/promises";
import { resolve, join } from "node:path";

const origin = "https://www.istesport.com";
const destinations = [
  {
    path: "/team",
    title: "Склад ISTe CS2 | Гравці кіберспортивної команди",
    description: "Знайомся зі складом ISTe у Counter-Strike 2: гравці, ролі, FACEIT та актуальна інформація про команду.",
  },
  {
    path: "/team/academy",
    title: "ISTe Academy CS2 | Академічний склад і гравці",
    description: "ISTe Academy у CS2: нікнейми, ролі, фотографії та профілі FACEIT гравців академічного складу.",
  },
  {
    path: "/matches",
    title: "Матчі ISTe CS2 | Результати і розклад",
    description: "Результати матчів ISTe з Counter-Strike 2, завершені зустрічі й інформація про майбутні матчі команди.",
  },
  {
    path: "/tournaments",
    title: "Кіберспортивні турніри CS2 | ISTe",
    description: "Турніри та змагання Counter-Strike 2 від ISTe: актуальні події, участь команд і турнірні сітки.",
  },
  {
    path: "/news",
    title: "Новини кіберспорту CS2 | Команда ISTe",
    description: "Новини ISTe: турніри Counter-Strike 2, результати матчів, зміни у складі та важливі події клубу.",
  },
  {
    path: "/history",
    title: "Історія ISTe | Засновник Євген Kortavyj",
    description: "Історія створення ISTe та шлях засновника Євгена Kortavyj у кіберспорті та спільноті Counter-Strike 2.",
  },
  {
    path: "/partners",
    title: "Партнери ISTe | Кіберспортивний клуб",
    description: "Інформація про партнерів ISTe, співпрацю з брендами та розвиток кіберспортивної спільноти.",
  },
  {
    path: "/collaborate",
    title: "Співпраця з ISTe | Партнерство та кіберспорт",
    description: "Запропонуй партнерство ISTe: кіберспортивні турніри, медіапроєкти та інтеграції брендів.",
  },
  {
    path: "/discord",
    title: "Discord бот ISTe | Інструменти спільноти",
    description: "Інформація про Discord бота ISTe та його можливості для ігрових і кіберспортивних серверів.",
  },
  {
    path: "/highlights",
    title: "Хайлайти ISTe CS2 | Найкращі ігрові моменти",
    description: "Відео та хайлайти матчів ISTe з Counter-Strike 2, стріми та медіа кіберспортивної команди.",
  },
  {
    path: "/contacts",
    title: "Контакти ISTe | Зв’язатися з командою",
    description: "Контакти ISTe для гравців, організаторів турнірів, партнерів та представників медіа.",
  },
  {
    path: "/support",
    title: "Підтримка ISTe | Допомога користувачам",
    description: "Допомога користувачам сайту ISTe, відповіді на запитання та зв’язок із підтримкою.",
  },
];

export function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char],
  );
}

function updateTag(html, regex, replacement, label) {
  if (!regex.test(html)) {
    throw new Error(`SEO tag missing in Vite output: ${label}`);
  }
  return html.replace(regex, replacement);
}

export function renderRouteHtml(original, route) {
  const title = escapeHtml(route.title);
  const description = escapeHtml(route.description);
  const canonical = origin + route.path;
  let html = original;

  html = updateTag(html, /<title>[^<]*<\/title>/, `<title>${title}</title>`, "title");
  html = updateTag(
    html,
    /<meta\s+name="description"\s+content="[^"]*"\s*\/>/s,
    `<meta name="description" content="${description}" />`,
    "description",
  );
  html = updateTag(
    html,
    /<link\s+rel="canonical"\s+href="[^"]*"\s*\/>/,
    `<link rel="canonical" href="${canonical}" />`,
    "canonical",
  );

  for (const [property, value] of [
    ["og:title", title],
    ["og:description", description],
    ["og:url", canonical],
  ]) {
    html = updateTag(
      html,
      new RegExp(`<meta\\s+property="${property}"\\s+content="[^"]*"\\s*\\/>`, "s"),
      `<meta property="${property}" content="${value}" />`,
      property,
    );
  }

  html = updateTag(
    html,
    /<meta\s+name="twitter:title"\s+content="[^"]*"\s*\/>/,
    `<meta name="twitter:title" content="${title}" />`,
    "twitter:title",
  );
  html = updateTag(
    html,
    /<meta\s+name="twitter:description"\s+content="[^"]*"\s*\/>/s,
    `<meta name="twitter:description" content="${description}" />`,
    "twitter:description",
  );
  return html;
}

export const seoRoutes = destinations;

async function main() {
  const outputDir = resolve("dist");
  const html = await readFile(join(outputDir, "index.html"), "utf8");
  const seoDir = join(outputDir, "_seo");
  await mkdir(seoDir, { recursive: true });

  for (const route of destinations) {
    const fileName = route.path.slice(1).replaceAll("/", "__") + ".html";
    await writeFile(join(seoDir, fileName), renderRouteHtml(html, route), "utf8");
  }
  console.log(`Generated ${destinations.length} crawlable route-specific HTML metadata shells.`);
}

if (process.argv[1] && import.meta.url === new URL(`file://${resolve(process.argv[1])}`).href) {
  await main();
}
