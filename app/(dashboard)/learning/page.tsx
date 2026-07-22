import { PageShell } from "@/components/enterprise/page-shell";
import { LearningRoadmapModule } from "@/components/learning-roadmap/learning-roadmap-module";

export default function LearningPage() {
  return (
    <PageShell className="bg-[#F8FAFC]">
      <LearningRoadmapModule />
    </PageShell>
  );
}
