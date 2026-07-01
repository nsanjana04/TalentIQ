import type { CertificateVisualProps } from "@/components/certificates/certificate-visual";
import { buildCertificatePrintHtml } from "./print-certificate-html";

export function printCertificate(props: CertificateVisualProps): boolean {
  const html = buildCertificatePrintHtml(props);
  const win = window.open("", "_blank", "noopener,noreferrer,width=1100,height=800");
  if (!win) {
    return false;
  }

  win.document.open();
  win.document.write(html);
  win.document.close();
  return true;
}
