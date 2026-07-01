"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight, Users } from "lucide-react";
import {
  useDeactivateUser,
  useUserFilters,
  useUsers,
} from "@/hooks/use-users";
import type { UserListItem } from "@/types/users";
import { UserFilters, type UserFilterState } from "./user-filters";
import { UserCard } from "./user-card";
import { UsersTable } from "./users-table";
import { UsersSkeleton } from "./users-skeleton";
import { UserProfileSheet } from "./user-profile-sheet";
import { UserEditDialog } from "./user-edit-dialog";
import { UserCreateDialog } from "./user-create-dialog";
import { EmptyState } from "@/components/dashboard/empty-state";
import { ApiErrorState } from "@/components/feedback/api-error-state";
import { Button } from "@/components/ui/button";
import { PermissionGate } from "@/components/rbac/permission-gate";

const PAGE_SIZE = 12;

export function UsersModule() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: meta } = useUserFilters();
  const deactivateUser = useDeactivateUser();

  const [filters, setFilters] = useState<UserFilterState>(() => ({
    search: searchParams.get("search") ?? "",
    roleId: searchParams.get("roleId") ?? "",
    departmentId: searchParams.get("departmentId") ?? "",
    status: (searchParams.get("status") as UserFilterState["status"]) ?? "all",
    view: (searchParams.get("view") as UserFilterState["view"]) ?? "card",
  }));

  const [page, setPage] = useState(Number(searchParams.get("page") ?? 1));
  const [debouncedSearch, setDebouncedSearch] = useState(filters.search);
  const [profileUserId, setProfileUserId] = useState<string | null>(null);
  const [editUser, setEditUser] = useState<UserListItem | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(filters.search), 300);
    return () => clearTimeout(timer);
  }, [filters.search]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, filters.roleId, filters.departmentId, filters.status]);

  useEffect(() => {
    const params = new URLSearchParams();
    if (debouncedSearch) params.set("search", debouncedSearch);
    if (filters.roleId) params.set("roleId", filters.roleId);
    if (filters.departmentId) params.set("departmentId", filters.departmentId);
    if (filters.status !== "all") params.set("status", filters.status);
    if (filters.view !== "card") params.set("view", filters.view);
    if (page > 1) params.set("page", String(page));
    const qs = params.toString();
    router.replace(qs ? `?${qs}` : "?", { scroll: false });
  }, [debouncedSearch, filters, page, router]);

  const { data, isLoading, isError, error, refetch, isFetching } = useUsers({
    page,
    pageSize: PAGE_SIZE,
    search: debouncedSearch || undefined,
    roleId: filters.roleId || undefined,
    departmentId: filters.departmentId || undefined,
    status: filters.status,
  });

  const handleFilterChange = useCallback((partial: Partial<UserFilterState>) => {
    setFilters((prev) => ({ ...prev, ...partial }));
  }, []);

  const handleView = useCallback((user: UserListItem) => {
    setProfileUserId(user.id);
  }, []);

  const handleEdit = useCallback((user: UserListItem) => {
    setEditUser(user);
    setProfileUserId(null);
  }, []);

  const handleDeactivate = useCallback(
    async (user: UserListItem) => {
      if (!confirm(`Deactivate ${user.fullName}? They will lose access to the platform.`)) {
        return;
      }
      await deactivateUser.mutateAsync(user.id);
    },
    [deactivateUser]
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <PermissionGate elementId="users.create.button">
          <Button onClick={() => setCreateOpen(true)}>Create user</Button>
        </PermissionGate>
      </div>

      <UserFilters
        filters={filters}
        meta={meta}
        onChange={handleFilterChange}
        total={data?.total}
      />

      {isLoading && <UsersSkeleton view={filters.view} />}

      {isError && (
        <ApiErrorState
          error={error}
          title="Failed to load users"
          action="Load users"
          resource="/api/users"
          onRetry={() => refetch()}
          isRetrying={isFetching}
        />
      )}

      {!isLoading && !isError && data && data.items.length === 0 && (
        <EmptyState
          icon={Users}
          title="No users found"
          description="Try adjusting your search or filters to find employees."
        />
      )}

      {!isLoading && !isError && data && data.items.length > 0 && (
        <>
          {filters.view === "card" ? (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {data.items.map((user) => (
                <UserCard
                  key={user.id}
                  user={user}
                  onView={handleView}
                  onEdit={handleEdit}
                  onDeactivate={handleDeactivate}
                />
              ))}
            </div>
          ) : (
            <UsersTable
              users={data.items}
              onView={handleView}
              onEdit={handleEdit}
              onDeactivate={handleDeactivate}
            />
          )}

          <Pagination
            page={data.page}
            totalPages={data.totalPages}
            total={data.total}
            isFetching={isFetching}
            onPageChange={setPage}
          />
        </>
      )}

      <UserProfileSheet
        userId={profileUserId}
        onClose={() => setProfileUserId(null)}
        onEdit={(id) => {
          const user = data?.items.find((u) => u.id === id);
          if (user) handleEdit(user);
        }}
      />

      <UserEditDialog
        user={editUser}
        open={!!editUser}
        onOpenChange={(open) => !open && setEditUser(null)}
      />

      <UserCreateDialog open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  );
}

function Pagination({
  page,
  totalPages,
  total,
  isFetching,
  onPageChange,
}: {
  page: number;
  totalPages: number;
  total: number;
  isFetching: boolean;
  onPageChange: (page: number) => void;
}) {
  const start = (page - 1) * PAGE_SIZE + 1;
  const end = Math.min(page * PAGE_SIZE, total);

  return (
    <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
      <p className="text-sm text-muted-foreground">
        Showing {start}–{end} of {total}
        {isFetching && " · Updating..."}
      </p>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          <ChevronLeft className="h-4 w-4" />
          Previous
        </Button>
        <span className="px-2 text-sm text-muted-foreground">
          Page {page} of {totalPages}
        </span>
        <Button
          variant="outline"
          size="sm"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
        >
          Next
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
