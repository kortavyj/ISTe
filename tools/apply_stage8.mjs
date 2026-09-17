import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const indexPath = path.join(root, "telegram-bot", "index.mjs");
const packagePath = path.join(root, "telegram-bot", "package.json");
const envPath = path.join(root, "telegram-bot", ".env.example");

if (!fs.existsSync(indexPath)) {
  throw new Error(`Not found: ${indexPath}`);
}

let source = fs.readFileSync(indexPath, "utf8");

// Git on Windows may keep CRLF line endings. Normalize before matching anchors.
source = source.replace(/\r\n/g, "\n");

if (source.includes('createEngagementAutomation')) {
  console.log("Stage 8 patch already applied.");
  process.exit(0);
}

function replaceOnce(label, needle, replacement) {
  if (!source.includes(needle)) {
    throw new Error(
      `Stage 8 patch stopped: anchor not found (${label}). ` +
      "Do not continue or push. Send this error to ChatGPT.",
    );
  }

  source = source.replace(needle, replacement);
}

replaceOnce(
  "import",
  'import { createRequestAutomation } from "./requests.mjs";',
  'import { createEngagementAutomation } from "./engagement.mjs";\n' +
    'import { createRequestAutomation } from "./requests.mjs";',
);

replaceOnce(
  "global automation",
  'let requestAutomation = null;\nlet newsTimer = null;',
  'let requestAutomation = null;\n' +
    'let engagementAutomation = null;\n' +
    'let newsTimer = null;',
);

replaceOnce(
  "admin rows",
  '          ...(requestAutomation ? requestAutomation.adminRows(lang) : []),\n' +
    '          [',
  '          ...(requestAutomation ? requestAutomation.adminRows(lang) : []),\n' +
    '          ...(engagementAutomation ? engagementAutomation.adminRows(lang) : []),\n' +
    '          [',
);

replaceOnce(
  "message handler",
  '  if (\n' +
    '    requestAutomation &&\n' +
    '    await requestAutomation.handleMessage(message, user)\n' +
    '  ) {\n' +
    '    return;\n' +
    '  }\n\n' +
    '  const command = normalizeCommand(message.text);',
  '  if (\n' +
    '    requestAutomation &&\n' +
    '    await requestAutomation.handleMessage(message, user)\n' +
    '  ) {\n' +
    '    return;\n' +
    '  }\n\n' +
    '  if (\n' +
    '    engagementAutomation &&\n' +
    '    await engagementAutomation.handleMessage(message, user)\n' +
    '  ) {\n' +
    '    return;\n' +
    '  }\n\n' +
    '  const command = normalizeCommand(message.text);',
);

replaceOnce(
  "callback handler",
  '  if (\n' +
    '    requestAutomation &&\n' +
    '    await requestAutomation.handleCallback(data, query, user)\n' +
    '  ) {\n' +
    '    return;\n' +
    '  }\n\n' +
    '  if (data.startsWith("lang:")) {',
  '  if (\n' +
    '    requestAutomation &&\n' +
    '    await requestAutomation.handleCallback(data, query, user)\n' +
    '  ) {\n' +
    '    return;\n' +
    '  }\n\n' +
    '  if (\n' +
    '    engagementAutomation &&\n' +
    '    await engagementAutomation.handleCallback(data, query, user)\n' +
    '  ) {\n' +
    '    return;\n' +
    '  }\n\n' +
    '  if (data.startsWith("lang:")) {',
);

replaceOnce(
  "commands",
  '      { command: "request", description: "Admin request details" },\n' +
    '      { command: "channelcheck", description: "Check ISTesport channel" },',
  '      { command: "request", description: "Admin request details" },\n' +
    '      { command: "giveaway", description: "Create giveaway" },\n' +
    '      { command: "giveaways", description: "Show active giveaways" },\n' +
    '      { command: "giveawaystatus", description: "Giveaway admin status" },\n' +
    '      { command: "giveawaycancel", description: "Cancel giveaway draft" },\n' +
    '      { command: "endgiveaway", description: "Finish giveaway and draw winner" },\n' +
    '      { command: "poll", description: "Create Telegram poll" },\n' +
    '      { command: "polls", description: "Show recent polls" },\n' +
    '      { command: "pollcancel", description: "Cancel poll draft" },\n' +
    '      { command: "closepoll", description: "Close Telegram poll" },\n' +
    '      { command: "channelcheck", description: "Check ISTesport channel" },',
);

replaceOnce(
  "bootstrap",
  '  const requestInitialized = await requestAutomation.initialize();\n\n' +
    '  await syncCommands();',
  '  const requestInitialized = await requestAutomation.initialize();\n\n' +
    '  engagementAutomation = createEngagementAutomation({\n' +
    '    telegram,\n' +
    '    sendMessage,\n' +
    '    answerCallback,\n' +
    '    audit,\n' +
    '    supabase,\n' +
    '    channel: CHANNEL,\n' +
    '    ownerId: OWNER_ID,\n' +
    '    hasRole,\n' +
    '  });\n\n' +
    '  const engagementInitialized = await engagementAutomation.initialize();\n\n' +
    '  await syncCommands();',
);

replaceOnce(
  "version",
  '      version: "0.7.0",',
  '      version: "0.8.0",',
);

replaceOnce(
  "ready log",
  '      requestsEnabled: true,\n' +
    '      requestInitialized,\n',
  '      requestsEnabled: true,\n' +
    '      requestInitialized,\n' +
    '      engagementEnabled: true,\n' +
    '      engagementInitialized,\n' +
    '      giveawaySweepSeconds: engagementAutomation.config.sweepSeconds,\n',
);

fs.writeFileSync(indexPath, source, "utf8");

const pkg = JSON.parse(fs.readFileSync(packagePath, "utf8"));
pkg.version = "0.8.0";
fs.writeFileSync(packagePath, `${JSON.stringify(pkg, null, 2)}\n`, "utf8");

if (fs.existsSync(envPath)) {
  let env = fs.readFileSync(envPath, "utf8");

  if (!env.includes("TELEGRAM_GIVEAWAY_POLL_SECONDS=")) {
    if (!env.endsWith("\n")) env += "\n";
    env +=
      "# Optional. How often expired giveaways are finalized.\n" +
      "TELEGRAM_GIVEAWAY_POLL_SECONDS=30\n";
    fs.writeFileSync(envPath, env, "utf8");
  }
}

console.log("Stage 8 patch applied.");
console.log("Next:");
console.log("  node --check .\\telegram-bot\\index.mjs");
console.log("  node --check .\\telegram-bot\\engagement.mjs");
