"use client";

import { useMemo, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { LoadingState } from "@/components/enterprise/states";
import { AssignmentPolicyBanner } from "@/components/learning-admin/assignment-policy-banner";
import {
  useAdminCourseLevels,
  useAdminLearningCourses,
  useAssignableDepartments,
  useAssignableRoles,
  useAssignableTeams,
  useAssignableUsers,
  useAssignmentPreview,
  useCreateAssignment,
} from "@/hooks/use-learning-admin";
import { COURSE_LEVEL_TIER_LABELS } from "@/types/learning-admin";
import { ROUTES } from "@/constants/routes";
import type { AssignmentTargetType } from "@prisma/client";

const STEPS = ["Course", "Level", "Audience", "Due Date", "Review"] as const;
const AUDIENCE_TABS: AssignmentTargetType[] = ["USER", "DEPARTMENT", "TEAM", "ROLE", "ORGANIZATION"];

const AUDIENCE_LABELS: Record<AssignmentTargetType, string> = {
  USER: "One user",
  DEPARTMENT: "Department",
  TEAM: "Team",
  ROLE: "Role",
  ORGANIZATION: "Organization",
};

export function CourseAssignmentWizard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [step, setStep] = useState(0);
  const [courseId, setCourseId] = useState("");
  const [courseLevelId, setCourseLevelId] = useState("");
  const [targetType, setTargetType] = useState<AssignmentTargetType>("USER");
  const [targetId, setTargetId] = useState<string | null>(null);
  const [userSearch, setUserSearch] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [notes, setNotes] = useState("");
  const [priority, setPriority] = useState("");
  const [orgConfirmed, setOrgConfirmed] = useState(false);

  const { data: courses } = useAdminLearningCourses({ page: 1, pageSize: 50 });
  const { data: levels, isLoading: levelsLoading } = useAdminCourseLevels(courseId || null);
  const { data: users } = useAssignableUsers(userSearch);
  const { data: departments } = useAssignableDepartments();
  const { data: teams } = useAssignableTeams();
  const { data: roles } = useAssignableRoles();
  const preview = useAssignmentPreview();
  const create = useCreateAssignment();

  useEffect(() => {
    const preCourse = searchParams.get("courseId");
    const preLevel = searchParams.get("courseLevelId");
    if (preCourse) setCourseId(preCourse);
    if (preLevel) setCourseLevelId(preLevel);
  }, [searchParams]);

  const selectedCourse = courses?.items.find((c) => c.id === courseId);
  const selectedLevel = levels?.find((l) => l.id === courseLevelId);

  const canPreview = courseId && courseLevelId && (targetType === "ORGANIZATION" ? orgConfirmed : targetId);

  const handlePreview = () => {
    if (!canPreview) return;
    preview.mutate({
      courseId,
      courseLevelId,
      targetType,
      targetId: targetType === "ORGANIZATION" ? null : targetId,
    });
  };

  const handleConfirm = async () => {
    if (!preview.data || !dueDate) return;
    const result = await create.mutateAsync({
      courseId,
      courseLevelId,
      targetType,
      targetId: targetType === "ORGANIZATION" ? null : targetId,
      dueDate: new Date(dueDate).toISOString(),
      notes: notes || undefined,
      priority: priority || undefined,
    });
    router.push(ROUTES.adminLearningAssignment(result.id));
  };

  const stepContent = useMemo(() => {
    switch (step) {
      case 0:
        return (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Select a course first. You must choose a specific level in the next step — generic course
              assignment is not allowed.
            </p>
            <div className="grid gap-2 sm:grid-cols-2">
            {courses?.items.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => {
                  setCourseId(c.id);
                  setCourseLevelId("");
                }}
                className={`rounded-lg border p-3 text-left text-sm ${courseId === c.id ? "border-primary ring-1 ring-primary" : ""}`}
              >
                <p className="font-medium">{c.title}</p>
                <p className="text-xs text-muted-foreground">{c.category} · {c.adminStatus}</p>
              </button>
            ))}
            </div>
          </div>
        );
      case 1:
        if (levelsLoading) return <LoadingState rows={2} />;
        if (!levels?.length) {
          return (
            <p className="text-sm text-amber-700">
              This course has no levels configured. Add levels before assigning.
            </p>
          );
        }
        return (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Select exactly one level to assign (e.g. Basic, Intermediate, Advanced, Expert).
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
            {levels?.map((l) => (
              <Card
                key={l.id}
                className={courseLevelId === l.id ? "border-primary ring-1 ring-primary" : ""}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm">{l.name}</CardTitle>
                    <Badge>{COURSE_LEVEL_TIER_LABELS[l.tier]}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-1 text-xs text-muted-foreground">
                  <p>{l.description}</p>
                  <p>{l.durationHours}h · Pass {l.passingScore}%</p>
                  <Button size="sm" variant="outline" className="mt-2" onClick={() => setCourseLevelId(l.id)}>
                    Select
                  </Button>
                </CardContent>
              </Card>
            ))}
            </div>
          </div>
        );
      case 2:
        return (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Choose who receives this course level assignment.
            </p>
            <div className="flex flex-wrap gap-2">
              {AUDIENCE_TABS.map((t) => (
                <Button
                  key={t}
                  size="sm"
                  variant={targetType === t ? "default" : "outline"}
                  onClick={() => {
                    setTargetType(t);
                    setTargetId(null);
                    setOrgConfirmed(false);
                  }}
                >
                  {AUDIENCE_LABELS[t]}
                </Button>
              ))}
            </div>
            {targetType === "USER" && (
              <>
                <Input placeholder="Search employees…" value={userSearch} onChange={(e) => setUserSearch(e.target.value)} />
                <div className="max-h-64 space-y-1 overflow-y-auto">
                  {users?.map((u) => (
                    <button
                      key={u.id}
                      type="button"
                      className={`flex w-full flex-col rounded border px-3 py-2 text-left text-sm ${targetId === u.id ? "border-primary" : ""}`}
                      onClick={() => setTargetId(u.id)}
                    >
                      <span className="font-medium">{u.firstName} {u.lastName}</span>
                      <span className="text-xs text-muted-foreground">{u.email} · {u.departmentName}</span>
                    </button>
                  ))}
                </div>
              </>
            )}
            {targetType === "DEPARTMENT" &&
              departments?.map((d) => (
                <button
                  key={d.id}
                  type="button"
                  className={`flex w-full justify-between rounded border px-3 py-2 text-sm ${targetId === d.id ? "border-primary" : ""}`}
                  onClick={() => setTargetId(d.id)}
                >
                  <span>{d.name}</span>
                  <span className="text-muted-foreground">{d.employeeCount} employees</span>
                </button>
              ))}
            {targetType === "TEAM" &&
              teams?.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  className={`flex w-full justify-between rounded border px-3 py-2 text-sm ${targetId === t.id ? "border-primary" : ""}`}
                  onClick={() => setTargetId(t.id)}
                >
                  <span>{t.name}</span>
                  <span className="text-muted-foreground">{t.memberCount} members</span>
                </button>
              ))}
            {targetType === "ROLE" &&
              roles?.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  className={`flex w-full justify-between rounded border px-3 py-2 text-sm ${targetId === r.id ? "border-primary" : ""}`}
                  onClick={() => setTargetId(r.id)}
                >
                  <span>{r.name}</span>
                  <span className="text-muted-foreground">{r.userCount} users</span>
                </button>
              ))}
            {targetType === "ORGANIZATION" && (
              <Card className="border-amber-300 bg-amber-50/50">
                <CardContent className="space-y-2 pt-4 text-sm">
                  <p>Assign this course level to all active users in the organization.</p>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" checked={orgConfirmed} onChange={(e) => setOrgConfirmed(e.target.checked)} />
                    I confirm organization-wide assignment
                  </label>
                </CardContent>
              </Card>
            )}
          </div>
        );
      case 3:
        return (
          <div className="space-y-4 max-w-md">
            <div>
              <label htmlFor="dueDate" className="mb-1 block text-sm font-medium">Due date</label>
              <Input id="dueDate" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            </div>
            <div>
              <label htmlFor="priority" className="mb-1 block text-sm font-medium">Priority (optional)</label>
              <Input id="priority" value={priority} onChange={(e) => setPriority(e.target.value)} />
            </div>
            <div>
              <label htmlFor="notes" className="mb-1 block text-sm font-medium">Notes (optional)</label>
              <textarea
                id="notes"
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </div>
        );
      case 4:
        return (
          <div className="space-y-4">
            {!preview.data && (
              <Button onClick={handlePreview} disabled={!canPreview || preview.isPending}>
                Generate preview
              </Button>
            )}
            {preview.data && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Review & Confirm</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <p className="rounded-md border bg-muted/40 px-3 py-2 font-medium">
                    {selectedCourse?.title} +{" "}
                    {selectedLevel ? COURSE_LEVEL_TIER_LABELS[selectedLevel.tier] : "Level"} +{" "}
                    {preview.data.targetLabel} + Due{" "}
                    {dueDate ? new Date(dueDate).toLocaleDateString() : "—"}
                  </p>
                  <p><strong>Course:</strong> {selectedCourse?.title}</p>
                  <p><strong>Level:</strong> {selectedLevel?.name} ({selectedLevel ? COURSE_LEVEL_TIER_LABELS[selectedLevel.tier] : ""})</p>
                  <p><strong>Audience:</strong> {preview.data.targetLabel} ({AUDIENCE_LABELS[preview.data.targetType]})</p>
                  <p><strong>Users affected:</strong> {preview.data.usersAffected}</p>
                  <p><strong>Will assign:</strong> {preview.data.finalAssignableUsers.length}</p>
                  <p><strong>Due date:</strong> {dueDate}</p>
                  {preview.data.duplicateUsers.length > 0 && (
                    <p className="text-amber-600">Duplicates skipped: {preview.data.duplicateUsers.length}</p>
                  )}
                  {preview.data.inactiveUsersSkipped.length > 0 && (
                    <p className="text-muted-foreground">Inactive skipped: {preview.data.inactiveUsersSkipped.length}</p>
                  )}
                  <div className="max-h-40 overflow-y-auto rounded border p-2">
                    {preview.data.finalAssignableUsers.map((u) => (
                      <p key={u.id} className="text-xs">{u.firstName} {u.lastName} · {u.email}</p>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        );
      default:
        return null;
    }
  }, [step, courses, courseId, levels, levelsLoading, courseLevelId, targetType, userSearch, users, departments, teams, roles, targetId, orgConfirmed, dueDate, priority, notes, preview, canPreview, selectedCourse, selectedLevel]);

  return (
    <div className="space-y-6">
      <AssignmentPolicyBanner />
      <div className="flex flex-wrap gap-2">
        {STEPS.map((label, i) => (
          <Badge key={label} variant={i === step ? "default" : "outline"}>
            {i + 1}. {label}
          </Badge>
        ))}
      </div>
      {stepContent}
      <div className="flex justify-between">
        <Button variant="outline" disabled={step === 0} onClick={() => setStep((s) => s - 1)}>
          Back
        </Button>
        {step < STEPS.length - 1 ? (
          <Button
            onClick={() => {
              if (step === 2 && canPreview) preview.mutate({
                courseId,
                courseLevelId,
                targetType,
                targetId: targetType === "ORGANIZATION" ? null : targetId,
              });
              setStep((s) => s + 1);
            }}
            disabled={
              (step === 0 && !courseId) ||
              (step === 1 && !courseLevelId) ||
              (step === 2 && !canPreview) ||
              (step === 3 && !dueDate)
            }
          >
            Next
          </Button>
        ) : (
          <Button onClick={handleConfirm} disabled={!preview.data || create.isPending}>
            Confirm assignment
          </Button>
        )}
      </div>
    </div>
  );
}
