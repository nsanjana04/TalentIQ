/** Pixel size of the QR image (matches modal header and export layout). */
export const CERTIFICATE_QR_DISPLAY_SIZE = 88;

/** Shared QR image URL — same-origin proxy for canvas export; identical in modal and downloads */
export function getCertificateQrImageUrl(url: string, size: number): string {
  const px = Math.max(64, Math.round(size));
  return `/api/certificates/qr?size=${px}&data=${encodeURIComponent(url)}`;
}
