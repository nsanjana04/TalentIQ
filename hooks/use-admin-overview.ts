"use client";

import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";

export interface AdminOverview {
  users: { total: number; active: number };
  organization: { departments: number; teams: number };
  skills: { total: number };
  courses: {
    total: number;
    published: number;
    enrollments: number;
    completed: number;
    inProgress: number;
    completionRate: number;
  };
  assessments: { total: number; published: number };
  certificates: { total: number; active: number };
  audit: { last7Days: number };
  roles: { total: number };
}

export const ADMIN_OVERVIEW_KEY = ["admin", "overview"] as const;

export function useAdminOverview() {
  return useQuery({
    queryKey: ADMIN_OVERVIEW_KEY,
    queryFn: () => apiClient.get<AdminOverview>("/api/admin/overview"),
    staleTime: 60_000,
  });
}
