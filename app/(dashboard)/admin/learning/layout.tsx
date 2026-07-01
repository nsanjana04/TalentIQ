import { PageShell } from "@/components/enterprise/page-shell";
import { LearningAdminNav } from "@/components/learning-admin/learning-admin-nav";

export default function AdminLearningLayout({ children }: { children: React.ReactNode }) {
  return (
    <PageShell>
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Learning Administration</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage courses, levels, assignments, and enterprise learning progress.
        </p>
      </div>
      <LearningAdminNav />
      {children}
    </PageShell>
  );
}
