"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import type {
  AdminCourseLevel,
  AdminCourseSummary,
  AssignmentBatchDetail,
  AssignmentBatchSummary,
  AssignmentPreviewResult,
  AssignableDepartment,
  AssignableRole,
  AssignableTeam,
  AssignableUser,
  DepartmentProgressRow,
  LearningAdminDashboard,
  LearningProgressRow,
  MyCourseAssignment,
} from "@/types/learning-admin";
import type {
  AssignmentListQuery,
  AdminCourseListQuery,
  CreateAssignmentInput,
} from "@/lib/validations/learning-admin";

export const LEARNING_ADMIN_KEY = ["admin", "learning"] as const;

export function useLearningAdminDashboard() {
  return useQuery({
    queryKey: [...LEARNING_ADMIN_KEY, "dashboard"],
    queryFn: () => apiClient.get<LearningAdminDashboard>("/api/admin/learning/dashboard"),
  });
}

export function useAdminLearningCourses(
  query: AdminCourseListQuery,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: [...LEARNING_ADMIN_KEY, "courses", query],
    queryFn: () =>
      apiClient.get<{ items: AdminCourseSummary[]; total: number }>(
        "/api/admin/learning/courses",
        { params: { page: String(query.page), pageSize: String(query.pageSize) } }
      ),
    enabled: options?.enabled ?? true,
  });
}

export function useAdminCourseLevels(courseId: string | null) {
  return useQuery({
    queryKey: [...LEARNING_ADMIN_KEY, "courses", courseId, "levels"],
    queryFn: () =>
      apiClient.get<AdminCourseLevel[]>(`/api/admin/learning/courses/${courseId}/levels`),
    enabled: !!courseId,
  });
}

export function useAssignableUsers(search?: string) {
  return useQuery({
    queryKey: [...LEARNING_ADMIN_KEY, "assignable-users", search],
    queryFn: () =>
      apiClient.get<AssignableUser[]>("/api/admin/learning/assignable-users", {
        params: { ...(search ? { search } : {}), format: "assignment" },
      }),
  });
}

export function useAssignableDepartments() {
  return useQuery({
    queryKey: [...LEARNING_ADMIN_KEY, "departments"],
    queryFn: () => apiClient.get<AssignableDepartment[]>("/api/admin/learning/departments"),
  });
}

export function useAssignableTeams() {
  return useQuery({
    queryKey: [...LEARNING_ADMIN_KEY, "teams"],
    queryFn: () => apiClient.get<AssignableTeam[]>("/api/admin/learning/teams"),
  });
}

export function useAssignableRoles() {
  return useQuery({
    queryKey: [...LEARNING_ADMIN_KEY, "roles"],
    queryFn: () => apiClient.get<AssignableRole[]>("/api/admin/learning/roles"),
  });
}

export function useAssignmentPreview() {
  return useMutation({
    mutationFn: (input: {
      courseId: string;
      courseLevelId: string;
      targetType: string;
      targetId?: string | null;
    }) =>
      apiClient.post<AssignmentPreviewResult>(
        "/api/admin/learning/assignments/preview",
        input
      ),
  });
}

export function useCreateAssignment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateAssignmentInput) =>
      apiClient.post<AssignmentBatchDetail>("/api/admin/learning/assignments", input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: LEARNING_ADMIN_KEY });
    },
  });
}

export function useAdminAssignments(query: AssignmentListQuery) {
  return useQuery({
    queryKey: [...LEARNING_ADMIN_KEY, "assignments", query],
    queryFn: () =>
      apiClient.get<{ items: AssignmentBatchSummary[]; total: number }>(
        "/api/admin/learning/assignments",
        { params: Object.fromEntries(
            Object.entries(query).map(([key, value]) => [
              key,
              value === undefined || value === null ? undefined : String(value),
            ])
          ) }
      ),
  });
}

export function useAdminAssignmentDetail(id: string | null) {
  return useQuery({
    queryKey: [...LEARNING_ADMIN_KEY, "assignments", id],
    queryFn: () =>
      apiClient.get<AssignmentBatchDetail>(`/api/admin/learning/assignments/${id}`),
    enabled: !!id,
  });
}

export function useLearningProgress() {
  return useQuery({
    queryKey: [...LEARNING_ADMIN_KEY, "progress"],
    queryFn: () =>
      apiClient.get<LearningProgressRow[]>("/api/admin/learning/progress"),
  });
}

export function useDepartmentProgress() {
  return useQuery({
    queryKey: [...LEARNING_ADMIN_KEY, "department-progress"],
    queryFn: () =>
      apiClient.get<DepartmentProgressRow[]>("/api/admin/learning/department-progress"),
  });
}

export function useOverdueAssignments() {
  return useQuery({
    queryKey: [...LEARNING_ADMIN_KEY, "overdue"],
    queryFn: () => apiClient.get<unknown[]>("/api/admin/learning/overdue"),
  });
}

export function useMyCourseAssignments() {
  return useQuery({
    queryKey: ["learning", "my-assignments"],
    queryFn: () => apiClient.get<MyCourseAssignment[]>("/api/learning/my-assignments"),
  });
}

export function useAssignmentMutations() {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: LEARNING_ADMIN_KEY });

  const remind = useMutation({
    mutationFn: (id: string) =>
      apiClient.post(`/api/admin/learning/assignments/${id}/remind`),
    onSuccess: invalidate,
  });

  const cancel = useMutation({
    mutationFn: (id: string) =>
      apiClient.post(`/api/admin/learning/assignments/${id}/cancel`),
    onSuccess: invalidate,
  });

  const extendDueDate = useMutation({
    mutationFn: ({ id, dueDate }: { id: string; dueDate: string }) =>
      apiClient.patch<AssignmentBatchDetail>(`/api/admin/learning/assignments/${id}`, {
        dueDate,
      }),
    onSuccess: invalidate,
  });

  return { remind, cancel, extendDueDate };
}
