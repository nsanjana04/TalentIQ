"use client";

import { useMemo, useCallback } from "react";
import { useAuth } from "./use-auth";
import { permissionEngine } from "@/lib/rbac/engine";
import { useResolvedNavigation } from "./useResolvedNavigation";
import { uiPermissionResolver } from "@/lib/rbac/resolvers/ui-resolver";
import type { Permission } from "@/lib/rbac/permissions";

export function usePermissions() {
  const { user, isLoading, isAuthenticated } = useAuth();
  const { flatItems: sidebarItems, canAccessScreen } = useResolvedNavigation();

  const permissions = useMemo(() => user?.permissions ?? [], [user?.permissions]);
  const denied = useMemo(() => user?.deniedPermissions ?? [], [user?.deniedPermissions]);

  const can = useCallback(
    (permission: Permission) => permissionEngine.can(permissions, permission),
    [permissions]
  );

  const canAny = useCallback(
    (required: Permission[]) => permissionEngine.canAny(permissions, required),
    [permissions]
  );

  const canAll = useCallback(
    (required: Permission[]) => permissionEngine.canAll(permissions, required),
    [permissions]
  );

  const canAccessRoute = useCallback(
    (pathname: string) => uiPermissionResolver.canAccessRoute(pathname, permissions),
    [permissions]
  );

  const canAccessElement = useCallback(
    (elementId: string) => uiPermissionResolver.resolveElement(elementId, permissions),
    [permissions]
  );

  return {
    permissions,
    deniedPermissions: denied,
    can,
    canAny,
    canAll,
    canAccessRoute,
    canAccessElement,
    sidebarItems,
    canAccessScreen,
    isReady: !isLoading && isAuthenticated && !!user,
  };
}
