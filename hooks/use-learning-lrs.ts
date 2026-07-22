"use client";

import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import type {
  EmployeeLearningDashboard,
  ExecutiveLearningDashboard,
  LearningAnalytics,
  ManagerLearningDashboard,
} from "@/types/learning-lrs";

export const LRS_EMPLOYEE_KEY = ["learning", "lrs", "employee"] as const;
export const LRS_MANAGER_KEY = ["learning", "lrs", "manager"] as const;
export const LRS_EXECUTIVE_KEY = ["learning", "lrs", "executive"] as const;
export const LRS_ANALYTICS_KEY = ["learning", "lrs", "analytics"] as const;

type LrsQueryOptions = { enabled?: boolean };

export function useEmployeeLearningDashboard(options?: LrsQueryOptions) {
  return useQuery({
    queryKey: LRS_EMPLOYEE_KEY,
    queryFn: () => apiClient.get<EmployeeLearningDashboard>("/api/learning/lrs/dashboard/employee"),
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    enabled: options?.enabled !== false,
  });
}

export function useManagerLearningDashboard(options?: LrsQueryOptions) {
  return useQuery({
    queryKey: LRS_MANAGER_KEY,
    queryFn: () => apiClient.get<ManagerLearningDashboard>("/api/learning/lrs/dashboard/manager"),
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    enabled: options?.enabled !== false,
  });
}

export function useExecutiveLearningDashboard(options?: LrsQueryOptions) {
  return useQuery({
    queryKey: LRS_EXECUTIVE_KEY,
    queryFn: () => apiClient.get<ExecutiveLearningDashboard>("/api/learning/lrs/dashboard/executive"),
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    enabled: options?.enabled !== false,
  });
}

export function useLearningAnalytics(options?: LrsQueryOptions) {
  return useQuery({
    queryKey: LRS_ANALYTICS_KEY,
    queryFn: () => apiClient.get<LearningAnalytics>("/api/learning/lrs/analytics"),
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    enabled: options?.enabled !== false,
  });
}

export function useLearningEventStream(onEvent?: (event: MessageEvent) => void) {
  if (typeof window === "undefined") return;
  const source = new EventSource("/api/learning/lrs/stream");
  source.onmessage = (e) => onEvent?.(e);
  return () => source.close();
}

export function learningReportExportUrl(format: "csv" | "xlsx" | "pdf") {
  return `/api/learning/lrs/export?format=${format}`;
}
