"use client";

import { useMemo } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { Award, Eye, MoreHorizontal, Pencil, Sparkles, UserX } from "lucide-react";
import type { UserListItem } from "@/types/users";
import { UserAvatar } from "./user-avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { PermissionGate } from "@/components/rbac/permission-gate";
import { ROLE_LABELS } from "@/constants/roles";
import { DataTable } from "@/components/enterprise/data-table";

interface UsersTableProps {
  users: UserListItem[];
  onView: (user: UserListItem) => void;
  onEdit: (user: UserListItem) => void;
  onDeactivate: (user: UserListItem) => void;
}

export function UsersTable({ users, onView, onEdit, onDeactivate }: UsersTableProps) {
  const columns = useMemo<ColumnDef<UserListItem, unknown>[]>(
    () => [
      {
        id: "employee",
        accessorFn: (row) => row.fullName,
        header: "Employee",
        cell: ({ row }) => {
          const user = row.original;
          return (
            <div className="flex items-center gap-3">
              <UserAvatar initials={user.initials} colorClass={user.avatarColor} size="sm" />
              <div className="min-w-0">
                <p className="truncate font-medium">{user.fullName}</p>
                <p className="truncate text-xs text-muted-foreground">{user.email}</p>
              </div>
            </div>
          );
        },
      },
      {
        id: "role",
        accessorFn: (row) => row.role.name,
        header: "Role",
        cell: ({ row }) => (
          <Badge variant="secondary" className="text-xs">
            {ROLE_LABELS[row.original.role.slug]}
          </Badge>
        ),
      },
      {
        id: "department",
        accessorFn: (row) => row.department?.name ?? "",
        header: "Department",
        cell: ({ row }) => (
          <span className="text-muted-foreground">{row.original.department?.name ?? "—"}</span>
        ),
      },
      {
        id: "skills",
        accessorKey: "skillCount",
        header: "Skills",
        cell: ({ row }) => (
          <div className="flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-muted-foreground" />
            <span>{row.original.skillCount}</span>
          </div>
        ),
      },
      {
        id: "certs",
        accessorKey: "certificateCount",
        header: "Certs",
        cell: ({ row }) => (
          <div className="flex items-center gap-1.5">
            <Award className="h-3.5 w-3.5 text-muted-foreground" />
            <span>{row.original.certificateCount}</span>
          </div>
        ),
      },
      {
        id: "progress",
        accessorKey: "learningProgress",
        header: "Progress",
        cell: ({ row }) => (
          <div className="flex min-w-[100px] items-center gap-2">
            <Progress value={row.original.learningProgress} className="h-1.5 flex-1" />
            <span className="w-8 text-xs text-muted-foreground">{row.original.learningProgress}%</span>
          </div>
        ),
      },
      {
        id: "status",
        accessorFn: (row) => (row.isActive ? "Active" : "Inactive"),
        header: "Status",
        cell: ({ row }) => (
          <Badge variant={row.original.isActive ? "success" : "danger"}>
            {row.original.isActive ? "Active" : "Inactive"}
          </Badge>
        ),
      },
      {
        id: "actions",
        header: "Actions",
        enableSorting: false,
        cell: ({ row }) => (
          <RowActions
            user={row.original}
            onView={onView}
            onEdit={onEdit}
            onDeactivate={onDeactivate}
          />
        ),
      },
    ],
    [onDeactivate, onEdit, onView]
  );

  return (
    <DataTable
      columns={columns}
      data={users}
      searchKey="fullName"
      searchPlaceholder="Search employees…"
      emptyMessage="No employees match your filters."
      pageSize={12}
    />
  );
}

function RowActions({
  user,
  onView,
  onEdit,
  onDeactivate,
}: {
  user: UserListItem;
  onView: (user: UserListItem) => void;
  onEdit: (user: UserListItem) => void;
  onDeactivate: (user: UserListItem) => void;
}) {
  return (
    <div className="flex items-center justify-end gap-1">
      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onView(user)}>
        <Eye className="h-4 w-4" />
      </Button>
      <PermissionGate elementId="users.edit.button">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEdit(user)}>
          <Pencil className="h-4 w-4" />
        </Button>
      </PermissionGate>
      <details className="relative">
        <summary className="flex h-8 w-8 cursor-pointer list-none items-center justify-center rounded-md hover:bg-muted">
          <MoreHorizontal className="h-4 w-4" />
        </summary>
        <div className="absolute right-0 z-10 mt-1 w-36 rounded-lg border bg-card py-1 shadow-lg">
          <PermissionGate elementId="users.delete.button">
            {user.isActive && (
              <button
                type="button"
                onClick={() => onDeactivate(user)}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-destructive hover:bg-muted"
              >
                <UserX className="h-3.5 w-3.5" />
                Deactivate
              </button>
            )}
          </PermissionGate>
        </div>
      </details>
    </div>
  );
}
