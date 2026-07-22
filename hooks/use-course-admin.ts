"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import type {
  CourseAdminOverview,
  CourseAnalytics,
  CourseDetail,
  CourseLinkedAssessment,
  CourseListItem,
  CourseMeta,
  EnrollmentRecord,
  GenerateCourseAssessmentQuestionsResult,
  ProgressRecord,
} from "@/types/course-admin";
import type {
  CreateCourseInput,
  CreateLessonInput,
  CreateModuleInput,
  GenerateCourseAssessmentQuestionsInput,
} from "@/lib/validations/course-admin";

export const COURSE_ADMIN_KEY = ["courses", "admin"] as const;

type ListParams = { search?: string; published?: string; page?: number };

export function useCourseOverview() {
  return useQuery({
    queryKey: [...COURSE_ADMIN_KEY, "overview"],
    queryFn: () => apiClient.get<CourseAdminOverview>("/api/courses/overview"),
    staleTime: 60_000,
  });
}

export function useCourseMeta() {
  return useQuery({
    queryKey: [...COURSE_ADMIN_KEY, "meta"],
    queryFn: () => apiClient.get<CourseMeta>("/api/courses/meta"),
    staleTime: 5 * 60_000,
  });
}

export function useCourseList(params?: ListParams) {
  return useQuery({
    queryKey: [...COURSE_ADMIN_KEY, "list", params],
    queryFn: () =>
      apiClient.get<{
        items: CourseListItem[];
        total: number;
        page: number;
        pageSize: number;
        totalPages: number;
      }>("/api/courses", {
        params: {
          ...(params?.search && { search: params.search }),
          ...(params?.published && { published: params.published }),
          ...(params?.page && { page: String(params.page) }),
        },
      }),
    staleTime: 30_000,
  });
}

export function useCourseDetail(courseId: string | null) {
  return useQuery({
    queryKey: [...COURSE_ADMIN_KEY, "detail", courseId],
    queryFn: () => apiClient.get<CourseDetail>(`/api/courses/${courseId}`),
    enabled: !!courseId,
    staleTime: 15_000,
  });
}

export function useCourseAnalytics(courseId: string | null) {
  return useQuery({
    queryKey: [...COURSE_ADMIN_KEY, "analytics", courseId],
    queryFn: () => apiClient.get<CourseAnalytics>(`/api/courses/${courseId}/analytics`),
    enabled: !!courseId,
    staleTime: 30_000,
  });
}

export function useCourseEnrollments(courseId: string | null) {
  return useQuery({
    queryKey: [...COURSE_ADMIN_KEY, "enrollments", courseId],
    queryFn: () => apiClient.get<EnrollmentRecord[]>(`/api/courses/${courseId}/enrollments`),
    enabled: !!courseId,
    staleTime: 30_000,
  });
}

export function useCourseProgress(courseId: string | null) {
  return useQuery({
    queryKey: [...COURSE_ADMIN_KEY, "progress", courseId],
    queryFn: () => apiClient.get<ProgressRecord[]>(`/api/courses/${courseId}/progress`),
    enabled: !!courseId,
    staleTime: 30_000,
  });
}

export function useCourseAssessments(courseId: string | null) {
  return useQuery({
    queryKey: [...COURSE_ADMIN_KEY, "assessments", courseId],
    queryFn: () =>
      apiClient.get<{ assessments: CourseLinkedAssessment[]; aiEnabled: boolean }>(
        `/api/courses/${courseId}/assessments`
      ),
    enabled: !!courseId,
    staleTime: 30_000,
  });
}

export function useGenerateCourseAssessmentQuestions(courseId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: GenerateCourseAssessmentQuestionsInput) =>
      apiClient.post<GenerateCourseAssessmentQuestionsResult>(
        `/api/courses/${courseId}/generate-assessment-questions`,
        body
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [...COURSE_ADMIN_KEY, "assessments", courseId] });
      qc.invalidateQueries({ queryKey: ["assessments"] });
    },
  });
}

function useInvalidateCourses() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: COURSE_ADMIN_KEY });
}

export function useCourseAdminMutations() {
  const invalidate = useInvalidateCourses();

  const createCourse = useMutation({
    mutationFn: (data: CreateCourseInput) => apiClient.post("/api/courses", data),
    onSuccess: invalidate,
  });

  const updateCourse = useMutation({
    mutationFn: ({ courseId, data }: { courseId: string; data: Partial<CreateCourseInput> }) =>
      apiClient.patch(`/api/courses/${courseId}`, data),
    onSuccess: invalidate,
  });

  const deleteCourse = useMutation({
    mutationFn: (courseId: string) => apiClient.delete(`/api/courses/${courseId}`),
    onSuccess: invalidate,
  });

  const createModule = useMutation({
    mutationFn: ({ courseId, data }: { courseId: string; data: CreateModuleInput }) =>
      apiClient.post(`/api/courses/${courseId}/modules`, data),
    onSuccess: invalidate,
  });

  const deleteModule = useMutation({
    mutationFn: (moduleId: string) => apiClient.delete(`/api/courses/modules/${moduleId}`),
    onSuccess: invalidate,
  });

  const createLesson = useMutation({
    mutationFn: ({ moduleId, data }: { moduleId: string; data: CreateLessonInput }) =>
      apiClient.post(`/api/courses/modules/${moduleId}/lessons`, data),
    onSuccess: invalidate,
  });

  const updateLesson = useMutation({
    mutationFn: ({
      lessonId,
      data,
    }: {
      lessonId: string;
      data: Partial<CreateLessonInput>;
    }) => apiClient.patch(`/api/courses/lessons/${lessonId}`, data),
    onSuccess: invalidate,
  });

  const deleteLesson = useMutation({
    mutationFn: (lessonId: string) => apiClient.delete(`/api/courses/lessons/${lessonId}`),
    onSuccess: invalidate,
  });

  return {
    createCourse,
    updateCourse,
    deleteCourse,
    createModule,
    deleteModule,
    createLesson,
    updateLesson,
    deleteLesson,
  };
}
