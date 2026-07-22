"use client";

/* eslint-disable @next/next/no-img-element -- external QR API */
import { getCertificateQrImageUrl, CERTIFICATE_QR_DISPLAY_SIZE } from "@/lib/certificates/certificate-qr-url";

export function CertificateQr({ url, size = CERTIFICATE_QR_DISPLAY_SIZE }: { url: string; size?: number }) {
  const src = getCertificateQrImageUrl(url, size);
  return (
    <img
      src={src}
      alt="Certificate verification QR code"
      width={size}
      height={size}
      className="rounded-lg border bg-white p-2"
    />
  );
}
