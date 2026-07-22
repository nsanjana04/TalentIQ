import type { CertificateVisualProps } from "@/components/certificates/certificate-visual";
import { BRAND } from "@/lib/design/tokens";
import { getCertificateQrImageUrl, CERTIFICATE_QR_DISPLAY_SIZE } from "@/lib/certificates/certificate-qr-url";

/** A4 landscape at ~300 DPI */
export const CERT_EXPORT_W = 3508;
export const CERT_EXPORT_H = 2480;

/** On-screen certificate reference width (max-w-3xl) */
const REF_W = 768;

const COLORS = {
  navy: "#0b3b75",
  blue: "#2f80ed",
  slate: "#64748b",
  ink: "#0f172a",
  white: "#ffffff",
  paperEnd: "#f8fafc",
  pageBg: "#e8edf3",
};

const FONTS = {
  sans: "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
  serif: "Georgia, 'Times New Roman', Times, serif",
  mono: "ui-monospace, 'Cascadia Code', Consolas, monospace",
};

type QrSlot = { x: number; y: number; imageSize: number; pad: number; url: string };

type Layout = ReturnType<typeof createLayout>;

function createLayout(pageW: number, pageH: number) {
  const marginX = pageW * 0.045;
  const marginY = pageH * 0.045;
  const cardX = marginX;
  const cardY = marginY;
  const cardW = pageW - marginX * 2;
  const cardH = pageH - marginY * 2;

  const s = cardW / REF_W;

  return {
    pageW,
    pageH,
    cardX,
    cardY,
    cardW,
    cardH,
    cx: cardX + cardW / 2,
    sx: s,
    sy: s,
    padL: cardX + 48 * s,
    padR: cardX + cardW - 48 * s,
    contentW: cardW - 96 * s,
    padTop: cardY + 48 * s,
    padBottom: cardY + cardH - 48 * s,
    sectionGap: 32 * s,
    labelSize: 12 * s,
    labelTracking: 0.35 * 12 * s,
    titleSize: 30 * s,
    titleLineH: 36 * s,
    bodySize: 14 * s,
    nameSize: 36 * s,
    nameLineH: 44 * s,
    detailSize: 16 * s,
    detailLineH: 22 * s,
    footerSize: 14 * s,
    footerMono: 12 * s,
    footerLineH: 20 * s,
    logoSize: 48 * s,
    qrSize: CERTIFICATE_QR_DISPLAY_SIZE * s,
    dividerW: 96 * s,
  };
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

function measureWrappedLines(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number
): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  if (!words.length) return [""];
  const lines: string[] = [];
  let line = words[0] ?? "";
  for (let i = 1; i < words.length; i++) {
    const test = `${line} ${words[i]}`;
    if (ctx.measureText(test).width > maxWidth) {
      lines.push(line);
      line = words[i]!;
    } else {
      line = test;
    }
  }
  lines.push(line);
  return lines;
}

function drawTrackedLabel(
  ctx: CanvasRenderingContext2D,
  text: string,
  centerX: number,
  y: number,
  letterSpacing: number
) {
  ctx.save();
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  const upper = text.toUpperCase();
  const chars = upper.split("");
  const widths = chars.map((c) => ctx.measureText(c).width);
  const total = widths.reduce((a, b) => a + b, 0) + letterSpacing * Math.max(0, chars.length - 1);
  let x = centerX - total / 2;
  for (let i = 0; i < chars.length; i++) {
    ctx.fillText(chars[i]!, x, y);
    x += widths[i]! + letterSpacing;
  }
  ctx.restore();
}

function drawWrappedCentered(
  ctx: CanvasRenderingContext2D,
  text: string,
  centerX: number,
  startY: number,
  maxWidth: number,
  lineHeight: number
): number {
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  const lines = measureWrappedLines(ctx, text, maxWidth);
  let y = startY;
  for (const line of lines) {
    ctx.fillText(line, centerX, y);
    y += lineHeight;
  }
  return y;
}

function baselineAfter(fromSize: number, toSize: number, marginPx: number, L: Layout) {
  return marginPx * L.sy + fromSize * L.sx * 0.28 + toSize * L.sx * 0.75;
}

