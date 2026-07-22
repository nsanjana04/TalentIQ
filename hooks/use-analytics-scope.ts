"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";

interface DepartmentRow {
  id: string;
  name: string;
  teams: { id: string; name: string }[];
}

export function useAnalyticsScopeFilters() {
  const query = useQuery({
    queryKey: ["analytics", "scope-filters"],
    queryFn: () => apiClient.get<DepartmentRow[]>("/api/departments"),
    staleTime: 5 * 60_000,
  });

  const teams = useMemo(() => {
    const departments = query.data ?? [];
    return departments.flatMap((department) =>
      department.teams.map((team) => ({
        id: team.id,
        name: team.name,
        departmentId: department.id,
      }))
    );
  }, [query.data]);

  return {
    ...query,
    departments: query.data ?? [],
    teams,
  };
}
