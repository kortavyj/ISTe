import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const indexPath = path.join(root, "telegram-bot", "index.mjs");
const packagePath = path.join(root, "telegram-bot", "package.json");
const envPath = path.join(root, "telegram-bot", ".env.example");

for (const file of [indexPath, packagePath]) {
  if (!fs.existsSync(file)) {
    throw new Error(`Missing required file: ${file}`);
  }
}

let source = fs.readFileSync(indexPath, "utf8");

function replaceOnce(anchor, replacement, label) {
  if (!source.includes(anchor)) {
    throw new Error(`Stage 7 patch anchor not found: ${label}`);
  }
  source = source.replace(anchor, replacement);
}

if (!source.includes('createRequestAutomation')) {
  replaceOnce(
    'import { createTwitchAutomation } from "./twitch.mjs";\n',
    'import { createRequestAutomation } from "./requests.mjs";\n' +
      'import { createTwitchAutomation } from "./twitch.mjs";\n',
    "request import",
  );
}

if (!source.includes("let requestAutomation = null;")) {
  replaceOnce(
    "let twitchAutomation = null;\n",
    "let twitchAutomation = null;\nlet requestAutomation = null;\n",
    "request automation variable",
  );
}

if (!source.includes("requestAutomation.adminRows")) {
  replaceOnce(
    "          ...(twitchAutomation ? twitchAutomation.adminRows(lang) : []),\n",
    "          ...(twitchAutomation ? twitchAutomation.adminRows(lang) : []),\n" +
      "          ...(requestAutomation ? requestAutomation.adminRows(lang) : []),\n",
    "admin rows",
  );
}

if (!source.includes("requestAutomation.handleMessage")) {
  replaceOnce(
    "  const command = normalizeCommand(message.text);\n",
    "  if (\n" +
      "    requestAutomation &&\n" +
      "    await requestAutomation.handleMessage(message, user)\n" +
      "  ) {\n" +
      "    return;\n" +
      "  }\n\n" +
      "  const command = normalizeCommand(message.text);\n",
    "message delegate",
  );
}

if (!source.includes("requestAutomation.handleCallback")) {
  replaceOnce(
    '  const data = String(query.data || "");\n',
    '  const data = String(query.data || "");\n\n' +
      "  if (\n" +
      "    requestAutomation &&\n" +
      "    await requestAutomation.handleCallback(data, query, user)\n" +
      "  ) {\n" +
      "    return;\n" +
      "  }\n",
    "callback delegate",
  );
}

if (!source.includes('command: "apply"')) {
  replaceOnce(
    '      { command: "livetest", description: "Preview Twitch LIVE post" },\n',
    '      { command: "livetest", description: "Preview Twitch LIVE post" },\n' +
      '      { command: "apply", description: "Apply to ISTesport" },\n' +
      '      { command: "support", description: "Contact ISTesport support" },\n' +
      '      { command: "partner", description: "Partnership request" },\n' +
      '      { command: "myrequests", description: "Show my requests" },\n' +
      '      { command: "cancel", description: "Cancel request draft" },\n' +
      '      { command: "requests", description: "Admin request queue" },\n' +
      '      { command: "request", description: "Admin request details" },\n',
    "Telegram commands",
  );
}

if (!source.includes("const requestInitialized =")) {
  replaceOnce(
    "  const twitchInitialized = await twitchAutomation.initialize();\n\n  await syncCommands();",
    "  const twitchInitialized = await twitchAutomation.initialize();\n\n" +
      "  requestAutomation = createRequestAutomation({\n" +
      "    telegram,\n" +
      "    sendMessage,\n" +
      "    answerCallback,\n" +
      "    audit,\n" +
      "    supabase,\n" +
      "    ownerId: OWNER_ID,\n" +
      "    hasRole,\n" +
      "  });\n\n" +
      "  const requestInitialized = await requestAutomation.initialize();\n\n" +
      "  await syncCommands();",
    "request initialization",
  );
}

if (!source.includes("requestInitialized,")) {
  replaceOnce(
    "      twitchPollSeconds: twitchAutomation.config.pollSeconds,\n",
    "      twitchPollSeconds: twitchAutomation.config.pollSeconds,\n" +
      "      requestsEnabled: true,\n" +
      "      requestInitialized,\n",
    "boot log fields",
  );
}

source = source.replace('version: "0.6.0"', 'version: "0.7.0"');

fs.writeFileSync(indexPath, source, "utf8");

const pkg = JSON.parse(fs.readFileSync(packagePath, "utf8"));
pkg.version = "0.7.0";
fs.writeFileSync(packagePath, JSON.stringify(pkg, null, 2) + "\n", "utf8");

if (fs.existsSync(envPath)) {
  let env = fs.readFileSync(envPath, "utf8");
  if (!env.includes("TELEGRAM_ADMIN_CHAT=")) {
    if (!env.endsWith("\n")) env += "\n";
    env += "# Optional. If empty, request notifications go to TELEGRAM_OWNER_ID.\n";
    env += "TELEGRAM_ADMIN_CHAT=\n";
  }
  fs.writeFileSync(envPath, env, "utf8");
}

console.log("Stage 7 patch applied.");
console.log("Next: node --check telegram-bot/index.mjs");
console.log("Next: node --check telegram-bot/requests.mjs");
