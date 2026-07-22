"use client";

import { Loader2, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { PermissionGate } from "@/components/rbac/permission-gate";
import { cn } from "@/lib/utils";

export function AdminPanel({
  title,
  description,
  onAdd,
  addLabel = "Add",
  children,
  isLoading,
}: {
  title: string;
  description?: string;
  onAdd?: () => void;
  addLabel?: string;
  children: React.ReactNode;
  isLoading?: boolean;
}) {
  return (
    <Card className="border-0 shadow-sm ring-1 ring-border/60">
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle className="text-base">{title}</CardTitle>
          {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
        </div>
        {onAdd && (
          <PermissionGate elementId="skills.manage.button">
            <Button size="sm" onClick={onAdd}>
              <Plus className="mr-1.5 h-4 w-4" />
              {addLabel}
            </Button>
          </PermissionGate>
        )}
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : (
          children
        )}
      </CardContent>
    </Card>
  );
}

export function DeleteButton({
  onClick,
  loading,
}: {
  onClick: () => void;
  loading?: boolean;
}) {
  return (
    <PermissionGate elementId="skills.manage.button">
      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={onClick} disabled={loading}>
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
      </Button>
    </PermissionGate>
  );
}

export function StatPill({
  label,
  value,
  className,
}: {
  label: string;
  value: number | string;
  className?: string;
}) {
  return (
    <div className={cn("rounded-xl bg-card p-4 shadow-sm ring-1 ring-border/60", className)}>
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

export function FormRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium">{label}</label>
      {children}
    </div>
  );
}
