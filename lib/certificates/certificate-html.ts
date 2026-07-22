import { BRAND } from "@/lib/design/tokens";
import type { CertificateVisualProps } from "@/components/certificates/certificate-visual";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export const CERTIFICATE_HTML_STYLES = `
  * { box-sizing: border-box; margin: 0; padding: 0; }
  .certificate-root {
    width: 1000px;
    background: #fff;
    font-family: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
    color: #0f172a;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  .certificate {
    position: relative;
    width: 100%;
    border: 4px solid rgba(11, 59, 117, 0.2);
    border-radius: 16px;
    background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
    padding: 36px 44px 40px;
    page-break-inside: avoid;
    break-inside: avoid;
  }
  .certificate::before,
  .certificate::after {
    content: "";
    position: absolute;
    pointer-events: none;
    border-radius: 12px;
  }
  .certificate::before {
    inset: 10px;
    border: 1px solid rgba(11, 59, 117, 0.15);
  }
  .certificate::after {
    inset: 18px;
    border: 1px dashed rgba(47, 128, 237, 0.2);
  }
  .inner { position: relative; z-index: 1; }
  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 16px;
    margin-bottom: 28px;
  }
  .brand { display: flex; align-items: center; gap: 12px; }
  .logo {
    width: 48px;
    height: 48px;
    border-radius: 12px;
    background: #0b3b75;
    color: #fff;
    font-weight: 700;
    font-size: 14px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }
  .brand-name { font-size: 14px; font-weight: 700; color: #0b3b75; }
  .brand-tag {
    font-size: 10px;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: #64748b;
    margin-top: 2px;
  }
  .qr img {
    display: block;
    border-radius: 8px;
    border: 1px solid #e2e8f0;
    background: #fff;
    padding: 4px;
  }
  .body { text-align: center; padding: 12px 0 28px; }
  .label {
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.35em;
    text-transform: uppercase;
    color: #2f80ed;
  }
  .title {
    margin-top: 12px;
    font-size: 28px;
    font-weight: 700;
    color: #0b3b75;
    line-height: 1.2;
  }
  .divider {
    width: 96px;
    height: 1px;
    margin: 16px auto 0;
    background: linear-gradient(90deg, transparent, rgba(11,59,117,0.4), transparent);
  }
  .sub { margin-top: 20px; font-size: 14px; color: #64748b; }
  .recipient {
    margin-top: 8px;
    font-family: Georgia, "Times New Roman", serif;
    font-size: 34px;
    font-weight: 600;
    line-height: 1.2;
  }
  .course {
    margin-top: 8px;
    font-size: 16px;
    font-weight: 600;
  }
  .footer {
    display: grid;
    grid-template-columns: 1fr 1fr;
    align-items: end;
    gap: 24px;
    border-top: 1px solid rgba(11, 59, 117, 0.1);
    padding-top: 20px;
    margin-top: 8px;
    font-size: 13px;
  }
  .footer-right { text-align: right; }
  .muted { color: #64748b; }
  .mono { font-family: ui-monospace, monospace; font-size: 11px; margin-top: 4px; }
  .issuer { font-weight: 600; color: #0b3b75; margin-top: 2px; }
  .watermark {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 2;
    pointer-events: none;
    font-size: 48px;
    font-weight: 900;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    transform: rotate(-12deg);
    opacity: 0.22;
    border: 4px solid;
    width: fit-content;
    height: fit-content;
    margin: auto;
    padding: 12px 32px;
  }
  .watermark.revoked { color: #dc2626; border-color: #dc2626; }
  .watermark.expired { color: #d97706; border-color: #d97706; }
`;

export function buildCertificateMarkup(props: CertificateVisualProps): string {
  const issuer = props.issuerName ?? BRAND.name;
  const issued = formatDate(props.issuedAt);
  const expires = props.expiresAt ? formatDate(props.expiresAt) : null;
  const qrSrc = props.verificationUrl
    ? `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(props.verificationUrl)}`
    : null;

  const courseBlock = props.courseTitle
    ? `<p class="sub">has successfully completed</p>
       <p class="course">${escapeHtml(props.courseTitle)}</p>`
    : props.assessmentTitle
      ? `<p class="sub">has demonstrated proficiency in</p>
         <p class="course">${escapeHtml(props.assessmentTitle)}</p>`
      : `<p class="sub">has met the requirements for this credential</p>`;

  const watermark =
    props.status === "REVOKED" || props.status === "EXPIRED"
      ? `<div class="watermark ${props.status === "REVOKED" ? "revoked" : "expired"}">${props.status}</div>`
      : "";

  return `<div class="certificate-root">
    <div class="certificate">
      ${watermark}
      <div class="inner">
        <div class="header">
          <div class="brand">
            <div class="logo">RM</div>
            <div>
              <div class="brand-name">${escapeHtml(BRAND.name)}</div>
              <div class="brand-tag">${escapeHtml(BRAND.tagline)}</div>
            </div>
          </div>
          ${qrSrc ? `<div class="qr"><img src="${qrSrc}" alt="Verification QR" width="88" height="88" crossorigin="anonymous" /></div>` : ""}
        </div>
        <div class="body">
          <p class="label">Certificate of Achievement</p>
          <h1 class="title">${escapeHtml(props.templateName)}</h1>
          <div class="divider"></div>
          <p class="sub">This is to certify that</p>
          <p class="recipient">${escapeHtml(props.recipientName)}</p>
          ${courseBlock}
        </div>
        <div class="footer">
          <div>
            <p><span class="muted">Issued: </span>${escapeHtml(issued)}</p>
            ${expires ? `<p><span class="muted">Valid until: </span>${escapeHtml(expires)}</p>` : ""}
            <p class="mono">${escapeHtml(props.certificateNumber)}</p>
          </div>
          <div class="footer-right">
            <p class="muted">Issued by</p>
            <p class="issuer">${escapeHtml(issuer)}</p>
          </div>
        </div>
      </div>
    </div>
  </div>`;
}

export function buildCertificateExportHtml(props: CertificateVisualProps): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Certificate — ${escapeHtml(props.recipientName)}</title>
  <style>${CERTIFICATE_HTML_STYLES}</style>
</head>
<body style="margin:0;background:#fff;">
  ${buildCertificateMarkup(props)}
</body>
</html>`;
}
