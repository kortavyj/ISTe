import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const indexPath = path.join(root, "telegram-bot", "index.mjs");
const packagePath = path.join(root, "telegram-bot", "package.json");

if (!fs.existsSync(indexPath)) {
  throw new Error(`Not found: ${indexPath}`);
}

let source = fs
  .readFileSync(indexPath, "utf8")
  .replace(/\r\n/g, "\n");

if (source.includes("createModerationAutomation")) {
  console.log("Stage 11 patch already applied.");
  process.exit(0);
}

function replaceOnce(label, needle, replacement) {
  if (!source.includes(needle)) {
    throw new Error(
      `Stage 11 patch stopped: anchor not found (${label}). ` +
      "Do not push. Send this error to ChatGPT.",
    );
  }
  source = source.replace(needle, replacement);
}

replaceOnce(
  "import",
  'import { createChannelAdminAutomation } from "./channel-admin.mjs";',
  'import { createModerationAutomation } from "./moderation.mjs";\n' +
    'import { createChannelAdminAutomation } from "./channel-admin.mjs";',
);

replaceOnce(
  "global",
  'let channelAdminAutomation = null;\nlet newsTimer = null;',
  'let channelAdminAutomation = null;\n' +
    'let moderationAutomation = null;\n' +
    'let newsTimer = null;',
);

replaceOnce(
  "handle update",
  'async function handleUpdate(update) {\n' +
    '  if (update?.message) return handleMessage(update.message);\n' +
    '  if (update?.callback_query) return handleCallback(update.callback_query);\n' +
    '}',
  'async function handleUpdate(update) {\n' +
    '  if (update?.message) {\n' +
    '    if (\n' +
    '      moderationAutomation &&\n' +
    '      await moderationAutomation.handleMessage(update.message)\n' +
    '    ) {\n' +
    '      return;\n' +
    '    }\n\n' +
    '    return handleMessage(update.message);\n' +
    '  }\n\n' +
    '  if (update?.callback_query) return handleCallback(update.callback_query);\n' +
    '}',
);

replaceOnce(
  "group commands",
  '    scope: { type: "all_private_chats" },\n' +
    '  });\n' +
    '}',
  '    scope: { type: "all_private_chats" },\n' +
    '  });\n\n' +
    '  await telegram("setMyCommands", {\n' +
    '    commands: [\n' +
    '      { command: "modstatus", description: "Show moderation status" },\n' +
    '      { command: "warn", description: "Warn replied user" },\n' +
    '      { command: "warnings", description: "Show replied user warnings" },\n' +
    '      { command: "clearwarnings", description: "Clear replied user warnings" },\n' +
    '      { command: "mute", description: "Mute replied user" },\n' +
    '      { command: "unmute", description: "Unmute replied user" },\n' +
    '      { command: "ban", description: "Ban replied user" },\n' +
    '      { command: "unban", description: "Unban by Telegram user ID" },\n' +
    '      { command: "antispam", description: "Anti-spam on/off" },\n' +
    '      { command: "links", description: "Link filter on/off" },\n' +
    '      { command: "filteradd", description: "Add blocked phrase" },\n' +
    '      { command: "filterdel", description: "Remove blocked phrase" },\n' +
    '      { command: "filters", description: "Show blocked phrases" },\n' +
    '    ],\n' +
    '    scope: { type: "all_group_chats" },\n' +
    '  });\n' +
    '}',
);

replaceOnce(
  "bootstrap",
  '  const channelAdminInitialized = await channelAdminAutomation.initialize();\n\n' +
    '  await syncCommands();',
  '  const channelAdminInitialized = await channelAdminAutomation.initialize();\n\n' +
    '  moderationAutomation = createModerationAutomation({\n' +
    '    telegram,\n' +
    '    sendMessage,\n' +
    '    audit,\n' +
    '    supabase,\n' +
    '  });\n\n' +
    '  const moderationInitialized = await moderationAutomation.initialize();\n\n' +
    '  await syncCommands();',
);

replaceOnce(
  "version",
  '      version: "0.9.0",',
  '      version: "0.11.0",',
);

replaceOnce(
  "ready log",
  '      channelAdminEnabled: true,\n' +
    '      channelAdminInitialized,\n',
  '      channelAdminEnabled: true,\n' +
    '      channelAdminInitialized,\n' +
    '      moderationEnabled: true,\n' +
    '      moderationInitialized,\n',
);

fs.writeFileSync(indexPath, source, "utf8");

const pkg = JSON.parse(fs.readFileSync(packagePath, "utf8"));
pkg.version = "0.11.0";
fs.writeFileSync(
  packagePath,
  `${JSON.stringify(pkg, null, 2)}\n`,
  "utf8",
);

console.log("Stage 11 patch applied.");
console.log("Next:");
console.log("  node --check .\\telegram-bot\\index.mjs");
console.log("  node --check .\\telegram-bot\\moderation.mjs");
