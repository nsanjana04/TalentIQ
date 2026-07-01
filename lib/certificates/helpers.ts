import { randomBytes } from "crypto";

export function generateCertificateNumber(): string {
  const year = new Date().getFullYear();
  const seq = randomBytes(3).toString("hex").toUpperCase();
  return `TIQ-${year}-${seq}`;
}

export function generateVerificationToken(): string {
  return randomBytes(24).toString("hex");
}

export function getVerificationUrl(token: string): string {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  return `${base}/verify/certificate/${token}`;
}

export function resolveCertificateStatus(
  status: string,
  expiresAt: Date | null
): "ACTIVE" | "EXPIRED" | "REVOKED" | "RENEWED" {
  if (status === "REVOKED" || status === "RENEWED") {
    return status as "REVOKED" | "RENEWED";
  }
  if (expiresAt && expiresAt < new Date()) return "EXPIRED";
  return status === "EXPIRED" ? "EXPIRED" : "ACTIVE";
}
