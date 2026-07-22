import { PageShell } from "@/components/enterprise/page-shell";
import { FigmaCourseDetailContent } from "@/components/learning-roadmap/figma/figma-course-detail-content";

interface CourseSlugPageProps {
  params: Promise<{ slug: string }>;
}

export default async function CourseSlugPage({ params }: CourseSlugPageProps) {
  const { slug } = await params;

  return (
    <PageShell className="bg-[#F8FAFC]">
      <FigmaCourseDetailContent slug={slug} />
    </PageShell>
  );
}
