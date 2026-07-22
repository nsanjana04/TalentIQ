"use client";

import { User, KeyRound, Bell, Monitor, Shield } from "lucide-react";
import { usePermissions } from "@/hooks/use-permissions";
import { useUrlTab } from "@/hooks/use-url-tab";
import { useAuth } from "@/hooks/use-auth";
import { SecurityPanel } from "./security-panel";
import { NotificationsPanel } from "./settings-panels";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type AccountTab = "profile" | "security" | "notifications" | "devices";

interface TabDef {
  id: AccountTab;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const TABS: TabDef[] = [
  { id: "profile", label: "Profile", icon: User },
  { id: "security", label: "Security", icon: KeyRound },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "devices", label: "Connected Devices", icon: Monitor },
];

const VALID_TABS = new Set<AccountTab>(["profile", "security", "notifications", "devices"]);

export function AccountModule({ initialTab }: { initialTab?: string } = {}) {
  const { user } = useAuth();
  const parsedInitial =
    initialTab && VALID_TABS.has(initialTab as AccountTab)
      ? (initialTab as AccountTab)
      : "profile";

  const [tab, setTab] = useUrlTab(VALID_TABS, parsedInitial);
  usePermissions();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        {TABS.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors",
                tab === t.id
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

      {tab === "profile" && user && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Profile
            </CardTitle>
            <CardDescription>Your personal account information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-muted-foreground">Name</p>
                <p className="font-medium">
                  {user.firstName} {user.lastName}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Email</p>
                <p className="font-medium">{user.email}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Role</p>
                <p className="font-medium">{user.role}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Email verified</p>
                <p className="font-medium">{user.emailVerified ? "Yes" : "No"}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {tab === "security" && (
        <div className="space-y-6">
          <Card className="border-primary/20 bg-primary/5">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <Shield className="h-4 w-4" />
                Personal Security
              </CardTitle>
              <CardDescription>
                Password, active sessions, and email verification — available to all users.
              </CardDescription>
            </CardHeader>
          </Card>
          <SecurityPanel />
        </div>
      )}

      {tab === "notifications" && <NotificationsPanel />}

      {tab === "devices" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Monitor className="h-5 w-5" />
              Connected Devices
            </CardTitle>
            <CardDescription>
              Active sessions are managed under Security. Revoke unfamiliar sessions there.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Open the Security tab to view and revoke active sessions on connected devices.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
