import { createHash, randomBytes } from "crypto";

export function generateSecureToken(bytes = 32): string {
  return randomBytes(bytes).toString("hex");
}

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function getTokenExpiry(hours: number): Date {
  const expires = new Date();
  expires.setHours(expires.getHours() + hours);
  return expires;
}
