"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  useCertificateComplianceAnalytics,
  useDepartmentAnalytics,
  useEmployeeAnalytics,
  useExecutiveAnalytics,
  useLearningProgressAnalytics,
  useOrganizationAnalytics,
  useSkillGapsAnalytics,
  useTeamAnalytics,
  type AnalyticsHubFilters,
} from "@/hooks/use-analytics-hub";
import Link from "next/link";
import { ROUTES } from "@/constants/routes";
import { StatCard } from "@/components/dashboard/stat-card";
import { AiRecommendations } from "@/components/dashboard/ai-recommendations";
import { LearningTrackingPanel } from "@/components/learning/learning-tracking-panel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  AnalyticsLoader,
  CHART_ACCENT,
  CHART_DANGER,
  CHART_MUTED,
  CHART_PRIMARY,
  CHART_SUCCESS,
  CHART_WARNING,
  ScopeBadge,
  StatusBadge,
  SummaryKpis,
  tooltipStyle,
} from "./analytics-shared";
import {
  Award,
  BookOpen,
  ClipboardCheck,
  Sparkles,
  TrendingUp,
  UserCheck,
  Users,
} from "lucide-react";

export function ExecutivePanel() {
  const { data, isLoading } = useExecutiveAnalytics();
  if (isLoading) return <AnalyticsLoader />;
  if (!data) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <ScopeBadge label={data.scopeLabel} />
        <span className="text-sm text-muted-foreground">
          Workforce health: <strong>{data.workforceHealthScore}%</strong>
        </span>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Total Employees" value={data.totalEmployees.value} icon={Users} />
        <StatCard title="Active (30d)" value={data.activeEmployees.value} icon={UserCheck} iconClassName="bg-emerald-500/10" />
        <StatCard title="Workforce Health" value={`${data.workforceHealthScore}%`} icon={Sparkles} iconClassName="bg-violet-500/10" />
        <StatCard title="Compliance" value={`${data.complianceScore}%`} icon={Award} iconClassName="bg-amber-500/10" />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard title="Learning Velocity" value={`${data.learningVelocity}%`} subtitle="Completion rate this month" icon={BookOpen} />
        <StatCard title="Assessments" value={data.assessments.totalAttempts} subtitle={`${data.assessments.passRate}% pass rate`} icon={ClipboardCheck} />
        <StatCard title="Skill Readiness" value={`${data.skillReadiness.overall}%`} subtitle={`${data.skillReadiness.verifiedCount} verified skills`} icon={Sparkles} iconClassName="bg-emerald-500/10" />
      </div>

      <p className="text-sm text-muted-foreground">
        Skill, learning, and department charts live on the{" "}
        <Link href={ROUTES.DASHBOARD} className="font-medium text-primary underline-offset-4 hover:underline">
          Dashboard
        </Link>
        . Use the other analytics tabs here for organization, department, and team drill-down.
      </p>

      <AiRecommendations recommendations={data.aiRecommendations} />
    </div>
  );
}

