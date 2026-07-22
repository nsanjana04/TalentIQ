"use client";

import { keepPreviousData, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { apiClient } from "@/lib/api-client";
import { userScopedKey } from "@/lib/auth/query-keys";
import type { SidebarNavItem } from "@/lib/rbac/types";

export interface SidebarSectionResponse {
  section: string;
  items: {
    key: string;
    label: string;
    route: string;
    icon: string;
    order: number;
  }[];
}

export interface SidebarApiResponse {
  sections: SidebarSectionResponse[];
}

const SIDEBAR_KEY = ["navigation", "sidebar"] as const;

function toNavItem(item: SidebarSectionResponse["items"][number]): SidebarNavItem {
  return {
    id: item.key,
    label: item.label,
    href: item.route,
    icon: item.icon,
    permissions: [],
    mode: "any",
    section: undefined,
  };
}

export function useResolvedNavigation() {
  const { user, isLoading, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: userScopedKey(SIDEBAR_KEY, user?.id, user?.role).concat(
      String(user?.permissionVersion ?? 0),
      String(user?.userPermissionVersion ?? 0)
    ),
    queryFn: () => apiClient.get<SidebarApiResponse>("/api/navigation/sidebar"),
    enabled: !!user?.id && isAuthenticated,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
    placeholderData: keepPreviousData,
  });

  const sections = (query.data?.sections ?? []).map((group) => ({
    section: group.section,
    items: group.items.map(toNavItem),
  }));

  const flatItems = sections.flatMap((group) => group.items);
  const loading =
    (!user && isLoading) || (!!user && isAuthenticated && query.isPending && !query.data);
  const isReady = !loading && !!user;

  return {
    sections,
    flatItems,
    loading,
    error: query.error as Error | null,
    isReady,
    isEmpty: isReady && flatItems.length === 0,
    refreshSidebar: () => queryClient.invalidateQueries({ queryKey: SIDEBAR_KEY }),
    accessibleRoutes: flatItems.map((item) => item.href),
    canAccessScreen: (keyOrRoute: string) =>
      flatItems.some(
        (item) =>
          item.id === keyOrRoute ||
          item.href === keyOrRoute ||
          item.href.split("?")[0] === keyOrRoute.split("?")[0]
      ),
  };
}
