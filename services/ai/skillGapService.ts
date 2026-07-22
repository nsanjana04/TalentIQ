import type { CopilotQueryContext, ServiceQueryResult } from "./types";
import { narrativeFromEmployees, rankEmployee } from "./metrics";

export function skillGapService(ctx: CopilotQueryContext): ServiceQueryResult {
  let pool = ctx.filteredSnapshots;

  if (ctx.entities.department) {
    pool = pool.filter(
      (s) => s.department?.toLowerCase() === ctx.entities.department!.toLowerCase()
    );
  }

  if (ctx.entities.certification) {
    const certQ = ctx.entities.certification.toLowerCase();
    pool = pool.filter(
      (s) =>
        !s.certifications.some((c) => c.templateName.toLowerCase().includes(certQ) && c.status === "ACTIVE")
    );
    const ranked = pool
      .sort((a, b) => a.readinessScore - b.readinessScore)
      .map((s) =>
        rankEmployee(
          s,
          ctx.userMap.get(s.employeeId)!,
          100 - s.readinessScore,
          `Missing ${ctx.entities.certification} certification — readiness ${s.readinessScore}%`,
          ctx.dataSources
        )
      );

    return {
      headline: `Employees missing ${ctx.entities.certification} certification`,
      narrative: narrativeFromEmployees(ctx.query, ranked, `Missing ${ctx.entities.certification}`),
      ranked,
      cardType: "skill_gap_analysis",
      cardTitle: `Missing ${ctx.entities.certification}`,
      cardSummary: `${ranked.length} employee(s) lack active ${ctx.entities.certification} credentials.`,
      severity: "high",
      drillDownEmployees: ranked.map((r) => r.employee),
    };
  }

  const ranked = pool
    .filter((s) => s.readinessScore < 80)
    .sort((a, b) => a.readinessScore - b.readinessScore || b.riskScore - a.riskScore)
    .map((s) => {
      const gapSize = 100 - s.readinessScore;
      const topGap = s.skillScores.sort((a, b) => a.score - b.score)[0];
      return rankEmployee(
        s,
        ctx.userMap.get(s.employeeId)!,
        gapSize,
        `Readiness gap ${gapSize}%${topGap ? ` — weakest: ${topGap.skillName} ${topGap.score}%` : ""}`,
        ctx.dataSources
      );
    });

  const deptLabel = ctx.entities.department;

  return {
    headline: deptLabel ? `Largest skill gaps in ${deptLabel}` : "Employees with largest skill gaps",
    narrative: narrativeFromEmployees(ctx.query, ranked, "Skill gap analysis", deptLabel),
    ranked,
    cardType: "skill_gap_analysis",
    cardTitle: "Skill gap priority list",
    cardSummary: `${ranked.length} employee(s) below 80% readiness, sorted by gap size descending.`,
    severity: "high",
    drillDownEmployees: ranked.map((r) => r.employee),
  };
}
