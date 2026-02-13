import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const ALGORITHM = "aes-256-gcm";
const KEY_PATH = path.join(process.cwd(), "data", ".helm-key");
const IV_LENGTH = 12; // 96-bit IV (NIST recommended for GCM)
const TAG_LENGTH = 16; // 128-bit auth tag

let cachedKey: Buffer | null = null;

function getKey(): Buffer {
  try {
    const hex = fs.readFileSync(KEY_PATH, "utf-8").trim();
    const buf = Buffer.from(hex, "hex");
    if (buf.length === 32) return buf;
  } catch {
    // Key doesn't exist or is invalid — generate one
  }

  const key = crypto.randomBytes(32);
  const dir = path.dirname(KEY_PATH);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(KEY_PATH, key.toString("hex"), { mode: 0o600 });
  return key;
}

function ensureKey(): Buffer {
  if (!cachedKey) cachedKey = getKey();
  return cachedKey;
}

/** Check whether a string looks like an encrypted token (iv:cipher:tag format). */
export function isEncrypted(value: string): boolean {
  const parts = value.split(":");
  if (parts.length !== 3) return false;
  try {
    for (const part of parts) {
      if (Buffer.from(part, "base64").toString("base64") !== part) return false;
    }
    return true;
  } catch {
    return false;
  }
}

/** Encrypt a plaintext string. Returns `base64(iv):base64(ciphertext):base64(authTag)`. */
export function encryptToken(plaintext: string): string {
  const key = ensureKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv, {
    authTagLength: TAG_LENGTH,
  });
  const encrypted = Buffer.concat([
    cipher.update(plaintext, "utf-8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  return `${iv.toString("base64")}:${encrypted.toString("base64")}:${tag.toString("base64")}`;
}

/** Decrypt a token string in the `iv:ciphertext:tag` format. */
export function decryptToken(encrypted: string): string {
  const key = ensureKey();
  const parts = encrypted.split(":");
  if (parts.length !== 3) throw new Error("Invalid encrypted token format");

  const iv = Buffer.from(parts[0], "base64");
  const ciphertext = Buffer.from(parts[1], "base64");
  const tag = Buffer.from(parts[2], "base64");

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv, {
    authTagLength: TAG_LENGTH,
  });
  decipher.setAuthTag(tag);
  const decrypted = Buffer.concat([
    decipher.update(ciphertext),
    decipher.final(),
  ]);
  return decrypted.toString("utf-8");
}
