"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import type {
  CreateLearningResourceInput,
  CreateOpenCourseInput,
  UpdateLearningResourceInput,
  UpdateOpenCourseInput,
} from "@/lib/validations/learning-content";
import type {
  AssignLearningResourceResult,
  AssignOpenCourseResult,
  AssignableEmployeesResponse,
  LearningContentOverview,
  LearningResource,
  LearningResourceAssignmentSummary,
  OpenCourse,
  OpenCourseAssignmentSummary,
  OpenCoursePlayerData,
  PublishedLearningContentOverview,
} from "@/types/learning-content";
import type { AssignLearningResourceInput, AssignOpenCourseInput } from "@/lib/validations/learning-content";

export const ADMIN_LEARNING_OVERVIEW_KEY = ["admin", "learning", "overview"] as const;
export const ADMIN_LEARNING_RESOURCES_KEY = ["admin", "learning", "resources"] as const;
export const ADMIN_LEARNING_ASSIGNABLE_USERS_KEY = ["admin", "learning", "assignable-users"] as const;
export const ADMIN_LEARNING_OPEN_COURSES_KEY = ["admin", "learning", "open-courses"] as const;
export const LEARNING_OPEN_COURSES_KEY = ["learning", "open-courses"] as const;
export const LEARNING_OPEN_COURSE_PLAYER_KEY = ["learning", "open-courses", "player"] as const;
export const LEARNING_OPEN_COURSES_SUMMARY_KEY = ["learning", "open-courses", "summary"] as const;
export const LEARNING_RESOURCES_KEY = ["learning", "resources"] as const;
export const LEARNING_CONTENT_OVERVIEW_KEY = ["learning", "content", "overview"] as const;

type ResourceFilters = { search?: string; type?: string; published?: string };
type OpenCourseFilters = { search?: string; category?: string; mandatory?: string; published?: string };

function toQueryParams(filters?: Record<string, string | undefined>) {
  if (!filters) return undefined;
  const params: Record<string, string> = {};
  for (const [key, value] of Object.entries(filters)) {
    if (value !== undefined && value !== "") params[key] = value;
  }
  return Object.keys(params).length > 0 ? params : undefined;
}

export function useAdminLearningOverview(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ADMIN_LEARNING_OVERVIEW_KEY,
    queryFn: () => apiClient.get<LearningContentOverview>("/api/admin/learning/overview"),
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    enabled: options?.enabled !== false,
  });
}

export function useAdminLearningResources(filters?: ResourceFilters) {
  return useQuery({
    queryKey: [...ADMIN_LEARNING_RESOURCES_KEY, filters],
    queryFn: () =>
      apiClient.get<LearningResource[]>("/api/admin/learning/resources", {
        params: toQueryParams(filters),
      }),
  });
}

export function useAdminOpenCourses(filters?: OpenCourseFilters) {
  return useQuery({
    queryKey: [...ADMIN_LEARNING_OPEN_COURSES_KEY, filters],
    queryFn: () =>
      apiClient.get<OpenCourse[]>("/api/admin/learning/open-courses", {
        params: toQueryParams(filters),
      }),
  });
}

export function useAdminLearningMutations() {
  const queryClient = useQueryClient();

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ADMIN_LEARNING_OVERVIEW_KEY });
    queryClient.invalidateQueries({ queryKey: ADMIN_LEARNING_RESOURCES_KEY });
    queryClient.invalidateQueries({ queryKey: ADMIN_LEARNING_OPEN_COURSES_KEY });
    queryClient.invalidateQueries({ queryKey: LEARNING_OPEN_COURSES_KEY });
    queryClient.invalidateQueries({ queryKey: LEARNING_OPEN_COURSES_SUMMARY_KEY });
    queryClient.invalidateQueries({ queryKey: LEARNING_RESOURCES_KEY });
    queryClient.invalidateQueries({ queryKey: LEARNING_CONTENT_OVERVIEW_KEY });
    queryClient.invalidateQueries({ queryKey: LEARNING_OPEN_COURSE_PLAYER_KEY });
  };

  return {
    createResource: useMutation({
      mutationFn: (body: CreateLearningResourceInput) =>
        apiClient.post<LearningResource>("/api/admin/learning/resources", body),
      onSuccess: invalidate,
    }),
    updateResource: useMutation({
      mutationFn: ({ id, body }: { id: string; body: UpdateLearningResourceInput }) =>
        apiClient.patch<LearningResource>(`/api/admin/learning/resources/${id}`, body),
      onSuccess: invalidate,
    }),
    deleteResource: useMutation({
      mutationFn: (id: string) => apiClient.delete(`/api/admin/learning/resources/${id}`),
      onSuccess: invalidate,
    }),
    uploadResourceFile: useMutation({
      mutationFn: (file: File) => {
        const formData = new FormData();
        formData.append("file", file);
        return apiClient.upload<{
          url: string;
          type: import("@/types/learning-content").LearningResourceType;
          provider: string;
          fileName: string;
          size: number;
        }>("/api/admin/learning/upload", formData);
      },
    }),
    createOpenCourse: useMutation({
      mutationFn: (body: CreateOpenCourseInput) =>
        apiClient.post<OpenCourse>("/api/admin/learning/open-courses", body),
      onSuccess: invalidate,
    }),
    updateOpenCourse: useMutation({
      mutationFn: ({ id, body }: { id: string; body: UpdateOpenCourseInput }) =>
        apiClient.patch<OpenCourse>(`/api/admin/learning/open-courses/${id}`, body),
      onSuccess: invalidate,
    }),
    deleteOpenCourse: useMutation({
      mutationFn: (id: string) => apiClient.delete(`/api/admin/learning/open-courses/${id}`),
      onSuccess: invalidate,
    }),
    assignOpenCourse: useMutation({
      mutationFn: ({ courseId, body }: { courseId: string; body: AssignOpenCourseInput }) =>
        apiClient.post<AssignOpenCourseResult>(
          `/api/admin/learning/open-courses/${courseId}/assign`,
          body
        ),
      onSuccess: invalidate,
    }),
    assignLearningResource: useMutation({
      mutationFn: ({ resourceId, body }: { resourceId: string; body: AssignLearningResourceInput }) =>
        apiClient.post<AssignLearningResourceResult>(
          `/api/admin/learning/resources/${resourceId}/assign`,
          body
        ),
      onSuccess: invalidate,
    }),
  };
}

