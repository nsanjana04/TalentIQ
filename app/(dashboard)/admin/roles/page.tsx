"use client";

import { Suspense } from "react";
import { RolesPermissionsManager } from "@/components/admin/roles-permissions-manager";

function RolesPageContent() {
  return <RolesPermissionsManager />;
}

export default function AdminRolesPage() {
  return (
    <Suspense fallback={<div className="p-6 text-sm text-muted-foreground">Loading…</div>}>
      <RolesPageContent />
    </Suspense>
  );
}