function measureBodyH(ctx: CanvasRenderingContext2D, props: CertificateVisualProps, L: Layout) {
  const maxW = L.contentW;
  let h = L.labelSize + 12 * L.sy;

  ctx.font = `bold ${L.titleSize}px ${FONTS.sans}`;
  h += measureWrappedLines(ctx, props.templateName, maxW).length * L.titleLineH + 16 * L.sy;
  h += 4 * L.sy + 24 * L.sy;
  h += baselineAfter(L.bodySize, L.nameSize, 8, L);

  ctx.font = `600 ${L.nameSize}px ${FONTS.serif}`;
  h += measureWrappedLines(ctx, props.recipientName, maxW).length * L.nameLineH;

  const detail = props.courseTitle ?? props.assessmentTitle;
  if (detail) {
    h += baselineAfter(L.nameSize, L.bodySize, 16, L);
    h += baselineAfter(L.bodySize, L.detailSize, 4, L);
    ctx.font = `bold ${L.detailSize}px ${FONTS.sans}`;
    h += measureWrappedLines(ctx, detail, maxW).length * L.detailLineH;
  } else {
    h += baselineAfter(L.nameSize, L.bodySize, 16, L);
  }
  return h;
}

function measureFooterH(L: Layout, hasExpiry: boolean) {
  const rows = hasExpiry ? 3 : 2;
  return 24 * L.sy + rows * L.footerLineH + L.footerMono + 8 * L.sy;
}

function drawPageBackground(ctx: CanvasRenderingContext2D, L: Layout) {
  ctx.fillStyle = COLORS.pageBg;
  ctx.fillRect(0, 0, L.pageW, L.pageH);
}

function drawCropMarks(ctx: CanvasRenderingContext2D, L: Layout) {
  const { cardX, cardY, cardW, cardH, sx: s } = L;
  const x2 = cardX + cardW;
  const y2 = cardY + cardH;
  const o = 10 * s;
  const len = 24 * s;

  ctx.strokeStyle = COLORS.navy;
  ctx.lineWidth = Math.max(2, 2 * s);
  ctx.lineCap = "square";

  // Top-left (opens up-left)
  ctx.beginPath();
  ctx.moveTo(cardX, cardY - o);
  ctx.lineTo(cardX, cardY - o - len);
  ctx.moveTo(cardX - o, cardY);
  ctx.lineTo(cardX - o - len, cardY);
  ctx.stroke();

  // Top-right
  ctx.beginPath();
  ctx.moveTo(x2, cardY - o);
  ctx.lineTo(x2, cardY - o - len);
  ctx.moveTo(x2 + o, cardY);
  ctx.lineTo(x2 + o + len, cardY);
  ctx.stroke();

  // Bottom-left
  ctx.beginPath();
  ctx.moveTo(cardX, y2 + o);
  ctx.lineTo(cardX, y2 + o + len);
  ctx.moveTo(cardX - o, y2);
  ctx.lineTo(cardX - o - len, y2);
  ctx.stroke();

  // Bottom-right
  ctx.beginPath();
  ctx.moveTo(x2, y2 + o);
  ctx.lineTo(x2, y2 + o + len);
  ctx.moveTo(x2 + o, y2);
  ctx.lineTo(x2 + o + len, y2);
  ctx.stroke();
}

function drawTalentSeal(ctx: CanvasRenderingContext2D, L: Layout) {
  const cx = L.cx;
  const cy = L.cardY + L.cardH / 2;
  const r = 80 * L.sx;
  const stampColor = "#94a3b8";

  ctx.save();

  ctx.globalAlpha = 0.07;
  ctx.strokeStyle = stampColor;
  ctx.lineWidth = 2 * L.sx;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.stroke();

  ctx.globalAlpha = 0.09;
  ctx.beginPath();
  ctx.arc(cx, cy, r - 12 * L.sx, 0, Math.PI * 2);
  ctx.stroke();

  ctx.fillStyle = stampColor;
  ctx.strokeStyle = stampColor;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  ctx.globalAlpha = 0.11;
  ctx.font = `bold ${15 * L.sx}px ${FONTS.sans}`;
  ctx.fillText("TALENT", cx, cy - 14 * L.sy);

  ctx.globalAlpha = 0.09;
  ctx.lineWidth = Math.max(1, 1 * L.sx);
  ctx.beginPath();
  ctx.moveTo(cx - 32 * L.sx, cy);
  ctx.lineTo(cx + 32 * L.sx, cy);
  ctx.stroke();

  ctx.globalAlpha = 0.11;
  ctx.font = `bold ${18 * L.sx}px ${FONTS.sans}`;
  ctx.fillText("IQ", cx, cy + 18 * L.sy);

  ctx.restore();
}

