"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import type {
  CreateDepartmentInput,
  CreateTeamInput,
  UpdateDepartmentInput,
  UpdateTeamInput,
} from "@/lib/validations/departments";

export interface DepartmentDetail {
  id: string;
  name: string;
  code: string;
  description: string | null;
  parent: { id: string; name: string; code: string } | null;
  userCount: number;
  teamCount: number;
  teams: {
    id: string;
    name: string;
    code: string;
    description: string | null;
    memberCount: number;
    leader: { id: string; name: string } | null;
  }[];
}

export const DEPARTMENTS_KEY = ["departments"] as const;

export function useDepartments() {
  return useQuery({
    queryKey: DEPARTMENTS_KEY,
    queryFn: () => apiClient.get<DepartmentDetail[]>("/api/departments"),
    staleTime: 30_000,
  });
}

export function useDepartmentMutations() {
  const queryClient = useQueryClient();

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: DEPARTMENTS_KEY });
    queryClient.invalidateQueries({ queryKey: ["users", "filters"] });
  };

  return {
    createDepartment: useMutation({
      mutationFn: (data: CreateDepartmentInput) =>
        apiClient.post<DepartmentDetail>("/api/departments", data),
      onSuccess: invalidate,
    }),
    updateDepartment: useMutation({
      mutationFn: ({ id, data }: { id: string; data: UpdateDepartmentInput }) =>
        apiClient.patch<DepartmentDetail>(`/api/departments/${id}`, data),
      onSuccess: invalidate,
    }),
    deleteDepartment: useMutation({
      mutationFn: (id: string) => apiClient.delete(`/api/departments/${id}`),
      onSuccess: invalidate,
    }),
    createTeam: useMutation({
      mutationFn: (data: CreateTeamInput) => apiClient.post<DepartmentDetail>("/api/teams", data),
      onSuccess: invalidate,
    }),
    updateTeam: useMutation({
      mutationFn: ({ id, data }: { id: string; data: UpdateTeamInput }) =>
        apiClient.patch<DepartmentDetail>(`/api/teams/${id}`, data),
      onSuccess: invalidate,
    }),
    deleteTeam: useMutation({
      mutationFn: (id: string) => apiClient.delete(`/api/teams/${id}`),
      onSuccess: invalidate,
    }),
  };
}