export function OrganizationPanel() {
  const { data, isLoading } = useOrganizationAnalytics();
  if (isLoading) return <AnalyticsLoader />;
  if (!data) return null;

  return (
    <div className="space-y-6">
      <ScopeBadge label={data.scope.label} />
      <SummaryKpis summary={data.summary} />

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Headcount by Department</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={data.headcountByDepartment} dataKey="count" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={(p) => `${p.name}: ${p.value}`}>
                  {data.headcountByDepartment.map((entry) => (
                    <Cell key={entry.name} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Workforce Health Radar</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={data.workforceHealth}>
                <PolarGrid stroke={CHART_MUTED} />
                <PolarAngleAxis dataKey="dimension" tick={{ fontSize: 11 }} />
                <PolarRadiusAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
                <Radar name="Score" dataKey="score" stroke={CHART_PRIMARY} fill={CHART_PRIMARY} fillOpacity={0.35} />
                <Radar name="Target" dataKey="target" stroke={CHART_SUCCESS} fill={CHART_SUCCESS} fillOpacity={0.1} />
                <Tooltip contentStyle={tooltipStyle} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
              </RadarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Cross-Functional Performance</CardTitle>
        </CardHeader>
        <CardContent className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.crossFunctional}>
              <CartesianGrid strokeDasharray="3 3" stroke={CHART_MUTED} vertical={false} />
              <XAxis dataKey="department" tick={{ fontSize: 10 }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={tooltipStyle} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="skillReadiness" fill={CHART_PRIMARY} name="Skills" radius={[4, 4, 0, 0]} />
              <Bar dataKey="learningProgress" fill={CHART_ACCENT} name="Learning" radius={[4, 4, 0, 0]} />
              <Bar dataKey="assessmentPassRate" fill={CHART_SUCCESS} name="Assessments" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Organization Growth Trend</CardTitle>
        </CardHeader>
        <CardContent className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={data.growthTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke={CHART_MUTED} vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis yAxisId="left" tick={{ fontSize: 11 }} />
              <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={tooltipStyle} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Area yAxisId="left" type="monotone" dataKey="employees" fill={CHART_PRIMARY} fillOpacity={0.15} stroke={CHART_PRIMARY} name="Employees" />
              <Bar yAxisId="right" dataKey="completions" fill={CHART_SUCCESS} name="Completions" radius={[4, 4, 0, 0]} />
              <Line yAxisId="right" type="monotone" dataKey="certifications" stroke={CHART_ACCENT} strokeWidth={2} name="Certifications" />
            </ComposedChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}

export function DepartmentPanel({ filters }: { filters: AnalyticsHubFilters }) {
  const { data, isLoading } = useDepartmentAnalytics(filters);
  if (isLoading) return <AnalyticsLoader />;
  if (!data) return null;

  return (
    <div className="space-y-6">
      <ScopeBadge label={data.scope.label} />
      <SummaryKpis summary={data.summary} />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Department Performance Matrix</CardTitle>
        </CardHeader>
        <CardContent className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.performanceMatrix} layout="vertical" margin={{ left: 24 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={CHART_MUTED} horizontal={false} />
              <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11 }} />
              <YAxis type="category" dataKey="name" width={110} tick={{ fontSize: 10 }} />
              <Tooltip contentStyle={tooltipStyle} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="skillReadiness" fill={CHART_PRIMARY} name="Skills" />
              <Bar dataKey="learningProgress" fill={CHART_ACCENT} name="Learning" />
              <Bar dataKey="assessmentPassRate" fill={CHART_SUCCESS} name="Assessments" />
              <Bar dataKey="certCompliance" fill={CHART_WARNING} name="Compliance" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Headcount Trend</CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.headcountTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke={CHART_MUTED} vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={tooltipStyle} />
                <Area type="monotone" dataKey="employees" stroke={CHART_PRIMARY} fill={CHART_PRIMARY} fillOpacity={0.2} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Department Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="max-h-64 space-y-3 overflow-y-auto">
            {data.items.map((d) => (
              <div key={d.id} className="space-y-1 rounded-lg border p-3">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{d.name}</span>
                  <span className="text-xs text-muted-foreground">{d.employees} employees</span>
                </div>
                <Progress value={d.skillReadiness} />
                <div className="flex gap-3 text-xs text-muted-foreground">
                  <span>Learning {d.learningProgress}%</span>
                  <span>Assessments {d.assessmentPassRate}%</span>
                  <span>{d.promotionReady} role-ready</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export function TeamPanel({ filters }: { filters: AnalyticsHubFilters }) {
  const { data, isLoading } = useTeamAnalytics(filters);
  if (isLoading) return <AnalyticsLoader />;
  if (!data) return null;

  return (
    <div className="space-y-6">
      <ScopeBadge label={data.scope.label} />
      <SummaryKpis summary={data.summary} />

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Team Comparison</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.comparison}>
                <CartesianGrid strokeDasharray="3 3" stroke={CHART_MUTED} vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={tooltipStyle} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="readiness" fill={CHART_PRIMARY} name="Skills" radius={[4, 4, 0, 0]} />
                <Bar dataKey="learning" fill={CHART_ACCENT} name="Learning" radius={[4, 4, 0, 0]} />
                <Bar dataKey="assessments" fill={CHART_SUCCESS} name="Assessments" radius={[4, 4, 0, 0]} />
                <Bar dataKey="compliance" fill={CHART_WARNING} name="Compliance" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Team Health Radar</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={data.radarMetrics} cx="50%" cy="50%" outerRadius="75%">
                <PolarGrid stroke={CHART_MUTED} />
                <PolarAngleAxis dataKey="metric" tick={{ fontSize: 11 }} />
                <PolarRadiusAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
                <Radar dataKey="value" stroke={CHART_PRIMARY} fill={CHART_PRIMARY} fillOpacity={0.4} />
                <Tooltip contentStyle={tooltipStyle} />
              </RadarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Team Details</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-muted-foreground">
                <th className="pb-2 pr-4">Team</th>
                <th className="pb-2 pr-4">Department</th>
                <th className="pb-2 pr-4">Members</th>
                <th className="pb-2 pr-4">Readiness</th>
                <th className="pb-2 pr-4">Learning</th>
                <th className="pb-2">Promotion Ready</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((t) => (
                <tr key={t.id} className="border-b border-border/50">
                  <td className="py-2.5 pr-4 font-medium">{t.name}</td>
                  <td className="py-2.5 pr-4 text-muted-foreground">{t.department}</td>
                  <td className="py-2.5 pr-4">{t.members}</td>
                  <td className="py-2.5 pr-4">{t.skillReadiness}%</td>
                  <td className="py-2.5 pr-4">{t.learningProgress}%</td>
                  <td className="py-2.5">{t.promotionReady}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}

export function EmployeePanel({ filters }: { filters: AnalyticsHubFilters }) {
  const { data, isLoading } = useEmployeeAnalytics(filters);
  if (isLoading) return <AnalyticsLoader />;
  if (!data) return null;

  return (
    <div className="space-y-6">
      <ScopeBadge label={data.scope.label} />
      <SummaryKpis summary={data.summary} />

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Readiness Distribution</CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.readinessDistribution}>
                <CartesianGrid strokeDasharray="3 3" stroke={CHART_MUTED} vertical={false} />
                <XAxis dataKey="range" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {data.readinessDistribution.map((entry) => (
                    <Cell key={entry.range} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">By Department</CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.byDepartment} layout="vertical" margin={{ left: 16 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={CHART_MUTED} horizontal={false} />
                <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 10 }} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="avgReadiness" fill={CHART_PRIMARY} name="Avg Readiness" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Employee Analytics</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-muted-foreground">
                <th className="pb-2 pr-4">Employee</th>
                <th className="pb-2 pr-4">Department</th>
                <th className="pb-2 pr-4">Skills</th>
                <th className="pb-2 pr-4">Learning</th>
                <th className="pb-2 pr-4">Assessments</th>
                <th className="pb-2 pr-4">Compliance</th>
              </tr>
            </thead>
            <tbody>
              {data.items.slice(0, 30).map((e) => (
                <tr key={e.id} className="border-b border-border/50">
                  <td className="py-2.5 pr-4">
                    <div className="font-medium">{e.name}</div>
                    <div className="text-xs text-muted-foreground">{e.jobRole ?? "—"}</div>
                  </td>
                  <td className="py-2.5 pr-4 text-muted-foreground">{e.department ?? "—"}</td>
                  <td className="py-2.5 pr-4">{e.skillReadiness}%</td>
                  <td className="py-2.5 pr-4">{e.learningProgress}%</td>
                  <td className="py-2.5 pr-4">{e.assessmentPassRate}%</td>
                  <td className="py-2.5 pr-4">{e.certCompliance}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}

export function SkillGapsPanel({ filters }: { filters: AnalyticsHubFilters }) {
  const { data, isLoading } = useSkillGapsAnalytics(filters);
  if (isLoading) return <AnalyticsLoader />;
  if (!data) return null;

  const { gapAnalysis } = data;

  return (
    <div className="space-y-6">
      <ScopeBadge label={data.scope.label} />

      <div className="grid gap-3 sm:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Critical Gaps</p>
            <p className="text-2xl font-bold text-destructive">{gapAnalysis.bySeverity.critical}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Moderate Gaps</p>
            <p className="text-2xl font-bold text-amber-600">{gapAnalysis.bySeverity.moderate}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Minor Gaps</p>
            <p className="text-2xl font-bold">{gapAnalysis.bySeverity.minor}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Top Skill Gaps</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={gapAnalysis.topGaps}>
                <CartesianGrid strokeDasharray="3 3" stroke={CHART_MUTED} vertical={false} />
                <XAxis dataKey="skillName" tick={{ fontSize: 9 }} angle={-20} textAnchor="end" height={60} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="count" fill={CHART_DANGER} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Gap Closure Trend</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={data.trend}>
                <CartesianGrid strokeDasharray="3 3" stroke={CHART_MUTED} vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={tooltipStyle} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="gaps" fill={CHART_DANGER} name="Open Gaps" radius={[4, 4, 0, 0]} />
                <Line type="monotone" dataKey="closed" stroke={CHART_SUCCESS} strokeWidth={2} name="Closed" />
              </ComposedChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Gap Details</CardTitle>
        </CardHeader>
        <CardContent className="max-h-80 space-y-2 overflow-y-auto">
          {gapAnalysis.items.slice(0, 25).map((g) => (
            <div key={g.id} className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm">
              <div>
                <span className="font-medium">{g.entityName}</span>
                <span className="mx-2 text-muted-foreground">·</span>
                <span>{g.skillName}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">
                  {g.actualLevel ?? "None"} → {g.requiredLevel}
                </span>
                <StatusBadge status={g.severity === "critical" ? "not_ready" : g.severity === "moderate" ? "developing" : "ready"} />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

export function LearningProgressPanel({ filters }: { filters: AnalyticsHubFilters }) {
  const { data, isLoading } = useLearningProgressAnalytics(filters);
  if (isLoading) return <AnalyticsLoader />;
  if (!data) return null;

  return (
    <div className="space-y-6">
      <LearningTrackingPanel variant="analytics" />
      <ScopeBadge label={data.scope.label} />
      <SummaryKpis summary={data.summary} />

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Learning Funnel</CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={data.funnel.filter((f) => f.count > 0)} dataKey="count" nameKey="stage" cx="50%" cy="50%" innerRadius={50} outerRadius={80} label={(p) => `${p.name}: ${p.value}`}>
                  {data.funnel.map((f) => (
                    <Cell key={f.stage} fill={f.fill} />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Time Spent Learning</CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.timeSpent}>
                <CartesianGrid strokeDasharray="3 3" stroke={CHART_MUTED} vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={tooltipStyle} />
                <Area type="monotone" dataKey="hours" stroke={CHART_ACCENT} fill={CHART_ACCENT} fillOpacity={0.25} name="Hours" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Enrollment & Completion Trend</CardTitle>
        </CardHeader>
        <CardContent className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={data.trend}>
              <CartesianGrid strokeDasharray="3 3" stroke={CHART_MUTED} vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis yAxisId="left" tick={{ fontSize: 11 }} />
              <YAxis yAxisId="right" orientation="right" domain={[0, 100]} tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={tooltipStyle} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar yAxisId="left" dataKey="enrolled" fill={CHART_PRIMARY} name="Enrolled" radius={[4, 4, 0, 0]} />
              <Bar yAxisId="left" dataKey="completed" fill={CHART_SUCCESS} name="Completed" radius={[4, 4, 0, 0]} />
              <Line yAxisId="right" type="monotone" dataKey="avgProgress" stroke={CHART_ACCENT} strokeWidth={2} name="Avg Progress %" />
            </ComposedChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">By Department</CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.byDepartment}>
                <CartesianGrid strokeDasharray="3 3" stroke={CHART_MUTED} vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 9 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={tooltipStyle} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="enrolled" fill={CHART_PRIMARY} name="Enrolled" />
                <Bar dataKey="completed" fill={CHART_SUCCESS} name="Completed" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Top Courses</CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.byCourse} layout="vertical" margin={{ left: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={CHART_MUTED} horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 9 }} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="enrollments" fill={CHART_PRIMARY} name="Enrollments" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export function CertificateCompliancePanel({ filters }: { filters: AnalyticsHubFilters }) {
  const { data, isLoading } = useCertificateComplianceAnalytics(filters);
  if (isLoading) return <AnalyticsLoader />;
  if (!data) return null;

  return (
    <div className="space-y-6">
      <ScopeBadge label={data.scope.label} />
      <SummaryKpis summary={data.summary} />

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Certificate Status</CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={data.byStatus.filter((s) => s.count > 0)} dataKey="count" nameKey="status" cx="50%" cy="50%" outerRadius={80} label={(p) => `${p.name}: ${p.value}`}>
                  {data.byStatus.map((s) => (
                    <Cell key={s.status} fill={s.fill} />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Compliance by Department</CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.byDepartment}>
                <CartesianGrid strokeDasharray="3 3" stroke={CHART_MUTED} vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 9 }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="rate" fill={CHART_SUCCESS} name="Compliance %" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Compliance Trend</CardTitle>
        </CardHeader>
        <CardContent className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data.trend}>
              <CartesianGrid strokeDasharray="3 3" stroke={CHART_MUTED} vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={tooltipStyle} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Line type="monotone" dataKey="issued" stroke={CHART_PRIMARY} strokeWidth={2} name="Issued" />
              <Line type="monotone" dataKey="renewed" stroke={CHART_SUCCESS} strokeWidth={2} name="Renewed" />
              <Line type="monotone" dataKey="expired" stroke={CHART_DANGER} strokeWidth={2} name="Expired" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {data.nonCompliant.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Non-Compliant Records</CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="pb-2 pr-4">Employee</th>
                  <th className="pb-2 pr-4">Department</th>
                  <th className="pb-2 pr-4">Template</th>
                  <th className="pb-2 pr-4">Status</th>
                  <th className="pb-2">Expires</th>
                </tr>
              </thead>
              <tbody>
                {data.nonCompliant.map((r, i) => (
                  <tr key={i} className="border-b border-border/50">
                    <td className="py-2.5 pr-4 font-medium">{r.userName}</td>
                    <td className="py-2.5 pr-4 text-muted-foreground">{r.department}</td>
                    <td className="py-2.5 pr-4">{r.templateName}</td>
                    <td className="py-2.5 pr-4">{r.status}</td>
                    <td className="py-2.5">{r.expiresAt ? new Date(r.expiresAt).toLocaleDateString() : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
