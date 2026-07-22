"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Bell,
  KeyRound,
  Mail,
  Monitor,
  Plug,
  ScrollText,
  Server,
  Settings2,
  Shield,
  ToggleLeft,
} from "lucide-react";
import { usePermissions } from "@/hooks/use-permissions";
import { useUrlTab } from "@/hooks/use-url-tab";
import { Permission } from "@/lib/rbac/permissions";
import { canAny } from "@/lib/rbac/check";
import { getVisibleSettingsTabs } from "@/lib/rbac/routePermissions";
import { ROUTES } from "@/constants/routes";
import { SettingsCategoryForm } from "./settings-category-form";
import {
  AuditTrackingPanel,
  NotificationsPanel,
  PermissionTogglesPanel,
  RoleBasedAccessPanel,
} from "./settings-panels";
import { cn } from "@/lib/utils";

type SettingsTab =
  | "general"
  | "security"
  | "email"
  | "notifications"
  | "integrations"
  | "appearance"
  | "system"
  | "rbac"
  | "permissions"
  | "audit";

interface TabDef {
  id: SettingsTab;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  permissions: Permission[];
}

const ALL_TABS: TabDef[] = [
  { id: "general", label: "General", icon: Settings2, permissions: [Permission.SETTINGS_GENERAL_MANAGE, Permission.SETTINGS_MANAGE] },
  { id: "security", label: "Security", icon: KeyRound, permissions: [Permission.SETTINGS_SECURITY_MANAGE, Permission.SETTINGS_MANAGE] },
  { id: "email", label: "Email", icon: Mail, permissions: [Permission.SETTINGS_EMAIL_MANAGE, Permission.SETTINGS_MANAGE] },
  { id: "notifications", label: "Notifications", icon: Bell, permissions: [Permission.SETTINGS_NOTIFICATIONS_MANAGE, Permission.SETTINGS_MANAGE] },
  { id: "integrations", label: "Integrations", icon: Plug, permissions: [Permission.INTEGRATIONS_MANAGE, Permission.SETTINGS_MANAGE] },
  { id: "appearance", label: "Appearance", icon: Monitor, permissions: [Permission.SETTINGS_APPEARANCE_MANAGE, Permission.SETTINGS_MANAGE] },
  { id: "system", label: "System", icon: Server, permissions: [Permission.SETTINGS_SYSTEM_MANAGE, Permission.SETTINGS_MANAGE] },
  { id: "rbac", label: "Role-Based Access", icon: Shield, permissions: [Permission.RBAC_MANAGE, Permission.ROLES_MANAGE] },
  { id: "permissions", label: "Permission Toggles", icon: ToggleLeft, permissions: [Permission.PERMISSIONS_MANAGE, Permission.ROLES_MANAGE] },
  { id: "audit", label: "Audit Tracking", icon: ScrollText, permissions: [Permission.AUDITLOGS_VIEW] },
];

const VALID_TABS = new Set<SettingsTab>(ALL_TABS.map((t) => t.id));

export function SettingsHubModule({ initialTab }: { initialTab?: string } = {}) {
  const router = useRouter();
  const { permissions } = usePermissions();

  const visibleTabIds = getVisibleSettingsTabs(permissions);
  const visibleTabs = ALL_TABS.filter((t) => visibleTabIds.includes(t.id));

  useEffect(() => {
    if (visibleTabs.length === 0) {
      router.replace(ROUTES.ACCOUNT);
    }
  }, [visibleTabs.length, router]);

  const parsedInitial =
    initialTab && VALID_TABS.has(initialTab as SettingsTab) && visibleTabIds.includes(initialTab)
      ? (initialTab as SettingsTab)
      : (visibleTabIds[0] as SettingsTab | undefined) ?? "general";

  const [tab, setTab] = useUrlTab(VALID_TABS, parsedInitial);

  if (visibleTabs.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">Redirecting to your account settings…</p>
    );
  }

  const activeTabAllowed = visibleTabIds.includes(tab);
  const activeTab = activeTabAllowed ? tab : (visibleTabIds[0] as SettingsTab);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        {visibleTabs.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
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

      {activeTab === "general" && canAny(permissions, [Permission.SETTINGS_GENERAL_MANAGE, Permission.SETTINGS_MANAGE]) && (
        <SettingsCategoryForm category="general" />
      )}
      {activeTab === "security" && canAny(permissions, [Permission.SETTINGS_SECURITY_MANAGE, Permission.SETTINGS_MANAGE]) && (
        <SettingsCategoryForm category="security" />
      )}
      {activeTab === "email" && canAny(permissions, [Permission.SETTINGS_EMAIL_MANAGE, Permission.SETTINGS_MANAGE]) && (
        <SettingsCategoryForm category="email" />
      )}
      {activeTab === "notifications" && canAny(permissions, [Permission.SETTINGS_NOTIFICATIONS_MANAGE, Permission.SETTINGS_MANAGE]) && (
        <NotificationsPanel />
      )}
      {activeTab === "integrations" && canAny(permissions, [Permission.INTEGRATIONS_MANAGE, Permission.SETTINGS_MANAGE]) && (
        <SettingsCategoryForm category="integrations" />
      )}
      {activeTab === "appearance" && canAny(permissions, [Permission.SETTINGS_APPEARANCE_MANAGE, Permission.SETTINGS_MANAGE]) && (
        <div className="space-y-6">
          <SettingsCategoryForm category="appearance" />
          <AppearancePreview />
        </div>
      )}
      {activeTab === "system" && canAny(permissions, [Permission.SETTINGS_SYSTEM_MANAGE, Permission.SETTINGS_MANAGE]) && (
        <SettingsCategoryForm category="system" />
      )}
      {activeTab === "rbac" && canAny(permissions, [Permission.RBAC_MANAGE, Permission.ROLES_MANAGE]) && (
        <RoleBasedAccessPanel />
      )}
      {activeTab === "permissions" && canAny(permissions, [Permission.PERMISSIONS_MANAGE, Permission.ROLES_MANAGE]) && (
        <PermissionTogglesPanel />
      )}
      {activeTab === "audit" && canAny(permissions, [Permission.AUDITLOGS_VIEW]) && (
        <AuditTrackingPanel />
      )}
    </div>
  );
}

function AppearancePreview() {
  return (
    <div className="rounded-lg border p-4">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Monitor className="h-4 w-4" />
        Theme changes apply on next page load. Users can override with system preferences.
      </div>
    </div>
  );
}
