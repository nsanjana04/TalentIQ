export interface SuccessionRoleView {
  id: string;
  title: string;
  department: string | null;
  holder: { id: string; name: string } | null;
  retirementRiskScore: number;
  attritionRiskScore: number;
  benchStrength: number;
  coverageScore: number;
  riskScore: number;
  readyNow: SuccessionCandidateView[];
  ready6Months: SuccessionCandidateView[];
  ready12Months: SuccessionCandidateView[];
}

export interface SuccessionCandidateView {
  id: string;
  candidateId: string;
  name: string;
  readiness: string;
  readinessScore: number;
  skillGapSummary: string | null;
  profileHref: string;
}

export interface ForecastView {
  id: string;
  category: string;
  modelType: string;
  department: string | null;
  skill: string | null;
  horizonMonths: number;
  predictedValue: number;
  confidence: number;
  drivers: { factor: string; impact: number }[];
  recommendations: string[];
  generatedAt: string;
}

export interface WarRoomData {
  scopeLabel: string;
  topRisks: { label: string; severity: string; count: number; href: string }[];
  complianceRisks: { expiringSoon: number; nonCompliant: number };
  attritionRisks: { highRisk: number; critical: number };
  learningRisks: { overdue: number; inProgress: number; avgProgress: number };
  leadershipHealth: number;
  criticalAlerts: { title: string; message: string; severity: string; href: string }[];
}
