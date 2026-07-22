"use client";

import { PermissionMatrixToggle } from "@/components/admin/permission-matrix-toggle";

export function RolesPermissionsManager() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Roles & Permissions</h1>
        <p className="mt-2 text-muted-foreground">
          Manage backend permissions for Admin, Manager, and Employee roles.
        </p>
      </div>

      <PermissionMatrixToggle embedded />
    </div>
  );
}
