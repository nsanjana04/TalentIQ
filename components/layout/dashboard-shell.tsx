"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { AppSidebar } from "./app-sidebar";
import { CommandHeader } from "./command-header";
import { GlobalSearch, useGlobalSearchShortcut } from "@/components/search/global-search";
import { BootstrapBanner } from "@/components/enterprise/bootstrap-banner";
import { useDashboard } from "@/hooks/use-dashboard";
import { useAuth } from "@/hooks/use-auth";
import { usePermissionRefresh } from "@/hooks/use-permission-refresh";
import { usePathname } from "next/navigation";
import { ScreenRouteGuard } from "./screen-route-guard";

const AiCopilotPanel = dynamic(
  () =>
    import("@/components/enterprise/ai-copilot-panel").then((mod) => ({
      default: mod.AiCopilotPanel,
    })),
  { ssr: false }
);

const RbacDebugPanel = dynamic(
  () =>
    import("@/components/dev/rbac-debug-panel").then((mod) => ({
      default: mod.RbacDebugPanel,
    })),
  { ssr: false }
);

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const [copilotOpen, setCopilotOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const pathname = usePathname();
  const isDashboard = pathname === "/dashboard";
  const hideBootstrap =
    pathname === "/learning" || pathname.startsWith("/course/");
  const { user } = useAuth();
  usePermissionRefresh();
  useGlobalSearchShortcut(() => setSearchOpen(true));
  const { data } = useDashboard({
    enabled: isDashboard && !!user?.id,
  });

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <AppSidebar className="hidden lg:flex" />
      {mobileNavOpen && (
        <>
          <button
            type="button"
            className="fixed inset-0 z-40 bg-black/50 lg:hidden"
            aria-label="Close navigation menu"
            onClick={() => setMobileNavOpen(false)}
          />
          <AppSidebar
            className="fixed inset-y-0 left-0 z-50 lg:hidden"
            onNavigate={() => setMobileNavOpen(false)}
          />
        </>
      )}
      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <CommandHeader
          onOpenCopilot={() => setCopilotOpen(true)}
          onOpenMenu={() => setMobileNavOpen(true)}
          onOpenSearch={() => setSearchOpen(true)}
        />
        <BootstrapBanner hidden={hideBootstrap} />
        <main className="min-h-0 flex-1 overflow-y-auto">
          <ScreenRouteGuard>{children}</ScreenRouteGuard>
        </main>
      </div>
      <GlobalSearch open={searchOpen} onOpenChange={setSearchOpen} />
      <AiCopilotPanel
        open={copilotOpen}
        onClose={() => setCopilotOpen(false)}
        recommendations={copilotOpen ? data?.aiRecommendations : undefined}
      />
      <RbacDebugPanel />
    </div>
  );
}
