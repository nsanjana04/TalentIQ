import type { CertificateVisualProps } from "@/components/certificates/certificate-visual";
import { CERTIFICATE_HTML_STYLES, buildCertificateMarkup } from "./certificate-html";

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function buildCertificatePrintHtml(props: CertificateVisualProps): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Certificate — ${escapeHtml(props.recipientName)}</title>
  <style>
    @page {
      size: landscape;
      margin: 12mm;
    }
    html, body {
      width: 100%;
      height: 100%;
      background: #fff;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    body {
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      padding: 8mm;
      margin: 0;
    }
    ${CERTIFICATE_HTML_STYLES}
    .certificate-root {
      max-width: 10.5in;
    }
  </style>
</head>
<body>
  ${buildCertificateMarkup(props)}
  <script>
    window.addEventListener("load", function () {
      setTimeout(function () {
        window.focus();
        window.print();
      }, 250);
    });
    window.addEventListener("afterprint", function () {
      window.close();
    });
  </script>
</body>
</html>`;
}
