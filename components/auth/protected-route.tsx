"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import type { RoleSlug } from "@/constants/role-slugs";
import type { Permission } from "@/lib/rbac/permissions";
import { ROUTES } from "@/constants/routes";
import { useAuth } from "@/hooks/use-auth";
import { usePermissions } from "@/hooks/use-permissions";

interface ProtectedRouteProps {
  children: React.ReactNode;
  permissions?: Permission[];
  permissionMode?: "any" | "all";
  roles?: RoleSlug[];
  requireVerifiedEmail?: boolean;
  fallback?: React.ReactNode;
}

export function ProtectedRoute({
  children,
  permissions = [],
  permissionMode = "any",
  roles = [],
  requireVerifiedEmail = false,
  fallback,
}: ProtectedRouteProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated, isLoading } = useAuth();
  const { canAny, canAll } = usePermissions();

  const hasPermissionAccess =
    permissions.length === 0
      ? true
      : permissionMode === "all"
        ? canAll(permissions)
        : canAny(permissions);

  const hasRoleAccess =
    roles.length === 0 ? true : roles.includes(user?.role as RoleSlug);

  const hasEmailAccess =
    !requireVerifiedEmail || user?.emailVerified === true;

  const isAuthorized =
    isAuthenticated && hasPermissionAccess && hasRoleAccess && hasEmailAccess;

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated) {
      router.replace(`${ROUTES.LOGIN}?redirect=${encodeURIComponent(pathname)}`);
      return;
    }
    if (!hasPermissionAccess || !hasRoleAccess) {
      router.replace(ROUTES.FORBIDDEN);
    }
  }, [
    isLoading,
    isAuthenticated,
    hasPermissionAccess,
    hasRoleAccess,
    router,
    pathname,
  ]);

  if (isLoading) {
    return (
      fallback ?? (
        <div className="flex min-h-[50vh] items-center justify-center">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      )
    );
  }

  if (!isAuthorized) return null;

  return <>{children}</>;
}
