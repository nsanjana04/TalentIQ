import { PageShell } from "@/components/enterprise/page-shell";
import { OpenCoursePlayer } from "@/components/learning/open-course-player";

type PageProps = {
  params: Promise<{ courseId: string }>;
};

export default async function OpenCoursePlayerPage({ params }: PageProps) {
  const { courseId } = await params;

  return (
    <PageShell>
      <OpenCoursePlayer courseId={courseId} />
    </PageShell>
  );
}
