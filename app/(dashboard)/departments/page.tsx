import { PageShell } from "@/components/enterprise/page-shell";
import { DepartmentsAdminModule } from "@/components/admin/departments-admin-module";

export default function DepartmentsPage() {
  return (
    <PageShell>
      <DepartmentsAdminModule />
    </PageShell>
  );
}
