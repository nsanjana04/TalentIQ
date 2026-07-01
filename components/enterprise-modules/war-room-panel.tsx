"use client";

import Link from "next/link";
import { AlertTriangle, BookOpen, Crown, Shield } from "lucide-react";
import { useWarRoom } from "@/hooks/use-enterprise-modules";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

export function WarRoomPanel() {
  const { data, isLoading, isError, refetch } = useWarRoom();

  if (isLoading) {
    return <Card><CardContent className="py-12 text-center text-muted-foreground">Loading executive war room…</CardContent></Card>;
  }

  if (isError || !data) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p>Unable to load war room briefing.</p>
          <Button className="mt-4" onClick={() => refetch()}>Retry</Button>
        </CardContent>
      </Card>
    );
  }

  const complianceRate =
    data.complianceRisks.expiringSoon + data.complianceRisks.nonCompliant > 0
      ? Math.max(0, 100 - data.complianceRisks.nonCompliant * 5)
      : 100;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Crown className="h-6 w-6 text-primary" />
        <Badge variant="outline">{data.scopeLabel}</Badge>
        <span className="text-sm text-muted-foreground">
          Leadership health: <strong>{data.leadershipHealth}%</strong>
        </span>
      </div>

      {data.criticalAlerts.length > 0 && (
        <Card className="border-destructive/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Critical Alerts
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.criticalAlerts.map((alert) => (
              <Link
                key={alert.title}
                href={alert.href}
                className="flex items-start justify-between rounded-lg border p-3 transition-colors hover:bg-muted/50"
              >
                <div>
                  <p className="font-medium">{alert.title}</p>
                  <p className="text-sm text-muted-foreground">{alert.message}</p>
                </div>
                <Badge variant={alert.severity === "critical" ? "danger" : "secondary"}>
                  {alert.severity}
                </Badge>
              </Link>
            ))}
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {data.topRisks.map((risk) => (
          <Link key={risk.label} href={risk.href}>
            <Card className="transition-colors hover:bg-muted/30">
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground">{risk.label}</p>
                <p className="text-2xl font-bold">{risk.count}</p>
                <Badge variant="outline" className="mt-2">{risk.severity}</Badge>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Compliance
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <div className="flex justify-between text-sm">
                <span>Compliance health</span>
                <span>{complianceRate}%</span>
              </div>
              <Progress value={complianceRate} className="mt-1" />
            </div>
            <p className="text-sm text-muted-foreground">
              {data.complianceRisks.expiringSoon} certifications expiring · {data.complianceRisks.nonCompliant} non-compliant employees
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Learning & Attrition
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>{data.learningRisks.inProgress} enrollments in progress ({data.learningRisks.avgProgress}% avg)</p>
            <p>{data.learningRisks.overdue} dropped or stalled enrollments</p>
            <p>{data.attritionRisks.highRisk} employees at elevated attrition risk</p>
            <p>{data.attritionRisks.critical} employees at critical attrition risk</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