function drawCardBackground(ctx: CanvasRenderingContext2D, L: Layout) {
  const { cardX, cardY, cardW, cardH, sx: s } = L;

  ctx.fillStyle = COLORS.white;
  ctx.fillRect(cardX, cardY, cardW, cardH);

  ctx.strokeStyle = COLORS.navy;
  ctx.lineWidth = Math.max(2, 2 * s);
  ctx.strokeRect(cardX, cardY, cardW, cardH);
}

function drawHeader(
  ctx: CanvasRenderingContext2D,
  L: Layout,
  top: number,
  hasQr: boolean
): { bottom: number; qr?: QrSlot } {
  const logoY = top;
  const logoX = L.padL;

  drawRoundedRect(ctx, logoX, logoY, L.logoSize, L.logoSize, 12 * L.sx);
  ctx.fillStyle = COLORS.navy;
  ctx.fill();
  ctx.fillStyle = COLORS.white;
  ctx.font = `bold ${14 * L.sx}px ${FONTS.sans}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("RM", logoX + L.logoSize / 2, logoY + L.logoSize / 2);

  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = COLORS.navy;
  ctx.font = `bold ${14 * L.sx}px ${FONTS.sans}`;
  ctx.fillText(BRAND.name, logoX + L.logoSize + 12 * L.sx, logoY + 20 * L.sy);
  ctx.fillStyle = COLORS.slate;
  ctx.font = `500 ${10 * L.sx}px ${FONTS.sans}`;
  ctx.fillText(BRAND.tagline.toUpperCase(), logoX + L.logoSize + 12 * L.sx, logoY + 38 * L.sy);

  let qr: QrSlot | undefined;
  if (hasQr) {
    const pad = 8 * L.sx;
    const imageSize = L.qrSize;
    const outer = imageSize + pad * 2;
    qr = {
      x: L.padR - outer,
      y: logoY + (L.logoSize - outer) / 2,
      imageSize,
      pad,
      url: "",
    };
  }

  return { bottom: top + L.logoSize, qr };
}

function drawBody(
  ctx: CanvasRenderingContext2D,
  props: CertificateVisualProps,
  L: Layout,
  startY: number
) {
  const maxW = L.contentW;
  let y = startY;

  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";

  ctx.fillStyle = COLORS.blue;
  ctx.font = `600 ${L.labelSize}px ${FONTS.sans}`;
  drawTrackedLabel(ctx, "Certificate of Achievement", L.cx, y, L.labelTracking);
  y += 12 * L.sy + L.labelSize;

  ctx.fillStyle = COLORS.navy;
  ctx.font = `bold ${L.titleSize}px ${FONTS.sans}`;
  y = drawWrappedCentered(ctx, props.templateName, L.cx, y, maxW, L.titleLineH) + 16 * L.sy;

  const divY = y + 4 * L.sy;
  ctx.strokeStyle = COLORS.blue;
  ctx.lineWidth = Math.max(2, 2 * L.sx);
  ctx.beginPath();
  ctx.moveTo(L.cx - L.dividerW / 2, divY);
  ctx.lineTo(L.cx + L.dividerW / 2, divY);
  ctx.stroke();
  y = divY + 24 * L.sy;

  ctx.fillStyle = COLORS.slate;
  ctx.font = `${L.bodySize}px ${FONTS.sans}`;
  ctx.fillText("This is to certify that", L.cx, y);
  y += baselineAfter(L.bodySize, L.nameSize, 8, L);

  ctx.fillStyle = COLORS.ink;
  ctx.font = `600 ${L.nameSize}px ${FONTS.serif}`;
  y = drawWrappedCentered(ctx, props.recipientName, L.cx, y, maxW, L.nameLineH);

  ctx.fillStyle = COLORS.slate;
  ctx.font = `${L.bodySize}px ${FONTS.sans}`;
  if (props.courseTitle) {
    y += baselineAfter(L.nameSize, L.bodySize, 16, L);
    ctx.fillText("has successfully completed", L.cx, y);
    y += baselineAfter(L.bodySize, L.detailSize, 4, L);
    ctx.fillStyle = COLORS.navy;
    ctx.font = `bold ${L.detailSize}px ${FONTS.sans}`;
    drawWrappedCentered(ctx, props.courseTitle, L.cx, y, maxW, L.detailLineH);
  } else if (props.assessmentTitle) {
    y += baselineAfter(L.nameSize, L.bodySize, 16, L);
    ctx.fillText("has demonstrated proficiency in", L.cx, y);
    y += baselineAfter(L.bodySize, L.detailSize, 4, L);
    ctx.fillStyle = COLORS.navy;
    ctx.font = `bold ${L.detailSize}px ${FONTS.sans}`;
    drawWrappedCentered(ctx, props.assessmentTitle, L.cx, y, maxW, L.detailLineH);
  } else {
    y += baselineAfter(L.nameSize, L.bodySize, 16, L);
    ctx.fillText("has met the requirements for this credential", L.cx, y);
  }
}

function drawFooter(
  ctx: CanvasRenderingContext2D,
  props: CertificateVisualProps,
  issuer: string,
  L: Layout,
  top: number
) {
  ctx.strokeStyle = "rgba(11, 59, 117, 0.1)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(L.padL, top);
  ctx.lineTo(L.padR, top);
  ctx.stroke();

  const textY = top + 24 * L.sy;
  const lineH = L.footerLineH;

  ctx.textBaseline = "alphabetic";
  ctx.font = `${L.footerSize}px ${FONTS.sans}`;
  ctx.textAlign = "left";
  ctx.fillStyle = COLORS.slate;
  ctx.fillText("Issued: ", L.padL, textY);
  const issuedLW = ctx.measureText("Issued: ").width;
  ctx.fillStyle = COLORS.ink;
  ctx.font = `500 ${L.footerSize}px ${FONTS.sans}`;
  ctx.fillText(formatDate(props.issuedAt), L.padL + issuedLW, textY);

  let row = 1;
  let leftBottom = textY;
  if (props.expiresAt) {
    const rowY = textY + row * lineH;
    ctx.font = `${L.footerSize}px ${FONTS.sans}`;
    ctx.fillStyle = COLORS.slate;
    ctx.fillText("Valid until: ", L.padL, rowY);
    const validLW = ctx.measureText("Valid until: ").width;
    ctx.fillStyle = COLORS.ink;
    ctx.font = `500 ${L.footerSize}px ${FONTS.sans}`;
    ctx.fillText(formatDate(props.expiresAt), L.padL + validLW, rowY);
    leftBottom = rowY;
    row++;
  }

  const certY = textY + row * lineH;
  ctx.fillStyle = COLORS.slate;
  ctx.font = `${L.footerMono}px ${FONTS.mono}`;
  ctx.fillText(props.certificateNumber, L.padL, certY);
  leftBottom = certY;

  ctx.textAlign = "right";
  ctx.font = `${L.footerSize}px ${FONTS.sans}`;
  ctx.fillStyle = COLORS.slate;
  ctx.fillText("Issued by", L.padR, leftBottom - lineH);
  ctx.fillStyle = COLORS.navy;
  ctx.font = `bold ${L.footerSize}px ${FONTS.sans}`;
  ctx.fillText(issuer, L.padR, leftBottom);
}

function drawWatermark(ctx: CanvasRenderingContext2D, status: string, L: Layout) {
  ctx.save();
  ctx.translate(L.cx, L.cardY + L.cardH / 2);
  ctx.rotate(-0.21);
  ctx.globalAlpha = status === "REVOKED" ? 0.3 : 0.25;
  const color = status === "REVOKED" ? "#dc2626" : "#d97706";
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 4 * L.sx;
  ctx.font = `900 ${36 * L.sx}px ${FONTS.sans}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const tw = ctx.measureText(status).width;
  ctx.strokeRect(-tw / 2 - 32 * L.sx, -28 * L.sy, tw + 64 * L.sx, 56 * L.sy);
  ctx.fillText(status, 0, 0);
  ctx.restore();
}

