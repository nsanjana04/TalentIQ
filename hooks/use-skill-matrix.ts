"use client";

import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import type { MatrixQuery } from "@/lib/validations/skill-matrix";
import type {
  ExportFormat,
  GapAnalysis,
  MatrixFilters,
  MatrixView,
  ReadinessScores,
  SkillMatrixData,
} from "@/types/skill-matrix";

export const SKILL_MATRIX_KEY = ["skill-matrix"] as const;

function buildParams(query: Partial<MatrixQuery>): Record<string, string> {
  const params: Record<string, string> = {};
  if (query.view) params.view = query.view;
  if (query.departmentId) params.departmentId = query.departmentId;
  if (query.teamId) params.teamId = query.teamId;
  if (query.jobRoleId) params.jobRoleId = query.jobRoleId;
  if (query.categoryId) params.categoryId = query.categoryId;
  if (query.skillIds) params.skillIds = query.skillIds;
  return params;
}

export function useSkillMatrixFilters() {
  return useQuery({
    queryKey: [...SKILL_MATRIX_KEY, "filters"],
    queryFn: () => apiClient.get<MatrixFilters>("/api/skill-matrix/filters"),
    staleTime: 5 * 60_000,
  });
}

export function useSkillMatrix(query: MatrixQuery) {
  return useQuery({
    queryKey: [...SKILL_MATRIX_KEY, "matrix", query],
    queryFn: () =>
      apiClient.get<SkillMatrixData>("/api/skill-matrix/matrix", {
        params: buildParams(query),
      }),
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    placeholderData: (prev) => prev,
  });
}

export function useGapAnalysis(query: MatrixQuery, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: [...SKILL_MATRIX_KEY, "gaps", query],
    queryFn: () =>
      apiClient.get<GapAnalysis>("/api/skill-matrix/gaps", {
        params: buildParams(query),
      }),
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    enabled: options?.enabled !== false,
  });
}

export function useReadinessScores(query: MatrixQuery, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: [...SKILL_MATRIX_KEY, "readiness", query],
    queryFn: () =>
      apiClient.get<ReadinessScores>("/api/skill-matrix/readiness", {
        params: buildParams(query),
      }),
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    enabled: options?.enabled !== false,
  });
}

export async function exportSkillMatrix(
  query: MatrixQuery & { format: ExportFormat }
): Promise<void> {
  const params = { ...buildParams(query), format: query.format };
  const search = new URLSearchParams(params).toString();
  const response = await fetch(`/api/skill-matrix/export?${search}`, {
    credentials: "include",
  });

  if (!response.ok) throw new Error("Export failed");

  const blob = await response.blob();
  const disposition = response.headers.get("Content-Disposition");
  const filename =
    disposition?.match(/filename="(.+)"/)?.[1] ?? `skill-matrix.${query.format}`;

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
