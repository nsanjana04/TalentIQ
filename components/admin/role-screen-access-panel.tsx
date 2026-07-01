"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { apiClient } from "@/lib/api-client";
import { useAuth } from "@/hooks/use-auth";
import { ROLE_LABELS } from "@/constants/roles";
import type { RoleSlug } from "@/constants/role-slugs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SECTION_ORDER } from "@/lib/screens/screen-definitions";
import { ApiErrorState } from "@/components/feedback/api-error-state";
import { MutationErrorBanner } from "@/components/feedback/mutation-error-banner";

interface RoleRecord {
  id: string;
  name: string;
  slug: string;
}

interface RoleScreenRow {
  screenId: string;
  key: string;
  label: string;
  route: string;
  section: string;
  sectionOrder: number;
  order: number;
  requiredPermission: string | null;
  enabled: boolean;
  permissionGranted: boolean;
  isVisible: boolean;
  permissionWarning: string | null;
}

export function RoleScreenAccessPanel() {
  const queryClient = useQueryClient();
  const { refreshPermissions, user } = useAuth();
  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null);
  const [pending, setPending] = useState<Record<string, boolean>>({});

  const rolesQuery = useQuery({
    queryKey: ["rbac", "roles"],
    queryFn: () => apiClient.get<RoleRecord[]>("/api/rbac/roles"),
  });

  const visibleRoles = rolesQuery.data;

  const activeRoleId = selectedRoleId ?? visibleRoles?.[0]?.id ?? null;
  const selectedRole = visibleRoles?.find((r) => r.id === activeRoleId);

  const screensQuery = useQuery({
    queryKey: ["admin", "roles", activeRoleId, "screens"],
    queryFn: () =>
      apiClient.get<{ screens: RoleScreenRow[] }>(
        `/api/admin/roles/${activeRoleId}/screens`
      ),
    enabled: !!activeRoleId,
  });

  const toggleMutation = useMutation({
    mutationFn: ({ screenId, enabled }: { screenId: string; enabled: boolean }) =>
      apiClient.patch(`/api/admin/roles/${activeRoleId}/screens/${screenId}`, { enabled }),
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "roles", activeRoleId, "screens"] });
      queryClient.invalidateQueries({ queryKey: ["navigation", "sidebar"] });
      queryClient.invalidateQueries({ queryKey: ["search"] });
      setPending({});
      try {
        await refreshPermissions();
      } catch {
        // Best-effort refresh.
      }
    },
  });

  const grouped = useMemo(() => {
    const rows = screensQuery.data?.screens ?? [];
    const map = new Map<string, RoleScreenRow[]>();
    for (const row of rows) {
      if (!map.has(row.section)) map.set(row.section, []);
      map.get(row.section)!.push(row);
    }
    return SECTION_ORDER.filter((section) => map.has(section)).map((section) => ({
      section,
      rows: (map.get(section) ?? []).sort((a, b) => a.order - b.order),
    }));
  }, [screensQuery.data?.screens]);

  const warningCount =
    screensQuery.data?.screens.filter((row) => row.permissionWarning).length ?? 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Screen Access</CardTitle>
        <CardDescription>
          Turn sidebar screens ON/OFF per role. Only screens in that role&apos;s product scope are listed.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {rolesQuery.isError && (
          <ApiErrorState
            compact
            error={rolesQuery.error}
            title="Could not load roles"
            action="Load roles"
            resource="/api/rbac/roles"
            onRetry={() => rolesQuery.refetch()}
            isRetrying={rolesQuery.isFetching}
          />
        )}

        {toggleMutation.isError && (
          <MutationErrorBanner
            error={toggleMutation.error}
            action="Update screen access"
            onDismiss={() => toggleMutation.reset()}
          />
        )}

        <div className="flex flex-wrap gap-2">
          {visibleRoles?.map((role) => (
            <Button
              key={role.id}
              variant={activeRoleId === role.id ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedRoleId(role.id)}
            >
              {ROLE_LABELS[role.slug as RoleSlug] ?? role.name}
            </Button>
          ))}
        </div>

        {selectedRole && (
          <p className="text-sm text-muted-foreground">
            {ROLE_LABELS[selectedRole.slug as RoleSlug] ?? selectedRole.name} —{" "}
            {screensQuery.data?.screens.filter((s) => s.enabled).length ?? 0} screens enabled,{" "}
            {screensQuery.data?.screens.filter((s) => s.isVisible).length ?? 0} visible
            {warningCount > 0 && (
              <span className="ml-2 text-amber-600">
                ({warningCount} enabled but missing required permission)
              </span>
            )}
          </p>
        )}

        {screensQuery.isLoading ? (
          <p className="text-sm text-muted-foreground">Loading screens…</p>
        ) : screensQuery.isError ? (
          <ApiErrorState
            compact
            error={screensQuery.error}
            title="Could not load screen access"
            action="Load screens"
            resource={`/api/admin/roles/${activeRoleId}/screens`}
            onRetry={() => screensQuery.refetch()}
            isRetrying={screensQuery.isFetching}
          />
        ) : grouped.length === 0 ? (
          <p className="text-sm text-muted-foreground">No screens configured for this role.</p>
        ) : (
          grouped.map((group) => (
            <div key={group.section} className="space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                {group.section}
              </h3>
              <div className="space-y-1 rounded-lg border p-2">
                {group.rows.map((row) => (
                  <label
                    key={row.screenId}
                    className="flex cursor-pointer items-start justify-between gap-4 rounded-md px-3 py-2 hover:bg-muted/40"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{row.label}</span>
                        <span
                          className={
                            row.enabled
                              ? row.isVisible
                                ? "text-xs text-emerald-600"
                                : "text-xs text-amber-600"
                              : "text-xs text-muted-foreground"
                          }
                        >
                          {row.enabled ? (row.isVisible ? "ON" : "ON (hidden)") : "OFF"}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">{row.route}</p>
                      {row.permissionWarning && (
                        <p className="mt-1 text-xs text-amber-600">{row.permissionWarning}</p>
                      )}
                    </div>
                    <input
                      type="checkbox"
                      className="mt-1 h-4 w-4"
                      checked={row.enabled}
                      disabled={pending[row.screenId] || toggleMutation.isPending}
                      onChange={(event) => {
                        setPending((prev) => ({ ...prev, [row.screenId]: true }));
                        toggleMutation.mutate({
                          screenId: row.screenId,
                          enabled: event.target.checked,
                        });
                      }}
                    />
                  </label>
                ))}
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
