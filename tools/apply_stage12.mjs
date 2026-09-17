import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const indexPath = path.join(root, "telegram-bot", "index.mjs");
const packagePath = path.join(root, "telegram-bot", "package.json");
const envPath = path.join(root, "telegram-bot", ".env.example");

if (!fs.existsSync(indexPath)) {
  throw new Error(`Not found: ${indexPath}`);
}

if (!fs.existsSync(packagePath)) {
  throw new Error(`Not found: ${packagePath}`);
}

let source = fs
  .readFileSync(indexPath, "utf8")
  .replace(/\r\n/g, "\n");

const pkg = JSON.parse(
  fs.readFileSync(packagePath, "utf8"),
);

if (source.includes("createObservabilityAutomation")) {
  console.log("Stage 12 patch already applied.");
  process.exit(0);
}

if (pkg.version !== "0.11.0") {
  throw new Error(
    `Stage 12 expects telegram-bot package version 0.11.0, got ${pkg.version}. ` +
    "Do not continue or push. Send this error to ChatGPT.",
  );
}

if (source.includes("createScheduledPostAutomation")) {
  throw new Error(
    "Stage 10 code was detected. This Stage 12 patch is built for the current " +
    "Stage 11 codebase where Stage 10 was skipped. Do not continue or push.",
  );
}

function replaceOnce(label, needle, replacement) {
  if (!source.includes(needle)) {
    throw new Error(
      `Stage 12 patch stopped: anchor not found (${label}). ` +
      "Do not continue or push. Send this error to ChatGPT.",
    );
  }

  source = source.replace(needle, replacement);
}

replaceOnce(
  "import",
  'import { createModerationAutomation } from "./moderation.mjs";',
  'import { createObservabilityAutomation } from "./observability.mjs";\n' +
    'import { createModerationAutomation } from "./moderation.mjs";',
);

replaceOnce(
  "global",
  'let moderationAutomation = null;\nlet newsTimer = null;',
  'let moderationAutomation = null;\n' +
    'let observabilityAutomation = null;\n' +
    'let newsTimer = null;',
);

replaceOnce(
  "admin rows",
  '          ...(channelAdminAutomation ? channelAdminAutomation.adminRows(lang) : []),\n' +
    '          [',
  '          ...(channelAdminAutomation ? channelAdminAutomation.adminRows(lang) : []),\n' +
    '          ...(observabilityAutomation ? observabilityAutomation.adminRows(lang) : []),\n' +
    '          [',
);

replaceOnce(
  "private message handler",
  '  if (\n' +
    '    channelAdminAutomation &&\n' +
    '    await channelAdminAutomation.handleMessage(message, user)\n' +
    '  ) {\n' +
    '    return;\n' +
    '  }\n\n' +
    '  const command = normalizeCommand(message.text);',
  '  if (\n' +
    '    channelAdminAutomation &&\n' +
    '    await channelAdminAutomation.handleMessage(message, user)\n' +
    '  ) {\n' +
    '    return;\n' +
    '  }\n\n' +
    '  if (\n' +
    '    observabilityAutomation &&\n' +
    '    await observabilityAutomation.handleMessage(message, user)\n' +
    '  ) {\n' +
    '    return;\n' +
    '  }\n\n' +
    '  const command = normalizeCommand(message.text);',
);

replaceOnce(
  "callback handler",
  '  if (\n' +
    '    channelAdminAutomation &&\n' +
    '    await channelAdminAutomation.handleCallback(data, query, user)\n' +
    '  ) {\n' +
    '    return;\n' +
    '  }\n\n' +
    '  if (data.startsWith("lang:")) {',
  '  if (\n' +
    '    channelAdminAutomation &&\n' +
    '    await channelAdminAutomation.handleCallback(data, query, user)\n' +
    '  ) {\n' +
    '    return;\n' +
    '  }\n\n' +
    '  if (\n' +
    '    observabilityAutomation &&\n' +
    '    await observabilityAutomation.handleCallback(data, query, user)\n' +
    '  ) {\n' +
    '    return;\n' +
    '  }\n\n' +
    '  if (data.startsWith("lang:")) {',
);

replaceOnce(
  "private commands",
  '      { command: "deletepost", description: "Delete manual channel post" },\n' +
    '      { command: "channelcheck", description: "Check ISTesport channel" },',
  '      { command: "deletepost", description: "Delete manual channel post" },\n' +
    '      { command: "health", description: "System health diagnostics" },\n' +
    '      { command: "botstats", description: "Bot statistics" },\n' +
    '      { command: "audit", description: "Recent audit activity" },\n' +
    '      { command: "errors", description: "Recent operational errors" },\n' +
    '      { command: "security", description: "Security diagnostics" },\n' +
    '      { command: "cleanup", description: "Run maintenance cleanup" },\n' +
    '      { command: "channelcheck", description: "Check ISTesport channel" },',
);

