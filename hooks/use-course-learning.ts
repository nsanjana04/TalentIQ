"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import type {
  GenerateModuleAssessmentQuestionsResult,
  ModuleAssessmentStatus,
  SetupModuleAssessmentsResult,
} from "@/types/course-admin";
import type {
  CompleteLessonResult,
  CompleteModuleResult,
  CoursePlayerData,
  PrepareModuleAssessmentResult,
} from "@/types/course-learning";
import type {
  GenerateAllModuleAssessmentsInput,
  GenerateModuleAssessmentQuestionsInput,
} from "@/lib/validations/course-admin";
import { COURSE_ADMIN_KEY } from "./use-course-admin";

export const COURSE_LEARNING_KEY = ["courses", "learning"] as const;

export function useCoursePlayer(courseId: string, lessonId?: string | null) {
  return useQuery({
    queryKey: [...COURSE_LEARNING_KEY, "player", courseId, lessonId ?? null],
    queryFn: () =>
      apiClient.get<CoursePlayerData>(`/api/courses/${courseId}/player`, {
        params: lessonId ? { lessonId } : undefined,
      }),
    enabled: !!courseId,
    staleTime: 10_000,
  });
}

export function useCompleteLesson(courseId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ lessonId, timeSpentMinutes }: { lessonId: string; timeSpentMinutes?: number }) =>
      apiClient.post<CompleteLessonResult>(`/api/courses/lessons/${lessonId}/complete`, {
        timeSpentMinutes,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [...COURSE_LEARNING_KEY, "player", courseId] });
    },
  });
}

export function useCompleteModule(courseId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (moduleId: string) =>
      apiClient.post<CompleteModuleResult>(`/api/courses/modules/${moduleId}/complete`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [...COURSE_LEARNING_KEY, "player", courseId] });
    },
  });
}

export function usePrepareModuleAssessment(courseId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (moduleId: string) =>
      apiClient.post<PrepareModuleAssessmentResult>(
        `/api/courses/modules/${moduleId}/prepare-assessment`
      ),
    onSuccess: () => {
      if (courseId) {
        qc.invalidateQueries({ queryKey: [...COURSE_LEARNING_KEY, "player", courseId] });
      }
    },
  });
}

export function useModuleAssessments(courseId: string | null) {
  return useQuery({
    queryKey: [...COURSE_ADMIN_KEY, "module-assessments", courseId],
    queryFn: () =>
      apiClient.get<{ modules: ModuleAssessmentStatus[]; aiEnabled: boolean }>(
        `/api/courses/${courseId}/module-assessments`
      ),
    enabled: !!courseId,
    staleTime: 30_000,
  });
}

export function useSetupModuleAssessments(courseId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () =>
      apiClient.post<SetupModuleAssessmentsResult>(
        `/api/courses/${courseId}/module-assessments`
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [...COURSE_ADMIN_KEY, "module-assessments", courseId] });
      qc.invalidateQueries({ queryKey: [...COURSE_ADMIN_KEY, "detail", courseId] });
    },
  });
}

export function useGenerateModuleAssessmentQuestions(moduleId: string, courseId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: GenerateModuleAssessmentQuestionsInput) =>
      apiClient.post<GenerateModuleAssessmentQuestionsResult>(
        `/api/courses/modules/${moduleId}/generate-assessment-questions`,
        body
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [...COURSE_ADMIN_KEY, "module-assessments", courseId] });
      qc.invalidateQueries({ queryKey: ["assessments"] });
    },
  });
}

export function useGenerateAllModuleAssessments(courseId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: GenerateAllModuleAssessmentsInput) =>
      apiClient.post<{
        generatedCount: number;
        skippedCount: number;
        results: GenerateModuleAssessmentQuestionsResult[];
      }>(`/api/courses/${courseId}/module-assessments/generate-all`, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [...COURSE_ADMIN_KEY, "module-assessments", courseId] });
      qc.invalidateQueries({ queryKey: [...COURSE_ADMIN_KEY, "detail", courseId] });
      qc.invalidateQueries({ queryKey: ["assessments"] });
    },
  });
}
