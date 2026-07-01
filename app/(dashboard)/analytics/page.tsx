import { Suspense } from "react";
import { AnalyticsHubModule } from "@/components/analytics-hub/analytics-hub-module";

export default function AnalyticsPage() {
  return (
    <Suspense fallback={<div className="p-6 text-muted-foreground">Loading analytics…</div>}>
      <AnalyticsHubModule />
    </Suspense>
  );
}
