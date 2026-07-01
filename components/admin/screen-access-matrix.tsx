"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { apiClient } from "@/lib/api-client";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SECTION_ORDER } from "@/lib/screens/screen-definitions";

interface RoleRecord {
  id: string;
  name: string;
  slug: string;
}

interface MatrixRow {
  screenId: string;
  key: string;
  label: string;
  route: string;
  section: string;
  sectionOrder: number;
  order: number;
  enabled: boolean;
  canView: boolean;
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
  canManage: boolean;
}

export function ScreenAccessMatrix() {
  const queryClient = useQueryClient();
  const { refreshPermissions, user } = useAuth();
  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null);
  const [pending, setPending] = useState<Record<string, boolean>>({});

  const rolesQuery = useQuery({
    queryKey: ["admin", "screen-access", "roles"],
    queryFn: async () => {
      const data = await apiClient.get<{
        roles: RoleRecord[];
        matrix: MatrixRow[];
      }>("/api/admin/screen-access");
      return data.roles;
    },
  });

  const activeRoleId = selectedRoleId ?? rolesQuery.data?.[0]?.id ?? null;

  const matrixQuery = useQuery({
    queryKey: ["admin", "screen-access", activeRoleId],
    queryFn: () =>
      apiClient.get<{ matrix: MatrixRow[] }>(`/api/admin/screen-access?roleId=${activeRoleId}`),
    enabled: !!activeRoleId,
  });

  const updateMutation = useMutation({
    mutationFn: (payload: MatrixRow) =>
      apiClient.put("/api/admin/screen-access", {
        roleId: activeRoleId,
        screenId: payload.screenId,
        enabled: payload.enabled,
        canView: payload.canView,
        canCreate: payload.canCreate,
        canUpdate: payload.canUpdate,
        canDelete: payload.canDelete,
        canManage: payload.canManage,
      }),
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "screen-access", activeRoleId] });
      queryClient.invalidateQueries({ queryKey: ["navigation", "sidebar"] });
      queryClient.invalidateQueries({ queryKey: ["search"] });
      setPending({});
      try {
        await refreshPermissions();
      } catch {
        // Best-effort session refresh.
      }
    },
  });

  const grouped = useMemo(() => {
    const rows = matrixQuery.data?.matrix ?? [];
    const map = new Map<string, MatrixRow[]>();
    for (const row of rows) {
      if (!map.has(row.section)) map.set(row.section, []);
      map.get(row.section)!.push(row);
    }
    return SECTION_ORDER.filter((section) => map.has(section)).map((section) => ({
      section,
      rows: (map.get(section) ?? []).sort((a, b) => a.order - b.order),
    }));
  }, [matrixQuery.data?.matrix]);

  function updateRow(row: MatrixRow, patch: Partial<MatrixRow>) {
    const next = { ...row, ...patch };
    if (patch.enabled !== undefined) {
      next.canView = patch.enabled;
      if (!patch.enabled) {
        next.canCreate = false;
        next.canUpdate = false;
        next.canDelete = false;
        next.canManage = false;
      }
    }
    setPending((prev) => ({ ...prev, [row.screenId]: true }));
    updateMutation.mutate(next);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Screen Access Matrix</CardTitle>
        <CardDescription>
          Toggle sidebar screens ON/OFF per role. Changes apply immediately to navigation.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-wrap items-center gap-3">
          <label htmlFor="screen-access-role" className="text-sm font-medium">
            Role
          </label>
          <select
            id="screen-access-role"
            className="rounded-md border bg-background px-3 py-2 text-sm"
            value={activeRoleId ?? ""}
            onChange={(event) => setSelectedRoleId(event.target.value)}
          >
            {(rolesQuery.data ?? []).map((role) => (
              <option key={role.id} value={role.id}>
                {role.name}
              </option>
            ))}
          </select>
          {updateMutation.isPending && (
            <span className="text-xs text-muted-foreground">Saving…</span>
          )}
        </div>

        {matrixQuery.isLoading ? (
          <p className="text-sm text-muted-foreground">Loading screen matrix…</p>
        ) : (
          grouped.map((group) => (
            <div key={group.section} className="space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                {group.section}
              </h3>
              <div className="overflow-x-auto rounded-lg border">
                <table className="min-w-full text-sm">
                  <thead className="bg-muted/40 text-left">
                    <tr>
                      <th className="px-3 py-2">Screen</th>
                      <th className="px-3 py-2">Enabled</th>
                      <th className="px-3 py-2">View</th>
                      <th className="px-3 py-2">Create</th>
                      <th className="px-3 py-2">Update</th>
                      <th className="px-3 py-2">Delete</th>
                      <th className="px-3 py-2">Manage</th>
                    </tr>
                  </thead>
                  <tbody>
                    {group.rows.map((row) => (
                      <tr key={row.screenId} className="border-t">
                        <td className="px-3 py-2">
                          <div className="font-medium">{row.label}</div>
                          <div className="text-xs text-muted-foreground">{row.route}</div>
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="checkbox"
                            checked={row.enabled}
                            disabled={pending[row.screenId]}
                            onChange={(event) =>
                              updateRow(row, { enabled: event.target.checked })
                            }
                          />
                        </td>
                        {(["canView", "canCreate", "canUpdate", "canDelete", "canManage"] as const).map(
                          (field) => (
                            <td key={field} className="px-3 py-2">
                              <input
                                type="checkbox"
                                checked={row[field]}
                                disabled={!row.enabled || pending[row.screenId]}
                                onChange={(event) =>
                                  updateRow(row, { [field]: event.target.checked })
                                }
                              />
                            </td>
                          )
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))
        )}

        {user && (
          <p className="text-xs text-muted-foreground">
            Signed in as {user.email}. Screen access updates bump permissionVersion for affected
            users.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
