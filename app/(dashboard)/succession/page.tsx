import { PageShell } from "@/components/enterprise/page-shell";
import { PageHeader } from "@/components/enterprise/page-header";
import { SuccessionPanel } from "@/components/enterprise-modules/succession-panel";

export default function SuccessionPage() {
  return (
    <PageShell>
      <PageHeader
        title="Succession Planning"
        description="Critical roles, bench strength, retirement and attrition risk, and ready-now successor pipelines."
      />
      <SuccessionPanel />
    </PageShell>
  );
}
