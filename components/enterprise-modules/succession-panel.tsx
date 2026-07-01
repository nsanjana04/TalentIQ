"use client";

import Link from "next/link";
import { AlertTriangle, GitBranch, Shield } from "lucide-react";
import { useSuccessionPlans } from "@/hooks/use-enterprise-modules";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

export function SuccessionPanel() {
  const { data, isLoading, isError, refetch } = useSuccessionPlans();

  if (isLoading) {
    return <Card><CardContent className="py-12 text-center text-muted-foreground">Loading succession plans…</CardContent></Card>;
  }

  if (isError || !data) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p>Unable to load succession data.</p>
          <Button className="mt-4" onClick={() => refetch()}>Retry</Button>
        </CardContent>
      </Card>
    );
  }

  const { plans, summary } = data;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Critical Roles</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold">{summary.criticalRoles}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Uncovered</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold text-destructive">{summary.uncovered}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Avg Coverage</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold">{summary.avgCoverage}%</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">High Risk</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold text-amber-600">{summary.highRisk}</p></CardContent>
        </Card>
      </div>

      {plans.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No critical roles configured. Seed data or add roles via administration.
          </CardContent>
        </Card>
      ) : (
        plans.map((role) => (
          <Card key={role.id}>
            <CardHeader>
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <GitBranch className="h-5 w-5" />
                    {role.title}
                  </CardTitle>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {role.department ?? "Organization"} · Holder: {role.holder?.name ?? "Vacant"}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Badge variant={role.riskScore >= 70 ? "danger" : "secondary"}>
                    Risk {role.riskScore}%
                  </Badge>
                  <Badge variant="outline">Coverage {role.coverageScore}%</Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <p className="text-xs text-muted-foreground">Retirement Risk</p>
                  <Progress value={role.retirementRiskScore} className="mt-1" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Attrition Risk</p>
                  <Progress value={role.attritionRiskScore} className="mt-1" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Bench Strength</p>
                  <Progress value={role.benchStrength} className="mt-1" />
                </div>
              </div>

              {[
                { label: "Ready Now", candidates: role.readyNow, icon: Shield },
                { label: "Ready in 6 Months", candidates: role.ready6Months, icon: GitBranch },
                { label: "Ready in 12 Months", candidates: role.ready12Months, icon: AlertTriangle },
              ].map(({ label, candidates, icon: Icon }) => (
                <div key={label}>
                  <p className="mb-2 flex items-center gap-1 text-sm font-medium">
                    <Icon className="h-4 w-4" /> {label} ({candidates.length})
                  </p>
                  {candidates.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No candidates in this tier.</p>
                  ) : (
                    <div className="grid gap-2 sm:grid-cols-2">
                      {candidates.map((c) => (
                        <Link
                          key={c.id}
                          href={c.profileHref}
                          className="rounded-lg border p-3 transition-colors hover:bg-muted/50"
                        >
                          <p className="font-medium">{c.name}</p>
                          <p className="text-sm text-muted-foreground">Readiness {c.readinessScore}%</p>
                          {c.skillGapSummary && (
                            <p className="mt-1 text-xs text-muted-foreground">{c.skillGapSummary}</p>
                          )}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}
