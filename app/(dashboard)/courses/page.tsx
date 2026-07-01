import { PageShell } from "@/components/enterprise/page-shell";
import { CourseAdminModule } from "@/components/course-admin/course-admin-module";

export default function CoursesPage() {
  return (
    <PageShell>
      <div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Course Administration</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage courses, modules, and lessons. Track enrollments, learner progress, and course
          analytics.
        </p>
      </div>
      <CourseAdminModule />
    </PageShell>
  );
}
