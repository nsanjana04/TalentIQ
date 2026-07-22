export type InsightType =
  | "skill_gap"
  | "certification_risk"
  | "promotion_ready"
  | "compliance_warning"
  | "learning_recommendation"
  | "workforce_health";

export type InsightSeverity = "critical" | "high" | "medium" | "low" | "info";

export interface WorkforceInsight {
  id: string;
  type: InsightType;
  title: string;
  severity: InsightSeverity;
  summary: string;
  affectedUsers: number;
  recommendedAction: string;
  actionHref: string;
  metadata?: Record<string, string | number>;
}

export interface AiInsightsResponse {
  insights: WorkforceInsight[];
  generatedAt: string;
  scopeLabel: string;
}
