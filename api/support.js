import { createHmac } from "node:crypto";

import {
  rankSupportFaq,
  normalizeSupportLocale,
} from "../shared/supportFaq.js";

const OPENAI_API = "https://api.openai.com/v1/responses";
const DEFAULT_MODEL = "gpt-5.6-luna";
const MAX_MESSAGE_LENGTH = 1200;
const MAX_OUTPUT_TOKENS = 500;
const REQUEST_TIMEOUT_MS = 18_000;

function send(response, status, body) {
  response.setHeader("Cache-Control", "no-store");
  response.setHeader("X-Content-Type-Options", "nosniff");
  response.setHeader("X-Frame-Options", "DENY");
  response.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");

  return response.status(status).json(body);
}

function getHeader(request, name) {
  const value = request.headers?.[name.toLowerCase()];
  if (Array.isArray(value)) return value[0] || "";
  return typeof value === "string" ? value : "";
}

function getClientAddress(request) {
  const forwarded = getHeader(request, "x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim().slice(0, 96);

  const realIp = getHeader(request, "x-real-ip");
  return realIp ? realIp.trim().slice(0, 96) : "unknown";
}

function supportRequestId(request) {
  const secret =
    process.env.SUPPORT_HASH_SECRET?.trim() ||
    process.env.SHOP_RATE_LIMIT_SECRET?.trim() ||
    "iste-support-anonymous";

  return createHmac("sha256", secret)
    .update(getClientAddress(request))
    .digest("hex")
    .slice(0, 16);
}

function extractOutputText(payload) {
  if (typeof payload?.output_text === "string" && payload.output_text.trim()) {
    return payload.output_text.trim();
  }

  const parts = [];

  for (const item of Array.isArray(payload?.output) ? payload.output : []) {
    if (item?.type !== "message") continue;

    for (const content of Array.isArray(item?.content) ? item.content : []) {
      if (
        content?.type === "output_text" &&
        typeof content?.text === "string"
      ) {
        parts.push(content.text);
      }
    }
  }

  return parts.join("\n").trim();
}

function faqContext(matches, locale) {
  const lang = normalizeSupportLocale(locale);

  return matches.map(({ faq }, index) => {
    const item = faq.copy[lang] || faq.copy.en;
    return [
      `FAQ ${index + 1} [${faq.id}]`,
      `Question: ${item.question}`,
      `Answer: ${item.answer}`,
    ].join("\n");
  }).join("\n\n");
}

async function askOpenAI(message, locale, matches) {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) return null;

  const model =
    process.env.OPENAI_SUPPORT_MODEL?.trim() ||
    DEFAULT_MODEL;

  const lang = normalizeSupportLocale(locale);
  const languageName =
    lang === "uk"
      ? "Ukrainian"
      : lang === "ru"
        ? "Russian"
        : "English";

  const instructions = [
    "You are ISTe Support, the first-line technical support assistant for the ISTe esports project.",
    "Answer only from the verified ISTe knowledge supplied below.",
    "Never invent project rules, prices, staff decisions, schedules, account status, recruitment decisions or technical facts that are not present in the knowledge.",
    "If the knowledge is insufficient, say clearly that you do not have enough verified information and recommend contacting human ISTe support.",
    "Keep the answer concise and practical.",
    `Answer in ${languageName}.`,
    "",
    "VERIFIED ISTe KNOWLEDGE:",
    faqContext(matches, lang) || "No matching verified FAQ entries.",
  ].join("\n");

  const controller = new AbortController();
  const timeout = setTimeout(
    () => controller.abort(),
    REQUEST_TIMEOUT_MS,
  );

  try {
    const result = await fetch(OPENAI_API, {
      method: "POST",
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        instructions,
        input: message,
        max_output_tokens: MAX_OUTPUT_TOKENS,
      }),
    });

    const payload = await result.json().catch(() => null);

    if (!result.ok) {
      console.error("ISTe Support OpenAI request failed", {
        status: result.status,
        code: payload?.error?.code || null,
        type: payload?.error?.type || null,
      });
      return null;
    }

    const text = extractOutputText(payload);
    return text || null;
  } catch (error) {
    console.error("ISTe Support OpenAI request failed", {
      message: error instanceof Error ? error.message : String(error),
    });
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

export default async function handler(request, response) {
  if (request.method !== "POST") {
    response.setHeader("Allow", "POST");
    return send(response, 405, {
      ok: false,
      error: "METHOD_NOT_ALLOWED",
      message: "Method not allowed.",
    });
  }

  const rawMessage =
    typeof request.body?.message === "string"
      ? request.body.message.trim()
      : "";

  const locale = normalizeSupportLocale(request.body?.locale);

  if (
    rawMessage.length < 2 ||
    rawMessage.length > MAX_MESSAGE_LENGTH
  ) {
    return send(response, 400, {
      ok: false,
      error: "INVALID_MESSAGE",
      message:
        "Support question must contain between 2 and 1200 characters.",
    });
  }

  const matches = rankSupportFaq(rawMessage, locale, 6);
  const bestScore = matches[0]?.score || 0;

  if (bestScore >= 8) {
    const item =
      matches[0].faq.copy[locale] ||
      matches[0].faq.copy.en;

    return send(response, 200, {
      ok: true,
      answer: item.answer,
      source: "faq",
      matchedFaqIds: [matches[0].faq.id],
      requestId: supportRequestId(request),
      needsHuman: false,
    });
  }

  const aiAnswer = await askOpenAI(
    rawMessage,
    locale,
    matches,
  );

  if (aiAnswer) {
    const lower = aiAnswer.toLowerCase();
    const needsHuman =
      lower.includes("human support") ||
      lower.includes("поддерж") ||
      lower.includes("підтрим");

    return send(response, 200, {
      ok: true,
      answer: aiAnswer,
      source: "ai",
      matchedFaqIds: matches.map(({ faq }) => faq.id),
      requestId: supportRequestId(request),
      needsHuman,
    });
  }

  const fallback = {
    uk:
      "У базі знань ISTe поки немає перевіреної відповіді на це питання. Звернися до технічної підтримки ISTe у Discord.",
    ru:
      "В базе знаний ISTe пока нет проверенного ответа на этот вопрос. Обратись в техническую поддержку ISTe в Discord.",
    en:
      "The ISTe knowledge base does not yet contain a verified answer to this question. Please contact ISTe technical support on Discord.",
  };

  return send(response, 200, {
    ok: true,
    answer: fallback[locale],
    source: "fallback",
    matchedFaqIds: matches.map(({ faq }) => faq.id),
    requestId: supportRequestId(request),
    needsHuman: true,
  });
}
