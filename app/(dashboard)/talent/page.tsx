import { PageShell } from "@/components/enterprise/page-shell";
import { PageHeader } from "@/components/enterprise/page-header";
import { SuccessionPanel } from "@/components/enterprise-modules/succession-panel";

export default function TalentPage() {
  return (
    <PageShell>
      <PageHeader
        title="Talent Intelligence"
        description="Succession bench strength and critical-role coverage from live workforce records."
      />
      <SuccessionPanel />
    </PageShell>
  );
}
