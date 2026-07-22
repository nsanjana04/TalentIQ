import type { InsightSeverity } from "@/types/ai-insights";

export type CopilotIntent =
  | "promotion_ready"
  | "succession_planning"
  | "skill_gap_analysis"
  | "certification_risk"
  | "compliance_risk"
  | "learning_progress"
  | "workforce_health"
  | "employee_search"
  | "department_analysis"
  | "attrition_risk";

export interface EmployeeSkillScore {
  skillId: string;
  skillName: string;
  level: string;
  levelRank: number;
  score: number;
  verified: boolean;
}

export interface EmployeeCertificationIntel {
  id: string;
  certificateNumber: string;
  templateName: string;
  status: string;
  issuedAt: string;
  expiresAt: string | null;
  daysUntilExpiry: number | null;
}

export interface EmployeeDrilldownLinks {
  profile: string;
  skills: string;
  learning: string;
  assessments: string;
  certificates: string;
  performance: string;
}

export interface EmployeeIntelSnapshot {
  employeeId: string;
  employeeName: string;
  email: string;
  role: string;
  roleSlug: string;
  department: string | null;
  departmentId: string | null;
  team: string | null;
  teamId: string | null;
  manager: string | null;
  managerId: string | null;
  jobTitle: string | null;
  readinessScore: number;
  performanceScore: number;
  skillScores: EmployeeSkillScore[];
  skillsVerified: number;
  certifications: EmployeeCertificationIntel[];
  learningProgress: number;
  learningCompletion: number;
  assessmentPassRate: number;
  promotionScore: number;
  promotionStatus: "ready" | "developing" | "not_ready";
  promotionTarget: string;
  riskScore: number;
  riskLevel: "critical" | "high" | "medium" | "low" | "none";
  activeCertCount: number;
  expiringCertCount: number;
  daysSinceLogin: number | null;
  recommendations: string[];
  profileHref: string;
  drilldown: EmployeeDrilldownLinks;
}

export interface AiSourceReference {
  table: string;
  field: string;
  description: string;
}

export interface DataSourceCounts {
  employees: number;
  performanceReviews: number;
  certifications: number;
  skillRecords: number;
  enrollments: number;
}

export interface RankedEmployeeResult {
  employee: EmployeeIntelSnapshot;
  relevanceScore: number;
  confidence: number;
  sources: AiSourceReference[];
  matchReason: string;
}

export type AiResponseCardType =
  | "promotion_ready"
  | "succession_planning"
  | "skill_gap_analysis"
  | "certification_risk"
  | "compliance_risk"
  | "learning_progress"
  | "workforce_health"
  | "employee_search"
  | "department_analysis"
  | "attrition_risk";

export interface DrillDownNode {
  type: "organization" | "department" | "team" | "employee";
  id: string;
  label: string;
  href?: string;
  count?: number;
  children?: DrillDownNode[];
}

export interface AiResponseCard {
  id: string;
  cardType: AiResponseCardType;
  title: string;
  summary: string;
  severity: InsightSeverity;
  employees: RankedEmployeeResult[];
  drillDown: DrillDownNode;
  confidence: number;
  sources: AiSourceReference[];
}

export interface CopilotQueryResponse {
  query: string;
  scopeLabel: string;
  intent: CopilotIntent;
  headline: string;
  narrative: string;
  structured: import("@/lib/ai/structured-response").CopilotStructuredResponse;
  cards: AiResponseCard[];
  rankedEmployees: RankedEmployeeResult[];
  drillDown: DrillDownNode;
  generatedAt: string;
  dataSources: DataSourceCounts;
  confidence: number;
}

export interface Employee360Profile extends EmployeeIntelSnapshot {
  firstName: string;
  lastName: string;
  isActive: boolean;
  experienceLevel: string | null;
  aiInsights: {
    summary: string;
    recommendations: string[];
    confidence: number;
    sources: AiSourceReference[];
  };
  assessments: {
    id: string;
    title: string;
    score: number | null;
    maxScore: number | null;
    passed: boolean | null;
    status: string;
    submittedAt: string | null;
  }[];
  enrollments: {
    id: string;
    courseTitle: string;
    progress: number;
    status: string;
  }[];
  learningProfile?: import("@/types/learning-lrs").EmployeeLearningProfile;
  activityTimeline: {
    id: string;
    action: string;
    description: string;
    createdAt: string;
  }[];
  successionScore: number;
}

export type CopilotExportFormat = "csv" | "xlsx" | "pdf";
