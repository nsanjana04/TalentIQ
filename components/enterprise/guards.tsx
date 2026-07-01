"use client";

import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { usePermissions } from "@/hooks/use-permissions";
import type { Permission } from "@/lib/rbac/permissions";
import type { RoleSlug } from "@/constants/role-slugs";
import { ROUTES } from "@/constants/routes";
import { PageLoadingState } from "./states";

interface PermissionGuardProps {
  permissions: Permission[];
  mode?: "any" | "all";
  children: ReactNode;
  fallback?: ReactNode;
  redirect?: boolean;
}

export function PermissionGuard({
  permissions,
  mode = "any",
  children,
  fallback = null,
  redirect = false,
}: PermissionGuardProps) {
  const { canAny, canAll } = usePermissions();
  const { isLoading } = useAuth();
  const router = useRouter();
  const allowed = mode === "all" ? canAll(permissions) : canAny(permissions);

  useEffect(() => {
    if (redirect && !isLoading && !allowed) {
      router.replace(ROUTES.FORBIDDEN);
    }
  }, [redirect, isLoading, allowed, router]);

  if (isLoading) return <PageLoadingState />;
  if (!allowed) return <>{fallback}</>;
  return <>{children}</>;
}

interface RoleGuardProps {
  roles: RoleSlug[];
  children: ReactNode;
  fallback?: ReactNode;
  redirect?: boolean;
}

export function RoleGuard({
  roles,
  children,
  fallback = null,
  redirect = false,
}: RoleGuardProps) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const allowed = user?.role != null && roles.includes(user.role);

  useEffect(() => {
    if (redirect && !isLoading && !allowed) {
      router.replace(ROUTES.FORBIDDEN);
    }
  }, [redirect, isLoading, allowed, router]);

  if (isLoading) return <PageLoadingState />;
  if (!allowed) return <>{fallback}</>;
  return <>{children}</>;
}
