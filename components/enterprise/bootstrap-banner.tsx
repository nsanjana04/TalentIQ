"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, Database } from "lucide-react";
import { apiClient } from "@/lib/api-client";
import { Button } from "@/components/ui/button";

export function BootstrapBanner({ hidden = false }: { hidden?: boolean }) {
  const qc = useQueryClient();
  const [dismissed, setDismissed] = useState(false);

  const { data } = useQuery({
    queryKey: ["system", "bootstrap"],
    queryFn: () =>
      apiClient.get<{ checks: { label: string; ok: boolean }[]; needsBootstrap: boolean }>(
        "/api/system/bootstrap"
      ),
    staleTime: 120_000,
    enabled: process.env.NODE_ENV === "development",
  });

  const inject = useMutation({
    mutationFn: () => apiClient.post<{ seeded: boolean; message: string }>("/api/system/bootstrap", {}),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["system", "bootstrap"] });
      window.location.reload();
    },
  });

  if (hidden || process.env.NODE_ENV !== "development" || dismissed || !data?.needsBootstrap) {
    return null;
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-warning/40 bg-warning/10 px-4 py-3">
      <div className="flex items-center gap-2 text-sm">
        <AlertTriangle className="h-4 w-4 text-warning" />
        <span>Starter data missing. Run bootstrap to inject realistic workforce records.</span>
      </div>
      <div className="flex gap-2">
        <Button size="sm" onClick={() => inject.mutate()} disabled={inject.isPending}>
          <Database className="mr-2 h-4 w-4" />
          {inject.isPending ? "Injecting…" : "Inject Starter Data"}
        </Button>
        <Button size="sm" variant="ghost" onClick={() => setDismissed(true)}>
          Dismiss
        </Button>
      </div>
    </div>
  );
}
