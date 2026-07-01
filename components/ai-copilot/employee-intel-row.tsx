"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import type { RankedEmployeeResult } from "@/types/employee-intelligence";
import { RiskBadge } from "@/components/enterprise/status-badges";
import { cn } from "@/lib/utils";

interface EmployeeIntelRowProps {
  result: RankedEmployeeResult;
  rank: number;
  selected?: boolean;
  onSelect?: (id: string) => void;
  className?: string;
}

export function EmployeeIntelRow({
  result,
  rank,
  selected,
  onSelect,
  className,
}: EmployeeIntelRowProps) {
  const { employee: e } = result;

  return (
    <div
      className={cn(
        "enterprise-panel flex flex-col gap-3 p-4 transition-all hover:border-primary/30",
        selected && "border-primary ring-1 ring-primary/20",
        className
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
              {rank}
            </span>
            <Link
              href={e.profileHref}
              className="truncate font-semibold text-foreground hover:text-primary hover:underline"
            >
              {e.employeeName}
            </Link>
            <Badge variant="outline" className="font-mono text-[10px]">
              {e.employeeId.slice(0, 8)}
            </Badge>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            {e.role}
            {e.department ? ` · ${e.department}` : ""}
            {e.team ? ` · ${e.team}` : ""}
            {e.manager ? ` · Mgr: ${e.manager}` : ""}
          </p>
          <p className="mt-1 text-xs text-primary">{result.matchReason}</p>
        </div>
        <div className="flex flex-col items-end gap-1 text-xs">
          <span className="text-muted-foreground">
            Relevance <strong className="tabular-nums text-foreground">{result.relevanceScore}</strong>
          </span>
          <span className="text-muted-foreground">
            Confidence <strong className="tabular-nums text-foreground">{result.confidence}%</strong>
          </span>
          <RiskBadge level={e.riskLevel} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Metric label="Readiness" value={`${e.readinessScore}%`} />
        <Metric label="Risk" value={`${e.riskScore}%`} />
        <Metric label="Learning" value={`${e.learningProgress}%`} />
        <Metric label="Promotion" value={`${e.promotionScore}%`} />
      </div>

      {e.skillScores.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {e.skillScores.slice(0, 4).map((s) => (
            <Badge key={s.skillId} variant="secondary" className="text-[10px]">
              {s.skillName}: {s.score}%
            </Badge>
          ))}
          {e.skillScores.length > 4 && (
            <Badge variant="outline" className="text-[10px]">
              +{e.skillScores.length - 4} skills
            </Badge>
          )}
        </div>
      )}

      <div>
        <div className="mb-1 flex justify-between text-xs">
          <span className="text-muted-foreground">Readiness index</span>
          <span className="font-medium tabular-nums">{e.readinessScore}%</span>
        </div>
        <Progress value={e.readinessScore} className="h-1.5" />
      </div>

      {onSelect && (
        <button
          type="button"
          onClick={() => onSelect(e.employeeId)}
          className="text-left text-xs font-medium text-primary hover:underline"
        >
          Add to comparison
        </button>
      )}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-muted/40 px-2 py-1.5">
      <p className="text-[10px] uppercase text-muted-foreground">{label}</p>
      <p className="text-sm font-semibold tabular-nums">{value}</p>
    </div>
  );
}
