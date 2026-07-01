"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { apiClient } from "@/lib/api-client";
import { PERMISSION_LABELS, PERMISSION_MODULES, type Permission } from "@/lib/rbac/permissions";
import { ROLE_LABELS } from "@/constants/roles";
import type { RoleSlug } from "@/constants/role-slugs";
import { useAuth } from "@/hooks/use-auth";
import { ApiErrorState } from "@/components/feedback/api-error-state";
import { MutationErrorBanner } from "@/components/feedback/mutation-error-banner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface RoleRecord {
  id: string;
  name: string;
  slug: string;
  isSystem: boolean;
}

interface PermissionRecord {
  id: string;
  key: string;
  name: string;
  module: string;
  enabled: boolean;
}

interface RolePermissionData {
  role: RoleRecord;
  permissions: PermissionRecord[];
}

export function PermissionMatrixToggle({ embedded = false }: { embedded?: boolean }) {
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

  const rolePermsQuery = useQuery({
    queryKey: ["rbac", "roles", activeRoleId, "permissions"],
    queryFn: () =>
      apiClient.get<RolePermissionData>(`/api/rbac/roles/${activeRoleId}/permissions`),
    enabled: !!activeRoleId,
  });

  const toggleMutation = useMutation({
    mutationFn: (payload: { permissionId: string; enabled: boolean }) =>
      apiClient.put(`/api/rbac/roles/${activeRoleId}/permissions`, payload),
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ["rbac", "roles", activeRoleId, "permissions"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "roles", activeRoleId, "screens"] });
      queryClient.invalidateQueries({ queryKey: ["search"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      setPending({});
      try {
        await refreshPermissions();
      } catch {
        // Permission matrix updated; session refresh is best-effort.
      }
    },
  });

  const permissionsByModule = (rolePermsQuery.data?.permissions ?? []).reduce<
    Record<string, PermissionRecord[]>
  >((acc, perm) => {
    if (!acc[perm.module]) acc[perm.module] = [];
    acc[perm.module].push(perm);
    return acc;
  }, {});

  const moduleOrder = new Map(PERMISSION_MODULES.map((module, index) => [module, index]));
  const sortedModuleEntries = Object.entries(permissionsByModule).sort(
    ([a], [b]) => (moduleOrder.get(a as (typeof PERMISSION_MODULES)[number]) ?? 99) -
      (moduleOrder.get(b as (typeof PERMISSION_MODULES)[number]) ?? 99)
  );

  function handleToggle(permissionId: string, enabled: boolean) {
    setPending((prev) => ({ ...prev, [permissionId]: enabled }));
    toggleMutation.mutate({ permissionId, enabled });
  }

  const selectedRole = visibleRoles?.find((r) => r.id === activeRoleId);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{embedded ? "Role Permissions" : "Role Permission Manager"}</CardTitle>
          <CardDescription>
            {embedded
              ? "Backend/action permissions for the selected role. Only permissions applicable to that role are shown."
              : "Toggle permissions per role. Changes are persisted and audited."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {rolesQuery.isLoading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading roles…
            </div>
          ) : rolesQuery.isError ? (
            <ApiErrorState
              compact
              error={rolesQuery.error}
              title="Could not load roles"
              action="Load roles"
              resource="/api/rbac/roles"
              onRetry={() => rolesQuery.refetch()}
              isRetrying={rolesQuery.isFetching}
            />
          ) : !visibleRoles?.length ? (
            <p className="text-sm text-muted-foreground">
              No roles found. Seed the database with{" "}
              <code className="text-xs">npx prisma db seed</code> to populate roles and
              permissions.
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {visibleRoles.map((role) => (
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
          )}
        </CardContent>
      </Card>

      {selectedRole && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              {ROLE_LABELS[selectedRole.slug as RoleSlug] ?? selectedRole.name}
            </CardTitle>
            <CardDescription>
              {rolePermsQuery.data?.permissions.filter((p) => p.enabled).length ?? 0} of{" "}
              {rolePermsQuery.data?.permissions.length ?? 0} permissions enabled
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {toggleMutation.isError && (
              <MutationErrorBanner
                error={toggleMutation.error}
                action="Update permission"
                onDismiss={() => toggleMutation.reset()}
              />
            )}
            {rolePermsQuery.isLoading ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading permissions…
              </div>
            ) : rolePermsQuery.isError ? (
              <ApiErrorState
                compact
                error={rolePermsQuery.error}
                title="Could not load permissions"
                action="Load permissions"
                resource={`/api/rbac/roles/${activeRoleId}/permissions`}
                onRetry={() => rolePermsQuery.refetch()}
                isRetrying={rolePermsQuery.isFetching}
              />
            ) : sortedModuleEntries.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No permissions in the database. Run{" "}
                <code className="text-xs">npx prisma db seed</code> to seed the permission catalog.
              </p>
            ) : (
              sortedModuleEntries.map(([module, perms]) => (
              <div key={module}>
                <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  {module}
                </h3>
                <div className="grid gap-2 sm:grid-cols-2">
                  {perms.map((perm) => {
                    const isEnabled =
                      pending[perm.id] !== undefined ? pending[perm.id] : perm.enabled;
                    const label =
                      PERMISSION_LABELS[perm.key as Permission] ?? perm.name;

                    return (
                      <label
                        key={perm.id}
                        className="flex cursor-pointer items-center justify-between rounded-md border p-3 hover:bg-muted/50"
                      >
                        <span className="text-sm">{label}</span>
                        <input
                          type="checkbox"
                          checked={isEnabled}
                          disabled={toggleMutation.isPending}
                          onChange={(e) => handleToggle(perm.id, e.target.checked)}
                          className="h-4 w-4 rounded border-input"
                        />
                      </label>
                    );
                  })}
                </div>
              </div>
              ))
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
