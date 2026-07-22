import { PageShell } from "@/components/enterprise/page-shell";
import { CoursePlayerRouter } from "@/components/course-admin/course-player-router";

type PageProps = {
  params: Promise<{ courseId: string }>;
};

export default async function CoursePlayerPage({ params }: PageProps) {
  const { courseId } = await params;

  return (
    <PageShell>
      <CoursePlayerRouter courseId={courseId} />
    </PageShell>
  );
}
