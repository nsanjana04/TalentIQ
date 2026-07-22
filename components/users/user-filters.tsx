"use client";

import { LayoutGrid, List, Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import type { UserFiltersMeta } from "@/types/users";
import { cn } from "@/lib/utils";

export type ViewMode = "card" | "table";

export interface UserFilterState {
  search: string;
  roleId: string;
  departmentId: string;
  status: "all" | "active" | "inactive";
  view: ViewMode;
}

interface UserFiltersProps {
  filters: UserFilterState;
  meta?: UserFiltersMeta;
  onChange: (filters: Partial<UserFilterState>) => void;
  total?: number;
}

export function UserFilters({ filters, meta, onChange, total }: UserFiltersProps) {
  const hasFilters =
    filters.search || filters.roleId || filters.departmentId || filters.status !== "all";

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative flex-1 lg:max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name or email..."
            value={filters.search}
            onChange={(e) => onChange({ search: e.target.value })}
            className="pl-9"
          />
        </div>

        <div className="flex items-center gap-2">
          <ViewToggle view={filters.view} onChange={(view) => onChange({ view })} />
          {total != null && (
            <span className="hidden text-sm text-muted-foreground sm:inline">
              {total} employee{total !== 1 ? "s" : ""}
            </span>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Select
          value={filters.roleId}
          onChange={(e) => onChange({ roleId: e.target.value })}
          className="w-full sm:w-[160px]"
        >
          <option value="">All roles</option>
          {meta?.roles.map((role) => (
            <option key={role.id} value={role.id}>
              {role.name}
            </option>
          ))}
        </Select>

        <Select
          value={filters.departmentId}
          onChange={(e) => onChange({ departmentId: e.target.value })}
          className="w-full sm:w-[180px]"
        >
          <option value="">All departments</option>
          {meta?.departments.map((dept) => (
            <option key={dept.id} value={dept.id}>
              {dept.name}
            </option>
          ))}
        </Select>

        <Select
          value={filters.status}
          onChange={(e) =>
            onChange({ status: e.target.value as UserFilterState["status"] })
          }
          className="w-full sm:w-[140px]"
        >
          <option value="all">All status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </Select>

        {hasFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() =>
              onChange({
                search: "",
                roleId: "",
                departmentId: "",
                status: "all",
              })
            }
          >
            <X className="mr-1 h-3.5 w-3.5" />
            Clear
          </Button>
        )}
      </div>
    </div>
  );
}

function ViewToggle({
  view,
  onChange,
}: {
  view: ViewMode;
  onChange: (view: ViewMode) => void;
}) {
  return (
    <div className="flex rounded-lg border p-0.5">
      <button
        type="button"
        onClick={() => onChange("card")}
        className={cn(
          "flex h-8 w-8 items-center justify-center rounded-md transition-colors",
          view === "card" ? "bg-primary text-primary-foreground" : "hover:bg-muted"
        )}
      >
        <LayoutGrid className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={() => onChange("table")}
        className={cn(
          "flex h-8 w-8 items-center justify-center rounded-md transition-colors",
          view === "table" ? "bg-primary text-primary-foreground" : "hover:bg-muted"
        )}
      >
        <List className="h-4 w-4" />
      </button>
    </div>
  );
}
