"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { renderCertificateCanvas } from "@/lib/certificates/certificate-render-canvas";
import {
  certificateRenderHeight,
  pickCertificateRenderWidth,
} from "@/lib/certificates/certificate-viewport";
import type { CertificateStatus } from "@/types/certificates";

export type CertificateVisualProps = {
  recipientName: string;
  templateName: string;
  certificateNumber: string;
  issuerName?: string | null;
  courseTitle?: string | null;
  assessmentTitle?: string | null;
  issuedAt: string;
  expiresAt?: string | null;
  status?: CertificateStatus;
  verificationUrl?: string;
  className?: string;
};

/**
 * Renders the certificate with the same canvas engine used for PDF/PNG export,
 * scaled to fit the current screen (phone, tablet, laptop, desktop).
 */
export function CertificateVisual({
  recipientName,
  templateName,
  certificateNumber,
  issuerName,
  courseTitle,
  assessmentTitle,
  issuedAt,
  expiresAt,
  status = "ACTIVE",
  verificationUrl,
  className,
}: CertificateVisualProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const lastWidthRef = useRef(0);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let cancelled = false;
    let debounceId: ReturnType<typeof setTimeout> | undefined;

    async function paint(width: number) {
      if (width <= 0 || cancelled) return;

      const renderW = pickCertificateRenderWidth(width, window.devicePixelRatio);
      const renderH = certificateRenderHeight(renderW);

      setLoading(true);
      try {
        const canvas = await renderCertificateCanvas(
          {
            recipientName,
            templateName,
            certificateNumber,
            issuerName,
            courseTitle,
            assessmentTitle,
            issuedAt,
            expiresAt,
            status,
            verificationUrl,
          },
          renderW,
          renderH
        );
        if (cancelled) return;
        setImageSrc(canvas.toDataURL("image/png", 1));
        lastWidthRef.current = width;
      } catch {
        if (!cancelled) setImageSrc(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    function schedulePaint() {
      if (debounceId) clearTimeout(debounceId);
      debounceId = setTimeout(() => {
        const width = container!.clientWidth;
        if (width <= 0) return;
        if (Math.abs(width - lastWidthRef.current) < 8 && lastWidthRef.current > 0) return;
        void paint(width);
      }, 120);
    }

    schedulePaint();

    const observer = new ResizeObserver(schedulePaint);
    observer.observe(container);

    return () => {
      cancelled = true;
      if (debounceId) clearTimeout(debounceId);
      observer.disconnect();
    };
  }, [
    recipientName,
    templateName,
    certificateNumber,
    issuerName,
    courseTitle,
    assessmentTitle,
    issuedAt,
    expiresAt,
    status,
    verificationUrl,
  ]);

  return (
    <div
      ref={containerRef}
      className={cn(
        "certificate-print-root mx-auto w-full",
        "max-w-[min(100%,calc(100vw-1.5rem))]",
        "sm:max-w-[min(100%,40rem)]",
        "md:max-w-[min(100%,48rem)]",
        "lg:max-w-[min(100%,56rem)]",
        "xl:max-w-[min(100%,64rem)]",
        className
      )}
      style={{ aspectRatio: "297 / 210" }}
    >
      {loading && !imageSrc ? (
        <div
          className="flex h-full w-full items-center justify-center bg-[#e8edf3] text-sm text-muted-foreground"
          aria-busy="true"
        >
          Loading certificate…
        </div>
      ) : null}
      {imageSrc ? (
        /* eslint-disable-next-line @next/next/no-img-element -- canvas bitmap preview */
        <img
          src={imageSrc}
          alt={`Certificate for ${recipientName}`}
          className="block h-full w-full object-contain"
          draggable={false}
        />
      ) : null}
    </div>
  );
}
