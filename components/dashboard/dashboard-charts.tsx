"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type {
  AssessmentsData,
  CertificatesData,
  DepartmentPerformance,
  LearningProgressData,
  SkillReadinessData,
} from "@/types/dashboard";
import { ChartCard } from "./chart-card";
import { EmptyState } from "./empty-state";
import { ReadinessProgressRow } from "./readiness-progress-row";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  BarChart3,
  BookOpen,
  ClipboardCheck,
  Award,
  TrendingUp,
  Building2,
} from "lucide-react";

import { CHART_COLORS, tooltipStyle } from "@/lib/design/tokens";

const CHART_PRIMARY = CHART_COLORS.primary;
const CHART_SUCCESS = CHART_COLORS.success;
const CHART_ACCENT = CHART_COLORS.accent;
const CHART_MUTED = CHART_COLORS.muted;

interface SkillReadinessChartProps {
  data: SkillReadinessData;
}

export function SkillReadinessChart({ data }: SkillReadinessChartProps) {
  return (
    <ChartCard
      title="Skill Readiness"
      description="Average proficiency across skill categories"
      action={
        <Badge variant="secondary" className="text-sm font-bold">
          {data.overall}%
        </Badge>
      }
    >
      {data.byCategory.length === 0 ? (
        <EmptyState
          icon={BarChart3}
          title="No skill data yet"
          description="Employee skills will appear here once assigned."
        />
      ) : (
        <div className="space-y-4">
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={data.trend}>
              <defs>
                <linearGradient id="readinessGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={CHART_PRIMARY} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={CHART_PRIMARY} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={CHART_MUTED} vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={tooltipStyle} />
              <Area
                type="monotone"
                dataKey="readiness"
                stroke={CHART_PRIMARY}
                fill="url(#readinessGrad)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
          <div className="space-y-2">
            {data.byCategory.slice(0, 4).map((cat) => (
              <div key={cat.name} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="font-medium">{cat.name}</span>
                  <span className="text-muted-foreground">{cat.readiness}%</span>
                </div>
                <Progress value={cat.readiness} />
              </div>
            ))}
          </div>
        </div>
      )}
    </ChartCard>
  );
}

interface LearningProgressChartProps {
  data: LearningProgressData;
}

export function LearningProgressChart({ data }: LearningProgressChartProps) {
  return (
    <ChartCard
      title="Learning Progress"
      description="Course enrollments and completions"
      action={
        <Badge variant="success">{data.avgProgress}% avg</Badge>
      }
    >
      {data.enrolled === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="No enrollments yet"
          description="Learning activity will show here once courses are assigned."
        />
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-2 text-center sm:gap-3">
            <div className="rounded-lg bg-muted/50 p-3">
              <p className="text-2xl font-bold">{data.enrolled}</p>
              <p className="text-xs text-muted-foreground">Enrolled</p>
            </div>
            <div className="rounded-lg bg-muted/50 p-3">
              <p className="text-2xl font-bold text-amber-600">{data.inProgress}</p>
              <p className="text-xs text-muted-foreground">In Progress</p>
            </div>
            <div className="rounded-lg bg-muted/50 p-3">
              <p className="text-2xl font-bold text-emerald-600">{data.completed}</p>
              <p className="text-xs text-muted-foreground">Completed</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={data.trend}>
              <CartesianGrid strokeDasharray="3 3" stroke={CHART_MUTED} vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={tooltipStyle} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="enrolled" fill={CHART_PRIMARY} radius={[4, 4, 0, 0]} name="Enrolled" />
              <Bar dataKey="completed" fill={CHART_SUCCESS} radius={[4, 4, 0, 0]} name="Completed" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </ChartCard>
  );
}

interface AssessmentsChartProps {
  data: AssessmentsData;
}

export function AssessmentsChart({ data }: AssessmentsChartProps) {
  return (
    <ChartCard
      title="Assessments"
      description="Attempt outcomes and pass rates"
      action={
        <Badge variant={data.passRate >= 70 ? "success" : "warning"}>
          {data.passRate}% pass
        </Badge>
      }
    >
      {data.totalAttempts === 0 ? (
        <EmptyState
          icon={ClipboardCheck}
          title="No assessments taken"
          description="Assessment results will appear once employees complete evaluations."
        />
      ) : (
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="w-full sm:max-w-[50%]">
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={data.byStatus}
                dataKey="count"
                nameKey="status"
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={3}
              >
                {data.byStatus.map((entry, i) => (
                  <Cell key={i} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip contentStyle={tooltipStyle} />
            </PieChart>
          </ResponsiveContainer>
          </div>
          <div className="flex-1 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-2xl font-bold">{data.totalAttempts}</p>
                <p className="text-xs text-muted-foreground">Total Attempts</p>
              </div>
              <div>
                <p className="text-2xl font-bold">{data.avgScore}%</p>
                <p className="text-xs text-muted-foreground">Avg Score</p>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={100}>
              <LineChart data={data.trend}>
                <XAxis dataKey="month" tick={{ fontSize: 10 }} hide />
                <Tooltip contentStyle={tooltipStyle} />
                <Line
                  type="monotone"
                  dataKey="passRate"
                  stroke={CHART_SUCCESS}
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </ChartCard>
  );
}

interface CertificatesChartProps {
  data: CertificatesData;
}

export function CertificatesChart({ data }: CertificatesChartProps) {
  return (
    <ChartCard
      title="Certificates"
      description="Issued credentials and expirations"
      action={
        data.expiringSoon > 0 ? (
          <Badge variant="warning">{data.expiringSoon} expiring</Badge>
        ) : (
          <Badge variant="success">{data.active} active</Badge>
        )
      }
    >
      {data.total === 0 ? (
        <EmptyState
          icon={Award}
          title="No certificates issued"
          description="Certificates will appear after employees pass assessments."
        />
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={data.trend}>
            <CartesianGrid strokeDasharray="3 3" stroke={CHART_MUTED} vertical={false} />
            <XAxis dataKey="month" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={tooltipStyle} />
            <Bar dataKey="issued" fill={CHART_ACCENT} radius={[4, 4, 0, 0]} name="Issued" />
          </BarChart>
        </ResponsiveContainer>
      )}
    </ChartCard>
  );
}

interface DepartmentPerformanceChartProps {
  data: DepartmentPerformance[];
}

export function DepartmentPerformanceChart({ data }: DepartmentPerformanceChartProps) {
  return (
    <ChartCard
      title="Department Performance"
      description="Cross-functional workforce metrics by department"
      className="lg:col-span-2"
    >
      {data.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="No department data"
          description="Department metrics are available for organization and department scopes."
        />
      ) : (
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={data} layout="vertical" margin={{ left: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={CHART_MUTED} horizontal={false} />
            <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11 }} />
            <YAxis
              type="category"
              dataKey="name"
              tick={{ fontSize: 11 }}
              width={100}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip contentStyle={tooltipStyle} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Bar dataKey="skillReadiness" fill={CHART_PRIMARY} name="Skills %" radius={[0, 4, 4, 0]} />
            <Bar dataKey="learningProgress" fill={CHART_ACCENT} name="Learning %" radius={[0, 4, 4, 0]} />
            <Bar dataKey="assessmentPassRate" fill={CHART_SUCCESS} name="Assessments %" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </ChartCard>
  );
}
