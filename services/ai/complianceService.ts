import type { CopilotQueryContext, ServiceQueryResult } from "./types";
import { narrativeFromEmployees, rankEmployee } from "./metrics";

export function complianceService(ctx: CopilotQueryContext): ServiceQueryResult {
  let pool = ctx.filteredSnapshots;

  const ranked = pool
    .filter(
      (s) =>
        s.certifications.some((c) => c.status === "EXPIRED") ||
        s.expiringCertCount > 0 ||
        s.riskScore >= 55
    )
    .sort((a, b) => b.riskScore - a.riskScore)
    .map((s) => {
      const expired = s.certifications.filter((c) => c.status === "EXPIRED").length;
      return rankEmployee(
        s,
        ctx.userMap.get(s.employeeId)!,
        s.riskScore,
        expired > 0
          ? `${expired} expired credential(s), risk ${s.riskScore}%`
          : `${s.expiringCertCount} expiring soon, risk ${s.riskScore}%`,
        ctx.dataSources
      );
    });

  const notCompliant = ctx.query.toLowerCase().includes("not compliant");

  return {
    headline: notCompliant ? "Non-compliant employees" : "Compliance risk employees",
    narrative: narrativeFromEmployees(ctx.query, ranked, "Compliance risk analysis"),
    ranked,
    cardType: "compliance_risk",
    cardTitle: "Compliance risk watchlist",
    cardSummary: `${ranked.length} employee(s) with expired, expiring, or high-risk compliance profiles.`,
    severity: ranked.some((r) => r.employee.riskLevel === "critical") ? "critical" : "high",
    drillDownEmployees: ranked.map((r) => r.employee),
  };
}

export function certificationService(ctx: CopilotQueryContext): ServiceQueryResult {
  const ranked = ctx.filteredSnapshots
    .filter((s) => s.expiringCertCount > 0)
    .sort((a, b) => b.expiringCertCount - a.expiringCertCount || b.riskScore - a.riskScore)
    .map((s) =>
      rankEmployee(
        s,
        ctx.userMap.get(s.employeeId)!,
        Math.min(100, s.expiringCertCount * 30 + s.riskScore),
        `${s.expiringCertCount} certificate(s) expiring within 30 days`,
        ctx.dataSources
      )
    );

  return {
    headline: "Certificates expiring within 30 days",
    narrative: narrativeFromEmployees(ctx.query, ranked, "Certification expiry risk"),
    ranked,
    cardType: "certification_risk",
    cardTitle: "Certification renewal required",
    cardSummary: `${ranked.length} employee(s) require renewal within 30 days.`,
    severity: ranked.length > 5 ? "critical" : "high",
    drillDownEmployees: ranked.map((r) => r.employee),
  };
}
