import { Suspense } from "react";
import { CourseAssignmentWizard } from "@/components/learning-admin/course-assignment-wizard";
import { LoadingState } from "@/components/enterprise/states";

export default function NewAssignmentPage() {
  return (
    <Suspense fallback={<LoadingState rows={4} />}>
      <CourseAssignmentWizard />
    </Suspense>
  );
}
