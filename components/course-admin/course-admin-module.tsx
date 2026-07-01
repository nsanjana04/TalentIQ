"use client";

import Link from "next/link";
import { useState } from "react";
import {
  BarChart3,
  BookOpen,
  ClipboardCheck,
  ExternalLink,
  GraduationCap,
  Layers,
  Loader2,
  Plus,
  Search,
  TrendingUp,
  Users,
} from "lucide-react";
import {
  useCourseAdminMutations,
  useCourseAnalytics,
  useCourseDetail,
  useCourseEnrollments,
  useCourseList,
  useCourseMeta,
  useCourseOverview,
  useCourseProgress,
} from "@/hooks/use-course-admin";
import {
  getExternalCourseNavigation,
  getExternalCourseProviderLabel,
  isExternalCourse,
} from "@/constants/external-courses";
import { OpenResourceButton } from "@/components/learning-content/open-resource-button";
import { StatPill } from "@/components/skills-admin/admin-ui";
import { CourseAnalyticsPanel } from "./course-analytics-panel";
import { CourseAssessmentAiPanel } from "./course-assessment-ai-panel";
import { ModuleAssessmentsPanel } from "./module-assessments-panel";
import { CourseBuilderPanel } from "./course-builder-panel";
import { CourseEnrollmentsPanel } from "./course-enrollments-panel";
import { CourseProgressPanel } from "./course-progress-panel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PermissionGate } from "@/components/rbac/permission-gate";
import { ROUTES } from "@/constants/routes";
import { cn } from "@/lib/utils";

type Tab = "builder" | "assessments" | "analytics" | "enrollments" | "progress";

const TABS: { id: Tab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: "builder", label: "Course Builder", icon: Layers },
  { id: "assessments", label: "Assessments", icon: ClipboardCheck },
  { id: "analytics", label: "Analytics", icon: BarChart3 },
  { id: "enrollments", label: "Enrollments", icon: Users },
  { id: "progress", label: "Progress", icon: TrendingUp },
];

