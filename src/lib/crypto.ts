import crypto from "node:crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12; // 96-bit IV (NIST recommended for GCM)
const TAG_LENGTH = 16; // 128-bit auth tag

let cachedKey: Buffer | null = null;
let keyChecked = false;

function resolveKey(): Buffer | null {
  const secret = process.env.HELM_SECRET;
  if (secret) {
    return crypto.createHash("sha256").update(secret).digest();
  }
  return null;
}

function getKey(): Buffer | null {
  if (!keyChecked) {
    cachedKey = resolveKey();
    keyChecked = true;
    if (!cachedKey) {
      console.warn(
        "[helm] HELM_SECRET env var not set — cookie values will not be encrypted. " +
        "Set HELM_SECRET to a random string for encryption at rest."
      );
    }
  }
  return cachedKey;
}

/**
 * Seal a JavaScript value into a cookie-safe string.
 * Encrypts with AES-256-GCM if HELM_SECRET is set, otherwise base64-encodes.
 * Both are stored in httpOnly cookies so they're inaccessible to client JS.
 */
export function seal(data: unknown): string {
  const json = JSON.stringify(data);
  const key = getKey();

  if (key) {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv, {
      authTagLength: TAG_LENGTH,
    });
    const encrypted = Buffer.concat([
      cipher.update(json, "utf-8"),
      cipher.final(),
    ]);
    const tag = cipher.getAuthTag();
    return "e:" + Buffer.concat([iv, encrypted, tag]).toString("base64");
  }

  // No key — base64 encode (still protected by httpOnly)
  return "b:" + Buffer.from(json, "utf-8").toString("base64");
}

/**
 * Unseal a cookie string back into a JavaScript value.
 */
export function unseal(sealed: string): unknown {
  if (sealed.startsWith("e:")) {
    const key = getKey();
    if (!key) throw new Error("Encrypted cookie but no HELM_SECRET set");

    const buf = Buffer.from(sealed.slice(2), "base64");
    const iv = buf.subarray(0, IV_LENGTH);
    const tag = buf.subarray(buf.length - TAG_LENGTH);
    const ciphertext = buf.subarray(IV_LENGTH, buf.length - TAG_LENGTH);

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv, {
      authTagLength: TAG_LENGTH,
    });
    decipher.setAuthTag(tag);
    const decrypted = Buffer.concat([
      decipher.update(ciphertext),
      decipher.final(),
    ]);
    return JSON.parse(decrypted.toString("utf-8"));
  }

  if (sealed.startsWith("b:")) {
    return JSON.parse(
      Buffer.from(sealed.slice(2), "base64").toString("utf-8")
    );
  }

  throw new Error("Invalid sealed format");
}
