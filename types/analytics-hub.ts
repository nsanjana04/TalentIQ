import type { DashboardScopeType } from "@/lib/dashboard/scope";
import type { DashboardOverview } from "@/types/dashboard";
import type { GapAnalysis, ReadinessScores } from "@/types/skill-matrix";

export interface AnalyticsScope {
  type: DashboardScopeType;
  label: string;
}

export interface AnalyticsFilters {
  departmentId?: string;
  teamId?: string;
}

export interface MetricSummary {
  label: string;
  value: number;
  unit?: string;
  change?: number;
  changeLabel?: string;
}

export interface EmployeeAnalyticsItem {
  id: string;
  name: string;
  email: string;
  department: string | null;
  team: string | null;
  jobRole: string | null;
  skillReadiness: number;
  learningProgress: number;
  assessmentPassRate: number;
  certCompliance: number;
  promotionScore: number;
  promotionStatus: "ready" | "developing" | "not_ready";
}

export interface EmployeeAnalytics {
  scope: AnalyticsScope;
  summary: MetricSummary[];
  items: EmployeeAnalyticsItem[];
  readinessDistribution: { range: string; count: number; fill: string }[];
  topPerformers: { name: string; score: number }[];
  byDepartment: { name: string; avgReadiness: number; employees: number }[];
}

export interface TeamAnalyticsItem {
  id: string;
  name: string;
  department: string;
  members: number;
  skillReadiness: number;
  learningProgress: number;
  assessmentPassRate: number;
  certCompliance: number;
  promotionReady: number;
}

export interface TeamAnalytics {
  scope: AnalyticsScope;
  summary: MetricSummary[];
  items: TeamAnalyticsItem[];
  comparison: { name: string; readiness: number; learning: number; assessments: number; compliance: number }[];
  radarMetrics: { metric: string; value: number }[];
}

export interface DepartmentAnalyticsItem {
  id: string;
  name: string;
  code: string;
  employees: number;
  teams: number;
  skillReadiness: number;
  learningProgress: number;
  assessmentPassRate: number;
  certCompliance: number;
  promotionReady: number;
}

export interface DepartmentAnalytics {
  scope: AnalyticsScope;
  summary: MetricSummary[];
  items: DepartmentAnalyticsItem[];
  performanceMatrix: { name: string; skillReadiness: number; learningProgress: number; assessmentPassRate: number; certCompliance: number }[];
  headcountTrend: { month: string; employees: number }[];
}

export interface OrganizationAnalytics {
  scope: AnalyticsScope;
  summary: MetricSummary[];
  headcountByDepartment: { name: string; count: number; fill: string }[];
  workforceHealth: { dimension: string; score: number; target: number }[];
  crossFunctional: { department: string; skillReadiness: number; learningProgress: number; assessmentPassRate: number }[];
  growthTrend: { month: string; employees: number; completions: number; certifications: number }[];
}

export interface LearningProgressAnalytics {
  scope: AnalyticsScope;
  summary: MetricSummary[];
  funnel: { stage: string; count: number; fill: string }[];
  byDepartment: { name: string; enrolled: number; completed: number; avgProgress: number }[];
  byCourse: { name: string; enrollments: number; completions: number; avgProgress: number }[];
  trend: { month: string; enrolled: number; completed: number; avgProgress: number }[];
  timeSpent: { month: string; hours: number }[];
}

export interface CertificateComplianceAnalytics {
  scope: AnalyticsScope;
  summary: MetricSummary[];
  complianceRate: number;
  byStatus: { status: string; count: number; fill: string }[];
  byDepartment: { name: string; compliant: number; total: number; rate: number }[];
  byTemplate: { name: string; active: number; expired: number; expiringSoon: number }[];
  nonCompliant: { userName: string; department: string; templateName: string; status: string; expiresAt: string | null }[];
  trend: { month: string; issued: number; renewed: number; expired: number }[];
}

export interface SkillGapsAnalytics {
  scope: AnalyticsScope;
  gapAnalysis: GapAnalysis;
  heatmapPreview: { skill: string; critical: number; moderate: number; minor: number }[];
  trend: { month: string; gaps: number; closed: number }[];
}

export interface ExecutiveAnalytics extends DashboardOverview {
  workforceHealthScore: number;
  complianceScore: number;
  learningVelocity: number;
}