export function CourseAdminModule() {
  const [search, setSearch] = useState("");
  const [published, setPublished] = useState("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("builder");
  const [createOpen, setCreateOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newInstructor, setNewInstructor] = useState("");

  const { data: overview } = useCourseOverview();
  const { data: meta } = useCourseMeta();
  const { data: list, isLoading: listLoading } = useCourseList({ search, published });
  const { data: course, isLoading: detailLoading } = useCourseDetail(selectedId);
  const { data: analytics, isLoading: analyticsLoading } = useCourseAnalytics(selectedId);
  const { data: enrollments, isLoading: enrollmentsLoading } = useCourseEnrollments(selectedId);
  const { data: progress, isLoading: progressLoading } = useCourseProgress(selectedId);
  const mutations = useCourseAdminMutations();

  async function handleCreate() {
    if (!newTitle.trim()) return;
    const created = await mutations.createCourse.mutateAsync({
      title: newTitle.trim(),
      instructorId: newInstructor || undefined,
      isPublished: false,
    });
    setCreateOpen(false);
    setNewTitle("");
    setNewInstructor("");
    setSelectedId((created as { id: string }).id);
  }

  return (
    <div className="space-y-6">
      {overview && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <StatPill label="Courses" value={overview.totalCourses} />
          <StatPill label="Published" value={overview.publishedCourses} />
          <StatPill label="Modules" value={overview.totalModules} />
          <StatPill label="Lessons" value={overview.totalLessons} />
          <StatPill label="Avg Completion" value={`${overview.avgCompletionRate}%`} />
        </div>
      )}

      <div className="flex flex-col gap-6 lg:flex-row">
        <Card className="w-full shrink-0 border-0 shadow-sm ring-1 ring-border/60 lg:w-80">
          <CardContent className="space-y-3 p-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold">Course Catalog</h2>
              <PermissionGate elementId="courses.manage.button">
                <Button size="sm" onClick={() => setCreateOpen(true)}>
                  <Plus className="h-4 w-4" />
                </Button>
              </PermissionGate>
            </div>

            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search courses…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8"
              />
            </div>

            <Select value={published} onChange={(e) => setPublished(e.target.value)}>
              <option value="all">All courses</option>
              <option value="true">Published only</option>
              <option value="false">Draft only</option>
            </Select>

            {listLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="max-h-[28rem] space-y-1 overflow-y-auto">
                {list?.items.map((c) => {
                  const external = isExternalCourse(c.slug);
                  const provider = getExternalCourseProviderLabel(c.slug);
                  return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setSelectedId(c.id)}
                    className={cn(
                      "w-full rounded-lg border px-3 py-2.5 text-left transition-colors",
                      selectedId === c.id
                        ? "border-primary/40 bg-primary/5"
                        : "border-transparent hover:bg-muted/50"
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium leading-tight">{c.title}</p>
                      <div className="flex shrink-0 flex-col items-end gap-1">
                        {external && provider ? (
                          <Badge
                            variant="outline"
                            className="text-[10px] border-violet-400/40 text-violet-700 dark:text-violet-300"
                          >
                            {provider}
                          </Badge>
                        ) : null}
                        <Badge
                          variant="outline"
                          className={cn(
                            "shrink-0 text-[10px]",
                            c.isPublished
                              ? "border-emerald-400/40 text-emerald-600"
                              : "text-muted-foreground"
                          )}
                        >
                          {c.isPublished ? "Live" : "Draft"}
                        </Badge>
                      </div>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {external
                        ? "External course · opens in browser"
                        : `${c.moduleCount} modules · ${c.lessonCount} lessons · ${c.enrollmentCount} enrolled`}
                    </p>
                  </button>
                  );
                })}
                {!list?.items.length && (
                  <p className="py-8 text-center text-sm text-muted-foreground">No courses found</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="min-w-0 flex-1 space-y-4">
          {selectedId && course ? (
            <>
              {(() => {
                const external = isExternalCourse(course.slug);
                const navigation = external ? getExternalCourseNavigation(course.slug) : null;
                const provider = getExternalCourseProviderLabel(course.slug);
                return (
              <>
              <Card className="border-primary/10 bg-gradient-to-r from-primary/5 to-transparent">
                <CardContent className="flex flex-wrap items-center justify-between gap-4 p-5">
                  <div>
                    <div className="flex items-center gap-2">
                      {external ? (
                        <GraduationCap className="h-5 w-5 text-primary" />
                      ) : (
                        <BookOpen className="h-5 w-5 text-primary" />
                      )}
                      <h2 className="text-lg font-bold">{course.title}</h2>
                      {external && provider ? (
                        <Badge variant="outline" className="border-violet-400/40 text-violet-700 dark:text-violet-300">
                          {provider}
                        </Badge>
                      ) : null}
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {external
                        ? (course.description ?? `Free ${provider} course — opens in your browser`)
                        : `${course.instructorName ?? "No instructor"} · ${course.stats.moduleCount} modules · ${course.stats.lessonCount} lessons · ${course.stats.completionRate}% completion`}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {external && navigation ? (
                      <>
                        <Button asChild size="sm">
                          <Link href={ROUTES.coursePlayer(course.id)}>Start course</Link>
                        </Button>
                        <OpenResourceButton
                          navigation={navigation}
                          label={`Open on ${provider ?? "Udemy"}`}
                          variant="outline"
                        />
                      </>
                    ) : (
                      <PermissionGate elementId="courses.manage.button">
                        <Button
                          size="sm"
                          variant={course.isPublished ? "outline" : "default"}
                          onClick={() =>
                            mutations.updateCourse.mutate({
                              courseId: course.id,
                              data: { isPublished: !course.isPublished },
                            })
                          }
                        >
                          {course.isPublished ? "Unpublish" : "Publish"}
                        </Button>
                      </PermissionGate>
                    )}
                  </div>
                </CardContent>
              </Card>

              {external && navigation ? (
                <Card>
                  <CardContent className="space-y-4 p-5">
                    <p className="text-sm text-muted-foreground">
                      This programming course is hosted on {provider}. Use the same in-browser flow as
                      Open Courses — launch Udemy in a new tab to watch lessons and practice.
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <Button asChild>
                        <Link href={ROUTES.coursePlayer(course.id)}>
                          View course details
                          <ExternalLink className="h-3.5 w-3.5" />
                        </Link>
                      </Button>
                      <OpenResourceButton navigation={navigation} label={`Open on ${provider ?? "Udemy"}`} />
                    </div>
                  </CardContent>
                </Card>
              ) : (
              <>
              <div className="flex flex-wrap gap-1">
                {TABS.map((t) => (
                  <Button
                    key={t.id}
                    size="sm"
                    variant={tab === t.id ? "default" : "outline"}
                    className="gap-2"
                    onClick={() => setTab(t.id)}
                  >
                    <t.icon className="h-4 w-4" />
                    {t.label}
                  </Button>
                ))}
              </div>

              {tab === "builder" && (
                <CourseBuilderPanel course={course} isLoading={detailLoading} />
              )}
              {tab === "assessments" && course && (
                <div className="space-y-6">
                  <ModuleAssessmentsPanel course={course} />
                  <CourseAssessmentAiPanel course={course} />
                </div>
              )}
              {tab === "analytics" && (
                <CourseAnalyticsPanel analytics={analytics} isLoading={analyticsLoading} />
              )}
              {tab === "enrollments" && (
                <CourseEnrollmentsPanel
                  enrollments={enrollments}
                  isLoading={enrollmentsLoading}
                />
              )}
              {tab === "progress" && (
                <CourseProgressPanel records={progress} isLoading={progressLoading} />
              )}
              </>
              )}
              </>
                );
              })()}
            </>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center gap-3 py-20 text-center">
                <BookOpen className="h-12 w-12 text-muted-foreground/40" />
                <p className="text-muted-foreground">
                  Select a course from the catalog to manage structure, analytics, enrollments, and
                  progress.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Course</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Input
              placeholder="Course title"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
            />
            <Select value={newInstructor} onChange={(e) => setNewInstructor(e.target.value)}>
              <option value="">Select instructor (optional)</option>
              {meta?.instructors.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.name}
                </option>
              ))}
            </Select>
            <Button
              className="w-full"
              onClick={handleCreate}
              disabled={mutations.createCourse.isPending}
            >
              Create Course
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
