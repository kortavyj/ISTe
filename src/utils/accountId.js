export const ACCOUNT_ID_PREFIX = "ISTE";

export function normalizeAccountId(value) {
  const digits = String(value ?? "").replace(/\D/g, "");

  if (!digits) {
    return "";
  }

  return digits.replace(/^0+(?=\d)/, "").slice(0, 18);
}

export function formatAccountId(value) {
  const normalized = normalizeAccountId(value);

  if (!normalized || normalized === "0") {
    return "";
  }

  return `${ACCOUNT_ID_PREFIX} ${normalized.padStart(6, "0")}`;
}

export function isValidAccountId(value) {
  const normalized = normalizeAccountId(value);

  return Boolean(normalized && normalized !== "0");
}
