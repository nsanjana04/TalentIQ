"use client";

import Link from "next/link";
import type { CopilotQueryResponse } from "@/types/employee-intelligence";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CopilotCardRouter } from "./copilot-card-router";
import { DataSourceFooter } from "./data-source-footer";
import { DrillDownPanel } from "./drill-down-panel";
import { ExecutiveActions } from "./executive-actions";
import { CopilotExportButtons } from "./export-buttons";
import { EmployeeComparisonView } from "./employee-comparison";

interface CopilotResponseViewProps {
  response: CopilotQueryResponse;
  compareIds: string[];
  onCompareSelect: (id: string) => void;
  comparisonEmployees?: CopilotQueryResponse["rankedEmployees"][number]["employee"][];
}

export function CopilotResponseView({
  response,
  compareIds,
  onCompareSelect,
  comparisonEmployees,
}: CopilotResponseViewProps) {
  const topEmployee = response.rankedEmployees[0]?.employee;
  const s = response.structured;

  return (
    <div className="space-y-4">
      <div className="enterprise-panel p-5">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <Badge variant="outline">{response.scopeLabel}</Badge>
          <Badge variant="secondary">{response.intent.replace(/_/g, " ")}</Badge>
          <Badge variant="outline">{response.rankedEmployees.length} employees</Badge>
          <Badge variant={s.riskLevel === "critical" || s.riskLevel === "high" ? "danger" : "outline"}>
            Risk: {s.riskLevel}
          </Badge>
          <Badge variant="outline">Confidence: {s.confidenceScore}%</Badge>
        </div>

        <h3 className="text-lg font-semibold text-foreground">{response.headline}</h3>

        <section className="mt-4 space-y-4">
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Executive Summary
            </h4>
            <p className="mt-1 text-sm leading-relaxed">{s.executiveSummary}</p>
          </div>

          {s.keyFindings.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Key Findings
              </h4>
              <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-muted-foreground">
                {s.keyFindings.map((f, i) => (
                  <li key={i}>{f}</li>
                ))}
              </ul>
            </div>
          )}

          {s.affectedEmployees.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Affected Employees
              </h4>
              <div className="mt-2 space-y-3">
                {s.affectedEmployees.slice(0, 8).map((e) => (
                  <div
                    key={e.employeeId}
                    className="rounded-xl border border-border bg-muted/20 p-3 text-sm"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <p className="font-semibold text-foreground">
                          {e.rank}. {e.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {e.jobTitle ?? e.department ?? "Employee"} · Manager: {e.manager ?? "N/A"}
                        </p>
                      </div>
                      <Button variant="outline" size="sm" asChild>
                        <Link href={e.profileHref}>View Details</Link>
                      </Button>
                    </div>
                    <div className="mt-2 grid gap-1 text-xs text-muted-foreground sm:grid-cols-2">
                      <span>Readiness: {e.readinessScore}%</span>
                      <span>Performance: {e.performanceScore}%</span>
                      <span>Promotion: {e.promotionScore}% → {e.promotionTarget}</span>
                      <span>Skills: {e.skillsCompleted}/{e.skillsTotal} verified</span>
                      <span>Learning: {e.learningProgress}%</span>
                      <span>Risk: {e.riskLevel} ({e.riskScore}%)</span>
                      {e.certifications.length > 0 && (
                        <span className="sm:col-span-2">
                          Certifications: {e.certifications.join(", ")}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {s.recommendedActions.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Recommended Actions
              </h4>
              <ul className="mt-2 list-inside list-decimal space-y-1 text-sm">
                {s.recommendedActions.map((a, i) => (
                  <li key={i}>{a}</li>
                ))}
              </ul>
            </div>
          )}
        </section>

        <DataSourceFooter
          dataSources={response.dataSources}
          confidence={response.confidence}
          generatedAt={response.generatedAt}
          className="mt-5 border-t border-border/50 pt-4"
        />
        <CopilotExportButtons query={response.query} className="mt-4" />
      </div>

      {response.cards.map((card) => (
        <CopilotCardRouter
          key={card.id}
          card={card}
          onCompareSelect={onCompareSelect}
          compareSelection={compareIds}
        />
      ))}

      {topEmployee && (
        <ExecutiveActions
          employeeId={topEmployee.employeeId}
          employeeName={topEmployee.employeeName}
          className="enterprise-panel p-4"
        />
      )}

      <DrillDownPanel node={response.drillDown} />

      {comparisonEmployees && comparisonEmployees.length >= 2 && (
        <EmployeeComparisonView employees={comparisonEmployees} className="enterprise-panel p-4" />
      )}
    </div>
  );
}
