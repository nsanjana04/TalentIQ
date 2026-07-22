"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Brain,
  BookOpen,
  ClipboardCheck,
  Award,
  BarChart3,
  Settings,
  Users,
  Shield,
  Building2,
  Cog,
  Route,
  Bot,
  Crown,
  UsersRound,
  Briefcase,
  Grid3x3,
  Layers,
  ShieldCheck,
  GraduationCap,
  Target,
  Star,
  TrendingUp,
  GitBranch,
  LineChart,
  Building,
  UserCog,
  ScrollText,
  Plug,
  Network,
  Store,
  FileText,
  KeyRound,
} from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useResolvedNavigation } from "@/hooks/useResolvedNavigation";
import { BRAND } from "@/lib/design/tokens";
import type { SidebarNavItem } from "@/lib/rbac/types";
import { Badge } from "@/components/ui/badge";
import { useNavBadges } from "@/hooks/use-nav-badges";

const ICON_MAP = {
  LayoutDashboard,
  Brain,
  BookOpen,
  ClipboardCheck,
  Award,
  BarChart3,
  Settings,
  Users,
  Shield,
  Building2,
  Cog,
  Route,
  Bot,
  Crown,
  UsersRound,
  Briefcase,
  Grid3x3,
  Layers,
  ShieldCheck,
  GraduationCap,
  Target,
  Star,
  TrendingUp,
  GitBranch,
  LineChart,
  Building,
  UserCog,
  ScrollText,
  Plug,
  Network,
  Store,
  FileText,
  KeyRound,
} as const;

function isItemActive(pathname: string, href: string): boolean {
  const baseHref = href.split("?")[0];
  if (baseHref === "/dashboard") return pathname === "/dashboard";
  return pathname === baseHref || pathname.startsWith(`${baseHref}/`);
}

interface AppSidebarProps {
  className?: string;
  onNavigate?: () => void;
}

function NavLink({ item, onNavigate }: { item: SidebarNavItem; onNavigate?: () => void }) {
  const pathname = usePathname();
  const Icon = ICON_MAP[item.icon as keyof typeof ICON_MAP] ?? LayoutDashboard;
  const isActive = isItemActive(pathname, item.href);

  return (
    <Link
      href={item.href}
      prefetch={false}
      onClick={onNavigate}
      className={cn(
        "relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all",
        isActive
          ? "bg-sidebar-accent text-white shadow-sm"
          : "text-sidebar-muted hover:bg-white/5 hover:text-sidebar-foreground"
      )}
      aria-current={isActive ? "page" : undefined}
    >
      {isActive && (
        <motion.span
          layoutId="sidebar-active"
          className="absolute inset-0 rounded-lg bg-sidebar-accent"
          transition={{ type: "spring", stiffness: 380, damping: 30 }}
        />
      )}
      <Icon className="relative z-10 h-4 w-4 shrink-0" aria-hidden />
      <span className="relative z-10 flex-1 truncate">{item.label}</span>
      {item.badgeCount != null && item.badgeCount > 0 && (
        <Badge
          variant="secondary"
          className="relative z-10 h-5 min-w-5 justify-center bg-white/15 px-1.5 text-[10px] text-white"
        >
          {item.badgeCount > 99 ? "99+" : item.badgeCount}
        </Badge>
      )}
    </Link>
  );
}

export function AppSidebar({ className, onNavigate }: AppSidebarProps) {
  const { sections, flatItems, loading, isEmpty } = useResolvedNavigation();
  const { data: badgeData } = useNavBadges();
  const badgeMap = badgeData?.badges ?? {};

  if (loading) {
    return (
      <aside
        className={cn(
          "sidebar-gradient sticky top-0 flex h-screen w-[280px] shrink-0 flex-col border-r border-white/5 text-sidebar-foreground",
          className
        )}
      >
        <div className="flex h-[72px] shrink-0 items-center border-b border-white/10 px-5">
          <div className="h-10 w-10 animate-pulse rounded-xl bg-white/10" />
        </div>
        <div className="flex-1 space-y-3 p-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-9 animate-pulse rounded-lg bg-white/5" />
          ))}
        </div>
      </aside>
    );
  }

  const sectionsWithBadges = sections.map((group) => ({
    ...group,
    items: group.items.map((item) => ({
      ...item,
      badgeCount: badgeMap[item.id] ?? item.badgeCount,
    })),
  }));

  return (
    <aside
      className={cn(
        "sidebar-gradient sticky top-0 flex h-screen w-[280px] shrink-0 flex-col border-r border-white/5 text-sidebar-foreground",
        className
      )}
    >
      <div className="flex h-[72px] shrink-0 items-center gap-3 border-b border-white/10 px-5">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sidebar-accent font-bold text-white shadow-lg">
          RM
        </div>
        <div className="min-w-0">
          <Link href="/dashboard" prefetch={false} className="block truncate text-sm font-bold text-white">
            {BRAND.name}
          </Link>
          <p className="truncate text-[10px] font-medium uppercase tracking-wider text-sidebar-muted">
            Monitoring Simplified
          </p>
        </div>
      </div>
      <nav className="min-h-0 flex-1 space-y-4 overflow-y-auto p-3" aria-label="Main navigation">
        {isEmpty ? (
          <p className="px-3 text-xs text-sidebar-muted">No modules available.</p>
        ) : (
          sectionsWithBadges.map((group) => (
            <div key={group.section}>
              <p className="mb-1.5 px-3 text-[10px] font-bold uppercase tracking-widest text-sidebar-muted/80">
                {group.section}
              </p>
              <div className="space-y-0.5">
                {group.items.map((item) => (
                  <NavLink key={item.id} item={item} onNavigate={onNavigate} />
                ))}
              </div>
            </div>
          ))
        )}
      </nav>
      <div className="border-t border-white/10 p-4">
        <div className="rounded-xl bg-white/5 p-3">
          <p className="text-xs font-semibold text-sidebar-foreground">Enterprise RBAC</p>
          <p className="mt-1 text-[10px] leading-relaxed text-sidebar-muted">
            Role-based access enforced across all intelligence modules.
            {!isEmpty && (
              <span className="mt-1 block text-sidebar-muted/70">
                {flatItems.length} modules · {sectionsWithBadges.length} sections
              </span>
            )}
          </p>
        </div>
      </div>
    </aside>
  );
}
