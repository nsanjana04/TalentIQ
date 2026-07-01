"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { apiClient, ApiClientError } from "@/lib/api-client";
import { useAuth } from "@/hooks/use-auth";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { resolveScreenPermission } from "@/lib/screens/screen-permissions";
import { authMeQueryKey } from "@/lib/auth/query-keys";
import { invalidateEffectiveAccess } from "@/hooks/use-effective-access";
import type { UserListItem } from "@/types/users";

interface OverrideDetails {
  user: {
    id: string;
    email: string;
    fullName: string;
    role: { id: string; name: string; slug: string };
  };
  roleDefaultScreens: { key: string; label: string; route: string }[];
  overrides: {
    id: string;
    screenId: string;
    key: string;
    label: string;
    route: string;
    overrideType: "ALLOW" | "DENY";
    reason: string | null;
    expiresAt: string | null;
    isExpired: boolean;
  }[];
  availableScreens: {
    screenId: string;
    key: string;
    label: string;
    route: string;
    section: string;
    requiredPermission: string | null;
    inRoleDefault: boolean;
  }[];
}

interface UserSearchResponse {
  items: UserListItem[];
  total: number;
}

const SEARCH_LIMIT = 10;
const MIN_SEARCH_LENGTH = 2;

export function UserOverridesPanel() {
  const queryClient = useQueryClient();
  const { refreshPermissions } = useAuth();
  const [search, setSearch] = useState("");
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [searchCommitted, setSearchCommitted] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [screenId, setScreenId] = useState("");
  const [overrideType, setOverrideType] = useState<"ALLOW" | "DENY">("ALLOW");
  const [reason, setReason] = useState("");
  const [expiresAt, setExpiresAt] = useState("");

  const debouncedSearch = useDebouncedValue(search.trim(), 300);
  const searchEnabled = debouncedSearch.length >= MIN_SEARCH_LENGTH && !searchCommitted;

  const usersQuery = useQuery({
    queryKey: ["admin", "users", "search", debouncedSearch],
    queryFn: async () => {
      const url = `/api/users?search=${encodeURIComponent(debouncedSearch)}&pageSize=${SEARCH_LIMIT}&status=active`;
      console.debug("[UserOverrides] search request sent:", debouncedSearch);
      const result = await apiClient.get<UserSearchResponse>(url);
      console.debug("[UserOverrides] users returned:", result.items.length, "total:", result.total);
      return result;
    },
    enabled: searchEnabled,
    retry: false,
  });

  useEffect(() => {
    if (usersQuery.isError) {
      const message =
        usersQuery.error instanceof ApiClientError
          ? usersQuery.error.message
          : "Failed to search users";
      setSearchError(message);
      console.debug("[UserOverrides] search error:", message);
    } else {
      setSearchError(null);
    }
  }, [usersQuery.isError, usersQuery.error]);

  const searchResults = usersQuery.data?.items ?? [];
  const showDropdown = searchEnabled && (usersQuery.isFetching || usersQuery.isFetched);

  useEffect(() => {
    if (showDropdown && usersQuery.isFetched && !usersQuery.isFetching) {
      console.debug("[UserOverrides] dropdown rendered count:", searchResults.length);
    }
  }, [showDropdown, usersQuery.isFetched, usersQuery.isFetching, searchResults.length]);

  const detailsQuery = useQuery({
    queryKey: ["admin", "users", selectedUserId, "screen-overrides"],
    queryFn: () =>
      apiClient.get<OverrideDetails>(`/api/admin/users/${selectedUserId}/screen-overrides`),
    enabled: !!selectedUserId,
  });

  const createMutation = useMutation({
    mutationFn: (payload: {
      screenId: string;
      overrideType: "ALLOW" | "DENY";
      reason: string;
      expiresAt?: string | null;
    }) => apiClient.post(`/api/admin/users/${selectedUserId}/screen-overrides`, payload),
    onSuccess: async () => {
      await invalidateAfterOverrideChange();
      setScreenId("");
      setReason("");
      setExpiresAt("");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (overrideId: string) =>
      apiClient.delete(
        `/api/admin/users/${selectedUserId}/screen-overrides/${overrideId}`
      ),
    onSuccess: async () => {
      await invalidateAfterOverrideChange();
    },
  });

  const activeOverrides = useMemo(
    () => (detailsQuery.data?.overrides ?? []).filter((o) => !o.isExpired),
    [detailsQuery.data?.overrides]
  );

  const selectedScreen = useMemo(
    () => detailsQuery.data?.availableScreens.find((screen) => screen.screenId === screenId),
    [detailsQuery.data?.availableScreens, screenId]
  );

  const selectedScreenPermission = useMemo(
    () => resolveScreenPermission(selectedScreen?.requiredPermission),
    [selectedScreen?.requiredPermission]
  );

  async function invalidateAfterOverrideChange() {
    queryClient.invalidateQueries({
      queryKey: ["admin", "users", selectedUserId, "screen-overrides"],
    });
    queryClient.invalidateQueries({ queryKey: ["navigation", "sidebar"] });
    queryClient.invalidateQueries({ queryKey: ["search"] });
    queryClient.invalidateQueries({ queryKey: authMeQueryKey() });
    invalidateEffectiveAccess(queryClient);
    try {
      await refreshPermissions();
    } catch {
      // Best-effort for admin session; target user refreshes via permission version polling.
    }
  }

  function handleSearchChange(value: string) {
    setSearch(value);
    setSearchCommitted(false);
    setSelectedUserId(null);
    setSearchError(null);
  }

  function handleSelectUser(user: UserListItem) {
    setSelectedUserId(user.id);
    setSearch(user.fullName);
    setSearchCommitted(true);
    setSearchError(null);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>User Screen Overrides</CardTitle>
        <CardDescription>
          Grant or deny specific screens for individual users. DENY always wins. Expired overrides
          are ignored automatically.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <label htmlFor="user-search" className="text-sm font-medium">
            Search user
          </label>
          <div className="relative">
            <Input
              id="user-search"
              placeholder="Search by name, email, or department…"
              value={search}
              onChange={(event) => handleSearchChange(event.target.value)}
              autoComplete="off"
            />
            {usersQuery.isFetching && searchEnabled && (
              <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
            )}
          </div>

          {searchError && (
            <div
              role="alert"
              className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
            >
              {searchError}
            </div>
          )}

          {search.trim().length > 0 && search.trim().length < MIN_SEARCH_LENGTH && (
            <p className="text-xs text-muted-foreground">
              Type at least {MIN_SEARCH_LENGTH} characters to search.
            </p>
          )}

          {showDropdown && (
            <div className="rounded-lg border">
              {usersQuery.isFetching && searchResults.length === 0 ? (
                <p className="px-3 py-2 text-sm text-muted-foreground">Searching…</p>
              ) : searchResults.length > 0 ? (
                searchResults.map((u) => (
                  <button
                    key={u.id}
                    type="button"
                    className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-muted/50"
                    onClick={() => handleSelectUser(u)}
                  >
                    <span>
                      {u.fullName}{" "}
                      <span className="text-muted-foreground">({u.email})</span>
                      {u.department?.name && (
                        <span className="text-muted-foreground"> · {u.department.name}</span>
                      )}
                    </span>
                    <Badge variant="outline">{u.role.name}</Badge>
                  </button>
                ))
              ) : (
                <p className="px-3 py-2 text-sm text-muted-foreground">No users found.</p>
              )}
            </div>
          )}
        </div>

        {detailsQuery.data && (
          <>
            <div className="rounded-lg border bg-muted/20 p-4">
              <p className="font-medium">{detailsQuery.data.user.fullName}</p>
              <p className="text-sm text-muted-foreground">{detailsQuery.data.user.email}</p>
              <p className="mt-1 text-sm">
                Role: <span className="font-medium">{detailsQuery.data.user.role.name}</span>
              </p>
              <p className="mt-2 text-xs text-muted-foreground">
                Role default screens:{" "}
                {detailsQuery.data.roleDefaultScreens.map((s) => s.label).join(", ") ||
                  "None enabled"}
              </p>
            </div>

            <div className="space-y-3 rounded-lg border p-4">
              <h3 className="text-sm font-semibold">Add override</h3>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1 sm:col-span-2">
                  <label className="text-xs font-medium">Screen</label>
                  <select
                    className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                    value={screenId}
                    onChange={(event) => setScreenId(event.target.value)}
                  >
                    <option value="">Select screen…</option>
                    {detailsQuery.data.availableScreens.map((screen) => (
                      <option key={screen.screenId} value={screen.screenId}>
                        {screen.label} ({screen.section})
                        {screen.inRoleDefault ? " — in role default" : ""}
                      </option>
                    ))}
                  </select>
                  {selectedScreen && overrideType === "ALLOW" && (
                    <p className="text-xs text-amber-700">
                      {selectedScreenPermission
                        ? `This will grant screen visibility and required route permission: ${selectedScreenPermission}`
                        : "This screen has no required RBAC permission."}
                    </p>
                  )}
                  {selectedScreen && overrideType === "DENY" && selectedScreenPermission && (
                    <p className="text-xs text-amber-700">
                      This will hide the screen and revoke route permission:{" "}
                      {selectedScreenPermission}
                    </p>
                  )}
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium">Override type</label>
                  <select
                    className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                    value={overrideType}
                    onChange={(event) =>
                      setOverrideType(event.target.value as "ALLOW" | "DENY")
                    }
                  >
                    <option value="ALLOW">Allow</option>
                    <option value="DENY">Deny</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium">Expiration (optional)</label>
                  <Input
                    type="datetime-local"
                    value={expiresAt}
                    onChange={(event) => setExpiresAt(event.target.value)}
                  />
                </div>
                <div className="space-y-1 sm:col-span-2">
                  <label className="text-xs font-medium">Reason (required)</label>
                  <Input
                    value={reason}
                    onChange={(event) => setReason(event.target.value)}
                    placeholder="Why is this override needed?"
                  />
                </div>
              </div>
              <Button
                size="sm"
                disabled={!screenId || !reason.trim() || createMutation.isPending}
                onClick={() =>
                  createMutation.mutate({
                    screenId,
                    overrideType,
                    reason: reason.trim(),
                    expiresAt: expiresAt
                      ? new Date(expiresAt).toISOString()
                      : null,
                  })
                }
              >
                Save override
              </Button>
              <p className="text-xs text-muted-foreground">
                The affected user&apos;s access refreshes automatically within ~30 seconds, or
                immediately via Refresh Access on the forbidden page.
              </p>
            </div>

            <div className="space-y-2">
              <h3 className="text-sm font-semibold">Active overrides</h3>
              {activeOverrides.length === 0 ? (
                <p className="text-sm text-muted-foreground">No active overrides.</p>
              ) : (
                <div className="overflow-x-auto rounded-lg border">
                  <table className="min-w-full text-sm">
                    <thead className="bg-muted/40 text-left">
                      <tr>
                        <th className="px-3 py-2">Screen</th>
                        <th className="px-3 py-2">Type</th>
                        <th className="px-3 py-2">Reason</th>
                        <th className="px-3 py-2">Expires</th>
                        <th className="px-3 py-2" />
                      </tr>
                    </thead>
                    <tbody>
                      {activeOverrides.map((row) => (
                        <tr key={row.id} className="border-t">
                          <td className="px-3 py-2">
                            <div className="font-medium">{row.label}</div>
                            <div className="text-xs text-muted-foreground">{row.route}</div>
                          </td>
                          <td className="px-3 py-2">
                            <span
                              className={
                                row.overrideType === "DENY"
                                  ? "text-destructive"
                                  : "text-emerald-600"
                              }
                            >
                              {row.overrideType}
                            </span>
                          </td>
                          <td className="px-3 py-2">{row.reason}</td>
                          <td className="px-3 py-2">
                            {row.expiresAt
                              ? new Date(row.expiresAt).toLocaleString()
                              : "Never"}
                          </td>
                          <td className="px-3 py-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              disabled={deleteMutation.isPending}
                              onClick={() => deleteMutation.mutate(row.id)}
                            >
                              Remove
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
