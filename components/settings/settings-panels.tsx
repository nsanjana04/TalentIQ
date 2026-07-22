"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Loader2, Shield } from "lucide-react";
import {
  useAuditLogs,
  useNotificationPreferences,
  useNotifications,
  useRoleSummaries,
  useUpdateNotificationPreferences,
} from "@/hooks/use-settings";
import { ROUTES } from "@/constants/routes";
import { SettingsCategoryForm } from "./settings-category-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { PermissionGate } from "@/components/rbac/permission-gate";
import { cn } from "@/lib/utils";

const ACTION_COLORS: Record<string, string> = {
  CREATE: "bg-emerald-500/15 text-emerald-700",
  UPDATE: "bg-blue-500/15 text-blue-700",
  DELETE: "bg-destructive/15 text-destructive",
  LOGIN: "bg-violet-500/15 text-violet-700",
  LOGOUT: "bg-muted text-muted-foreground",
  PERMISSION_DENIED: "bg-amber-500/15 text-amber-700",
  EXPORT: "bg-cyan-500/15 text-cyan-700",
};

export function NotificationsPanel() {
  const { data: prefs, isLoading: prefsLoading } = useNotificationPreferences();
  const { data: notifs, isLoading: notifsLoading } = useNotifications();
  const updatePrefs = useUpdateNotificationPreferences();
  const [form, setForm] = useState({
    emailEnabled: true,
    inAppEnabled: true,
    digestFrequency: "weekly" as "daily" | "weekly" | "never",
    skills: true,
    courses: true,
    assessments: true,
    certificates: true,
  });

  useEffect(() => {
    if (prefs) setForm(prefs);
  }, [prefs]);

  return (
    <div className="space-y-6">
      <PermissionGate elementId="settings.manage.panel">
        <SettingsCategoryForm category="notifications" />
      </PermissionGate>

      <Card>
        <CardHeader>
          <CardTitle>My Notification Preferences</CardTitle>
          <CardDescription>Control how you receive alerts</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {prefsLoading ? (
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          ) : (
            <>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={form.emailEnabled}
                    onChange={(e) => setForm((f) => ({ ...f, emailEnabled: e.target.checked }))}
                  />
                  Email notifications
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={form.inAppEnabled}
                    onChange={(e) => setForm((f) => ({ ...f, inAppEnabled: e.target.checked }))}
                  />
                  In-app notifications
                </label>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Digest frequency</label>
                <Select
                  value={form.digestFrequency}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      digestFrequency: e.target.value as "daily" | "weekly" | "never",
                    }))
                  }
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="never">Never</option>
                </Select>
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                {(["skills", "courses", "assessments", "certificates"] as const).map((key) => (
                  <label key={key} className="flex items-center gap-2 text-sm capitalize">
                    <input
                      type="checkbox"
                      checked={form[key]}
                      onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.checked }))}
                    />
                    {key}
                  </label>
                ))}
              </div>
              <Button
                onClick={() => updatePrefs.mutate(form)}
                disabled={updatePrefs.isPending}
              >
                {updatePrefs.isPending ? "Saving…" : "Save Preferences"}
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent Notifications</CardTitle>
          <CardDescription>
            {notifs?.unread ? `${notifs.unread} unread` : "Your notification inbox"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {notifsLoading ? (
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          ) : notifs?.items.length === 0 ? (
            <p className="text-sm text-muted-foreground">No notifications yet</p>
          ) : (
            <div className="space-y-2">
              {notifs?.items.map((n) => (
                <div
                  key={n.id}
                  className={cn(
                    "rounded-lg border p-3",
                    !n.isRead && "border-primary/30 bg-primary/5"
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-medium">{n.title}</p>
                      <p className="text-xs text-muted-foreground">{n.message}</p>
                    </div>
                    <Badge variant="outline" className="shrink-0 text-xs">
                      {n.type}
                    </Badge>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {new Date(n.createdAt).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export function RoleBasedAccessPanel() {
  const { data: roles, isLoading } = useRoleSummaries();

  if (isLoading) {
    return (
      <div className="flex justify-center py-16 text-muted-foreground">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
        Loading roles…
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Role-Based Access Control
          </CardTitle>
          <CardDescription>
            Enterprise roles and their permission assignments across the platform.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="pb-2 pr-4">Role</th>
                  <th className="pb-2 pr-4">Slug</th>
                  <th className="pb-2 pr-4">Permissions</th>
                  <th className="pb-2 pr-4">Users</th>
                  <th className="pb-2">Type</th>
                </tr>
              </thead>
              <tbody>
                {roles?.map((role) => (
                  <tr key={role.id} className="border-b border-border/50">
                    <td className="py-2.5 pr-4 font-medium">{role.name}</td>
                    <td className="py-2.5 pr-4 font-mono text-xs text-muted-foreground">{role.slug}</td>
                    <td className="py-2.5 pr-4">{role.permissionCount}</td>
                    <td className="py-2.5 pr-4">{role.userCount}</td>
                    <td className="py-2.5">
                      <Badge variant={role.isSystem ? "secondary" : "outline"}>
                        {role.isSystem ? "System" : "Custom"}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export function PermissionTogglesPanel() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Permission Toggles</CardTitle>
        <CardDescription>
          Manage role permission toggles in RBAC & Permissions — a single place to avoid duplicate
          configuration.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button asChild>
          <Link href={`${ROUTES.ADMIN_ROLES}?tab=permissions`}>Open Roles & Permissions</Link>
        </Button>
      </CardContent>
    </Card>
  );
}

export function AuditTrackingPanel() {
  const [action, setAction] = useState("");
  const [entityType, setEntityType] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 50;
  const { data, isLoading, isFetching } = useAuditLogs({
    action: action || undefined,
    entityType: entityType || undefined,
    limit: pageSize,
    offset: (page - 1) * pageSize,
  });

  const totalPages = data ? Math.max(1, Math.ceil(data.total / pageSize)) : 1;

  useEffect(() => {
    setPage(1);
  }, [action, entityType]);

  return (
    <div className="space-y-6">
      <PermissionGate elementId="settings.manage.panel">
        <SettingsCategoryForm category="audit" />
      </PermissionGate>

      <Card>
        <CardHeader>
          <CardTitle>Audit Log</CardTitle>
          <CardDescription>
            Immutable record of platform actions
            {data && ` · ${data.total} total entries`}
            {isFetching && !isLoading && " · Refreshing…"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-3">
            <Select value={action} onChange={(e) => setAction(e.target.value)} className="w-40">
              <option value="">All actions</option>
              {["CREATE", "UPDATE", "DELETE", "LOGIN", "LOGOUT", "PERMISSION_DENIED", "EXPORT", "PASSWORD_CHANGE"].map((a) => (
                <option key={a} value={a}>{a}</option>
              ))}
            </Select>
            <Input
              placeholder="Filter by entity type"
              value={entityType}
              onChange={(e) => setEntityType(e.target.value)}
              className="w-48"
            />
          </div>

          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : data?.items.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">No audit logs found</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="pb-2 pr-4">Time</th>
                    <th className="pb-2 pr-4">Action</th>
                    <th className="pb-2 pr-4">Entity</th>
                    <th className="pb-2 pr-4">Actor</th>
                    <th className="pb-2">IP</th>
                  </tr>
                </thead>
                <tbody>
                  {data?.items.map((log) => (
                    <tr key={log.id} className="border-b border-border/50">
                      <td className="py-2.5 pr-4 whitespace-nowrap text-xs text-muted-foreground">
                        {new Date(log.createdAt).toLocaleString()}
                      </td>
                      <td className="py-2.5 pr-4">
                        <Badge className={cn("text-xs", ACTION_COLORS[log.action] ?? "bg-muted")} variant="secondary">
                          {log.action}
                        </Badge>
                      </td>
                      <td className="py-2.5 pr-4">
                        <span className="font-medium">{log.entityType}</span>
                        {log.entityId && (
                          <span className="ml-1 font-mono text-xs text-muted-foreground">
                            {log.entityId.slice(0, 8)}
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 pr-4 text-muted-foreground">
                        {log.actorName ?? "System"}
                      </td>
                      <td className="py-2.5 text-xs text-muted-foreground">{log.ipAddress ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {data && data.total > pageSize && (
            <div className="flex items-center justify-between pt-2">
              <p className="text-sm text-muted-foreground">
                Page {page} of {totalPages}
              </p>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  Previous
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
