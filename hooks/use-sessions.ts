"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import type { UserSession } from "@/types/auth";

const SESSIONS_KEY = ["auth", "sessions"] as const;

export function useSessions() {
  const queryClient = useQueryClient();

  const sessionsQuery = useQuery({
    queryKey: SESSIONS_KEY,
    queryFn: () => apiClient.get<UserSession[]>("/api/auth/sessions"),
  });

  const revokeMutation = useMutation({
    mutationFn: (sessionId: string) =>
      apiClient.delete(`/api/auth/sessions/${sessionId}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: SESSIONS_KEY }),
  });

  const revokeAllMutation = useMutation({
    mutationFn: () => apiClient.delete("/api/auth/sessions"),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: SESSIONS_KEY }),
  });

  return {
    sessions: sessionsQuery.data ?? [],
    isLoading: sessionsQuery.isLoading,
    revokeSession: revokeMutation.mutateAsync,
    revokeAllSessions: revokeAllMutation.mutateAsync,
    isRevoking: revokeMutation.isPending,
    isRevokingAll: revokeAllMutation.isPending,
    refetch: sessionsQuery.refetch,
  };
}