export function drawCertificateToCanvas(
  props: CertificateVisualProps,
  width = CERT_EXPORT_W,
  height = CERT_EXPORT_H
): HTMLCanvasElement & { __qr?: QrSlot } {
  const canvas = document.createElement("canvas") as HTMLCanvasElement & { __qr?: QrSlot };
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Failed to create certificate canvas");

  const L = createLayout(width, height);
  const issuer = props.issuerName ?? BRAND.name;

  drawPageBackground(ctx, L);
  drawCardBackground(ctx, L);
  drawCropMarks(ctx, L);
  drawTalentSeal(ctx, L);

  const header = drawHeader(ctx, L, L.padTop, !!props.verificationUrl);
  const footerH = measureFooterH(L, !!props.expiresAt);
  const footerTop = L.padBottom - footerH;

  const bodyH = measureBodyH(ctx, props, L);
  const bodyAreaTop = header.bottom + L.sectionGap;
  const bodyAreaBottom = footerTop - L.sectionGap;
  const bodyTop = bodyAreaTop + Math.max(0, (bodyAreaBottom - bodyAreaTop - bodyH) / 2);

  drawBody(ctx, props, L, bodyTop);
  drawFooter(ctx, props, issuer, L, footerTop);

  if (props.status === "REVOKED" || props.status === "EXPIRED") {
    drawWatermark(ctx, props.status, L);
  }

  if (props.verificationUrl && header.qr) {
    canvas.__qr = { ...header.qr, url: props.verificationUrl };
  }

  return canvas;
}

