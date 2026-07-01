export interface MetricDelta {
  value: number;
  change?: number;
  changeLabel?: string;
}

export interface SkillReadinessData {
  overall: number;
  verifiedCount: number;
  totalSkills: number;
  byCategory: { name: string; readiness: number; count: number }[];
  trend: { month: string; readiness: number }[];
}

export interface LearningProgressData {
  enrolled: number;
  inProgress: number;
  completed: number;
  dropped: number;
  avgProgress: number;
  trend: { month: string; enrolled: number; completed: number }[];
  topCourses: { name: string; enrollments: number; avgProgress: number }[];
}

export interface AssessmentsData {
  totalAttempts: number;
  passRate: number;
  avgScore: number;
  byStatus: { status: string; count: number; fill: string }[];
  trend: { month: string; attempts: number; passRate: number }[];
}

export interface CertificatesData {
  total: number;
  active: number;
  expiringSoon: number;
  trend: { month: string; issued: number }[];
}

export interface DepartmentPerformance {
  name: string;
  code: string;
  employees: number;
  skillReadiness: number;
  learningProgress: number;
  assessmentPassRate: number;
}

export interface ActivityItem {
  id: string;
  type: "audit" | "notification";
  title: string;
  description: string;
  actor?: string;
  timestamp: string;
  icon: "login" | "skill" | "course" | "assessment" | "certificate" | "system";
}

export interface AiRecommendation {
  id: string;
  priority: "high" | "medium" | "low";
  title: string;
  description: string;
  action?: string;
  metric?: string;
}

export interface DashboardOverview {
  scope: "organization" | "department" | "team" | "personal";
  scopeLabel: string;
  totalEmployees: MetricDelta;
  activeEmployees: MetricDelta;
  skillReadiness: SkillReadinessData;
  learningProgress: LearningProgressData;
  assessments: AssessmentsData;
  certificates: CertificatesData;
  departmentPerformance: DepartmentPerformance[];
  recentActivity: ActivityItem[];
  aiRecommendations: AiRecommendation[];
}
