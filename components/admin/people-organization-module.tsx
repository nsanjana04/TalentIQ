"use client";

import { Suspense, useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Building2, Users } from "lucide-react";
import { UsersModule } from "@/components/users/users-module";
import { UsersSkeleton } from "@/components/users/users-skeleton";
import { DepartmentsAdminModule } from "@/components/admin/departments-admin-module";
import { usePermissions } from "@/hooks/use-permissions";
import { Permission } from "@/lib/rbac/permissions";
import { canAny } from "@/lib/rbac/check";
import { cn } from "@/lib/utils";

type PeopleTab = "users" | "organization";

const TABS: { id: PeopleTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: "users", label: "Users", icon: Users },
  { id: "organization", label: "Departments & Teams", icon: Building2 },
];

export function PeopleOrganizationModule({ showHeader = true }: { showHeader?: boolean }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { permissions, can } = usePermissions();

  const canUsers = can(Permission.USERS_VIEW);
  const canOrganization = canAny(permissions, [
    Permission.DEPARTMENTS_VIEW,
    Permission.DEPARTMENTS_MANAGE,
  ]);

  const visibleTabs = useMemo(
    () =>
      TABS.filter((t) =>
        t.id === "users" ? canUsers : canOrganization
      ),
    [canUsers, canOrganization]
  );

  const tabParam = searchParams.get("tab");
  const activeTab: PeopleTab =
    tabParam === "organization" && canOrganization
      ? "organization"
      : tabParam === "users" && canUsers
        ? "users"
        : visibleTabs[0]?.id ?? "users";

  useEffect(() => {
    if (visibleTabs.length === 0) return;
    if (!visibleTabs.some((t) => t.id === activeTab)) {
      const params = new URLSearchParams(searchParams.toString());
      params.set("tab", visibleTabs[0].id);
      router.replace(`?${params.toString()}`);
    }
  }, [activeTab, visibleTabs, router, searchParams]);

  if (visibleTabs.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        You do not have permission to view people or organization settings.
      </p>
    );
  }

  function selectTab(id: PeopleTab) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", id);
    router.replace(`?${params.toString()}`);
  }

  return (
    <div className="space-y-6">
      {showHeader && (
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">People & Organization</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage user accounts, roles, departments, and teams from one place.
          </p>
        </div>
      )}

      {visibleTabs.length > 1 && (
        <div className="flex flex-wrap gap-2" role="tablist" aria-label="People and organization views">
          {visibleTabs.map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                type="button"
                role="tab"
                aria-selected={activeTab === t.id}
                onClick={() => selectTab(t.id)}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors",
                  activeTab === t.id
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-background text-muted-foreground hover:bg-muted"
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                {t.label}
              </button>
            );
          })}
        </div>
      )}

      {activeTab === "users" && canUsers && (
        <Suspense fallback={<UsersSkeleton view="card" />}>
          <UsersModule />
        </Suspense>
      )}

      {activeTab === "organization" && canOrganization && (
        <DepartmentsAdminModule embedded />
      )}
    </div>
  );
}
