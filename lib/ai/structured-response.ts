import type { InsightSeverity } from "@/types/ai-insights";
import type {
  AiSourceReference,
  CopilotIntent,
  DataSourceCounts,
  RankedEmployeeResult,
} from "@/types/employee-intelligence";

export interface CopilotEmployeeDetail {
  rank: number;
  employeeId: string;
  name: string;
  jobTitle: string | null;
  department: string | null;
  manager: string | null;
  readinessScore: number;
  performanceScore: number;
  promotionScore: number;
  promotionTarget: string;
  promotionStatus: string;
  skillsCompleted: number;
  skillsTotal: number;
  certifications: string[];
  learningProgress: number;
  riskLevel: string;
  riskScore: number;
  matchReason: string;
  profileHref: string;
}

export interface CopilotStructuredResponse {
  executiveSummary: string;
  keyFindings: string[];
  affectedEmployees: CopilotEmployeeDetail[];
  recommendedActions: string[];
  riskLevel: InsightSeverity;
  confidenceScore: number;
  dataSources: AiSourceReference[];
  recordCounts: DataSourceCounts;
}

export function buildEmployeeDetail(
  rank: number,
  result: RankedEmployeeResult
): CopilotEmployeeDetail {
  const e = result.employee;
  const certNames = e.certifications.slice(0, 5).map((c) => c.templateName);
  return {
    rank,
    employeeId: e.employeeId,
    name: e.employeeName,
    jobTitle: e.jobTitle,
    department: e.department,
    manager: e.manager,
    readinessScore: e.readinessScore,
    performanceScore: e.performanceScore,
    promotionScore: e.promotionScore,
    promotionTarget: e.promotionTarget,
    promotionStatus: e.promotionStatus,
    skillsCompleted: e.skillsVerified,
    skillsTotal: e.skillScores.length,
    certifications: certNames,
    learningProgress: e.learningCompletion,
    riskLevel: e.riskLevel,
    riskScore: e.riskScore,
    matchReason: result.matchReason,
    profileHref: e.profileHref,
  };
}

export function buildStructuredCopilotResponse(params: {
  intent: CopilotIntent;
  headline: string;
  ranked: RankedEmployeeResult[];
  cardSummary: string;
  severity: InsightSeverity;
  confidence: number;
  dataSources: DataSourceCounts;
  sources: AiSourceReference[];
  deptLabel?: string;
}): CopilotStructuredResponse {
  const { ranked, headline, cardSummary, severity, confidence, dataSources, sources, deptLabel } =
    params;

  const affectedEmployees = ranked.slice(0, 15).map((r, i) => buildEmployeeDetail(i + 1, r));

  const keyFindings: string[] = [];
  if (ranked.length === 0) {
    keyFindings.push(
      `Zero employees matched live database records${deptLabel ? ` in ${deptLabel}` : ""} for this query.`
    );
  } else {
    keyFindings.push(`${ranked.length} employee record(s) matched from ${dataSources.employees} in scope.`);
    const top = ranked[0]?.employee;
    if (top) {
      keyFindings.push(
        `Top match: ${top.employeeName} (${top.department ?? "Unassigned"}) — readiness ${top.readinessScore}%, performance ${top.performanceScore}%.`
      );
    }
    const deptCounts = new Map<string, number>();
    for (const r of ranked) {
      const d = r.employee.department ?? "Unassigned";
      deptCounts.set(d, (deptCounts.get(d) ?? 0) + 1);
    }
    const topDept = [...deptCounts.entries()].sort((a, b) => b[1] - a[1])[0];
    if (topDept) keyFindings.push(`${topDept[1]} affected employee(s) in ${topDept[0]}.`);
    keyFindings.push(cardSummary);
  }

  const emptyDataActions = [
    "No qualifying records found in the live database.",
    "Run `npm run bootstrap` or click Inject Starter Data in development.",
    "Add skills, learning enrollments, and certifications for target employees.",
    "Assign employees to the requested department and verify RBAC scope includes them.",
  ];

  const recommendedActions = ranked.length
    ? ranked[0].employee.recommendations.slice(0, 3)
    : emptyDataActions;

  const executiveSummary =
    ranked.length === 0
      ? `No qualifying records found. ${headline}${deptLabel ? ` in ${deptLabel}` : ""} returned zero employees from ${dataSources.employees} scoped records.`
      : `${headline}. ${ranked.length} employee(s) identified from ${dataSources.employees} scoped records, ${dataSources.certifications} certifications, and ${dataSources.skillRecords} skill records. Average confidence ${confidence}%.`;

  return {
    executiveSummary,
    keyFindings,
    affectedEmployees,
    recommendedActions,
    riskLevel: severity,
    confidenceScore: confidence,
    dataSources: sources,
    recordCounts: dataSources,
  };
}

export function buildRichNarrative(structured: CopilotStructuredResponse, headline: string): string {
  if (structured.affectedEmployees.length === 0) {
    return structured.executiveSummary;
  }

  const lines = structured.affectedEmployees.slice(0, 10).map((e) => {
    const certs = e.certifications.length ? e.certifications.join(", ") : "None on file";
    return [
      `${e.rank}. ${e.name}`,
      e.jobTitle ? `   Role: ${e.jobTitle}` : null,
      `   Department: ${e.department ?? "Unassigned"} · Manager: ${e.manager ?? "N/A"}`,
      `   Readiness: ${e.readinessScore}% · Performance: ${e.performanceScore}% · Promotion: ${e.promotionScore}%`,
      `   Skills: ${e.skillsCompleted}/${e.skillsTotal} verified · Learning: ${e.learningProgress}%`,
      `   Certifications: ${certs}`,
      e.promotionTarget ? `   Recommended: ${e.promotionTarget}` : null,
      `   Risk: ${e.riskLevel} (${e.riskScore}%)`,
    ]
      .filter(Boolean)
      .join("\n");
  });

  return [
    structured.executiveSummary,
    "",
    headline,
    "",
    ...lines,
    "",
    "Sources: employees, employee_skills, course_enrollments, assessment_attempts, certificates",
  ].join("\n");
}
