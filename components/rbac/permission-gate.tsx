"use client";

import type { ReactNode } from "react";
import { usePermissions } from "@/hooks/use-permissions";
interface PermissionGateProps {
  elementId: string;
  children: ReactNode;
  fallback?: ReactNode;
  showDisabled?: boolean;
}

export function PermissionGate({
  elementId,
  children,
  fallback = null,
  showDisabled = false,
}: PermissionGateProps) {
  const { canAccessElement } = usePermissions();
  const result = canAccessElement(elementId);

  if (!result.visible) return <>{fallback}</>;

  if (!result.enabled && showDisabled) {
    return <div className="pointer-events-none opacity-50">{children}</div>;
  }

  if (!result.enabled) return <>{fallback}</>;

  return <>{children}</>;
}
