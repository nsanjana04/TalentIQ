"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LoadingState } from "@/components/enterprise/states";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import type { AssignmentTargetType } from "@prisma/client";
import { ApiClientError } from "@/lib/errors/api-client-error";
import type { FigmaRoadmapCourse } from "./figma-roadmap-data";
import { FigmaRoadmapEmployeeAssignFields } from "./figma-roadmap-employee-assign-fields";
import {
  resolveAdminCourseForRoadmap,
  resolveLevelIdByNumber,
} from "./figma-roadmap-assign-utils";

const GROUP_AUDIENCE_TABS: AssignmentTargetType[] = [
  "DEPARTMENT",
  "TEAM",
  "ROLE",
  "ORGANIZATION",
];

const AUDIENCE_LABELS: Record<AssignmentTargetType, string> = {
  USER: "Employee",
  DEPARTMENT: "Department",
  TEAM: "Team",
  ROLE: "Role",
  ORGANIZATION: "Organization",
};

type AssignMode = "employee" | "group";

interface FigmaRoadmapAssignDialogProps {
  course: FigmaRoadmapCourse | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode?: AssignMode;
  initialLevelNumber?: number;
}

function getErrorMessage(error: unknown): string {
  if (error instanceof ApiClientError) return error.message;
  if (error instanceof Error) return error.message;
  if (typeof error === "object" && error !== null && "message" in error) {
    return String((error as { message: unknown }).message);
  }
  return "Something went wrong. Please try again.";
}

