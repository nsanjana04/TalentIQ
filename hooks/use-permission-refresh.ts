"use client";

import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "./use-auth";
import { syncEffectiveAccessIfStale } from "./use-effective-access";
import { apiClient } from "@/lib/api-client";

const PERMISSION_POLL_MS = 90_000;

interface PermissionVersionResponse {
  global: number;
  user: number;
}

async function fetchPermissionVersions(): Promise<PermissionVersionResponse> {
  return apiClient.get<PermissionVersionResponse>("/api/auth/permission-version");
}

/** Keeps JWT permissions in sync with DB effective access (role + screen overrides). */
export function usePermissionRefresh() {
  const { user, isAuthenticated, refreshPermissions } = useAuth();
  const queryClient = useQueryClient();
  const refreshingRef = useRef(false);

  useEffect(() => {
    if (!isAuthenticated || !user?.id) return;

    let cancelled = false;

    async function maybeRefresh() {
      if (refreshingRef.current || cancelled) return;
      refreshingRef.current = true;
      try {
        const versions = await fetchPermissionVersions();
        if (cancelled) return;

        const jwtStale =
          (user!.permissionVersion ?? 0) < versions.global ||
          (user!.userPermissionVersion ?? 0) < versions.user;

        if (jwtStale) {
          await syncEffectiveAccessIfStale(queryClient, refreshPermissions, user);
        }
      } catch {
        // Ignore transient refresh failures.
      } finally {
        refreshingRef.current = false;
      }
    }

    void maybeRefresh();

    const interval = window.setInterval(() => {
      void maybeRefresh();
    }, PERMISSION_POLL_MS);

    function onVisible() {
      if (document.visibilityState === "visible") {
        void maybeRefresh();
      }
    }

    document.addEventListener("visibilitychange", onVisible);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [
    isAuthenticated,
    user?.id,
    user?.permissionVersion,
    user?.userPermissionVersion,
    queryClient,
    refreshPermissions,
    user,
  ]);
}
