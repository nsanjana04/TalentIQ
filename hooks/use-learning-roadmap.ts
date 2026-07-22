"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import type { LearningRoadmapOverview } from "@/types/learning-roadmap";

export const LEARNING_ROADMAP_KEY = ["learning", "roadmap"] as const;

type RoadmapParams = { skillId?: string };
type RoadmapQueryOptions = { enabled?: boolean };

export function useLearningRoadmap(params?: RoadmapParams, options?: RoadmapQueryOptions) {
  return useQuery({
    queryKey: [...LEARNING_ROADMAP_KEY, params],
    queryFn: () =>
      apiClient.get<LearningRoadmapOverview>("/api/learning/roadmap", {
        params: params?.skillId ? { skillId: params.skillId } : undefined,
      }),
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    enabled: options?.enabled !== false,
  });
}

export function useEnrollCourse() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (courseId: string) =>
      apiClient.post<{ enrollmentId: string; courseId: string; status: string }>(
        "/api/learning/enroll",
        { courseId }
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: LEARNING_ROADMAP_KEY });
    },
  });
}

export function useCompleteExternalCourse() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (courseId: string) =>
      apiClient.post<{ enrollmentId: string; courseId: string; status: string; progress: number }>(
        "/api/learning/complete-external",
        { courseId }
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: LEARNING_ROADMAP_KEY });
    },
  });
}

export function useGenerateCourseQuiz() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (courseId: string) =>
      apiClient.post<{ assessmentId: string; questionCount: number; generated: boolean }>(
        "/api/learning/generate-quiz",
        { courseId }
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: LEARNING_ROADMAP_KEY });
    },
  });
}
