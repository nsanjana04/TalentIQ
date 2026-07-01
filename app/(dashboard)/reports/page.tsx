import { PageShell } from "@/components/enterprise/page-shell";
import { ReportsModule } from "@/components/reports/reports-module";

export default function ReportsPage() {
  return (
    <PageShell>
      <div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Reports</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Export workforce skill data and access organization reporting summaries.
        </p>
      </div>
      <ReportsModule />
    </PageShell>
  );
}
