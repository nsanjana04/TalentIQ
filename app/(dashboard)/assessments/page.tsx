import { Suspense } from "react";
import { PageShell } from "@/components/enterprise/page-shell";
import { AssessmentAdminModule } from "@/components/assessments/assessment-admin-module";

export default function AssessmentsPage() {
  return (
    <PageShell>
      <div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Assessments</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Question bank, timed attempts, auto-grading, pass/fail results, and retakes.
        </p>
      </div>
      <Suspense fallback={null}>
        <AssessmentAdminModule />
      </Suspense>
    </PageShell>
  );
}
