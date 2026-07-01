import { CourseLevelsPageContent } from "@/components/learning-admin/course-levels-page-content";

type PageProps = { params: Promise<{ courseId: string }> };

export default async function AdminCourseLevelsPage({ params }: PageProps) {
  const { courseId } = await params;
  return <CourseLevelsPageContent courseId={courseId} />;
}
