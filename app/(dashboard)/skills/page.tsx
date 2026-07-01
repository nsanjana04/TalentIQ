import { Suspense } from "react";
import { PageShell } from "@/components/enterprise/page-shell";
import { SkillAdminModule } from "@/components/skills-admin/skill-admin-module";
import { PageLoadingState } from "@/components/enterprise/states";

export default function SkillsPage() {
  return (
    <PageShell>
      <div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Skill Administration</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your skill library, mappings, validity policies, and weightage rules.
        </p>
      </div>
      <Suspense fallback={<PageLoadingState />}>
        <SkillAdminModule />
      </Suspense>
    </PageShell>
  );
}
