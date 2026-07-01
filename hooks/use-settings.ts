"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import type {
  AuditLogsResponse,
  NotificationItem,
  NotificationPreference,
  RoleSummary,
  SettingsCategory,
  SettingsCategoryData,
  SettingsOverview,
} from "@/types/settings";
import type { AuditLogsQuery } from "@/lib/validations/settings";

export const SETTINGS_KEY = ["settings"] as const;

export function useSettingsOverview() {
  return useQuery({
    queryKey: [...SETTINGS_KEY, "overview"],
    queryFn: () => apiClient.get<SettingsOverview>("/api/settings/overview"),
    staleTime: 30_000,
  });
}

export function useSettingsCategory(category: SettingsCategory) {
  return useQuery({
    queryKey: [...SETTINGS_KEY, "category", category],
    queryFn: () => apiClient.get<SettingsCategoryData>(`/api/settings/${category}`),
    staleTime: 30_000,
  });
}

export function useSettingsMutations() {
  const qc = useQueryClient();

  const updateCategory = useMutation({
    mutationFn: ({
      category,
      settings,
    }: {
      category: SettingsCategory;
      settings: Record<string, string | number | boolean>;
    }) => apiClient.patch(`/api/settings/${category}`, { settings }),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: SETTINGS_KEY });
      qc.invalidateQueries({ queryKey: [...SETTINGS_KEY, "category", vars.category] });
    },
  });

  return { updateCategory };
}

export function useNotificationPreferences() {
  return useQuery({
    queryKey: [...SETTINGS_KEY, "notification-prefs"],
    queryFn: () => apiClient.get<NotificationPreference>("/api/settings/notification-preferences"),
    staleTime: 60_000,
  });
}

export function useUpdateNotificationPreferences() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (prefs: Partial<NotificationPreference>) =>
      apiClient.patch("/api/settings/notification-preferences", prefs),
    onSuccess: () => qc.invalidateQueries({ queryKey: [...SETTINGS_KEY, "notification-prefs"] }),
  });
}

export function useNotifications() {
  return useQuery({
    queryKey: [...SETTINGS_KEY, "notifications"],
    queryFn: () =>
      apiClient.get<{ items: NotificationItem[]; unread: number }>("/api/notifications"),
    staleTime: 30_000,
  });
}

export function useAuditLogs(query?: AuditLogsQuery) {
  return useQuery({
    queryKey: [...SETTINGS_KEY, "audit-logs", query],
    queryFn: () =>
      apiClient.get<AuditLogsResponse>("/api/audit-logs", {
        params: {
          ...(query?.action && { action: query.action }),
          ...(query?.entityType && { entityType: query.entityType }),
          ...(query?.limit !== undefined && { limit: String(query.limit) }),
          ...(query?.offset !== undefined && { offset: String(query.offset) }),
        },
      }),
    staleTime: 15_000,
  });
}

export function useRoleSummaries() {
  return useQuery({
    queryKey: [...SETTINGS_KEY, "roles"],
    queryFn: () => apiClient.get<RoleSummary[]>("/api/settings/roles"),
    staleTime: 60_000,
  });
}
