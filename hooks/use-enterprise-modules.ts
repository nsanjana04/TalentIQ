"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import type { ForecastView, SuccessionRoleView, WarRoomData } from "@/types/enterprise-modules";

export function useWarRoom() {
  return useQuery({
    queryKey: ["war-room"],
    queryFn: () => apiClient.get<WarRoomData>("/api/war-room"),
    staleTime: 60_000,
  });
}

export function useSuccessionPlans() {
  return useQuery({
    queryKey: ["succession"],
    queryFn: () =>
      apiClient.get<{
        plans: SuccessionRoleView[];
        summary: {
          criticalRoles: number;
          uncovered: number;
          avgCoverage: number;
          highRisk: number;
        };
      }>("/api/succession"),
    staleTime: 60_000,
  });
}

export function useForecasts(model?: string, refresh?: boolean) {
  return useQuery({
    queryKey: ["forecasting", model, refresh],
    queryFn: () => {
      const params = new URLSearchParams();
      if (model) params.set("model", model);
      if (refresh) params.set("refresh", "true");
      const q = params.toString();
      return apiClient.get<ForecastView[]>(`/api/forecasting${q ? `?${q}` : ""}`);
    },
    staleTime: 300_000,
  });
}

export function useRegenerateForecasts() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => apiClient.post<ForecastView[]>("/api/forecasting", {}),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["forecasting"] }),
  });
}