export function useAssignableEmployees(enabled = true) {
  return useQuery({
    queryKey: ADMIN_LEARNING_ASSIGNABLE_USERS_KEY,
    queryFn: () =>
      apiClient.get<AssignableEmployeesResponse>("/api/admin/learning/assignable-users"),
    enabled,
  });
}

export function useOpenCourseAssignments(courseId: string | null) {
  return useQuery({
    queryKey: [...ADMIN_LEARNING_OPEN_COURSES_KEY, courseId, "assignments"],
    queryFn: () =>
      apiClient.get<OpenCourseAssignmentSummary[]>(
        `/api/admin/learning/open-courses/${courseId}/assign`
      ),
    enabled: Boolean(courseId),
  });
}

export function useResourceAssignments(resourceId: string | null) {
  return useQuery({
    queryKey: [...ADMIN_LEARNING_RESOURCES_KEY, resourceId, "assignments"],
    queryFn: () =>
      apiClient.get<LearningResourceAssignmentSummary[]>(
        `/api/admin/learning/resources/${resourceId}/assign`
      ),
    enabled: Boolean(resourceId),
  });
}

export function useOpenCourses(filters?: OpenCourseFilters) {
  return useQuery({
    queryKey: [...LEARNING_OPEN_COURSES_KEY, filters],
    queryFn: () =>
      apiClient.get<OpenCourse[]>("/api/learning/open-courses", {
        params: toQueryParams(filters),
      }),
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}

export function useLearningResources(filters?: ResourceFilters) {
  return useQuery({
    queryKey: [...LEARNING_RESOURCES_KEY, filters],
    queryFn: () =>
      apiClient.get<LearningResource[]>("/api/learning/resources", {
        params: toQueryParams(filters),
      }),
  });
}

export function useLearningContentOverview(enabled = true) {
  return useQuery({
    queryKey: LEARNING_CONTENT_OVERVIEW_KEY,
    queryFn: () =>
      apiClient.get<PublishedLearningContentOverview>("/api/learning/content/overview"),
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    enabled,
  });
}

export function useOpenCoursePlayer(courseId: string) {
  return useQuery({
    queryKey: [...LEARNING_OPEN_COURSE_PLAYER_KEY, courseId],
    queryFn: () =>
      apiClient.get<OpenCoursePlayerData>(`/api/learning/open-courses/${courseId}/player`),
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    enabled: Boolean(courseId),
  });
}

export function useOpenCourseSummary() {
  return useQuery({
    queryKey: LEARNING_OPEN_COURSES_SUMMARY_KEY,
    queryFn: () =>
      apiClient.get<import("@/types/learning-content").OpenCourseLibrarySummary>(
        "/api/learning/open-courses/summary"
      ),
  });
}

export function useCompleteOpenCourse() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (courseId: string) =>
      apiClient.post(`/api/learning/open-courses/${courseId}/complete`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: LEARNING_OPEN_COURSES_KEY });
      queryClient.invalidateQueries({ queryKey: LEARNING_OPEN_COURSES_SUMMARY_KEY });
      queryClient.invalidateQueries({ queryKey: LEARNING_OPEN_COURSE_PLAYER_KEY });
    },
  });
}
