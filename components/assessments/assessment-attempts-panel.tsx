"use client";

import { useMemo, useState } from "react";
import { History, Loader2, Search } from "lucide-react";
import { useAssessmentList, useAttemptRecords } from "@/hooks/use-assessments";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { cn } from "@/lib/utils";

const STATUS_COLORS: Record<string, string> = {
  PASSED: "bg-emerald-500/15 text-emerald-700",
  FAILED: "bg-destructive/15 text-destructive",
  IN_PROGRESS: "bg-amber-500/15 text-amber-700",
  SUBMITTED: "bg-blue-500/15 text-blue-700",
  GRADED: "bg-primary/10 text-primary",
};

export function AssessmentAttemptsPanel() {
  const [assessmentFilter, setAssessmentFilter] = useState("");
  const [learnerSearch, setLearnerSearch] = useState("");

  const { data: assessments } = useAssessmentList(undefined, "all", { enabled: true });
  const { data: attempts, isLoading } = useAttemptRecords(assessmentFilter || undefined, {
    enabled: true,
  });

  const filteredAttempts = useMemo(() => {
    if (!attempts) return [];
    const q = learnerSearch.trim().toLowerCase();
    if (!q) return attempts;
    return attempts.filter(
      (a) =>
        a.userName.toLowerCase().includes(q) ||
        a.userEmail.toLowerCase().includes(q) ||
        a.assessmentTitle.toLowerCase().includes(q)
    );
  }, [attempts, learnerSearch]);

  return (
    <div className="space-y-4">
      <div className="rounded-xl border bg-card/50 p-4">
        <div className="flex items-start gap-3">
          <History className="mt-0.5 h-5 w-5 text-primary" />
          <div>
            <h2 className="font-semibold">Attempts & Results</h2>
            <p className="text-sm text-muted-foreground">
              Review learner submissions across all assessments. Filter by assessment or search
              by learner name, email, or assessment title.
            </p>
          </div>
        </div>
      </div>

      <Card>
        <CardContent className="flex flex-wrap gap-3 p-4">
          <div className="relative min-w-[200px] flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              className="pl-8"
              placeholder="Search learner or assessment…"
              value={learnerSearch}
              onChange={(e) => setLearnerSearch(e.target.value)}
            />
          </div>
          <Select
            value={assessmentFilter}
            onChange={(e) => setAssessmentFilter(e.target.value)}
            className="min-w-[220px]"
          >
            <option value="">All assessments</option>
            {assessments?.map((a) => (
              <option key={a.id} value={a.id}>
                {a.title}
              </option>
            ))}
          </Select>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          Loading attempt records…
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/40 text-left text-muted-foreground">
                <th className="px-4 py-3">Learner</th>
                <th className="px-4 py-3">Assessment</th>
                <th className="px-4 py-3">Attempt</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Score</th>
                <th className="px-4 py-3">Submitted</th>
              </tr>
            </thead>
            <tbody>
              {filteredAttempts.map((a) => (
                <tr key={a.id} className="border-b last:border-0">
                  <td className="px-4 py-3">
                    <p className="font-medium">{a.userName}</p>
                    <p className="text-xs text-muted-foreground">{a.userEmail}</p>
                  </td>
                  <td className="px-4 py-3">{a.assessmentTitle}</td>
                  <td className="px-4 py-3">#{a.attemptNumber}</td>
                  <td className="px-4 py-3">
                    <Badge className={cn("text-xs", STATUS_COLORS[a.status])}>
                      {a.status}
                      {a.passed === true && " ✓"}
                      {a.passed === false && " ✗"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">{a.score !== null ? `${a.score}%` : "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {a.submittedAt ? new Date(a.submittedAt).toLocaleDateString() : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!filteredAttempts.length && (
            <p className="py-12 text-center text-muted-foreground">
              {learnerSearch || assessmentFilter
                ? "No attempts match your filters."
                : "No attempts recorded yet."}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
