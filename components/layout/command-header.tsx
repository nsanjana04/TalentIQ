"use client";

import Link from "next/link";
import { Bot, ChevronDown, Menu, Moon, Search, Sun, Monitor } from "lucide-react";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { NotificationCenter } from "@/components/enterprise/notification-center";
import { ROLE_LABELS } from "@/constants/roles";
import { ROUTES } from "@/constants/routes";
import { useAuth } from "@/hooks/use-auth";
import { usePermissions } from "@/hooks/use-permissions";
import { Permission } from "@/lib/rbac/permissions";
import { useNotifications } from "@/hooks/use-notifications";
import { useThemeStore, type ThemeMode } from "@/stores/theme-store";
import { cn } from "@/lib/utils";
import type { RoleSlug } from "@/constants/role-slugs";

const ROUTE_TITLES: Record<string, string> = {
  "/dashboard": "Command Center",
  "/ai-copilot": "AI Workforce Copilot",
  "/skills": "Skill Intelligence",
  "/skill-matrix": "Skill Matrix",
  "/learning": "Learning Pathways",
  "/course": "Learning Pathways",
  "/courses": "Course Catalog",
  "/assessments": "Assessments",
  "/certifications": "Certification Intelligence",
  "/analytics": "Workforce Analytics",
  "/reports": "Reports",
  "/settings": "System Settings",
  "/account": "Account",
  "/employees": "Employees",
  "/admin": "Administration",
  "/admin/learning": "Learning Administration",
  "/admin/people": "People & Organization",
  "/admin/users": "People & Organization",
  "/admin/departments": "People & Organization",
  "/admin/roles": "RBAC & Permissions",
  "/admin/audit-logs": "Audit Logs",
};

interface CommandHeaderProps {
  onOpenCopilot: () => void;
  onOpenMenu?: () => void;
  onOpenSearch: () => void;
}

const THEME_CYCLE: ThemeMode[] = ["light", "dark", "system"];

export function CommandHeader({ onOpenCopilot, onOpenMenu, onOpenSearch }: CommandHeaderProps) {
  const pathname = usePathname();
  const figmaLearningHeader =
    pathname === "/learning" || pathname.startsWith("/course/");
  const { user, logout, isLoggingOut } = useAuth();
  const { can } = usePermissions();
  const showCopilot = can(Permission.DASHBOARD_VIEW);
  const { mode, setMode } = useThemeStore();
  const { data: notifications } = useNotifications();

  const title =
    Object.entries(ROUTE_TITLES).find(([route]) => pathname.startsWith(route))?.[1] ??
    "Workforce Intelligence";

  function cycleTheme() {
    const idx = THEME_CYCLE.indexOf(mode);
    setMode(THEME_CYCLE[(idx + 1) % THEME_CYCLE.length]);
  }

  const ThemeIcon = mode === "dark" ? Moon : mode === "light" ? Sun : Monitor;

  return (
    <header className="glass-header flex h-14 shrink-0 items-center gap-2 px-3 sm:h-[72px] sm:gap-3 sm:px-4 lg:gap-4 lg:px-6">
      {onOpenMenu && (
        <Button
          variant="ghost"
          size="icon"
          className="shrink-0 lg:hidden"
          onClick={onOpenMenu}
          aria-label="Open navigation menu"
        >
          <Menu className="h-5 w-5" />
        </Button>
      )}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-foreground">{title}</p>
        {!figmaLearningHeader && user?.role && (
          <p className="truncate text-xs text-muted-foreground">
            {ROLE_LABELS[user.role as RoleSlug]} scope
          </p>
        )}
        {figmaLearningHeader && (
          <p className="truncate text-[13px] font-normal text-[#6B7280]">
            Build skills. Earn certifications. Advance your career.
          </p>
        )}
      </div>

      <button
        type="button"
        onClick={onOpenSearch}
        className="hidden min-w-0 max-w-[14rem] flex-1 md:block lg:max-w-xs"
        aria-label="Open global search (Cmd+K)"
      >
        <div className="relative flex h-9 items-center rounded-lg border border-border bg-muted/40 px-3 text-sm text-muted-foreground transition-colors hover:bg-muted/60">
          <Search className="mr-2 h-4 w-4 shrink-0" />
          <span className="truncate">Search workforce data…</span>
          <kbd className="ml-auto hidden rounded border border-border bg-background px-1.5 py-0.5 text-[10px] lg:inline">
            ⌘K
          </kbd>
        </div>
      </button>

      <Button
        variant="ghost"
        size="icon"
        className="shrink-0 md:hidden"
        onClick={onOpenSearch}
        aria-label="Open search"
      >
        <Search className="h-4 w-4" />
      </Button>

      <div className="flex shrink-0 items-center gap-0.5 sm:gap-1">
        {showCopilot && (
          <Button
            variant="outline"
            size="sm"
            className="hidden gap-2 border-primary/20 bg-primary/5 text-primary hover:bg-primary/10 sm:inline-flex"
            onClick={onOpenCopilot}
          >
            <Bot className="h-4 w-4" />
            Copilot
          </Button>
        )}
        {showCopilot && (
          <Button
            variant="ghost"
            size="icon"
            className="sm:hidden"
            onClick={onOpenCopilot}
            aria-label="Open AI copilot"
          >
            <Bot className="h-4 w-4" />
          </Button>
        )}
        <NotificationCenter
          notifications={notifications?.items}
          unreadCount={notifications?.unreadCount}
          dotOnly={figmaLearningHeader}
        />
        {!figmaLearningHeader && (
          <Button
            variant="ghost"
            size="icon"
            onClick={cycleTheme}
            aria-label={`Theme: ${mode}. Click to change.`}
          >
            <ThemeIcon className="h-4 w-4" />
          </Button>
        )}
        {user && (
          <div
            className={cn(
              "ml-1 flex items-center gap-2 border-l border-border pl-3 sm:gap-3",
              figmaLearningHeader && "border-[#E5E7EB]"
            )}
          >
            {figmaLearningHeader ? (
              <>
                <div className="hidden text-right sm:block">
                  <p className="text-[13px] font-medium leading-none text-[#111827]">
                    {user.firstName} {user.lastName}
                  </p>
                  <p className="text-xs text-[#6B7280]">{user.email}</p>
                </div>
                <div
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-[#2563EB] text-xs font-bold text-white"
                  aria-hidden
                >
                  {user.firstName?.[0]}
                  {user.lastName?.[0]}
                </div>
                <ChevronDown className="hidden h-4 w-4 text-[#6B7280] sm:block" />
              </>
            ) : (
              <>
                <Link href={ROUTES.ACCOUNT} className="hidden text-right hover:opacity-80 sm:block">
                  <p className="text-sm font-medium leading-none">
                    {user.firstName} {user.lastName}
                  </p>
                  <p className="text-xs text-muted-foreground">{user.email}</p>
                </Link>
                <div
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground"
                  aria-hidden
                >
                  {user.firstName?.[0]}
                  {user.lastName?.[0]}
                </div>
              </>
            )}
          </div>
        )}
        <Button
          variant="outline"
          size="sm"
          onClick={() => void logout()}
          disabled={isLoggingOut}
          className={cn("ml-1 shrink-0", figmaLearningHeader && "border-[#E5E7EB] text-[#374151]")}
        >
          {isLoggingOut ? "…" : "Sign out"}
        </Button>
      </div>
    </header>
  );
}
