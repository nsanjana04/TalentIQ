"use client";

import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import type {
  CertificateComplianceAnalytics,
  DepartmentAnalytics,
  EmployeeAnalytics,
  ExecutiveAnalytics,
  LearningProgressAnalytics,
  OrganizationAnalytics,
  SkillGapsAnalytics,
  TeamAnalytics,
} from "@/types/analytics-hub";

export const ANALYTICS_HUB_KEY = ["analytics-hub"] as const;

export interface AnalyticsHubFilters {
  departmentId?: string;
  teamId?: string;
  view?: "employee" | "department" | "team" | "role";
}

function filterParams(filters?: AnalyticsHubFilters) {
  return {
    ...(filters?.departmentId && { departmentId: filters.departmentId }),
    ...(filters?.teamId && { teamId: filters.teamId }),
    ...(filters?.view && { view: filters.view }),
  };
}

export function useExecutiveAnalytics() {
  return useQuery({
    queryKey: [...ANALYTICS_HUB_KEY, "executive"],
    queryFn: () => apiClient.get<ExecutiveAnalytics>("/api/analytics/executive"),
    staleTime: 60_000,
  });
}

export function useEmployeeAnalytics(filters?: AnalyticsHubFilters) {
  return useQuery({
    queryKey: [...ANALYTICS_HUB_KEY, "employees", filters],
    queryFn: () =>
      apiClient.get<EmployeeAnalytics>("/api/analytics/employees", {
        params: filterParams(filters),
      }),
    staleTime: 60_000,
  });
}

export function useTeamAnalytics(filters?: AnalyticsHubFilters) {
  return useQuery({
    queryKey: [...ANALYTICS_HUB_KEY, "teams", filters],
    queryFn: () =>
      apiClient.get<TeamAnalytics>("/api/analytics/teams", { params: filterParams(filters) }),
    staleTime: 60_000,
  });
}

export function useDepartmentAnalytics(filters?: AnalyticsHubFilters) {
  return useQuery({
    queryKey: [...ANALYTICS_HUB_KEY, "departments", filters],
    queryFn: () =>
      apiClient.get<DepartmentAnalytics>("/api/analytics/departments", {
        params: filterParams(filters),
      }),
    staleTime: 60_000,
  });
}

export function useOrganizationAnalytics() {
  return useQuery({
    queryKey: [...ANALYTICS_HUB_KEY, "organization"],
    queryFn: () => apiClient.get<OrganizationAnalytics>("/api/analytics/organization"),
    staleTime: 60_000,
  });
}

export function useLearningProgressAnalytics(filters?: AnalyticsHubFilters) {
  return useQuery({
    queryKey: [...ANALYTICS_HUB_KEY, "learning-progress", filters],
    queryFn: () =>
      apiClient.get<LearningProgressAnalytics>("/api/analytics/learning-progress", {
        params: filterParams(filters),
      }),
    staleTime: 60_000,
  });
}

export function useCertificateComplianceAnalytics(filters?: AnalyticsHubFilters) {
  return useQuery({
    queryKey: [...ANALYTICS_HUB_KEY, "certificate-compliance", filters],
    queryFn: () =>
      apiClient.get<CertificateComplianceAnalytics>("/api/analytics/certificate-compliance", {
        params: filterParams(filters),
      }),
    staleTime: 60_000,
  });
}

export function useSkillGapsAnalytics(filters?: AnalyticsHubFilters) {
  return useQuery({
    queryKey: [...ANALYTICS_HUB_KEY, "skill-gaps", filters],
    queryFn: () =>
      apiClient.get<SkillGapsAnalytics>("/api/analytics/skill-gaps", {
        params: filterParams(filters),
      }),
    staleTime: 60_000,
  });
}
