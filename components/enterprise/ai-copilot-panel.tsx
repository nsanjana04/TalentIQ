"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Bot, Loader2, Send, Sparkles, X } from "lucide-react";
import { useState } from "react";
import type { AiRecommendation } from "@/types/dashboard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useAiCopilotQuery } from "@/hooks/use-ai-insights";
import type { CopilotQueryResponse } from "@/types/employee-intelligence";

interface AiCopilotPanelProps {
  open: boolean;
  onClose: () => void;
  recommendations?: AiRecommendation[];
}

const SUGGESTED_PROMPTS = [
  "Who is promotion-ready in Engineering?",
  "Show compliance risks this quarter",
  "Summarize skill gaps by department",
  "Which teams need succession planning?",
];

const PRIORITY_VARIANT = {
  high: "danger",
  medium: "warning",
  low: "secondary",
} as const;

type PanelMessage =
  | { role: "user"; content: string }
  | { role: "assistant"; response: CopilotQueryResponse };

function formatCopilotResponse(response: CopilotQueryResponse): string {
  if (response.rankedEmployees.length === 0) {
    return [
      response.headline,
      response.narrative,
      "No qualifying records found in the live database.",
    ].join("\n\n");
  }

  const lines = response.rankedEmployees.slice(0, 8).map((result, index) => {
    const e = result.employee;
    return [
      `${index + 1}. ${e.employeeName}`,
      e.jobTitle ? `   Role: ${e.jobTitle}` : null,
      `   Department: ${e.department ?? "Unassigned"} · Manager: ${e.manager ?? "N/A"}`,
      `   Readiness: ${e.readinessScore}% · Performance: ${e.performanceScore}% · Promotion: ${e.promotionScore}%`,
      e.promotionTarget ? `   Target: ${e.promotionTarget}` : null,
      `   ${result.matchReason}`,
    ]
      .filter(Boolean)
      .join("\n");
  });

  return [response.headline, "", ...lines].join("\n");
}

export function AiCopilotPanel({ open, onClose, recommendations = [] }: AiCopilotPanelProps) {
  const [query, setQuery] = useState("");
  const [messages, setMessages] = useState<PanelMessage[]>([]);
  const copilot = useAiCopilotQuery();

  function handleSend(text?: string) {
    const q = (text ?? query).trim();
    if (!q || copilot.isPending) return;

    setQuery("");
    setMessages((prev) => [...prev, { role: "user", content: q }]);

    copilot.mutate(q, {
      onSuccess: (result) => {
        setMessages((prev) => [...prev, { role: "assistant", response: result }]);
      },
      onError: () => {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            response: {
              query: q,
              scopeLabel: "Scope",
              intent: "workforce_health",
              headline: "Query failed",
              narrative: "Unable to load workforce records. Check your connection and try again.",
              structured: {
                executiveSummary: "Query failed — no employee data returned from the database.",
                keyFindings: [],
                affectedEmployees: [],
                recommendedActions: ["Retry the query or open the full AI Copilot page."],
                riskLevel: "high",
                confidenceScore: 0,
                dataSources: [],
                recordCounts: {
                  employees: 0,
                  performanceReviews: 0,
                  certifications: 0,
                  skillRecords: 0,
                  enrollments: 0,
                },
              },
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

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-navy/40 backdrop-blur-sm"
            onClick={onClose}
            aria-hidden
          />
          <motion.aside
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 320 }}
            className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col border-l border-border bg-card shadow-2xl"
            role="dialog"
            aria-label="AI Workforce Copilot"
          >
            <header className="flex items-center justify-between border-b border-border/50 px-5 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/70 text-primary-foreground">
                  <Bot className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="font-semibold">Workforce Copilot</h2>
                  <p className="text-xs text-muted-foreground">Live database intelligence</p>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close copilot">
                <X className="h-4 w-4" />
              </Button>
            </header>

            <div className="flex-1 space-y-4 overflow-y-auto p-5">
              {messages.length === 0 ? (
                <div className="space-y-4">
                  <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
                    <div className="flex items-center gap-2 text-sm font-medium text-primary">
                      <Sparkles className="h-4 w-4" />
                      Intelligence briefing
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Ask about readiness, compliance, succession, or workforce metrics.
                      Responses use the same live data service as the AI Copilot page.
                    </p>
                  </div>
                  {recommendations.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Priority insights
                      </p>
                      {recommendations.slice(0, 3).map((rec) => (
                        <button
                          key={rec.id}
                          type="button"
                          onClick={() => handleSend(rec.title)}
                          className="w-full rounded-lg border border-border/60 p-3 text-left transition-colors hover:border-primary/30 hover:bg-muted/30"
                        >
                          <Badge variant={PRIORITY_VARIANT[rec.priority]} className="mb-1">
                            {rec.priority}
                          </Badge>
                          <p className="text-sm font-medium">{rec.title}</p>
                        </button>
                      ))}
                    </div>
                  )}
                  <div className="space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Suggested queries
                    </p>
                    {SUGGESTED_PROMPTS.map((prompt) => (
                      <button
                        key={prompt}
                        type="button"
                        onClick={() => handleSend(prompt)}
                        className="block w-full rounded-lg bg-muted/50 px-3 py-2 text-left text-sm transition-colors hover:bg-muted"
                      >
                        {prompt}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                messages.map((msg, i) => (
                  <div
                    key={i}
                    className={cn(
                      "max-w-[90%] rounded-xl px-4 py-3 text-sm whitespace-pre-wrap",
                      msg.role === "user"
                        ? "ml-auto bg-primary text-primary-foreground"
                        : "bg-muted/60 text-foreground"
                    )}
                  >
                    {msg.role === "user" ? msg.content : formatCopilotResponse(msg.response)}
                  </div>
                ))
              )}
              {copilot.isPending && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Querying workforce records…
                </div>
              )}
            </div>

            <footer className="border-t border-border/50 p-4">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSend();
                }}
                className="flex gap-2"
              >
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Ask the workforce copilot…"
                  aria-label="Copilot query"
                  disabled={copilot.isPending}
                />
                <Button type="submit" size="icon" aria-label="Send message" disabled={copilot.isPending}>
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            </footer>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
