"use client";

import { useAuth } from "@/hooks/use-auth";
import { useResolvedNavigation } from "@/hooks/useResolvedNavigation";
import { isRbacDebugEnabled } from "@/lib/dev/rbac-debug";

export function RbacDebugPanel() {
  const { user } = useAuth();
  const { flatItems, sections } = useResolvedNavigation();

  if (!isRbacDebugEnabled()) return null;
  if (!user) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm rounded-lg border border-amber-500/40 bg-background/95 p-3 text-xs shadow-lg backdrop-blur">
      <p className="mb-2 font-semibold text-amber-600">RBAC Debug (dev only)</p>
      <dl className="space-y-1 text-muted-foreground">
        <div>
          <dt className="inline font-medium text-foreground">User: </dt>
          <dd className="inline">
            {user.firstName} {user.lastName} ({user.email})
          </dd>
        </div>
        <div>
          <dt className="inline font-medium text-foreground">Role: </dt>
          <dd className="inline">{user.role}</dd>
        </div>
        <div>
          <dt className="inline font-medium text-foreground">Scope: </dt>
          <dd className="inline">{user.scope?.label ?? "—"}</dd>
        </div>
        <div>
          <dt className="inline font-medium text-foreground">Permissions: </dt>
          <dd className="inline">{user.permissions.length}</dd>
        </div>
        <div>
          <dt className="inline font-medium text-foreground">Sections: </dt>
          <dd className="inline">{sections.length}</dd>
        </div>
        <div>
          <dt className="font-medium text-foreground">Visible nav ({flatItems.length})</dt>
          <dd className="mt-1 max-h-24 overflow-y-auto font-mono text-[10px]">
            {flatItems.map((i) => i.label).join(" · ") || "—"}
          </dd>
        </div>
      </dl>
    </div>
  );
}
