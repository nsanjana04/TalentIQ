"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import type {
  CertificateVerificationResult,
  PathwayCourseCurriculum,
  RoadmapPathwayOverview,
} from "@/types/roadmap-pathway";

export const ROADMAP_PATHWAY_KEY = ["learning", "roadmap", "pathway"] as const;

export function pathwayCurriculumKey(pathwaySlug: string) {
  return ["learning", "roadmap", "pathway", pathwaySlug, "curriculum"] as const;
}

export function useRoadmapPathway() {
  return useQuery({
    queryKey: ROADMAP_PATHWAY_KEY,
    queryFn: () => apiClient.get<RoadmapPathwayOverview>("/api/learning/roadmap/pathway"),
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });
}

export function usePathwayCourseCurriculum(pathwaySlug: string | null, enabled = true) {
  return useQuery({
    queryKey: pathwaySlug ? pathwayCurriculumKey(pathwaySlug) : ["learning", "roadmap", "pathway", "curriculum", "idle"],
    queryFn: () =>
      apiClient.get<PathwayCourseCurriculum>(
        `/api/learning/roadmap/pathway/${pathwaySlug}/curriculum`
      ),
    enabled: Boolean(pathwaySlug) && enabled,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });
}

export function usePreparePathwayFinalAssessment(pathwaySlug: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () =>
      apiClient.post<{
        assessmentId: string;
        assessmentTitle: string;
        questionCount: number;
        generated: boolean;
        aiPowered: boolean;
      }>("/api/learning/roadmap/pathway/prepare-final-assessment", { pathwaySlug }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: pathwayCurriculumKey(pathwaySlug) });
      queryClient.invalidateQueries({ queryKey: ROADMAP_PATHWAY_KEY });
    },
  });
}

export function useCompletePathwayLevelContent(pathwaySlug: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (tier: string) =>
      apiClient.post("/api/learning/roadmap/pathway/complete-level-content", {
        pathwaySlug,
        tier,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: pathwayCurriculumKey(pathwaySlug) });
      queryClient.invalidateQueries({ queryKey: ROADMAP_PATHWAY_KEY });
    },
  });
}

export function useOpenPathwayCourse() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (pathwaySlug: string) =>
      apiClient.post<{ externalUrl: string; courseId: string | null }>(
        "/api/learning/roadmap/pathway",
        { pathwaySlug }
      ),
    onSuccess: (data) => {
      if (data.externalUrl) {
        window.open(data.externalUrl, "_blank", "noopener,noreferrer");
      }
      queryClient.invalidateQueries({ queryKey: ROADMAP_PATHWAY_KEY });
      queryClient.invalidateQueries({ queryKey: ["learning", "roadmap"] });
      queryClient.invalidateQueries({ queryKey: ["learning", "lrs"] });
    },
  });
}

export function useVerifyPathwayCertificate() {
  return useMutation({
    mutationFn: async ({
      pathwaySlug,
      file,
    }: {
      pathwaySlug: string;
      file: File;
    }) => {
      const formData = new FormData();
      formData.append("pathwaySlug", pathwaySlug);
      formData.append("file", file);

      const response = await fetch("/api/learning/roadmap/verify-certificate", {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      const json = await response.json();
      if (!response.ok || !json.success) {
        throw new Error(json.error?.message ?? "Certificate verification failed");
      }
      return json.data as CertificateVerificationResult;
    },
  });
}

export function useCompletePathwayCertificate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (pathwaySlug: string) =>
      apiClient.post("/api/learning/roadmap/complete-certificate", { pathwaySlug }),
    onSuccess: (_data, pathwaySlug) => {
      queryClient.invalidateQueries({ queryKey: ROADMAP_PATHWAY_KEY });
      queryClient.invalidateQueries({ queryKey: pathwayCurriculumKey(pathwaySlug) });
      queryClient.invalidateQueries({ queryKey: ["learning", "roadmap"] });
      queryClient.invalidateQueries({ queryKey: ["learning", "lrs"] });
    },
  });
}
