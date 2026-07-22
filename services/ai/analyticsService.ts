import type { EmployeeIntelSnapshot } from "@/types/employee-intelligence";
import type { CopilotQueryContext, ServiceQueryResult } from "./types";
import { narrativeFromEmployees, rankEmployee } from "./metrics";

function avgReadiness(emps: EmployeeIntelSnapshot[]) {
  if (!emps.length) return 0;
  return Math.round(emps.reduce((s, e) => s + e.readinessScore, 0) / emps.length);
}

export function analyticsService(ctx: CopilotQueryContext): ServiceQueryResult {
  const { entities, filteredSnapshots: pool, query } = ctx;
  const q = query.toLowerCase();

  if (entities.compareDepartments) {
    const [a, b] = entities.compareDepartments;
    const deptA = pool.filter((s) => s.department?.toLowerCase().includes(a.toLowerCase()));
    const deptB = pool.filter((s) => s.department?.toLowerCase().includes(b.toLowerCase()));
    const avgA = avgReadiness(deptA);
    const avgB = avgReadiness(deptB);
    const combined = [...deptA, ...deptB]
      .sort((x, y) => y.readinessScore - x.readinessScore)
      .map((s) =>
        rankEmployee(
          s,
          ctx.userMap.get(s.employeeId)!,
          s.readinessScore,
          `${s.department}: readiness ${s.readinessScore}%`,
          ctx.dataSources
        )
      );

    return {
      headline: `${a} vs ${b} — readiness comparison`,
      narrative: `${a} avg readiness ${avgA}% (${deptA.length} employees) vs ${b} avg ${avgB}% (${deptB.length} employees).\n${narrativeFromEmployees(query, combined.slice(0, 10), "Department comparison")}`,
      ranked: combined,
      cardType: "department_analysis",
      cardTitle: `${a} vs ${b}`,
      cardSummary: `${a}: ${avgA}% avg · ${b}: ${avgB}% avg across ${combined.length} employees.`,
      severity: Math.abs(avgA - avgB) > 15 ? "high" : "medium",
      drillDownEmployees: combined.map((r) => r.employee),
    };
  }

  if (entities.inactiveDays != null || q.includes("not logged in")) {
    const days = entities.inactiveDays ?? 60;
    const ranked = pool
      .filter((s) => s.daysSinceLogin == null || s.daysSinceLogin >= days)
      .sort((a, b) => (b.daysSinceLogin ?? 999) - (a.daysSinceLogin ?? 999))
      .map((s) =>
        rankEmployee(
          s,
          ctx.userMap.get(s.employeeId)!,
          s.daysSinceLogin ?? 100,
          s.daysSinceLogin != null
            ? `Inactive ${s.daysSinceLogin} days`
            : "Never logged in",
          ctx.dataSources
        )
      );

    return {
      headline: `Employees inactive ${days}+ days`,
      narrative: narrativeFromEmployees(query, ranked, `Inactive ${days}+ days`),
      ranked,
      cardType: "attrition_risk",
      cardTitle: "Inactivity attrition risk",
      cardSummary: `${ranked.length} employee(s) have not logged in for ${days}+ days.`,
      severity: "high",
      drillDownEmployees: ranked.map((r) => r.employee),
    };
  }

  if (q.includes("at risk") && !q.includes("compliance")) {
    const ranked = pool
      .sort((a, b) => b.riskScore - a.riskScore)
      .slice(0, entities.limit ?? 15)
      .map((s) =>
        rankEmployee(
          s,
          ctx.userMap.get(s.employeeId)!,
          s.riskScore,
          `Risk ${s.riskScore}%, readiness ${s.readinessScore}%`,
          ctx.dataSources
        )
      );

    return {
      headline: "Highest workforce risk employees",
      narrative: narrativeFromEmployees(query, ranked, "Attrition & readiness risk"),
      ranked,
      cardType: "attrition_risk",
      cardTitle: "Workforce risk ranking",
      cardSummary: `${ranked.length} employee(s) sorted by composite risk score descending.`,
      severity: "high",
      drillDownEmployees: ranked.map((r) => r.employee),
    };
  }

  if (entities.limit != null || q.includes("performer")) {
    const ascending = entities.sortAscending ?? false;
    const limit = entities.limit ?? 10;
    const sorted = [...pool].sort((a, b) =>
      ascending ? a.performanceScore - b.performanceScore : b.performanceScore - a.performanceScore
    );
    const ranked = sorted.slice(0, limit).map((s) =>
      rankEmployee(
        s,
        ctx.userMap.get(s.employeeId)!,
        s.performanceScore,
        `Performance ${s.performanceScore}%, readiness ${s.readinessScore}%`,
        ctx.dataSources
      )
    );

    return {
      headline: ascending ? `Bottom ${limit} performers` : `Top ${limit} performers`,
      narrative: narrativeFromEmployees(query, ranked, ascending ? "Bottom performers" : "Top performers"),
      ranked,
      cardType: "employee_search",
      cardTitle: ascending ? `Bottom ${limit} performers` : `Top ${limit} performers`,
      cardSummary: `${ranked.length} employee(s) ranked by performance score ${ascending ? "ascending" : "descending"}.`,
      severity: "info",
      drillDownEmployees: ranked.map((r) => r.employee),
    };
  }

  if (q.includes("weakest team") || (q.includes("manager") && q.includes("weak"))) {
    const byManager = new Map<string, EmployeeIntelSnapshot[]>();
    for (const s of pool) {
      const key = s.manager ?? "Unassigned";
      const list = byManager.get(key) ?? [];
      list.push(s);
      byManager.set(key, list);
    }
    const managerAvgs = [...byManager.entries()]
      .map(([manager, emps]) => ({ manager, avg: avgReadiness(emps), emps }))
      .sort((a, b) => a.avg - b.avg);

    const weakest = managerAvgs.slice(0, 3);
    const ranked = weakest
      .flatMap((m) => m.emps)
      .sort((a, b) => a.readinessScore - b.readinessScore)
      .map((s) =>
        rankEmployee(
          s,
          ctx.userMap.get(s.employeeId)!,
          100 - s.readinessScore,
          `Manager ${s.manager ?? "N/A"} team avg ${avgReadiness(weakest.find((w) => w.emps.includes(s))?.emps ?? [])}%`,
          ctx.dataSources
        )
      );

    return {
      headline: "Managers with weakest team readiness",
      narrative: narrativeFromEmployees(query, ranked, "Manager team analysis"),
      ranked,
      cardType: "department_analysis",
      cardTitle: "Weakest manager teams",
      cardSummary: `${weakest.length} manager team(s) below organizational readiness average.`,
      severity: "high",
      drillDownEmployees: ranked.map((r) => r.employee),
    };
  }

  if (entities.department || q.includes("underperforming") || q.includes("department")) {
    const deptMap = new Map<string, EmployeeIntelSnapshot[]>();
    for (const s of pool) {
      const key = s.department ?? "Unassigned";
      const list = deptMap.get(key) ?? [];
      list.push(s);
      deptMap.set(key, list);
    }
    const deptAvgs = [...deptMap.entries()]
      .map(([dept, emps]) => ({ dept, avg: avgReadiness(emps), emps }))
      .sort((a, b) => a.avg - b.avg);

    const targetDept = entities.department
      ? deptAvgs.find((d) => d.dept.toLowerCase() === entities.department!.toLowerCase())
      : deptAvgs[0];

    const emps = targetDept?.emps ?? pool;
    const ranked = emps
      .sort((a, b) => a.readinessScore - b.readinessScore)
      .map((s) =>
        rankEmployee(
          s,
          ctx.userMap.get(s.employeeId)!,
          100 - s.readinessScore,
          `${s.department ?? "Unassigned"} dept avg ${targetDept?.avg ?? avgReadiness(pool)}%`,
          ctx.dataSources
        )
      );

    return {
      headline: entities.department
        ? `${entities.department} department analysis`
        : "Underperforming departments",
      narrative: narrativeFromEmployees(
        query,
        ranked,
        "Department analysis",
        targetDept?.dept ?? entities.department
      ),
      ranked,
      cardType: "department_analysis",
      cardTitle: entities.department ? `${entities.department} readiness` : "Department underperformance",
      cardSummary: `${targetDept?.dept ?? "Lowest"} dept avg readiness ${targetDept?.avg ?? 0}%.`,
      severity: (targetDept?.avg ?? 100) < 60 ? "critical" : "high",
      drillDownEmployees: ranked.map((r) => r.employee),
    };
  }

  const ranked = pool
    .sort((a, b) => b.readinessScore - a.readinessScore)
    .slice(0, 15)
    .map((s) =>
      rankEmployee(
        s,
        ctx.userMap.get(s.employeeId)!,
        s.readinessScore,
        `Readiness ${s.readinessScore}%, performance ${s.performanceScore}%`,
        ctx.dataSources
      )
    );

  const orgAvg = avgReadiness(pool);

  return {
    headline: "Workforce health overview",
    narrative: `Organization average readiness ${orgAvg}% across ${pool.length} employees.\n${narrativeFromEmployees(query, ranked, "Workforce health")}`,
    ranked,
    cardType: "workforce_health",
    cardTitle: "Workforce health snapshot",
    cardSummary: `${pool.length} employees · ${orgAvg}% avg readiness · ${ctx.dataSources.certifications} certifications tracked.`,
    severity: orgAvg >= 75 ? "info" : orgAvg >= 60 ? "medium" : "high",
    drillDownEmployees: ranked.map((r) => r.employee),
  };
}
