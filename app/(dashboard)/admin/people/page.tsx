import { Suspense } from "react";
import { PageShell } from "@/components/enterprise/page-shell";
import { PeopleOrganizationModule } from "@/components/admin/people-organization-module";
import { UsersSkeleton } from "@/components/users/users-skeleton";

export default function AdminPeoplePage() {
  return (
    <PageShell>
      <Suspense fallback={<UsersSkeleton view="card" />}>
        <PeopleOrganizationModule />
      </Suspense>
    </PageShell>
  );
}
