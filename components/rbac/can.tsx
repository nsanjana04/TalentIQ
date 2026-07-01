"use client";

import type { ReactNode } from "react";
import { usePermissions } from "@/hooks/use-permissions";
import type { Permission } from "@/lib/rbac/permissions";

interface CanProps {
  permission?: Permission;
  permissions?: Permission[];
  mode?: "any" | "all";
  fallback?: ReactNode;
  children: ReactNode;
}

export function Can({
  permission,
  permissions = [],
  mode = "any",
  fallback = null,
  children,
}: CanProps) {
  const { can, canAny, canAll } = usePermissions();

  const required = permission ? [permission, ...permissions] : permissions;

  if (required.length === 0) return <>{children}</>;

  const allowed =
    mode === "all" ? canAll(required) : required.length === 1 ? can(required[0]) : canAny(required);

  return allowed ? <>{children}</> : <>{fallback}</>;
}
