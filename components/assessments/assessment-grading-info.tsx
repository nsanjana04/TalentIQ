"use client";

import { Info, Sparkles } from "lucide-react";
import type { ExamKind } from "@/lib/assessments/exam-grading-policy";
import { getExamGradingSummary } from "@/lib/assessments/exam-grading-policy";
import { cn } from "@/lib/utils";

interface AssessmentGradingInfoProps {
  kind?: ExamKind;
  aiGenerated?: boolean;
  className?: string;
  compact?: boolean;
}

export function AssessmentGradingInfo({
  kind = "module",
  aiGenerated = true,
  className,
  compact = false,
}: AssessmentGradingInfoProps) {
  const bullets = getExamGradingSummary(kind);

  return (
    <div
      className={cn(
        "rounded-lg border border-primary/15 bg-primary/5 p-4",
        className
      )}
    >
      <div className="flex items-start gap-2">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
        <div className="min-w-0 space-y-2">
          <p className="text-sm font-semibold text-foreground">
            How this assessment works
          </p>
          {aiGenerated && (
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              Questions are generated automatically from module content when you start.
            </p>
          )}
          {!compact && (
            <ul className="list-disc space-y-1 pl-4 text-xs text-muted-foreground">
              {bullets.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
