"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ChevronRight, Loader2 } from "lucide-react";
import { RoadmapPathwaySection } from "./roadmap-pathway-section";
import { useRoadmapPathway } from "@/hooks/use-roadmap-pathway";
import { LearningContentModule } from "@/components/learning-content/learning-content-module";
import { FigmaStatsRow } from "@/components/learning-roadmap/figma/figma-stats-row";
import { PathwayOverviewDrawer } from "@/components/learning-roadmap/pathway-overview-drawer";
import type { RoadmapPathwayCourse } from "@/types/roadmap-pathway";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useUrlTab } from "@/hooks/use-url-tab";
import { useAuth } from "@/hooks/use-auth";
import { usePermissions } from "@/hooks/use-permissions";
import { RoleSlug } from "@/constants/role-slugs";
import { isLearningManagerRole } from "@/constants/learning-manager-roles";
import { Permission } from "@/lib/rbac/permissions";
import { ROLE_LABELS } from "@/constants/roles";

type Tab = "roadmap" | "learning-content";

const TABS: { id: Tab; label: string }[] = [
  { id: "roadmap", label: "Roadmap" },
  { id: "learning-content", label: "Learning Content" },
];

const VALID_TABS = new Set<Tab>(TABS.map((t) => t.id));
const TAB_ALIASES: Partial<Record<string, Tab>> = {
  programs: "roadmap",
  career: "roadmap",
  timeline: "roadmap",
};

function LearningRoadmapModuleContent() {
  const searchParams = useSearchParams();
  const [tab, setTab] = useUrlTab(VALID_TABS, "roadmap", TAB_ALIASES);
  const [overviewOpen, setOverviewOpen] = useState(false);
  const [focusCourseSlug, setFocusCourseSlug] = useState<string | null>(null);

  const { user } = useAuth();
  const { can } = usePermissions();
  const { data: pathwayOverview } = useRoadmapPathway();

  const isSystemAdmin = user?.role === RoleSlug.ADMIN;
  const canManageLearningContent = Boolean(
    user?.role && isLearningManagerRole(user.role) && can(Permission.COURSES_MANAGE)
  );
  const isLearningContentAdmin = isSystemAdmin || canManageLearningContent;

  useEffect(() => {
    const skillId = searchParams.get("skillId");
    if (skillId) setFocusCourseSlug(skillId);
  }, [searchParams]);

  const handleNextAction = useCallback((courseSlug: string) => {
    setTab("roadmap");
    setFocusCourseSlug(courseSlug);
  }, [setTab]);

  const focusCourse = useMemo(
    () => pathwayOverview?.courses.find((course) => course.slug === focusCourseSlug) ?? null,
    [pathwayOverview?.courses, focusCourseSlug]
  );

  return (
    <div className="space-y-5">
      <div className="px-6">
        <FigmaStatsRow onNextAction={handleNextAction} />
      </div>

      {user?.role && (
        <div className="px-6">
          <Badge variant="outline" className="text-xs font-normal text-[#6B7280]">
            {ROLE_LABELS[user.role as RoleSlug]} view
            {isLearningContentAdmin ? " · Learning content management enabled" : ""}
          </Badge>
        </div>
      )}

      {tab === "roadmap" && (
        <div className="border-b border-[#E5E7EB] bg-white px-6 py-4">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-[#6B7280]">
            Current pathway
          </p>
          <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
            <p className="text-base font-semibold text-[#111827]">
              {pathwayOverview?.pathwayName ?? "IT & Software Learning Path"}
            </p>
            <p className="text-[13px] text-[#6B7280]">
              Your last activity: {pathwayOverview?.lastActivityLabel ?? "—"} ·{" "}
              {pathwayOverview?.coursesCompleted ?? 0} completed ·{" "}
              {pathwayOverview?.coursesInProgress ?? 0} in progress
            </p>
            <button
              type="button"
              className="inline-flex items-center gap-0.5 text-[13px] font-medium text-[#2563EB] hover:underline"
              onClick={() => setOverviewOpen(true)}
            >
              View pathway details
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      <div className="border-b border-[#E5E7EB] px-6">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            className={cn(
              "mr-6 border-b-2 bg-transparent py-3 text-sm transition-colors",
              tab === t.id
                ? "border-[#2563EB] font-semibold text-[#2563EB]"
                : "border-transparent font-normal text-[#6B7280] hover:text-[#374151]"
            )}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "roadmap" && (
        <div className="space-y-4 px-6">
          <RoadmapPathwaySection
            focusCourse={focusCourse}
            onFocusHandled={() => setFocusCourseSlug(null)}
          />
        </div>
      )}

      {tab === "learning-content" && (
        <div className="px-6">
          <LearningContentModule
            context="pathways"
            resourceMode={isSystemAdmin ? "admin" : "view"}
            openCourseMode={canManageLearningContent ? "admin" : "view"}
          />
        </div>
      )}

      <PathwayOverviewDrawer
        overview={pathwayOverview}
        open={overviewOpen}
        onOpenChange={setOverviewOpen}
      />
    </div>
  );
}

export function LearningRoadmapModule() {
  return (
    <Suspense
      fallback={
        <Card>
          <CardContent className="flex items-center justify-center gap-2 py-16 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            Loading…
          </CardContent>
        </Card>
      }
    >
      <LearningRoadmapModuleContent />
    </Suspense>
  );
}
