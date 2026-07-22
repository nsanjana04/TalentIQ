"use client";

import { useState } from "react";
import { BookOpen, Link2, Video } from "lucide-react";
import { useAdminLearningOverview, useLearningContentOverview } from "@/hooks/use-learning-content";
import { StatPill } from "@/components/skills-admin/admin-ui";
import { ResourceLibraryPanel } from "@/components/learning-admin/resource-library-panel";
import { OpenCoursesAdminPanel } from "@/components/learning-admin/open-courses-admin-panel";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Tab = "resources" | "open-courses";

const TABS: { id: Tab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: "resources", label: "Resource Library", icon: Link2 },
  { id: "open-courses", label: "Open Courses", icon: Video },
];

type LearningContentModuleProps = {
  /** Embedded in Learning Pathways — adjusts copy; modes still follow role props. */
  context?: "pathways" | "default";
  /** Resource Library: admin UI for system admin; others see assigned items. */
  resourceMode?: "admin" | "view";
  /** Open Courses: learning managers can manage; employees see assigned. */
  openCourseMode?: "admin" | "view";
  /** @deprecated Use resourceMode / openCourseMode instead */
  mode?: "admin" | "view";
};

function tabDescription(
  tab: Tab,
  activeMode: "admin" | "view",
  isPathwaysContext: boolean
): string {
  if (tab === "resources") {
    return activeMode === "admin"
      ? "External links — YouTube, Udemy, Coursera, Microsoft Learn, PDF, docs"
      : isPathwaysContext
        ? "Curated links assigned to you — YouTube, Udemy, docs, and more"
        : "Browse resources assigned to you";
  }
  return activeMode === "admin"
    ? "Company videos — product, HR, security, general (mandatory optional)"
    : isPathwaysContext
      ? "Company training videos and mandatory completions assigned to you"
      : "Browse open courses assigned to you";
}

export function LearningContentModule({
  context = "default",
  resourceMode,
  openCourseMode,
  mode = "admin",
}: LearningContentModuleProps) {
  const isPathwaysContext = context === "pathways";
  const resolvedResourceMode = resourceMode ?? mode;
  const resolvedOpenCourseMode = openCourseMode ?? mode;
  const [tab, setTab] = useState<Tab>("resources");

  const isAdminMode = resolvedResourceMode === "admin" || resolvedOpenCourseMode === "admin";
  const isViewMode = resolvedResourceMode === "view" && resolvedOpenCourseMode === "view";
  const { data: adminOverview } = useAdminLearningOverview({ enabled: isAdminMode });
  const { data: viewOverview } = useLearningContentOverview(isViewMode);

  const activeMode = tab === "resources" ? resolvedResourceMode : resolvedOpenCourseMode;

  const overview =
    activeMode === "admin" && adminOverview
      ? adminOverview
      : viewOverview
        ? {
            resourceCount: viewOverview.resourceCount,
            publishedResources: viewOverview.resourceCount,
            openCourseCount: viewOverview.openCourseCount,
            publishedOpenCourses: viewOverview.openCourseCount,
            mandatoryOpenCourses: viewOverview.mandatoryOpenCourses,
          }
        : activeMode === "admin"
          ? adminOverview
          : undefined;

  const compactStats = isViewMode;

  return (
    <div className="space-y-6">
      {overview && (
        <div className={cn("grid gap-3", compactStats ? "sm:grid-cols-3" : "sm:grid-cols-2 lg:grid-cols-5")}>
          {compactStats ? (
            <>
              <StatPill label="Assigned resources" value={overview.publishedResources} />
              <StatPill label="Open courses" value={overview.publishedOpenCourses} />
              <StatPill label="Mandatory" value={overview.mandatoryOpenCourses} />
            </>
          ) : (
            <>
              <StatPill
                label="Resources"
                value={activeMode === "admin" ? overview.resourceCount : overview.publishedResources}
              />
              <StatPill
                label="Published Resources"
                value={overview.publishedResources ?? overview.resourceCount}
              />
              <StatPill
                label="Open Courses"
                value={activeMode === "admin" ? overview.openCourseCount : overview.publishedOpenCourses}
              />
              <StatPill
                label="Published Courses"
                value={overview.publishedOpenCourses ?? overview.openCourseCount}
              />
              <StatPill label="Mandatory" value={overview.mandatoryOpenCourses} />
            </>
          )}
        </div>
      )}

      <div className="rounded-xl border bg-card/50 p-4">
        <div className="mb-4 flex items-start gap-3">
          <BookOpen className="mt-0.5 h-5 w-5 text-primary" />
          <div>
            <h2 className="font-semibold">
              {isAdminMode
                ? "Learning content management"
                : isPathwaysContext
                  ? "Your assigned content"
                  : "Assigned learning content"}
            </h2>
            <p className="text-sm text-muted-foreground">
              {isAdminMode
                ? isPathwaysContext
                  ? "Manage resource links and open courses for your organization. Add, edit, assign, and publish content from here."
                  : "Manage external resource links and company open courses for your organization."
                : isPathwaysContext
                  ? "Browse resources and open courses assigned to you by your administrator."
                  : "Browse learning content assigned to you by your administrator."}
            </p>
          </div>
        </div>

        {isAdminMode && (
          <div className="mb-4 rounded-lg border border-[#E5E7EB] bg-[#F8FAFC] px-4 py-3 text-sm text-[#6B7280]">
            <p className="font-medium text-[#111827]">Admin permissions on this tab</p>
            <ul className="mt-2 list-inside list-disc space-y-0.5 text-xs">
              {resolvedResourceMode === "admin" && (
                <>
                  <li>Add, edit, and delete resources in the Resource Library</li>
                  <li>Upload files or link external URLs (YouTube, Udemy, docs)</li>
                  <li>Assign resources to course levels and employees</li>
                </>
              )}
              {resolvedOpenCourseMode === "admin" && (
                <>
                  <li>Add, edit, and delete open company courses</li>
                  <li>Mark courses as mandatory and assign to teams</li>
                </>
              )}
            </ul>
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          {TABS.map((t) => (
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
        <p className="mt-2 text-xs text-muted-foreground">
          {tabDescription(tab, activeMode, isPathwaysContext)}
        </p>
      </div>

      {tab === "resources" && <ResourceLibraryPanel mode={resolvedResourceMode} />}
      {tab === "open-courses" && <OpenCoursesAdminPanel mode={resolvedOpenCourseMode} />}
    </div>
  );
}
