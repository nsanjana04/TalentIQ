"use client";

import { useState } from "react";
import { Bot, RefreshCw, Send, Sparkles } from "lucide-react";
import { PageShell } from "@/components/enterprise/page-shell";
import { PageHeader } from "@/components/enterprise/page-header";
import { InsightCard } from "@/components/enterprise/insight-card";
import { EmptyState, ErrorState, PageLoadingState } from "@/components/enterprise/states";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { CopilotResponseView } from "@/components/ai-copilot/copilot-response";
import {
  useAiCopilotQuery,
  useAiInsights,
  useEmployeeCompare,
} from "@/hooks/use-ai-insights";
import type { CopilotQueryResponse } from "@/types/employee-intelligence";
import { cn } from "@/lib/utils";

const SUGGESTED_PROMPTS = [
  "Which employees have the largest skill gaps?",
  "Which employees are most at risk?",
  "Which certificates expire in 30 days?",
  "Who has the largest skill gaps?",
  "Which departments are underperforming?",
  "Who should replace Engineering Manager?",
  "Show top 10 performers.",
  "Show all employees missing AWS certification.",
];

type ChatMessage =
  | { role: "user"; content: string }
  | { role: "assistant"; response: CopilotQueryResponse };

export default function AiCopilotPage() {
  const { data, isLoading, isError, refetch, isFetching } = useAiInsights();
  const copilot = useAiCopilotQuery();
  const compare = useEmployeeCompare();
  const [query, setQuery] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [comparisonEmployees, setComparisonEmployees] = useState<
    CopilotQueryResponse["rankedEmployees"][number]["employee"][] | undefined
  >();

  function toggleCompare(id: string) {
    setCompareIds((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id].slice(0, 5);
      if (next.length >= 2) {
        compare.mutate(next, {
          onSuccess: (result) => setComparisonEmployees(result.employees),
        });
      } else {
        setComparisonEmployees(undefined);
      }
      return next;
    });
  }

  function handleAsk(text?: string) {
    const q = (text ?? query).trim();
    if (!q) return;
    setQuery("");
    setCompareIds([]);
    setComparisonEmployees(undefined);
    setMessages((prev) => [...prev, { role: "user", content: q }]);

    copilot.mutate(q, {
      onSuccess: (result) => {
        setMessages((prev) => [...prev, { role: "assistant", response: result }]);
      },
      onError: () => {
        const emptyStructured = {
          executiveSummary: "Query failed — no employee data returned from the database.",
          keyFindings: ["Check database connectivity and your RBAC scope."],
          affectedEmployees: [],
          recommendedActions: ["Retry the query or contact your administrator."],
          riskLevel: "high" as const,
          confidenceScore: 0,
          dataSources: [],
          recordCounts: {
            employees: 0,
            performanceReviews: 0,
            certifications: 0,
            skillRecords: 0,
            enrollments: 0,
          },
        };
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            response: {
              query: q,
              scopeLabel: data?.scopeLabel ?? "Scope",
              intent: "workforce_health",
              headline: "Query failed — no employee data returned",
              narrative: emptyStructured.executiveSummary,
              structured: emptyStructured,
              cards: [],
              rankedEmployees: [],
              drillDown: { type: "organization", id: "org", label: "Organization" },
              generatedAt: new Date().toISOString(),
              dataSources: {
                employees: 0,
                performanceReviews: 0,
                certifications: 0,
                skillRecords: 0,
                enrollments: 0,
              },
              confidence: 0,
            },
          },
        ]);
      },
    });
  }

  if (isLoading) return <PageShell><PageLoadingState /></PageShell>;

  if (isError) {
    return (
      <PageShell>
        <ErrorState onRetry={() => refetch()} />
      </PageShell>
    );
  }

  const insights = data?.insights ?? [];

  return (
    <PageShell>
      <PageHeader
        title="AI Workforce Copilot"
        description="Employee-level workforce intelligence from live HRIS records — ranked, sourced, and actionable."
        live
        badge={<Badge variant="outline">{data?.scopeLabel}</Badge>}
        actions={
          <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
            <RefreshCw className={cn("mr-2 h-4 w-4", isFetching && "animate-spin")} />
            Refresh insights
          </Button>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <div className="enterprise-panel p-4">
            <div className="mb-4 flex items-center gap-2 text-sm font-medium text-primary">
              <Sparkles className="h-4 w-4" />
              Ask a workforce question
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleAsk();
              }}
              className="flex gap-2"
            >
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Ask about readiness, compliance, skills, or learning…"
                disabled={copilot.isPending}
              />
              <Button type="submit" disabled={copilot.isPending || !query.trim()}>
                <Send className="h-4 w-4" />
              </Button>
            </form>
            <div className="mt-3 flex flex-wrap gap-2">
              {SUGGESTED_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => handleAsk(prompt)}
                  className="rounded-full border border-border bg-muted/40 px-3 py-1 text-xs transition-colors hover:bg-muted"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>

          {messages.length > 0 ? (
            <div className="space-y-4">
              {messages.map((msg, i) =>
                msg.role === "user" ? (
                  <div
                    key={i}
                    className="ml-auto max-w-[95%] rounded-2xl bg-primary px-4 py-3 text-sm text-primary-foreground"
                  >
                    {msg.content}
                  </div>
                ) : (
                  <CopilotResponseView
                    key={i}
                    response={msg.response}
                    compareIds={compareIds}
                    onCompareSelect={toggleCompare}
                    comparisonEmployees={comparisonEmployees}
                  />
                )
              )}
            </div>
          ) : (
            <EmptyState
              icon={Bot}
              title="Start a workforce intelligence conversation"
              description="Responses include ranked employees with readiness, risk, skills, certifications, and drill-down hierarchy."
            />
          )}
        </div>

        <div className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Active insights
          </h2>
          {insights.length === 0 ? (
            <EmptyState title="No insights" description="Insights will appear as workforce data is collected." />
          ) : (
            insights.map((insight) => (
              <InsightCard
                key={insight.id}
                title={insight.title}
                summary={insight.summary}
                severity={insight.severity}
                affectedUsers={insight.affectedUsers}
                recommendedAction={insight.recommendedAction}
                actionHref={insight.actionHref}
              />
            ))
          )}
        </div>
      </div>
    </PageShell>
  );
}
