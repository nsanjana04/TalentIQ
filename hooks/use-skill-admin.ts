"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import type { SkillAdminMeta, SkillAdminOverview } from "@/types/skill-admin";

export const SKILL_ADMIN_KEY = ["skills", "admin"] as const;

export function useSkillOverview() {
  return useQuery({
    queryKey: [...SKILL_ADMIN_KEY, "overview"],
    queryFn: () => apiClient.get<SkillAdminOverview>("/api/skills/overview"),
    staleTime: 60_000,
  });
}

export function useSkillMeta() {
  return useQuery({
    queryKey: [...SKILL_ADMIN_KEY, "meta"],
    queryFn: () => apiClient.get<SkillAdminMeta>("/api/skills/meta"),
    staleTime: 5 * 60_000,
  });
}

function useSkillList<T>(resource: string) {
  return useQuery({
    queryKey: [...SKILL_ADMIN_KEY, resource],
    queryFn: () => apiClient.get<T[]>(`/api/skills/${resource}`),
    staleTime: 30_000,
  });
}

export function useSkillCategories() {
  return useSkillList("categories");
}

export function useSkillLibrary(search?: string) {
  return useQuery({
    queryKey: [...SKILL_ADMIN_KEY, "library", search],
    queryFn: () =>
      apiClient.get("/api/skills/library", {
        params: search ? { search } : undefined,
      }),
    staleTime: 30_000,
  });
}

export function useSkillLevels() {
  return useSkillList("levels");
}

export function useSkillRelations() {
  return useSkillList("relations");
}

export function useRoleMappings() {
  return useSkillList("role-mappings");
}

export function useCourseMappings() {
  return useSkillList("course-mappings");
}

export function useAssessmentMappings() {
  return useSkillList("assessment-mappings");
}

export function useCertificateMappings() {
  return useSkillList("certificate-mappings");
}

export function useValidityRules() {
  return useSkillList("validity-rules");
}

export function useWeightageRules() {
  return useSkillList("weightage-rules");
}

function useInvalidateSkillAdmin() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: SKILL_ADMIN_KEY });
}

function usePostMutation(path: string) {
  const invalidate = useInvalidateSkillAdmin();
  return useMutation({
    mutationFn: (body: unknown) => apiClient.post(`/api/skills/${path}`, body),
    onSuccess: invalidate,
  });
}

function usePatchMutation(path: string) {
  const invalidate = useInvalidateSkillAdmin();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: unknown }) =>
      apiClient.patch(`/api/skills/${path}/${id}`, body),
    onSuccess: invalidate,
  });
}

function useDeleteMutation(path: string) {
  const invalidate = useInvalidateSkillAdmin();
  return useMutation({
    mutationFn: (id: string) => apiClient.delete(`/api/skills/${path}/${id}`),
    onSuccess: invalidate,
  });
}

export function useSkillAdminMutations() {
  const invalidate = useInvalidateSkillAdmin();

  const upsertValidity = useMutation({
    mutationFn: (body: unknown) => apiClient.post("/api/skills/validity-rules", body),
    onSuccess: invalidate,
  });

  const deleteValidity = useMutation({
    mutationFn: (skillId: string) =>
      apiClient.delete(`/api/skills/validity-rules/${skillId}`),
    onSuccess: invalidate,
  });

  return {
    createCategory: usePostMutation("categories"),
    updateCategory: usePatchMutation("categories"),
    deleteCategory: useDeleteMutation("categories"),
    createSkill: usePostMutation("library"),
    updateSkill: usePatchMutation("library"),
    deleteSkill: useDeleteMutation("library"),
    createLevel: usePostMutation("levels"),
    updateLevel: usePatchMutation("levels"),
    deleteLevel: useDeleteMutation("levels"),
    createRelation: usePostMutation("relations"),
    deleteRelation: useDeleteMutation("relations"),
    createRoleMapping: usePostMutation("role-mappings"),
    deleteRoleMapping: useDeleteMutation("role-mappings"),
    createCourseMapping: usePostMutation("course-mappings"),
    deleteCourseMapping: useDeleteMutation("course-mappings"),
    createAssessmentMapping: usePostMutation("assessment-mappings"),
    deleteAssessmentMapping: useDeleteMutation("assessment-mappings"),
    createCertificateMapping: usePostMutation("certificate-mappings"),
    deleteCertificateMapping: useDeleteMutation("certificate-mappings"),
    upsertValidity,
    deleteValidity,
    createWeightage: usePostMutation("weightage-rules"),
    updateWeightage: usePatchMutation("weightage-rules"),
    deleteWeightage: useDeleteMutation("weightage-rules"),
  };
}
