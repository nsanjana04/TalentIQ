"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import type { CreateUserInput, UpdateUserInput } from "@/lib/validations/users";
import type {
  PaginatedUsers,
  UserFiltersMeta,
  UserListParams,
  UserProfile,
} from "@/types/users";

export const USERS_QUERY_KEY = ["users"] as const;
export const USER_FILTERS_KEY = ["users", "filters"] as const;

function buildListParams(params: UserListParams): Record<string, string> {
  const query: Record<string, string> = {
    page: String(params.page ?? 1),
    pageSize: String(params.pageSize ?? 12),
    status: params.status ?? "all",
  };
  if (params.search) query.search = params.search;
  if (params.roleId) query.roleId = params.roleId;
  if (params.departmentId) query.departmentId = params.departmentId;
  return query;
}

export function useUserFilters() {
  return useQuery({
    queryKey: USER_FILTERS_KEY,
    queryFn: () => apiClient.get<UserFiltersMeta>("/api/users/filters"),
    staleTime: 10 * 60 * 1000,
  });
}

export function useUsers(params: UserListParams) {
  return useQuery({
    queryKey: [...USERS_QUERY_KEY, "list", params],
    queryFn: () =>
      apiClient.get<PaginatedUsers>("/api/users", {
        params: buildListParams(params),
      }),
    placeholderData: (prev) => prev,
    staleTime: 30 * 1000,
  });
}

export function useUserProfile(userId: string | null) {
  return useQuery({
    queryKey: [...USERS_QUERY_KEY, "profile", userId],
    queryFn: () => apiClient.get<UserProfile>(`/api/users/${userId}`),
    enabled: !!userId,
    staleTime: 60 * 1000,
  });
}

export function useUpdateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, data }: { userId: string; data: UpdateUserInput }) =>
      apiClient.patch<UserProfile>(`/api/users/${userId}`, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: USERS_QUERY_KEY });
      queryClient.setQueryData([...USERS_QUERY_KEY, "profile", data.id], data);
    },
  });
}

export function useCreateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateUserInput) =>
      apiClient.post<UserProfile>("/api/users", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: USERS_QUERY_KEY });
    },
  });
}

export function useDeactivateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userId: string) =>
      apiClient.post(`/api/users/${userId}/deactivate`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: USERS_QUERY_KEY });
    },
  });
}