export function FigmaRoadmapAssignDialog({
  course,
  open,
  onOpenChange,
  mode = "employee",
  initialLevelNumber,
}: FigmaRoadmapAssignDialogProps) {
  const [assignMode, setAssignMode] = useState<AssignMode>(mode);
  const [adminCourseId, setAdminCourseId] = useState("");
  const [courseLevelId, setCourseLevelId] = useState("");
  const [targetType, setTargetType] = useState<AssignmentTargetType>(
    mode === "employee" ? "USER" : "DEPARTMENT"
  );
  const [targetId, setTargetId] = useState<string | null>(null);
  const [roleFilterId, setRoleFilterId] = useState("");
  const [userSearch, setUserSearch] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [orgConfirmed, setOrgConfirmed] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const {
    data: courses,
    isLoading: coursesLoading,
    isError: coursesError,
    error: coursesLoadError,
    refetch: refetchCourses,
  } = useAdminLearningCourses({ page: 1, pageSize: 100 }, { enabled: open });
  const { data: levels, isLoading: levelsLoading } = useAdminCourseLevels(
    adminCourseId || null
  );
  const { data: users, isLoading: usersLoading } = useAssignableUsers(userSearch);
  const { data: departments, isLoading: departmentsLoading } = useAssignableDepartments();
  const { data: teams, isLoading: teamsLoading } = useAssignableTeams();
  const { data: roles, isLoading: rolesLoading } = useAssignableRoles();
  const preview = useAssignmentPreview();
  const create = useCreateAssignment();

  const previewResetRef = useRef(preview.reset);
  previewResetRef.current = preview.reset;

  useEffect(() => {
    if (!open || !course) return;
    setAssignMode(mode);
    setAdminCourseId("");
    setCourseLevelId("");
    setTargetType(mode === "employee" ? "USER" : "DEPARTMENT");
    setTargetId(null);
    setRoleFilterId("");
    setUserSearch("");
    setDueDate("");
    setOrgConfirmed(false);
    setSubmitted(false);
    setFormError(null);
    previewResetRef.current();
  }, [open, course?.slug, mode]);

  useEffect(() => {
    if (!open || !course || !courses?.items.length) return;
    const match = resolveAdminCourseForRoadmap(courses.items, course);
    if (match) setAdminCourseId(match.id);
  }, [open, course, courses?.items]);

  useEffect(() => {
    if (!open || !levels?.length) return;
    const levelId = resolveLevelIdByNumber(levels, initialLevelNumber);
    if (levelId) setCourseLevelId(levelId);
  }, [open, initialLevelNumber, levels]);

  const selectedAdminCourse = courses?.items.find((c) => c.id === adminCourseId);
  const selectedLevel = levels?.find((l) => l.id === courseLevelId);
  const selectedEmployee = users?.find((user) => user.id === targetId);

  const employeeReady =
    assignMode === "employee" && targetType === "USER" && Boolean(roleFilterId) && Boolean(targetId);

  const groupReady =
    assignMode === "group" &&
    (targetType === "ORGANIZATION" ? orgConfirmed : Boolean(targetId));

  const canPreview = Boolean(adminCourseId && courseLevelId && (employeeReady || groupReady));

  const audienceLabel = useMemo(() => {
    if (assignMode === "employee" && selectedEmployee) {
      return `${selectedEmployee.firstName} ${selectedEmployee.lastName} (${selectedEmployee.roleName ?? "Employee"})`;
    }
    if (targetType === "ORGANIZATION") return "Organization";
    if (preview.data?.targetLabel) return preview.data.targetLabel;
    if (assignMode === "group" && targetId) {
      if (targetType === "DEPARTMENT") return departments?.find((d) => d.id === targetId)?.name;
      if (targetType === "TEAM") return teams?.find((t) => t.id === targetId)?.name;
      if (targetType === "ROLE") return roles?.find((r) => r.id === targetId)?.name;
    }
    return null;
  }, [
    assignMode,
    selectedEmployee,
    targetType,
    preview.data?.targetLabel,
    targetId,
    departments,
    teams,
    roles,
  ]);

  const summaryLine = useMemo(() => {
    const courseName = course?.title ?? selectedAdminCourse?.title;
    if (!courseName || !selectedLevel || !dueDate || !audienceLabel) return null;
    return `${courseName} + ${COURSE_LEVEL_TIER_LABELS[selectedLevel.tier]} + ${audienceLabel} + Due ${new Date(dueDate).toLocaleDateString()}`;
  }, [course?.title, selectedAdminCourse?.title, selectedLevel, dueDate, audienceLabel]);

  const clearPreview = () => {
    setFormError(null);
    previewResetRef.current();
  };

  const handlePreview = async () => {
    if (!canPreview) return;
    setFormError(null);
    try {
      await preview.mutateAsync({
        courseId: adminCourseId,
        courseLevelId,
        targetType,
        targetId: targetType === "ORGANIZATION" ? null : targetId,
      });
    } catch (error) {
      setFormError(getErrorMessage(error));
    }
  };

  const handleConfirm = async () => {
    if (!canPreview || !dueDate) return;
    setFormError(null);
    try {
      if (!preview.data) {
        await preview.mutateAsync({
          courseId: adminCourseId,
          courseLevelId,
          targetType,
          targetId: targetType === "ORGANIZATION" ? null : targetId,
        });
      }
      await create.mutateAsync({
        courseId: adminCourseId,
        courseLevelId,
        targetType,
        targetId: targetType === "ORGANIZATION" ? null : targetId,
        dueDate: new Date(`${dueDate}T12:00:00`).toISOString(),
      });
      setSubmitted(true);
    } catch (error) {
      setFormError(getErrorMessage(error));
    }
  };

  const mutationError =
    formError ||
    (preview.isError ? getErrorMessage(preview.error) : null) ||
    (create.isError ? getErrorMessage(create.error) : null);

  return (
    <Dialog open={open} onOpenChange={onOpenChange} className="max-w-2xl">
      <DialogContent onClose={() => onOpenChange(false)} className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {assignMode === "employee" ? "Assign course to employee" : "Assign course to group"}
          </DialogTitle>
          <DialogDescription>
            {course
              ? `Assign ${course.title} — pick level, ${assignMode === "employee" ? "employee" : "audience"}, and due date.`
              : "Assign a course from the roadmap."}
          </DialogDescription>
        </DialogHeader>

        <p className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900">
          <strong>Rule:</strong> Course + Level + Audience + Due Date (e.g. Python + Basic + Engineering + Due Date)
        </p>

        {submitted ? (
          <div className="space-y-4 py-4">
            <p className="rounded-lg border border-[#DCFCE7] bg-[#F0FDF4] px-4 py-3 text-sm text-[#166534]">
              Course assigned successfully.
              {summaryLine && (
                <>
                  <br />
                  <span className="font-medium">{summaryLine}</span>
                </>
              )}
            </p>
            <Button onClick={() => onOpenChange(false)}>Close</Button>
          </div>
        ) : (
          <div className="space-y-5">
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                type="button"
                variant={assignMode === "employee" ? "default" : "outline"}
                onClick={() => {
                  setAssignMode("employee");
                  setTargetType("USER");
                  setTargetId(null);
                  setRoleFilterId("");
                  clearPreview();
                }}
              >
                Assign course to employee
              </Button>
              <Button
                size="sm"
                type="button"
                variant={assignMode === "group" ? "default" : "outline"}
                onClick={() => {
                  setAssignMode("group");
                  setTargetType("DEPARTMENT");
                  setTargetId(null);
                  setRoleFilterId("");
                  clearPreview();
                }}
              >
                Assign course to group
              </Button>
            </div>

            <div className="rounded-lg border border-[#E5E7EB] bg-[#F9FAFB] px-4 py-3">
              <p className="text-xs font-medium uppercase tracking-wide text-[#6B7280]">
                Course
              </p>
              <p className="mt-1 text-sm font-semibold text-[#111827]">{course?.title}</p>
              {selectedLevel && (
                <p className="mt-1 text-xs text-[#6B7280]">
                  Level: {COURSE_LEVEL_TIER_LABELS[selectedLevel.tier]}
                </p>
              )}
              {coursesLoading && (
                <p className="mt-2 text-xs text-[#6B7280]">Loading course catalog…</p>
              )}
              {coursesError && (
                <div className="mt-2 space-y-2">
                  <p className="text-sm text-red-600">
                    {coursesLoadError instanceof ApiClientError
                      ? coursesLoadError.message
                      : "Could not load course catalog."}
                  </p>
                  <Button type="button" size="sm" variant="outline" onClick={() => void refetchCourses()}>
                    Retry
                  </Button>
                </div>
              )}
              {!coursesLoading && !coursesError && !adminCourseId && courses?.items.length ? (
                <div className="mt-3 space-y-2">
                  <p className="text-xs text-amber-700">
                    Could not auto-link this course. Select the matching catalog course:
                  </p>
                  <select
                    id="adminCourse"
                    value={adminCourseId}
                    onChange={(e) => {
                      setAdminCourseId(e.target.value);
                      setCourseLevelId("");
                      clearPreview();
                    }}
                    className="flex h-10 w-full rounded-md border border-input bg-white px-3 text-sm"
                  >
                    <option value="">Select catalog course…</option>
                    {courses.items.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.title}
                      </option>
                    ))}
                  </select>
                </div>
              ) : null}
              {!coursesLoading && !coursesError && !courses?.items.length ? (
                <p className="mt-2 text-sm text-amber-700">
                  No catalog courses found. Run{" "}
                  <code className="rounded bg-[#F3F4F6] px-1">npx tsx scripts/seed-learning-admin-only.ts</code>.
                </p>
              ) : null}
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium text-[#111827]">
                Level <span className="text-red-500">*</span>
              </p>
              {levelsLoading || coursesLoading ? (
                <LoadingState rows={1} />
              ) : !adminCourseId ? (
                <p className="text-sm text-[#6B7280]">Waiting for course catalog…</p>
              ) : !levels?.length ? (
                <p className="text-sm text-amber-700">This course has no levels configured.</p>
              ) : (
                <div className="grid gap-2 sm:grid-cols-2">
                  {levels.map((level) => (
                    <button
                      key={level.id}
                      type="button"
                      onClick={() => {
                        setCourseLevelId(level.id);
                        clearPreview();
                      }}
                      className={`rounded-lg border px-3 py-2 text-left text-sm ${
                        courseLevelId === level.id
                          ? "border-[#2563EB] ring-1 ring-[#2563EB]"
                          : "border-[#E5E7EB]"
                      }`}
                    >
                      <span className="font-medium">{level.name}</span>
                      <span className="mt-0.5 block text-xs text-[#6B7280]">
                        {COURSE_LEVEL_TIER_LABELS[level.tier]} · {level.durationHours}h
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {assignMode === "employee" ? (
              rolesLoading || usersLoading ? (
                <LoadingState rows={2} />
              ) : (
                <FigmaRoadmapEmployeeAssignFields
                  roles={roles}
                  users={users}
                  roleFilterId={roleFilterId}
                  onRoleFilterChange={(roleId) => {
                    setRoleFilterId(roleId);
                    setTargetId(null);
                    clearPreview();
                  }}
                  targetId={targetId}
                  onEmployeeSelect={(userId) => {
                    setTargetId(userId);
                    clearPreview();
                  }}
                  userSearch={userSearch}
                  onUserSearchChange={setUserSearch}
                />
              )
            ) : (
              <div className="space-y-3">
                <p className="text-sm font-medium text-[#111827]">
                  Audience <span className="text-red-500">*</span>
                </p>
                <div className="flex flex-wrap gap-2">
                  {GROUP_AUDIENCE_TABS.map((type) => (
                    <Button
                      key={type}
                      size="sm"
                      type="button"
                      variant={targetType === type ? "default" : "outline"}
                      onClick={() => {
                        setTargetType(type);
                        setTargetId(null);
                        setOrgConfirmed(false);
                        clearPreview();
                      }}
                    >
                      {AUDIENCE_LABELS[type]}
                    </Button>
                  ))}
                </div>

                {departmentsLoading || teamsLoading || rolesLoading ? (
                  <LoadingState rows={2} />
                ) : null}

                {targetType === "DEPARTMENT" &&
                  departments?.map((dept) => (
                    <button
                      key={dept.id}
                      type="button"
                      className={`flex w-full justify-between rounded border px-3 py-2 text-sm ${
                        targetId === dept.id ? "border-[#2563EB]" : "border-[#E5E7EB]"
                      }`}
                      onClick={() => {
                        setTargetId(dept.id);
                        clearPreview();
                      }}
                    >
                      <span>{dept.name}</span>
                      <span className="text-[#6B7280]">{dept.employeeCount} employees</span>
                    </button>
                  ))}

                {targetType === "TEAM" &&
                  teams?.map((team) => (
                    <button
                      key={team.id}
                      type="button"
                      className={`flex w-full justify-between rounded border px-3 py-2 text-sm ${
                        targetId === team.id ? "border-[#2563EB]" : "border-[#E5E7EB]"
                      }`}
                      onClick={() => {
                        setTargetId(team.id);
                        clearPreview();
                      }}
                    >
                      <span>{team.name}</span>
                      <span className="text-[#6B7280]">{team.memberCount} members</span>
                    </button>
                  ))}

                {targetType === "ROLE" &&
                  roles?.map((role) => (
                    <button
                      key={role.id}
                      type="button"
                      className={`flex w-full justify-between rounded border px-3 py-2 text-sm ${
                        targetId === role.id ? "border-[#2563EB]" : "border-[#E5E7EB]"
                      }`}
                      onClick={() => {
                        setTargetId(role.id);
                        clearPreview();
                      }}
                    >
                      <span>{role.name}</span>
                      <span className="text-[#6B7280]">{role.userCount} users</span>
                    </button>
                  ))}

                {targetType === "ORGANIZATION" && (
                  <label className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50/50 px-3 py-3 text-sm">
                    <input
                      type="checkbox"
                      checked={orgConfirmed}
                      onChange={(e) => {
                        setOrgConfirmed(e.target.checked);
                        clearPreview();
                      }}
                      className="mt-0.5"
                    />
                    <span>I confirm organization-wide course assignment for all active users.</span>
                  </label>
                )}
              </div>
            )}

            <div className="space-y-2">
              <label htmlFor="roadmapDueDate" className="text-sm font-medium text-[#111827]">
                Due date <span className="text-red-500">*</span>
              </label>
              <Input
                id="roadmapDueDate"
                type="date"
                min={new Date().toISOString().slice(0, 10)}
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>

            {summaryLine && (
              <p className="rounded-md border bg-[#EFF6FF] px-3 py-2 text-sm font-medium text-[#1E40AF]">
                {summaryLine}
              </p>
            )}

            {preview.data && (
              <p className="text-xs text-[#6B7280]">
                {preview.data.finalAssignableUsers.length} employee(s) will receive this course
                {preview.data.duplicateUsers.length > 0 &&
                  ` (${preview.data.duplicateUsers.length} duplicate(s) skipped)`}
                .
              </p>
            )}

            {mutationError && (
              <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {mutationError}
              </p>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              {!preview.data ? (
                <Button
                  type="button"
                  disabled={!canPreview || !dueDate || preview.isPending}
                  onClick={() => void handlePreview()}
                >
                  Preview
                </Button>
              ) : (
                <Button
                  type="button"
                  disabled={!dueDate || create.isPending}
                  onClick={() => void handleConfirm()}
                >
                  Assign course
                </Button>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
