"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { apiClient } from "@/lib/api-client";
import { authMeQueryKey } from "@/lib/auth/query-keys";
import type { Permission } from "@/lib/rbac/permissions";
import type { RoleSlug } from "@/constants/role-slugs";

export interface EffectiveAccessResponse {
  permissions: Permission[];
  role: RoleSlug;
  permissionVersion: number;
  userPermissionVersion: number;
}

export interface EffectiveAccessPathResponse extends EffectiveAccessResponse {
  path: string;
  allowed: boolean;
}

export const EFFECTIVE_ACCESS_KEY = ["auth", "effective-access"] as const;

function effectiveAccessQueryKey(userId?: string | null, path?: string) {
  return [...EFFECTIVE_ACCESS_KEY, userId ?? "anon", path ?? "all"] as const;
}

async function fetchEffectiveAccess(path?: string): Promise<
  EffectiveAccessResponse | EffectiveAccessPathResponse
> {
  const url = path
    ? `/api/auth/effective-access?path=${encodeURIComponent(path)}`
    : "/api/auth/effective-access";
  return apiClient.get(url);
}

export function useEffectiveAccess(path?: string) {
  const { user, isAuthenticated } = useAuth();

  return useQuery({
    queryKey: effectiveAccessQueryKey(user?.id, path),
    queryFn: () => fetchEffectiveAccess(path),
    enabled: !!user?.id && isAuthenticated,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}

/** Sync JWT session when server effective permissions are newer than the client copy. */
export async function syncEffectiveAccessIfStale(
  queryClient: ReturnType<typeof useQueryClient>,
  refreshPermissions: () => Promise<unknown>,
  user?: {
    id: string;
    permissionVersion?: number;
    userPermissionVersion?: number;
  } | null
): Promise<EffectiveAccessResponse | null> {
  if (!user?.id) return null;

  try {
    const access = await fetchEffectiveAccess();
    const jwtStale =
      (user.permissionVersion ?? 0) < access.permissionVersion ||
      (user.userPermissionVersion ?? 0) < access.userPermissionVersion;

    queryClient.setQueryData(effectiveAccessQueryKey(user.id), access);

    if (jwtStale) {
      await refreshPermissions();
      queryClient.invalidateQueries({ queryKey: EFFECTIVE_ACCESS_KEY });
      queryClient.invalidateQueries({ queryKey: ["navigation", "sidebar"] });
      queryClient.invalidateQueries({ queryKey: ["search"] });
      queryClient.invalidateQueries({ queryKey: authMeQueryKey(user.id) });
    }

    return access;
  } catch {
    return null;
  }
}

export async function checkPathWithEffectiveAccess(path: string): Promise<boolean> {
  try {
    const result = await apiClient.get<EffectiveAccessPathResponse>(
      `/api/auth/effective-access?path=${encodeURIComponent(path)}`
    );
    return result.allowed;
  } catch {
    return false;
  }
}

export function invalidateEffectiveAccess(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: EFFECTIVE_ACCESS_KEY });
}
