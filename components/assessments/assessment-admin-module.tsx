"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  ClipboardCheck,
  Database,
  History,
  Loader2,
  Play,
} from "lucide-react";
import { useUrlTab } from "@/hooks/use-url-tab";
import { useAssessmentOverview } from "@/hooks/use-assessments";
import { StatPill } from "@/components/skills-admin/admin-ui";
import { AssessmentAttemptsPanel } from "./assessment-attempts-panel";
import { AssessmentCatalogPanel } from "./assessment-catalog-panel";
import { MyAssessmentsPanel } from "./my-assessments-panel";
import { QuestionBankPanel } from "./question-bank-panel";
import { Button } from "@/components/ui/button";
import { usePermissions } from "@/hooks/use-permissions";
import { Permission } from "@/lib/rbac/permissions";
import { cn } from "@/lib/utils";

type Tab = "take" | "catalog" | "bank" | "attempts";

const VALID_TABS = new Set<Tab>(["take", "catalog", "bank", "attempts"]);

const TABS: {
  id: Tab;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  managerOnly?: boolean;
}[] = [
  { id: "take", label: "My Assessments", icon: Play },
  { id: "catalog", label: "Catalog", icon: ClipboardCheck, managerOnly: true },
  { id: "bank", label: "Question Bank", icon: Database, managerOnly: true },
  { id: "attempts", label: "Attempts & Results", icon: History, managerOnly: true },
];

function AssessmentAdminModuleContent() {
  const { can } = usePermissions();
  const isManager = can(Permission.ASSESSMENTS_MANAGE);
  const searchParams = useSearchParams();
  const hasDeepLink = Boolean(searchParams.get("assessmentId"));
  const defaultTab: Tab = hasDeepLink ? "take" : isManager ? "catalog" : "take";
  const [tab, setTab] = useUrlTab(VALID_TABS, defaultTab);

  const { data: overview } = useAssessmentOverview({ enabled: isManager && tab === "catalog" });

  const visibleTabs = TABS.filter((t) => !t.managerOnly || isManager);

  return (
    <div className="space-y-6">
      {isManager && overview && tab === "catalog" && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <StatPill label="Assessments" value={overview.totalAssessments} />
          <StatPill label="Published" value={overview.publishedAssessments} />
          <StatPill label="Questions" value={overview.totalQuestions} />
          <StatPill label="Bank Items" value={overview.bankQuestions} />
          <StatPill label="Pass Rate" value={`${overview.passRate}%`} />
        </div>
      )}

      <div className="flex flex-wrap gap-1">
        {visibleTabs.map((t) => (
          <Button
            key={t.id}
            size="sm"
            variant={tab === t.id ? "default" : "outline"}
            className={cn("gap-2", tab === t.id && "shadow-sm")}
            onClick={() => setTab(t.id)}
          >
            <t.icon className="h-4 w-4" />
            {t.label}
          </Button>
        ))}
      </div>

      {tab === "take" && <MyAssessmentsPanel />}
      {tab === "catalog" && isManager && <AssessmentCatalogPanel />}
      {tab === "bank" && isManager && <QuestionBankPanel />}
      {tab === "attempts" && isManager && <AssessmentAttemptsPanel />}
    </div>
  );
}

export function AssessmentAdminModule() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          Loading assessments…
        </div>
      }
    >
      <AssessmentAdminModuleContent />
    </Suspense>
  );
}
