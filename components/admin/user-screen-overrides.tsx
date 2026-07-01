"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { apiClient } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PermissionGate } from "@/components/rbac/permission-gate";

interface OverrideRow {
  id: string;
  screenId: string;
  key: string;
  label: string;
  route: string;
  section: string;
  overrideType: "ALLOW" | "DENY" | null;
  reason: string | null;
}

interface UserScreenOverridesProps {
  userId: string;
}

export function UserScreenOverrides({ userId }: UserScreenOverridesProps) {
  const queryClient = useQueryClient();
  const [reason, setReason] = useState("");

  const query = useQuery({
    queryKey: ["admin", "users", userId, "screen-overrides"],
    queryFn: () =>
      apiClient.get<{
        overrides: OverrideRow[];
        availableScreens: { screenId: string; label: string }[];
      }>(`/api/admin/users/${userId}/screen-overrides`),
  });

  const setMutation = useMutation({
    mutationFn: (payload: { screenId: string; overrideType: "ALLOW" | "DENY"; reason: string }) =>
      apiClient.post(`/api/admin/users/${userId}/screen-overrides`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "users", userId, "screen-overrides"] });
      queryClient.invalidateQueries({ queryKey: ["navigation", "sidebar"] });
      setReason("");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (overrideId: string) =>
      apiClient.delete(`/api/admin/users/${userId}/screen-overrides/${overrideId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "users", userId, "screen-overrides"] });
      queryClient.invalidateQueries({ queryKey: ["navigation", "sidebar"] });
    },
  });

  const rows = query.data?.availableScreens ?? [];

  return (
    <PermissionGate elementId="rbac.manage">
      <div className="enterprise-panel space-y-4 p-5">
        <div>
          <h3 className="font-semibold">Screen Overrides</h3>
          <p className="text-sm text-muted-foreground">
            DENY wins over role access. ALLOW grants a screen only to this user.
          </p>
        </div>

        <Input
          placeholder="Reason (required for new overrides)"
          value={reason}
          onChange={(event) => setReason(event.target.value)}
        />

        {query.isLoading ? (
          <p className="text-sm text-muted-foreground">Loading overrides…</p>
        ) : (
          <div className="max-h-96 overflow-y-auto rounded-lg border">
            <table className="min-w-full text-sm">
              <thead className="bg-muted/40 text-left">
                <tr>
                  <th className="px-3 py-2">Screen</th>
                  <th className="px-3 py-2">Override</th>
                  <th className="px-3 py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => {
                  const override = query.data?.overrides?.find((o) => o.screenId === row.screenId);
                  return (
                    <tr key={row.screenId} className="border-t">
                      <td className="px-3 py-2">{row.label}</td>
                      <td className="px-3 py-2">
                        {override?.overrideType ?? "None"}
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex flex-wrap gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={setMutation.isPending || !reason.trim()}
                            onClick={() =>
                              setMutation.mutate({
                                screenId: row.screenId,
                                overrideType: "ALLOW",
                                reason: reason.trim(),
                              })
                            }
                          >
                            Allow
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={setMutation.isPending || !reason.trim()}
                            onClick={() =>
                              setMutation.mutate({
                                screenId: row.screenId,
                                overrideType: "DENY",
                                reason: reason.trim(),
                              })
                            }
                          >
                            Deny
                          </Button>
                          {override?.id && (
                            <Button
                              size="sm"
                              variant="ghost"
                              disabled={deleteMutation.isPending}
                              onClick={() => deleteMutation.mutate(override.id)}
                            >
                              Clear
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </PermissionGate>
  );
}
