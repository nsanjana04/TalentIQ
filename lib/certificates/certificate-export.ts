import { jsPDF } from "jspdf";
import { BRAND } from "@/lib/design/tokens";
import { downloadBlob, downloadText } from "@/lib/downloads";
import type { CertificateVisualProps } from "@/components/certificates/certificate-visual";
import type { CertificateRecord } from "@/types/certificates";
import { renderCertificateCanvas } from "./certificate-render-canvas";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);
}

function escapeCsvCell(value: string) {
  return `"${value.replace(/"/g, '""')}"`;
}

export function certificateRecordToVisualProps(cert: CertificateRecord): CertificateVisualProps {
  return {
    recipientName: cert.userName,
    templateName: cert.templateName,
    certificateNumber: cert.certificateNumber,
    issuerName: cert.issuerName,
    courseTitle: cert.courseTitle,
    assessmentTitle: cert.assessmentTitle,
    issuedAt: cert.issuedAt,
    expiresAt: cert.expiresAt,
    status: cert.status,
    verificationUrl: cert.verificationUrl,
  };
}

const CSV_HEADERS = [
  "Certificate Number",
  "Recipient",
  "Email",
  "Template",
  "Issuer",
  "Course",
  "Assessment",
  "Status",
  "Issued At",
  "Expires At",
  "Verification URL",
] as const;

function certificateToCsvRow(cert: CertificateRecord): string[] {
  return [
    cert.certificateNumber,
    cert.userName,
    cert.userEmail,
    cert.templateName,
    cert.issuerName ?? BRAND.name,
    cert.courseTitle ?? "",
    cert.assessmentTitle ?? "",
    cert.status,
    formatDate(cert.issuedAt),
    cert.expiresAt ? formatDate(cert.expiresAt) : "",
    cert.verificationUrl,
  ];
}

export function exportCertificatesCsv(certs: CertificateRecord[]): string {
  const rows = [CSV_HEADERS.join(","), ...certs.map((c) => certificateToCsvRow(c).map(escapeCsvCell).join(","))];
  return rows.join("\n");
}

export function downloadCertificateCsv(cert: CertificateRecord) {
  const csv = exportCertificatesCsv([cert]);
  const filename = `certificate-${slugify(cert.certificateNumber)}.csv`;
  downloadText(csv, filename, "text/csv;charset=utf-8");
}

export function downloadCertificateVisualCsv(
  props: CertificateVisualProps,
  meta?: { email?: string }
) {
  const row: CertificateRecord = {
    id: "",
    certificateNumber: props.certificateNumber,
    verificationToken: "",
    verificationUrl: props.verificationUrl ?? "",
    status: props.status ?? "ACTIVE",
    userId: "",
    userName: props.recipientName,
    userEmail: meta?.email ?? "",
    templateId: "",
    templateName: props.templateName,
    issuerName: props.issuerName ?? null,
    courseTitle: props.courseTitle ?? null,
    assessmentTitle: props.assessmentTitle ?? null,
    issuedAt: props.issuedAt,
    expiresAt: props.expiresAt ?? null,
    renewedAt: null,
    revokedAt: null,
    revokedReason: null,
    issuedByName: null,
    daysUntilExpiry: null,
  };
  downloadCertificateCsv(row);
}

export function downloadCertificatesCsv(certs: CertificateRecord[], label = "certificates") {
  if (!certs.length) return;
  const date = new Date().toISOString().slice(0, 10);
  const csv = exportCertificatesCsv(certs);
  downloadText(csv, `${label}-${date}.csv`, "text/csv;charset=utf-8");
}

async function canvasToPdfBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const imgData = canvas.toDataURL("image/png", 1.0);
  // Canvas is exact A4 ratio — fill page edge-to-edge for consistent alignment
  doc.addImage(imgData, "PNG", 0, 0, pageW, pageH, undefined, "SLOW");
  return doc.output("blob");
}

export async function buildCertificatePdf(props: CertificateVisualProps): Promise<Blob> {
  const canvas = await renderCertificateCanvas(props);
  return canvasToPdfBlob(canvas);
}

export async function buildCertificatesPdf(
  items: CertificateVisualProps[]
): Promise<Blob> {
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();

  for (let i = 0; i < items.length; i++) {
    if (i > 0) doc.addPage();
    const canvas = await renderCertificateCanvas(items[i]);
    const imgData = canvas.toDataURL("image/png", 1.0);
    doc.addImage(imgData, "PNG", 0, 0, pageW, pageH, undefined, "SLOW");
  }
  return doc.output("blob");
}

export async function buildCertificateImage(props: CertificateVisualProps): Promise<Blob> {
  const canvas = await renderCertificateCanvas(props);
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Failed to create image"))),
      "image/png",
      1.0
    );
  });
}

export async function downloadCertificateImage(
  props: CertificateVisualProps,
  certNumber: string
) {
  const blob = await buildCertificateImage(props);
  downloadBlob(blob, `certificate-${slugify(certNumber)}.png`);
}

export async function downloadCertificatePdf(props: CertificateVisualProps, certNumber: string) {
  const blob = await buildCertificatePdf(props);
  downloadBlob(blob, `certificate-${slugify(certNumber)}.pdf`);
}

export async function downloadCertificatesPdf(certs: CertificateRecord[], label = "certificates") {
  if (!certs.length) return;
  const date = new Date().toISOString().slice(0, 10);
  const blob = await buildCertificatesPdf(certs.map(certificateRecordToVisualProps));
  downloadBlob(blob, `${label}-${date}.pdf`);
}
