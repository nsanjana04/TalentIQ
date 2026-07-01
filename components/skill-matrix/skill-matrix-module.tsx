"use client";

import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Building2,
  FileSpreadsheet,
  FileText,
  Grid3x3,
  Loader2,
  Shield,
  Users,
  AlertTriangle,
} from "lucide-react";
import {
  exportSkillMatrix,
  useGapAnalysis,
  useReadinessScores,
  useSkillMatrix,
  useSkillMatrixFilters,
} from "@/hooks/use-skill-matrix";
import type { ExportFormat, MatrixView } from "@/types/skill-matrix";
import { MatrixHeatmap } from "./matrix-heatmap";
import { StatPill } from "@/components/skills-admin/admin-ui";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PermissionGate } from "@/components/rbac/permission-gate";
import { cn } from "@/lib/utils";

const VIEWS: { id: MatrixView; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: "employee", label: "Employee", icon: Users },
  { id: "department", label: "Department", icon: Building2 },
  { id: "team", label: "Team", icon: Users },
  { id: "role", label: "Role", icon: Shield },
  { id: "heatmap", label: "Heatmap", icon: Grid3x3 },
];

export function SkillMatrixModule() {
  const [view, setView] = useState<MatrixView>("employee");
  const [departmentId, setDepartmentId] = useState("");
  const [teamId, setTeamId] = useState("");
  const [jobRoleId, setJobRoleId] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [exporting, setExporting] = useState<ExportFormat | null>(null);
  const [panel, setPanel] = useState<"matrix" | "gaps" | "readiness">("matrix");

  const query = useMemo(
    () => ({
      view,
      departmentId: departmentId || undefined,
      teamId: teamId || undefined,
      jobRoleId: jobRoleId || undefined,
      categoryId: categoryId || undefined,
    }),
    [view, departmentId, teamId, jobRoleId, categoryId]
  );

  const { data: filters } = useSkillMatrixFilters();
  const { data: matrix, isLoading, isFetching } = useSkillMatrix(query);
  const { data: gaps } = useGapAnalysis(query, { enabled: panel === "gaps" });
  const { data: readiness } = useReadinessScores(query, { enabled: panel === "readiness" });

  const teams = filters?.teams.filter(
    (t) => !departmentId || t.departmentId === departmentId
  );

  async function handleExport(format: ExportFormat) {
    setExporting(format);
    try {
      await exportSkillMatrix({ ...query, format });
    } finally {
      setExporting(null);
    }
  }

  return (
    <div className="space-y-6">
      {matrix && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatPill label="Entities" value={matrix.summary.totalRows} />
          <StatPill label="Skills" value={matrix.summary.totalColumns} />
          <StatPill label="Avg Readiness" value={`${matrix.summary.avgReadiness}%`} />
          <StatPill label="Gaps" value={matrix.summary.gapsCount} />
        </div>
      )}

      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap gap-1 rounded-xl bg-muted/40 p-1">
          {VIEWS.map((v) => {
            const Icon = v.icon;
            return (
              <button
                key={v.id}
                type="button"
                onClick={() => setView(v.id)}
                className={cn(
                  "flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm transition-colors",
                  view === v.id
                    ? "bg-card font-medium shadow-sm ring-1 ring-border/60"
                    : "text-muted-foreground hover:bg-card/60"
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                {v.label}
              </button>
            );
          })}
        </div>

        <PermissionGate elementId="analytics.export.button">
          <div className="flex flex-wrap gap-2">
            {(["csv", "xlsx", "pdf"] as ExportFormat[]).map((fmt) => (
              <Button
                key={fmt}
                variant="outline"
                size="sm"
                disabled={!!exporting}
                onClick={() => handleExport(fmt)}
              >
                {exporting === fmt ? (
                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                ) : fmt === "pdf" ? (
                  <FileText className="mr-1.5 h-3.5 w-3.5" />
                ) : (
                  <FileSpreadsheet className="mr-1.5 h-3.5 w-3.5" />
                )}
                {fmt.toUpperCase()}
              </Button>
            ))}
          </div>
        </PermissionGate>
      </div>

      <div className="flex flex-wrap gap-2">
        <Select value={departmentId} onChange={(e) => { setDepartmentId(e.target.value); setTeamId(""); }} className="w-full sm:w-44">
          <option value="">All departments</option>
          {filters?.departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
        </Select>
        <Select value={teamId} onChange={(e) => setTeamId(e.target.value)} className="w-full sm:w-40">
          <option value="">All teams</option>
          {teams?.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
        </Select>
        <Select value={jobRoleId} onChange={(e) => setJobRoleId(e.target.value)} className="w-full sm:w-44">
          <option value="">All roles</option>
          {filters?.jobRoles.map((r) => <option key={r.id} value={r.id}>{r.title}</option>)}
        </Select>
        <Select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className="w-full sm:w-44">
          <option value="">All categories</option>
          {filters?.categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </Select>
      </div>

      <div className="flex gap-2 border-b">
        {(["matrix", "gaps", "readiness"] as const).map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => setPanel(p)}
            className={cn(
              "border-b-2 px-4 py-2 text-sm font-medium capitalize transition-colors",
              panel === p
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            {p === "matrix" ? "Matrix View" : p === "gaps" ? "Gap Analysis" : "Readiness Scores"}
          </button>
        ))}
        {isFetching && <Loader2 className="ml-2 h-4 w-4 animate-spin self-center text-muted-foreground" />}
      </div>

      {panel === "matrix" && (
        <Card className="border-0 shadow-sm ring-1 ring-border/60">
          <CardHeader>
            <CardTitle className="text-base capitalize">
              {view} Matrix
              {matrix && (
                <Badge variant="outline" className="ml-2 font-normal">
                  {matrix.scopeLabel}
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex h-48 items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : matrix ? (
              <MatrixHeatmap data={matrix} />
            ) : null}
          </CardContent>
        </Card>
      )}

      {panel === "gaps" && gaps && (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card className="border-0 ring-1 ring-border/60">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <AlertTriangle className="h-4 w-4 text-amber-500" />
                Gap Severity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-4 grid grid-cols-3 gap-3 text-center">
                <div className="rounded-lg bg-red-500/10 p-3">
                  <p className="text-2xl font-bold text-red-600">{gaps.bySeverity.critical}</p>
                  <p className="text-xs text-muted-foreground">Critical</p>
                </div>
                <div className="rounded-lg bg-amber-500/10 p-3">
                  <p className="text-2xl font-bold text-amber-600">{gaps.bySeverity.moderate}</p>
                  <p className="text-xs text-muted-foreground">Moderate</p>
                </div>
                <div className="rounded-lg bg-blue-500/10 p-3">
                  <p className="text-2xl font-bold">{gaps.bySeverity.minor}</p>
                  <p className="text-xs text-muted-foreground">Minor</p>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={gaps.topGaps}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="skillName" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Bar dataKey="count" fill="oklch(45% 0.2 264)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="border-0 ring-1 ring-border/60">
            <CardHeader>
              <CardTitle className="text-base">Top Gaps</CardTitle>
            </CardHeader>
            <CardContent className="max-h-[360px] space-y-2 overflow-y-auto">
              {gaps.items.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">No skill gaps detected.</p>
              ) : (
                gaps.items.map((gap) => (
                  <div
                    key={gap.id}
                    className="flex items-start justify-between rounded-lg border border-border/50 p-3"
                  >
                    <div>
                      <p className="text-sm font-medium">{gap.skillName}</p>
                      <p className="text-xs text-muted-foreground">{gap.entityName}</p>
                      <p className="text-xs">
                        Required: {gap.requiredLevel} · Actual: {gap.actualLevel ?? "None"}
                      </p>
                    </div>
                    <Badge
                      variant={
                        gap.severity === "critical"
                          ? "danger"
                          : gap.severity === "moderate"
                            ? "warning"
                            : "secondary"
                      }
                    >
                      {gap.severity}
                    </Badge>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {panel === "readiness" && readiness && (
        <div className="grid gap-4 lg:grid-cols-3">
          <Card className="border-0 ring-1 ring-border/60 lg:col-span-1">
            <CardHeader>
              <CardTitle className="text-base">Overall Readiness</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center">
              <div className="relative flex h-32 w-32 items-center justify-center">
                <span className="text-4xl font-bold">{readiness.overall}%</span>
              </div>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie
                    data={readiness.distribution}
                    dataKey="count"
                    nameKey="label"
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={60}
                  >
                    {readiness.distribution.map((entry, i) => (
                      <Cell key={i} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="border-0 ring-1 ring-border/60 lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-base">Readiness Rankings</CardTitle>
            </CardHeader>
            <CardContent className="max-h-[400px] space-y-2 overflow-y-auto">
              {readiness.items.map((item, i) => (
                <div
                  key={item.id}
                  className="flex items-center gap-3 rounded-lg bg-muted/30 px-3 py-2"
                >
                  <span className="w-6 text-sm font-bold text-muted-foreground">{i + 1}</span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{item.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {item.skillsMet}/{item.skillsRequired} skills met
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-24 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-primary transition-all"
                        style={{ width: `${item.score}%` }}
                      />
                    </div>
                    <span className="w-10 text-right text-sm font-semibold">{item.score}%</span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}

      <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
        <span className="flex items-center gap-1"><span className="h-3 w-3 rounded bg-emerald-500" /> Met</span>
        <span className="flex items-center gap-1"><span className="h-3 w-3 rounded bg-blue-500" /> Exceeds</span>
        <span className="flex items-center gap-1"><span className="h-3 w-3 rounded bg-amber-400" /> Partial</span>
        <span className="flex items-center gap-1"><span className="h-3 w-3 rounded bg-red-500" /> Missing</span>
        <span className="flex items-center gap-1"><span className="h-3 w-3 rounded bg-muted" /> N/A</span>
      </div>
    </div>
  );
}
