"use client";

import Link from "next/link";
import {
  Award,
  BarChart3,
  BookOpen,
  ClipboardCheck,
  Sparkles,
  User,
} from "lucide-react";
import type { EmployeeDrilldownLinks, EmployeeIntelSnapshot } from "@/types/employee-intelligence";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { RiskBadge } from "@/components/enterprise/status-badges";

interface EmployeeDrilldownCardProps {
  employee: EmployeeIntelSnapshot;
  rank?: number;
  matchReason?: string;
  relevanceScore?: number;
  confidence?: number;
  selected?: boolean;
  onCompareSelect?: (id: string) => void;
}

export function EmployeeDrilldownCard({
  employee: e,
  rank,
  matchReason,
  relevanceScore,
  confidence,
  selected,
  onCompareSelect,
}: EmployeeDrilldownCardProps) {
  return (
    <article
      className={`enterprise-panel space-y-4 p-4 ${selected ? "border-primary ring-1 ring-primary/20" : ""}`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            {rank != null && (
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                {rank}
              </span>
            )}
            <Link href={e.profileHref} className="font-semibold hover:text-primary hover:underline">
              {e.employeeName}
            </Link>
            <Badge variant="outline" className="font-mono text-[10px]">
              {e.employeeId.slice(0, 8)}
            </Badge>
            <RiskBadge level={e.riskLevel} />
          </div>
          {matchReason && <p className="mt-1 text-xs text-primary">{matchReason}</p>}
        </div>
        {(relevanceScore != null || confidence != null) && (
          <div className="text-right text-xs text-muted-foreground">
            {relevanceScore != null && (
              <p>
                Relevance <strong className="text-foreground">{relevanceScore}</strong>
              </p>
            )}
            {confidence != null && (
              <p>
                Confidence <strong className="text-foreground">{confidence}%</strong>
              </p>
            )}
          </div>
        )}
      </div>

      <dl className="grid gap-2 text-sm sm:grid-cols-2 lg:grid-cols-3">
        <Field label="Role" value={e.role} />
        <Field label="Department" value={e.department ?? "—"} />
        <Field label="Manager" value={e.manager ?? "—"} />
        <Field label="Readiness Score" value={`${e.readinessScore}%`} />
        <Field label="Performance Score" value={`${e.performanceScore}%`} />
        <Field label="Skills Verified" value={String(e.skillsVerified)} />
        <Field label="Certificates" value={String(e.activeCertCount)} />
        <Field label="Learning Completion" value={`${e.learningCompletion}%`} />
        <Field label="Promotion Target" value={e.promotionTarget} />
      </dl>

      <Progress value={e.readinessScore} className="h-1.5" />

      <DrilldownActions links={e.drilldown} />

      {onCompareSelect && (
        <button
          type="button"
          onClick={() => onCompareSelect(e.employeeId)}
          className="text-xs font-medium text-primary hover:underline"
        >
          {selected ? "Remove from comparison" : "Add to comparison"}
        </button>
      )}
    </article>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-muted/30 px-3 py-2">
      <dt className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</dt>
      <dd className="font-medium tabular-nums">{value}</dd>
    </div>
  );
}

const DRILL_ACTIONS: {
  key: keyof EmployeeDrilldownLinks;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  { key: "profile", label: "View Profile", icon: User },
  { key: "skills", label: "View Skills", icon: Sparkles },
  { key: "learning", label: "View Learning", icon: BookOpen },
  { key: "assessments", label: "View Assessments", icon: ClipboardCheck },
  { key: "certificates", label: "View Certificates", icon: Award },
  { key: "performance", label: "View Performance", icon: BarChart3 },
];

export function DrilldownActions({ links }: { links: EmployeeDrilldownLinks }) {
  return (
    <div className="flex flex-wrap gap-2 border-t border-border/50 pt-3">
      {DRILL_ACTIONS.map(({ key, label, icon: Icon }) => (
        <Button key={key} variant="outline" size="sm" asChild>
          <Link href={links[key]}>
            <Icon className="mr-1.5 h-3.5 w-3.5" />
            {label}
          </Link>
        </Button>
      ))}
    </div>
  );
}
