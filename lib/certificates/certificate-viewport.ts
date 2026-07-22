import { CERT_EXPORT_H, CERT_EXPORT_W } from "./certificate-draw-canvas";

/** A4 landscape page aspect (width / height) */
export const CERT_PAGE_ASPECT = CERT_EXPORT_W / CERT_EXPORT_H;

/** Pick canvas pixel width for on-screen display (sharp but not wasteful). */
export function pickCertificateRenderWidth(containerWidth: number, devicePixelRatio = 1): number {
  const dpr = Math.min(Math.max(devicePixelRatio, 1), 2);
  const target = Math.round(containerWidth * dpr);
  return Math.min(CERT_EXPORT_W, Math.max(640, target));
}

export function certificateRenderHeight(renderWidth: number): number {
  return Math.round(renderWidth * (CERT_EXPORT_H / CERT_EXPORT_W));
}
