import { copyFile, mkdir } from "node:fs/promises";
import { resolve } from "node:path";

const distDirectory = resolve("dist");
const sourceIndex = resolve(distDirectory, "index.html");

const routes = [
  "team",
  "matches",
  "news",
  "partners",
  "history",
  "contacts",
  "shop",
  "privacy",
  "terms",
  "login",
  "register",
  "forgot-password",
  "reset-password",
  "blocked",
  "account",
  "users",
  "admin/news",
  "owner/users",
];

for (const route of routes) {
  const routeDirectory = resolve(distDirectory, route);
  await mkdir(routeDirectory, { recursive: true });
  await copyFile(sourceIndex, resolve(routeDirectory, "index.html"));
}

await copyFile(sourceIndex, resolve(distDirectory, "404.html"));

console.log(`Created direct route entry files for ${routes.length} routes.`);
