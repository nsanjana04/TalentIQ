"use client";

import Link from "next/link";
import { useState } from "react";
import { AlertCircle, Loader2, Plus, Search, Trash2, UserPlus, Video } from "lucide-react";
import {
  useAdminLearningMutations,
  useAdminOpenCourses,
  useCompleteOpenCourse,
  useOpenCourseSummary,
  useOpenCourses,
} from "@/hooks/use-learning-content";
import { useAuth } from "@/hooks/use-auth";
import { OpenCourseAssignDialog } from "@/components/learning-admin/open-course-assign-dialog";
import type { LearningResourceType, OpenCourse, OpenCourseCategory } from "@/types/learning-content";
import { OpenResourceButton, ResourceTypeBadge } from "@/components/learning-content/open-resource-button";
import { ApiClientError } from "@/lib/api-client";
import { ROUTES } from "@/constants/routes";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Select } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  LEARNING_RESOURCE_TYPE_LABELS,
  OPEN_COURSE_CATEGORY_LABELS,
} from "@/lib/utils/learning-url";
import { cn } from "@/lib/utils";

const CATEGORIES = Object.keys(OPEN_COURSE_CATEGORY_LABELS) as OpenCourseCategory[];
const RESOURCE_TYPES = Object.keys(LEARNING_RESOURCE_TYPE_LABELS) as LearningResourceType[];

const EMPTY_FORM = {
  title: "",
  description: "",
  category: "GENERAL" as OpenCourseCategory,
  type: "YOUTUBE" as LearningResourceType,
  url: "",
  durationMinutes: "",
  isMandatory: false,
  isPublished: true,
};

type OpenCoursesAdminPanelProps = {
  mode?: "admin" | "view";
};

