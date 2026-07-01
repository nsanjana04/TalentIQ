import { AssignmentsAdminPanel } from "@/components/learning-admin/assignments-admin-panel";
import { AssignmentPolicyBanner } from "@/components/learning-admin/assignment-policy-banner";

export default function AdminLearningAssignmentsPage() {
  return (
    <div className="space-y-6">
      <AssignmentPolicyBanner />
      <AssignmentsAdminPanel />
    </div>
  );
}
