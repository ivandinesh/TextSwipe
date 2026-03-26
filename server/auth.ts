import { createHash, randomBytes, scryptSync, timingSafeEqual } from "crypto";

const SCRYPT_KEYLEN = 64;

export function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const derivedKey = scryptSync(password, salt, SCRYPT_KEYLEN).toString("hex");
  return `${salt}:${derivedKey}`;
}

export function verifyPassword(password: string, storedHash: string) {
  const [salt, key] = storedHash.split(":");
  if (!salt || !key) {
    return false;
  }

  const derivedKey = scryptSync(password, salt, SCRYPT_KEYLEN);
  const storedKey = Buffer.from(key, "hex");

  if (derivedKey.length !== storedKey.length) {
    return false;
  }

  return timingSafeEqual(derivedKey, storedKey);
}

export function generateSecureToken(bytes = 32) {
  return randomBytes(bytes).toString("hex");
}

export function hashResetToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}
