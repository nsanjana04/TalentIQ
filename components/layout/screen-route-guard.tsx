"use client";

import { useEffect, useMemo, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useResolvedNavigation } from "@/hooks/useResolvedNavigation";
import {
  checkPathWithEffectiveAccess,
  invalidateEffectiveAccess,
  syncEffectiveAccessIfStale,
} from "@/hooks/use-effective-access";
import { SCREEN_DEFINITIONS } from "@/lib/screens/screen-definitions";
import { isPrivilegedEmergencyRole } from "@/lib/screens/emergency-screen-access";
import { ROUTES } from "@/constants/routes";

interface ScreenRouteGuardProps {
  children: React.ReactNode;
}

function normalizePath(path: string): string {
  return path.split("?")[0].replace(/\/$/, "") || "/";
}

function isRegisteredScreenPath(pathname: string): boolean {
  const normalized = normalizePath(pathname);
  return SCREEN_DEFINITIONS.some((screen) => {
    const route = normalizePath(screen.route);
    return normalized === route || normalized.startsWith(`${route}/`);
  });
}

function isAllowedBySidebar(pathname: string, flatItems: { href: string }[]): boolean {
  const normalized = normalizePath(pathname);
  return flatItems.some((item) => {
    const href = normalizePath(item.href);
    if (href === "/dashboard") return normalized === "/dashboard";
    return normalized === href || normalized.startsWith(`${href}/`);
  });
}

export function ScreenRouteGuard({ children }: ScreenRouteGuardProps) {
  const pathname = usePathname();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { isAuthenticated, isLoading, user, refreshPermissions } = useAuth();
  const { flatItems, loading: navLoading, isReady } = useResolvedNavigation();
  const recheckingRef = useRef(false);

  const registered = useMemo(() => isRegisteredScreenPath(pathname), [pathname]);

  useEffect(() => {
    if (isLoading || !isAuthenticated || navLoading || !isReady || !user?.id) return;
    if (pathname === ROUTES.FORBIDDEN) return;
    if (!registered) return;

    const normalized = normalizePath(pathname);

    if (normalized === ROUTES.ACCOUNT || normalized.startsWith(`${ROUTES.ACCOUNT}/`)) {
      return;
    }

    if (
      isPrivilegedEmergencyRole(user.role) &&
      (normalized === ROUTES.DASHBOARD || normalized.startsWith(`${ROUTES.DASHBOARD}/`))
    ) {
      return;
    }

    if (isAllowedBySidebar(normalized, flatItems)) {
      return;
    }

    if (recheckingRef.current) return;
    recheckingRef.current = true;

    void (async () => {
      try {
        await queryClient.invalidateQueries({ queryKey: ["navigation", "sidebar"] });
        await syncEffectiveAccessIfStale(queryClient, refreshPermissions, user);

        const allowed = await checkPathWithEffectiveAccess(normalized);
        if (allowed) {
          invalidateEffectiveAccess(queryClient);
          await queryClient.invalidateQueries({ queryKey: ["navigation", "sidebar"] });
          return;
        }

        router.replace(`${ROUTES.FORBIDDEN}?path=${encodeURIComponent(pathname)}`);
      } finally {
        recheckingRef.current = false;
      }
    })();
  }, [
    pathname,
    flatItems,
    isLoading,
    isAuthenticated,
    navLoading,
    isReady,
    router,
    registered,
    user,
    queryClient,
    refreshPermissions,
  ]);

  return children;
}
