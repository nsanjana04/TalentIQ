"use client";

import {
  Award,
  BookOpen,
  Eye,
  MoreHorizontal,
  Pencil,
  Sparkles,
  UserX,
} from "lucide-react";
import type { UserListItem } from "@/types/users";
import { UserAvatar } from "./user-avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { PermissionGate } from "@/components/rbac/permission-gate";
import { ROLE_LABELS } from "@/constants/roles";
import { cn } from "@/lib/utils";

interface UserCardProps {
  user: UserListItem;
  onView: (user: UserListItem) => void;
  onEdit: (user: UserListItem) => void;
  onDeactivate: (user: UserListItem) => void;
}

export function UserCard({ user, onView, onEdit, onDeactivate }: UserCardProps) {
  return (
    <Card
      className={cn(
        "group relative overflow-hidden border-0 shadow-sm ring-1 ring-border/60 transition-all hover:shadow-md hover:ring-primary/20",
        !user.isActive && "opacity-75"
      )}
    >
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <UserAvatar
              initials={user.initials}
              colorClass={user.avatarColor}
              size="lg"
            />
            <div className="min-w-0">
              <h3 className="truncate font-semibold">{user.fullName}</h3>
              <p className="truncate text-xs text-muted-foreground">{user.email}</p>
            </div>
          </div>
          <UserActionsMenu
            user={user}
            onView={onView}
            onEdit={onEdit}
            onDeactivate={onDeactivate}
          />
        </div>

        <div className="mt-4 flex flex-wrap gap-1.5">
          <Badge variant="secondary" className="text-xs">
            {ROLE_LABELS[user.role.slug]}
          </Badge>
          {user.department && (
            <Badge variant="outline" className="text-xs">
              {user.department.name}
            </Badge>
          )}
          <Badge variant={user.isActive ? "success" : "danger"} className="text-xs">
            {user.isActive ? "Active" : "Inactive"}
          </Badge>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2 text-center">
          <Metric icon={Sparkles} label="Skills" value={user.skillCount} />
          <Metric icon={Award} label="Certs" value={user.certificateCount} />
          <Metric icon={BookOpen} label="Progress" value={`${user.learningProgress}%`} />
        </div>

        <div className="mt-4 space-y-1">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Learning progress</span>
            <span className="font-medium">{user.learningProgress}%</span>
          </div>
          <Progress value={user.learningProgress} />
        </div>

        <div className="mt-4 flex gap-2">
          <Button variant="outline" size="sm" className="flex-1" onClick={() => onView(user)}>
            <Eye className="mr-1.5 h-3.5 w-3.5" />
            View
          </Button>
          <PermissionGate elementId="users.edit.button">
            <Button variant="secondary" size="sm" className="flex-1" onClick={() => onEdit(user)}>
              <Pencil className="mr-1.5 h-3.5 w-3.5" />
              Edit
            </Button>
          </PermissionGate>
        </div>
      </CardContent>
    </Card>
  );
}

function Metric({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-lg bg-muted/40 px-2 py-2">
      <Icon className="mx-auto h-3.5 w-3.5 text-muted-foreground" />
      <p className="mt-1 text-sm font-bold">{value}</p>
      <p className="text-[10px] text-muted-foreground">{label}</p>
    </div>
  );
}

function UserActionsMenu({
  user,
  onView,
  onEdit,
  onDeactivate,
}: UserCardProps) {
  return (
    <div className="relative">
      <details className="group/menu">
        <summary className="flex h-8 w-8 cursor-pointer list-none items-center justify-center rounded-md hover:bg-muted">
          <MoreHorizontal className="h-4 w-4" />
        </summary>
        <div className="absolute right-0 z-10 mt-1 w-40 rounded-lg border bg-card py-1 shadow-lg ring-1 ring-border/60">
          <MenuItem icon={Eye} label="View profile" onClick={() => onView(user)} />
          <PermissionGate elementId="users.edit.button">
            <MenuItem icon={Pencil} label="Edit" onClick={() => onEdit(user)} />
          </PermissionGate>
          <PermissionGate elementId="users.delete.button">
            {user.isActive && (
              <MenuItem
                icon={UserX}
                label="Deactivate"
                onClick={() => onDeactivate(user)}
                destructive
              />
            )}
          </PermissionGate>
        </div>
      </details>
    </div>
  );
}

function MenuItem({
  icon: Icon,
  label,
  onClick,
  destructive,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  onClick: () => void;
  destructive?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-muted",
        destructive && "text-destructive"
      )}
    >
      <Icon className="h-3.5 w-3.5" />
      {label}
    </button>
  );
}