async function drawQrOnCanvas(canvas: HTMLCanvasElement, qr?: QrSlot) {
  if (!qr) return;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  try {
    const fetchSize = Math.round(qr.imageSize * 2);
    const src = getCertificateQrImageUrl(qr.url, fetchSize);
    const response = await fetch(src);
    if (!response.ok) throw new Error("QR fetch failed");
    const blob = await response.blob();
    const objectUrl = URL.createObjectURL(blob);
    const img = new Image();
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error("QR load failed"));
      img.src = objectUrl;
    });

    const outer = qr.imageSize + qr.pad * 2;
    ctx.fillStyle = COLORS.white;
    drawRoundedRect(ctx, qr.x, qr.y, outer, outer, qr.pad);
    ctx.fill();
    ctx.strokeStyle = "#e2e8f0";
    ctx.lineWidth = 1;
    drawRoundedRect(ctx, qr.x, qr.y, outer, outer, qr.pad);
    ctx.stroke();
    ctx.drawImage(img, qr.x + qr.pad, qr.y + qr.pad, qr.imageSize, qr.imageSize);
    URL.revokeObjectURL(objectUrl);
  } catch {
    // QR optional — placeholder box if fetch fails
    const outer = qr.imageSize + qr.pad * 2;
    ctx.fillStyle = COLORS.white;
    drawRoundedRect(ctx, qr.x, qr.y, outer, outer, qr.pad);
    ctx.fill();
    ctx.strokeStyle = "#e2e8f0";
    ctx.lineWidth = 1;
    drawRoundedRect(ctx, qr.x, qr.y, outer, outer, qr.pad);
    ctx.stroke();
  }
}

export async function renderCertificateCanvas(
  props: CertificateVisualProps,
  width = CERT_EXPORT_W,
  height = CERT_EXPORT_H
): Promise<HTMLCanvasElement> {
  const canvas = drawCertificateToCanvas(props, width, height);
  await drawQrOnCanvas(canvas, canvas.__qr);
  return canvas;
}