export function OpenCoursesAdminPanel({ mode = "admin" }: OpenCoursesAdminPanelProps) {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [mandatoryFilter, setMandatoryFilter] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<OpenCourse | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [assignCourse, setAssignCourse] = useState<OpenCourse | null>(null);

  const { user } = useAuth();
  const canSetOrgMandatory = user?.role === "ADMIN" || user?.role === "MANAGER";

  const filters = {
    search: search || undefined,
    category: categoryFilter || undefined,
    mandatory: mandatoryFilter,
  };

  const adminQuery = useAdminOpenCourses(filters);
  const viewQuery = useOpenCourses(filters);
  const { data: courses, isLoading, isError, error } =
    mode === "admin" ? adminQuery : viewQuery;
  const { data: summary } = useOpenCourseSummary();
  const complete = useCompleteOpenCourse();
  const mutations = useAdminLearningMutations();

  const mandatoryPending =
    summary && summary.mandatoryTotal > summary.mandatoryCompleted
      ? summary.mandatoryTotal - summary.mandatoryCompleted
      : 0;

  function openCreate() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setSaveError(null);
    setDialogOpen(true);
  }

  function openEdit(course: OpenCourse) {
    setEditing(course);
    setForm({
      title: course.title,
      description: course.description ?? "",
      category: course.category,
      type: course.type,
      url: course.url,
      durationMinutes: course.durationMinutes?.toString() ?? "",
      isMandatory: course.isMandatory,
      isPublished: course.isPublished,
    });
    setSaveError(null);
    setDialogOpen(true);
  }

  async function handleSave(e?: React.FormEvent) {
    e?.preventDefault();
    setSaveError(null);

    if (!form.title.trim() || !form.url.trim()) {
      setSaveError("Title and URL are required.");
      return;
    }

    const payload = {
      title: form.title.trim(),
      description: form.description.trim() || undefined,
      category: form.category,
      type: form.type,
      url: form.url.trim(),
      durationMinutes: form.durationMinutes ? Number(form.durationMinutes) : undefined,
      isMandatory: form.isMandatory,
      isPublished: form.isPublished,
      sortOrder: 0,
    };

    try {
      if (editing) {
        await mutations.updateOpenCourse.mutateAsync({ id: editing.id, body: payload });
      } else {
        await mutations.createOpenCourse.mutateAsync(payload);
      }
      setDialogOpen(false);
    } catch (err) {
      setSaveError(
        err instanceof ApiClientError
          ? err.message
          : "Failed to save course. If using Docker, run: npx prisma db push"
      );
    }
  }

  return (
    <div className="space-y-4">
      {mode === "view" && summary && summary.total > 0 && (
        <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-transparent">
          <CardContent className="space-y-4 p-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h3 className="font-semibold">Company Training Progress</h3>
                <p className="text-sm text-muted-foreground">
                  {summary.mandatoryCompleted}/{summary.mandatoryTotal} mandatory completed
                  {mandatoryPending > 0 && (
                    <span className="ml-2 text-amber-600 dark:text-amber-400">
                      · {mandatoryPending} required remaining
                    </span>
                  )}
                </p>
              </div>
              <div className="min-w-[10rem]">
                <Progress
                  value={
                    summary.mandatoryTotal
                      ? Math.round((summary.mandatoryCompleted / summary.mandatoryTotal) * 100)
                      : 0
                  }
                  className="h-2"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[200px] flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Search open courses…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="w-40">
          <option value="">All categories</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {OPEN_COURSE_CATEGORY_LABELS[c]}
            </option>
          ))}
        </Select>
        <Select value={mandatoryFilter} onChange={(e) => setMandatoryFilter(e.target.value)} className="w-36">
          <option value="all">All</option>
          <option value="true">Mandatory</option>
          <option value="false">Optional</option>
        </Select>
        {mode === "admin" && (
          <Button type="button" onClick={openCreate} className="gap-2">
            <Plus className="h-4 w-4" />
            Add Open Course
          </Button>
        )}
      </div>

      {isError && (
        <p className="text-sm text-destructive">
          Could not load courses
          {error instanceof ApiClientError ? `: ${error.message}` : "."} Please refresh and try
          again.
        </p>
      )}

      {isLoading ? (
        <Card>
          <CardContent className="flex items-center justify-center gap-2 py-16 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            Loading open courses…
          </CardContent>
        </Card>
      ) : !courses?.length ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
            <Video className="h-10 w-10 text-muted-foreground/50" />
            <p className="text-muted-foreground">
              {mode === "admin"
                ? "Add product, HR, security, or general training videos. Mark some as mandatory for all employees."
                : "No courses assigned to you yet. Your administrator will assign training when ready."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 lg:grid-cols-2">
          {courses.map((course) => {
            const done = course.completionStatus === "COMPLETED";
            const required =
              mode === "view" && (course.isMandatory || course.isAssigned) && !done;
            return (
            <Card
              key={course.id}
              className={cn(
                course.isMandatory && "border-amber-400/40",
                done && mode === "view" && "border-emerald-400/30"
              )}
            >
              <CardContent className="space-y-3 p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold">{course.title}</h3>
                      {course.isMandatory && (
                        <Badge className="gap-1 bg-amber-500/15 text-amber-700 dark:text-amber-300">
                          <AlertCircle className="h-3 w-3" />
                          Mandatory
                        </Badge>
                      )}
                      {required && course.isAssigned && !course.isMandatory && (
                        <Badge className="gap-1 bg-amber-500/15 text-amber-700 dark:text-amber-300">
                          <AlertCircle className="h-3 w-3" />
                          Assigned
                        </Badge>
                      )}
                      {done && mode === "view" && (
                        <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300">
                          Completed
                        </Badge>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="outline">{OPEN_COURSE_CATEGORY_LABELS[course.category]}</Badge>
                      <ResourceTypeBadge type={course.type} provider={course.provider} />
                      {mode === "admin" && (
                        <Badge variant={course.isPublished ? "default" : "secondary"}>
                          {course.isPublished ? "Published" : "Draft"}
                        </Badge>
                      )}
                      {(course.assignmentCount ?? 0) > 0 && (
                        <Badge variant="outline">{course.assignmentCount} assigned</Badge>
                      )}
                    </div>
                  </div>
                  {course.durationMinutes && (
                    <span className="text-xs text-muted-foreground">{course.durationMinutes} min</span>
                  )}
                </div>
                {course.description && (
                  <p className="text-sm text-muted-foreground">{course.description}</p>
                )}
                <div className="flex flex-wrap gap-2">
                  <Button asChild size="sm">
                    <Link href={ROUTES.openCoursePlayer(course.id)}>
                      {mode === "admin" ? "View course" : done ? "Review course" : "Start course"}
                    </Link>
                  </Button>
                  <OpenResourceButton navigation={course.navigation} label="Open link" variant="outline" />
                  {mode === "view" && course.completionStatus !== "COMPLETED" && (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={complete.isPending}
                      onClick={() => complete.mutate(course.id)}
                    >
                      {complete.isPending ? "Saving…" : "Mark complete"}
                    </Button>
                  )}
                  {mode === "admin" && (
                    <>
                      <Button type="button" size="sm" variant="outline" onClick={() => setAssignCourse(course)}>
                        <UserPlus className="mr-1 h-4 w-4" />
                        Assign course level
                      </Button>
                      <Button type="button" size="sm" variant="outline" onClick={() => openEdit(course)}>
                        Edit
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="text-destructive"
                        disabled={mutations.deleteOpenCourse.isPending}
                        onClick={() => mutations.deleteOpenCourse.mutate(course.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          );
          })}
        </div>
      )}

      {mode === "admin" && (
      <>
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Open Course" : "Add Open Course"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-3">
            <div>
              <label className="text-sm font-medium">Title</label>
              <Input
                className="mt-1"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Security Awareness Training"
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium">Video / course URL</label>
              <Input
                className="mt-1"
                type="url"
                value={form.url}
                onChange={(e) => setForm({ ...form, url: e.target.value })}
                placeholder="https://youtube.com/watch?v=... or any training link"
                required
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="text-sm font-medium">Category</label>
                <Select
                  className="mt-1"
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value as OpenCourseCategory })}
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {OPEN_COURSE_CATEGORY_LABELS[c]}
                    </option>
                  ))}
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Content type</label>
                <Select
                  className="mt-1"
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value as LearningResourceType })}
                >
                  {RESOURCE_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {LEARNING_RESOURCE_TYPE_LABELS[t]}
                    </option>
                  ))}
                </Select>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Duration (minutes)</label>
              <Input
                className="mt-1"
                type="number"
                min={0}
                value={form.durationMinutes}
                onChange={(e) => setForm({ ...form, durationMinutes: e.target.value })}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Description</label>
              <textarea
                className={cn(
                  "mt-1 flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                )}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.isMandatory}
                disabled={!canSetOrgMandatory}
                onChange={(e) => setForm({ ...form, isMandatory: e.target.checked })}
              />
              Mandatory for all employees
              {!canSetOrgMandatory && (
                <span className="text-xs text-muted-foreground">
                  (Use Assign to require this for your team)
                </span>
              )}
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.isPublished}
                onChange={(e) => setForm({ ...form, isPublished: e.target.checked })}
              />
              Published
            </label>
            {saveError && <p className="text-sm text-destructive">{saveError}</p>}
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={mutations.createOpenCourse.isPending || mutations.updateOpenCourse.isPending}
              >
                {mutations.createOpenCourse.isPending || mutations.updateOpenCourse.isPending
                  ? "Saving…"
                  : editing
                    ? "Save changes"
                    : "Add course"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <OpenCourseAssignDialog
        course={assignCourse}
        open={Boolean(assignCourse)}
        onOpenChange={(next) => {
          if (!next) setAssignCourse(null);
        }}
      />
      </>
      )}
    </div>
  );
}