replaceOnce(
  "help owner block",
  '  if (hasRole(user, "owner")) {\n' +
    '    lines.push("<code>/channelcheck</code>");\n' +
    '  }',
  '  if (hasRole(user, "admin")) {\n' +
    '    lines.push("<code>/health</code>");\n' +
    '    lines.push("<code>/botstats</code>");\n' +
    '    lines.push("<code>/audit</code>");\n' +
    '    lines.push("<code>/errors</code>");\n' +
    '  }\n\n' +
    '  if (hasRole(user, "owner")) {\n' +
    '    lines.push("<code>/security</code>");\n' +
    '    lines.push("<code>/cleanup</code>");\n' +
    '    lines.push("<code>/channelcheck</code>");\n' +
    '  }',
);

replaceOnce(
  "bootstrap observability",
  '  const moderationInitialized = await moderationAutomation.initialize();\n\n' +
    '  await syncCommands();',
  '  const moderationInitialized = await moderationAutomation.initialize();\n\n' +
    '  observabilityAutomation = createObservabilityAutomation({\n' +
    '    telegram,\n' +
    '    sendMessage,\n' +
    '    answerCallback,\n' +
    '    audit,\n' +
    '    supabase,\n' +
    '    channel: CHANNEL,\n' +
    '    ownerId: OWNER_ID,\n' +
    '    botInfo,\n' +
    '    hasRole,\n' +
    '    moduleStatus: {\n' +
    '      news: true,\n' +
    '      matches: Boolean(matchInitialized),\n' +
    '      faceit: Boolean(faceitInitialized),\n' +
    '      twitch: Boolean(twitchInitialized),\n' +
    '      requests: Boolean(requestInitialized),\n' +
    '      engagement: Boolean(engagementInitialized),\n' +
    '      channelAdmin: Boolean(channelAdminInitialized),\n' +
    '      moderation: Boolean(moderationInitialized),\n' +
    '    },\n' +
    '  });\n\n' +
    '  const observabilityInitialized = await observabilityAutomation.initialize();\n\n' +
    '  await syncCommands();',
);

replaceOnce(
  "version",
  '      version: "0.11.0",',
  '      version: "0.12.0",',
);

replaceOnce(
  "ready log",
  '      moderationEnabled: true,\n' +
    '      moderationInitialized,\n',
  '      moderationEnabled: true,\n' +
    '      moderationInitialized,\n' +
    '      observabilityEnabled: true,\n' +
    '      observabilityInitialized,\n' +
    '      maintenanceSeconds: observabilityAutomation.config.maintenanceSeconds,\n',
);

replaceOnce(
  "start observability",
  '  await twitchAutomation.start();\n\n' +
    '  while (!stopping) {',
  '  await twitchAutomation.start();\n' +
    '  await observabilityAutomation.start();\n\n' +
    '  while (!stopping) {',
);

replaceOnce(
  "update error journal",
  '          console.error("telegram_update_failed", {\n' +
    '            updateId: update?.update_id ?? null,\n' +
    '            message: error instanceof Error ? error.message : String(error),\n' +
    '          });',
  '          console.error("telegram_update_failed", {\n' +
    '            updateId: update?.update_id ?? null,\n' +
    '            message: error instanceof Error ? error.message : String(error),\n' +
    '          });\n\n' +
    '          await observabilityAutomation?.recordError(\n' +
    '            "telegram_update_failed",\n' +
    '            error,\n' +
    '            { updateId: update?.update_id ?? null },\n' +
    '          );',
);

replaceOnce(
  "poll error journal",
  '      console.error("telegram_poll_failed", {\n' +
    '        message: error instanceof Error ? error.message : String(error),\n' +
    '      });\n\n' +
    '      await sleep(2000);',
  '      console.error("telegram_poll_failed", {\n' +
    '        message: error instanceof Error ? error.message : String(error),\n' +
    '      });\n\n' +
    '      await observabilityAutomation?.recordError(\n' +
    '        "telegram_poll_failed",\n' +
    '        error,\n' +
    '      );\n\n' +
    '      await sleep(2000);',
);

replaceOnce(
  "shutdown",
  '  matchAutomation?.stop();\n' +
    '  faceitAutomation?.stop();\n' +
    '  twitchAutomation?.stop();',
  '  observabilityAutomation?.stop();\n' +
    '  matchAutomation?.stop();\n' +
    '  faceitAutomation?.stop();\n' +
    '  twitchAutomation?.stop();',
);

fs.writeFileSync(indexPath, source, "utf8");

pkg.version = "0.12.0";
fs.writeFileSync(
  packagePath,
  `${JSON.stringify(pkg, null, 2)}\n`,
  "utf8",
);

if (fs.existsSync(envPath)) {
  let env = fs.readFileSync(envPath, "utf8");

  if (!env.includes("TELEGRAM_MAINTENANCE_SECONDS=")) {
    if (!env.endsWith("\n")) env += "\n";

    env +=
      "# Optional. Health snapshot and expired-draft cleanup interval.\n" +
      "TELEGRAM_MAINTENANCE_SECONDS=21600\n";

    fs.writeFileSync(envPath, env, "utf8");
  }
}

console.log("Stage 12 patch applied.");
console.log("Next:");
console.log("  node --check .\\telegram-bot\\index.mjs");
console.log("  node --check .\\telegram-bot\\observability.mjs");
