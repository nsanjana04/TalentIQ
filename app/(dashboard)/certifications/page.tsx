import { PageShell } from "@/components/enterprise/page-shell";
import { CertificateEngineModule } from "@/components/certificates/certificate-engine-module";

export default function CertificationsPage() {
  return (
    <PageShell>
      <div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Certificate Engine</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Templates, issuance, renewal, expiration, QR verification, and certificate analytics.
        </p>
      </div>
      <CertificateEngineModule />
    </PageShell>
  );
}
