"use client";

import { useMemo, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import {
  Award,
  BookOpen,
  Building2,
  LayoutDashboard,
  User,
  Users,
} from "lucide-react";
import { useAnalyticsScopeFilters } from "@/hooks/use-analytics-scope";
import {
  ANALYTICS_TABS,
  type AnalyticsTab,
  isAnalyticsTab,
} from "@/lib/analytics/canonical-analytics-tabs";
import { Select } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { AnalyticsHubFilters } from "@/hooks/use-analytics-hub";
import {
  CertificateCompliancePanel,
  DepartmentPanel,
  EmployeePanel,
  ExecutivePanel,
  LearningProgressPanel,
  OrganizationPanel,
  TeamPanel,
} from "./analytics-panels";

const TAB_META: Record<
  AnalyticsTab,
  { label: string; icon: React.ComponentType<{ className?: string }> }
> = {
  executive: { label: "Executive", icon: LayoutDashboard },
  organization: { label: "Organization", icon: Building2 },
  department: { label: "Department", icon: Building2 },
  team: { label: "Team", icon: Users },
  employee: { label: "Employee", icon: User },
  learning: { label: "Learning Progress", icon: BookOpen },
  compliance: { label: "Certificate Compliance", icon: Award },
};

interface AnalyticsHubModuleProps {
  defaultTab?: AnalyticsTab;
  visibleTabs?: AnalyticsTab[];
  title?: string;
  description?: string;
}

export function AnalyticsHubModule({
  defaultTab = "executive",
  visibleTabs,
  title = "Workforce Analytics",
  description = "Organization, department, team, and employee intelligence for learning and compliance.",
}: AnalyticsHubModuleProps = {}) {
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");
  const allowedTabs = useMemo(() => {
    const ids = visibleTabs ?? [...ANALYTICS_TABS];
    return ids.map((id) => ({ id, ...TAB_META[id] }));
  }, [visibleTabs]);
  const allowedTabIds = useMemo(() => new Set<string>(allowedTabs.map((t) => t.id)), [allowedTabs]);
  const resolvedDefault =
    defaultTab && allowedTabIds.has(defaultTab) ? defaultTab : allowedTabs[0]?.id ?? "executive";
  const initialTab =
    tabParam && isAnalyticsTab(tabParam) && allowedTabIds.has(tabParam)
      ? tabParam
      : resolvedDefault;
  const [tab, setTab] = useState<AnalyticsTab>(initialTab);
  const [departmentId, setDepartmentId] = useState("");
  const [teamId, setTeamId] = useState("");

  useEffect(() => {
    if (tabParam && isAnalyticsTab(tabParam) && allowedTabIds.has(tabParam)) {
      setTab(tabParam);
    }
  }, [tabParam, allowedTabIds]);

  const { departments, teams } = useAnalyticsScopeFilters();

  const filters: AnalyticsHubFilters = useMemo(
    () => ({
      departmentId: departmentId || undefined,
      teamId: teamId || undefined,
    }),
    [departmentId, teamId]
  );

  const scopedTeams = teams.filter((t) => !departmentId || t.departmentId === departmentId);
  const showFilters = !["executive", "organization"].includes(tab);

  return (
    <div className="command-gradient min-h-full space-y-6 p-4 lg:p-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </header>
      <div className="flex flex-wrap gap-2" role="tablist" aria-label="Analytics views">
        {allowedTabs.map((t) => {
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

      {showFilters && (
        <div className="flex flex-wrap gap-3">
          <Select
            value={departmentId}
            onChange={(e) => {
              setDepartmentId(e.target.value);
              setTeamId("");
            }}
            className="w-48"
          >
            <option value="">All departments</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </Select>
          <Select
            value={teamId}
            onChange={(e) => setTeamId(e.target.value)}
            className="w-48"
            disabled={!departmentId && scopedTeams.length === 0}
          >
            <option value="">All teams</option>
            {scopedTeams.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </Select>
        </div>
      )}

      {tab === "executive" && <ExecutivePanel />}
      {tab === "organization" && <OrganizationPanel />}
      {tab === "department" && <DepartmentPanel filters={filters} />}
      {tab === "team" && <TeamPanel filters={filters} />}
      {tab === "employee" && <EmployeePanel filters={filters} />}
      {tab === "learning" && <LearningProgressPanel filters={filters} />}
      {tab === "compliance" && <CertificateCompliancePanel filters={filters} />}
    </div>
  );
}
