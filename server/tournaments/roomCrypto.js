import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

function getKey() {
  const encoded = process.env.ISTE_CS2_ROOM_ENCRYPTION_KEY || "";
  const key = Buffer.from(encoded, "base64");
  if (!/^[A-Za-z0-9+/]{43}=$/.test(encoded) || key.length !== 32 || key.toString("base64") !== encoded) {
    throw new Error("ROOM_ENCRYPTION_KEY_UNAVAILABLE");
  }
  return key;
}
export function encryptRoomPassword(password) {
  if (typeof password !== "string" || password.length > 128) throw new Error("INVALID_ROOM_PASSWORD");
  if (!password) return "";
  const nonce = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", getKey(), nonce);
  const ciphertext = Buffer.concat([cipher.update(password, "utf8"), cipher.final()]);
  return "enc1:" + Buffer.concat([nonce, cipher.getAuthTag(), ciphertext]).toString("base64");
}
export function decryptRoomPassword(value) {
  if (value === "") return "";
  if (typeof value !== "string" || !value.startsWith("enc1:")) throw new Error("UNENCRYPTED_ROOM_PASSWORD");
  const packet = Buffer.from(value.slice(5), "base64");
  if (packet.length < 29) throw new Error("CORRUPT_ROOM_PASSWORD");
  const decipher = createDecipheriv("aes-256-gcm", getKey(), packet.subarray(0, 12));
  decipher.setAuthTag(packet.subarray(12, 28));
  return Buffer.concat([decipher.update(packet.subarray(28)), decipher.final()]).toString("utf8");
}
