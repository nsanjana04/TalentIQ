"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import type { AiInsightsResponse } from "@/types/ai-insights";
import type { CopilotQueryResponse, Employee360Profile, EmployeeIntelSnapshot } from "@/types/employee-intelligence";

const INSIGHTS_KEY = ["ai-insights"] as const;

export function useAiInsights() {
  return useQuery({
    queryKey: INSIGHTS_KEY,
    queryFn: () => apiClient.get<AiInsightsResponse>("/api/ai-insights"),
    staleTime: 2 * 60 * 1000,
  });
}

export function useAiCopilotQuery() {
  return useMutation({
    mutationFn: (query: string) =>
      apiClient.post<CopilotQueryResponse>("/api/ai-insights", { q: query }),
  });
}

export function useEmployee360(employeeId: string) {
  return useQuery({
    queryKey: ["employee-360", employeeId],
    queryFn: () => apiClient.get<Employee360Profile>(`/api/employees/${employeeId}/360`),
    enabled: !!employeeId,
  });
}

export function useEmployeeCompare() {
  return useMutation({
    mutationFn: (ids: string[]) =>
      apiClient.post<{ employees: EmployeeIntelSnapshot[]; comparedAt: string }>(
        "/api/ai-insights/compare",
        { ids }
      ),
  });
}

export function copilotExportUrl(query: string, format: "csv" | "xlsx" | "pdf") {
  const params = new URLSearchParams({ q: query, format });
  return `/api/ai-insights/export?${params.toString()}`;
}
