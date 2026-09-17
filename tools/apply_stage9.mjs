import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const indexPath = path.join(root, "telegram-bot", "index.mjs");
const packagePath = path.join(root, "telegram-bot", "package.json");

if (!fs.existsSync(indexPath)) throw new Error(`Not found: ${indexPath}`);

let source = fs.readFileSync(indexPath, "utf8").replace(/\r\n/g, "\n");

if (source.includes("createChannelAdminAutomation")) {
  console.log("Stage 9 patch already applied.");
  process.exit(0);
}

function replaceOnce(label, needle, replacement) {
  if (!source.includes(needle)) {
    throw new Error(
      `Stage 9 patch stopped: anchor not found (${label}). Do not push. Send this error to ChatGPT.`,
    );
  }
  source = source.replace(needle, replacement);
}

replaceOnce(
  "import",
  'import { createEngagementAutomation } from "./engagement.mjs";',
  'import { createChannelAdminAutomation } from "./channel-admin.mjs";\n' +
    'import { createEngagementAutomation } from "./engagement.mjs";',
);

replaceOnce(
  "global",
  'let engagementAutomation = null;\nlet newsTimer = null;',
  'let engagementAutomation = null;\nlet channelAdminAutomation = null;\nlet newsTimer = null;',
);

replaceOnce(
  "admin rows",
  '          ...(engagementAutomation ? engagementAutomation.adminRows(lang) : []),\n' +
    '          [',
  '          ...(engagementAutomation ? engagementAutomation.adminRows(lang) : []),\n' +
    '          ...(channelAdminAutomation ? channelAdminAutomation.adminRows(lang) : []),\n' +
    '          [',
);

replaceOnce(
  "message handler",
  '  if (\n' +
    '    engagementAutomation &&\n' +
    '    await engagementAutomation.handleMessage(message, user)\n' +
    '  ) {\n' +
    '    return;\n' +
    '  }\n\n' +
    '  const command = normalizeCommand(message.text);',
  '  if (\n' +
    '    engagementAutomation &&\n' +
    '    await engagementAutomation.handleMessage(message, user)\n' +
    '  ) {\n' +
    '    return;\n' +
    '  }\n\n' +
    '  if (\n' +
    '    channelAdminAutomation &&\n' +
    '    await channelAdminAutomation.handleMessage(message, user)\n' +
    '  ) {\n' +
    '    return;\n' +
    '  }\n\n' +
    '  const command = normalizeCommand(message.text);',
);

replaceOnce(
  "callback handler",
  '  if (\n' +
    '    engagementAutomation &&\n' +
    '    await engagementAutomation.handleCallback(data, query, user)\n' +
    '  ) {\n' +
    '    return;\n' +
    '  }\n\n' +
    '  if (data.startsWith("lang:")) {',
  '  if (\n' +
    '    engagementAutomation &&\n' +
    '    await engagementAutomation.handleCallback(data, query, user)\n' +
    '  ) {\n' +
    '    return;\n' +
    '  }\n\n' +
    '  if (\n' +
    '    channelAdminAutomation &&\n' +
    '    await channelAdminAutomation.handleCallback(data, query, user)\n' +
    '  ) {\n' +
    '    return;\n' +
    '  }\n\n' +
    '  if (data.startsWith("lang:")) {',
);

replaceOnce(
  "commands",
  '      { command: "closepoll", description: "Close Telegram poll" },\n' +
    '      { command: "channelcheck", description: "Check ISTesport channel" },',
  '      { command: "closepoll", description: "Close Telegram poll" },\n' +
    '      { command: "post", description: "Create manual channel post" },\n' +
    '      { command: "posts", description: "Show manual channel posts" },\n' +
    '      { command: "postcancel", description: "Cancel manual post draft" },\n' +
    '      { command: "editpost", description: "Edit manual channel post" },\n' +
    '      { command: "deletepost", description: "Delete manual channel post" },\n' +
    '      { command: "channelcheck", description: "Check ISTesport channel" },',
);

replaceOnce(
  "bootstrap",
  '  const engagementInitialized = await engagementAutomation.initialize();\n\n' +
    '  await syncCommands();',
  '  const engagementInitialized = await engagementAutomation.initialize();\n\n' +
    '  channelAdminAutomation = createChannelAdminAutomation({\n' +
    '    telegram,\n' +
    '    sendMessage,\n' +
    '    answerCallback,\n' +
    '    audit,\n' +
    '    supabase,\n' +
    '    channel: CHANNEL,\n' +
    '    hasRole,\n' +
    '  });\n\n' +
    '  const channelAdminInitialized = await channelAdminAutomation.initialize();\n\n' +
    '  await syncCommands();',
);

replaceOnce(
  "version",
  '      version: "0.8.0",',
  '      version: "0.9.0",',
);

replaceOnce(
  "ready log",
  '      engagementEnabled: true,\n' +
    '      engagementInitialized,\n' +
    '      giveawaySweepSeconds: engagementAutomation.config.sweepSeconds,\n',
  '      engagementEnabled: true,\n' +
    '      engagementInitialized,\n' +
    '      giveawaySweepSeconds: engagementAutomation.config.sweepSeconds,\n' +
    '      channelAdminEnabled: true,\n' +
    '      channelAdminInitialized,\n',
);

fs.writeFileSync(indexPath, source, "utf8");

const pkg = JSON.parse(fs.readFileSync(packagePath, "utf8"));
pkg.version = "0.9.0";
fs.writeFileSync(packagePath, `${JSON.stringify(pkg, null, 2)}\n`, "utf8");

console.log("Stage 9 patch applied.");
console.log("Next:");
console.log("  node --check .\\telegram-bot\\index.mjs");
console.log("  node --check .\\telegram-bot\\channel-admin.mjs");
