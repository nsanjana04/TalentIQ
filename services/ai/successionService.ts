import type { CopilotQueryContext, ServiceQueryResult } from "./types";
import { narrativeFromEmployees, rankEmployee } from "./metrics";

function filterPool(ctx: CopilotQueryContext) {
  let pool = ctx.filteredSnapshots;
  if (ctx.entities.department) {
    pool = pool.filter(
      (s) => s.department?.toLowerCase() === ctx.entities.department!.toLowerCase()
    );
  }
  return pool;
}

export function successionService(ctx: CopilotQueryContext): ServiceQueryResult {
  const pool = filterPool(ctx);
  const targetRole = ctx.entities.managerRole ?? ctx.entities.roleTitle;

  let candidates = pool.filter((s) => s.promotionScore >= 60 && s.readinessScore >= 60);

  if (targetRole) {
    const roleQ = targetRole.toLowerCase();
    candidates = candidates.filter(
      (s) =>
        s.department?.toLowerCase().includes(roleQ) ||
        s.jobTitle?.toLowerCase().includes(roleQ) ||
        s.role.toLowerCase().includes(roleQ)
    );
  }

  const ranked = candidates
    .sort((a, b) => b.promotionScore + b.readinessScore - (a.promotionScore + a.readinessScore))
    .map((s) => {
      const successionScore = Math.round(s.promotionScore * 0.6 + s.readinessScore * 0.4);
      return rankEmployee(
        s,
        ctx.userMap.get(s.employeeId)!,
        successionScore,
        `Succession score ${successionScore}% — promotion ${s.promotionScore}%, readiness ${s.readinessScore}%`,
        ctx.dataSources
      );
    });

  const headline = targetRole
    ? `Succession candidates to replace ${targetRole} Manager`
    : "Succession planning bench strength";

  return {
    headline,
    narrative: narrativeFromEmployees(ctx.query, ranked, headline),
    ranked,
    cardType: "succession_planning",
    cardTitle: "Succession candidates",
    cardSummary: `${ranked.length} employee(s) ranked by combined promotion and readiness scores.`,
    severity: "info",
    drillDownEmployees: ranked.map((r) => r.employee),
  };
}
