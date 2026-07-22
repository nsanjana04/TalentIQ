import type { CopilotQueryContext, ServiceQueryResult } from "./types";
import { narrativeFromEmployees, rankEmployee } from "./metrics";

export function learningService(ctx: CopilotQueryContext): ServiceQueryResult {
  let pool = ctx.filteredSnapshots;
  const q = ctx.query.toLowerCase();

  if (ctx.entities.department) {
    pool = pool.filter(
      (s) => s.department?.toLowerCase() === ctx.entities.department!.toLowerCase()
    );
  }

  const fallingBehindQuery =
    q.includes("falling behind") || q.includes("behind") || q.includes("below target");
  const completedCourseQuery =
    q.includes("completed") && (q.includes("aws") || q.includes("course") || ctx.entities.course);
  const stuckQuery = q.includes("stuck") || q.includes("not progressing") || q.includes(" stalled");
  const engagedQuery =
    q.includes("most engaged") || q.includes("engagement") || q.includes("active learner");
  const deptVelocityQuery =
    q.includes("department learns fastest") ||
    q.includes("learns fastest") ||
    q.includes("fastest department");
  const expiringQuery =
    q.includes("certifications expire") ||
    q.includes("certification expire") ||
    q.includes("expire soon");
  const leadershipQuery = q.includes("leadership");
  const mandatoryQuery = q.includes("mandatory") || q.includes("needs");

  if (expiringQuery) {
    const ranked = pool
      .filter((s) => s.expiringCertCount > 0)
      .sort((a, b) => b.expiringCertCount - a.expiringCertCount)
      .map((s) =>
        rankEmployee(
          s,
          ctx.userMap.get(s.employeeId)!,
          s.expiringCertCount * 20,
          `${s.expiringCertCount} certification(s) expiring soon`,
          ctx.dataSources
        )
      );
    return {
      headline: "Certifications expiring soon",
      narrative: narrativeFromEmployees(ctx.query, ranked, "Employees with expiring certifications"),
      ranked,
      cardType: "certification_risk",
      cardTitle: "Expiring certifications",
      cardSummary: `${ranked.length} employee(s) have certifications expiring soon.`,
      severity: "high",
      drillDownEmployees: ranked.map((r) => r.employee),
    };
  }

  if (completedCourseQuery) {
    const courseName = ctx.entities.course ?? (q.includes("aws 101") ? "AWS 101" : "AWS");
    const ranked = pool
      .filter((s) => s.learningCompletion >= 100 || s.learningProgress >= 90)
      .sort((a, b) => b.learningCompletion - a.learningCompletion)
      .map((s) =>
        rankEmployee(
          s,
          ctx.userMap.get(s.employeeId)!,
          s.learningCompletion,
          `Completed or near-complete on ${courseName}`,
          ctx.dataSources
        )
      );
    return {
      headline: `Employees who completed ${courseName}`,
      narrative: narrativeFromEmployees(ctx.query, ranked, `Completion status for ${courseName}`),
      ranked,
      cardType: "learning_progress",
      cardTitle: `${courseName} completions`,
      cardSummary: `${ranked.length} employee(s) completed or nearly completed ${courseName}.`,
      severity: "low",
      drillDownEmployees: ranked.map((r) => r.employee),
    };
  }

  if (stuckQuery) {
    const ranked = pool
      .filter((s) => s.learningProgress > 0 && s.learningProgress < 50 && (s.daysSinceLogin ?? 0) > 14)
      .sort((a, b) => a.learningProgress - b.learningProgress)
      .map((s) =>
        rankEmployee(
          s,
          ctx.userMap.get(s.employeeId)!,
          100 - s.learningProgress,
          `Stuck at ${s.learningProgress}% — inactive ${s.daysSinceLogin ?? "?"} days`,
          ctx.dataSources
        )
      );
    return {
      headline: "Employees stuck in learning",
      narrative: narrativeFromEmployees(ctx.query, ranked, "Learners with low progress and inactivity"),
      ranked,
      cardType: "learning_progress",
      cardTitle: "Stuck learners",
      cardSummary: `${ranked.length} employee(s) appear stuck in their learning paths.`,
      severity: "high",
      drillDownEmployees: ranked.map((r) => r.employee),
    };
  }

  if (engagedQuery) {
    const ranked = pool
      .filter((s) => s.learningProgress >= 50)
      .sort((a, b) => b.learningProgress - a.learningProgress)
      .slice(0, ctx.entities.limit ?? 10)
      .map((s) =>
        rankEmployee(
          s,
          ctx.userMap.get(s.employeeId)!,
          s.learningProgress,
          `Learning progress ${s.learningProgress}% — highly engaged`,
          ctx.dataSources
        )
      );
    return {
      headline: "Most engaged learners",
      narrative: narrativeFromEmployees(ctx.query, ranked, "Top engaged employees by learning progress"),
      ranked,
      cardType: "learning_progress",
      cardTitle: "Engagement leaders",
      cardSummary: `${ranked.length} highly engaged learner(s) identified.`,
      severity: "low",
      drillDownEmployees: ranked.map((r) => r.employee),
    };
  }

  if (deptVelocityQuery) {
    const deptScores = new Map<string, { total: number; count: number }>();
    for (const s of pool) {
      const dept = s.department ?? "Unassigned";
      const entry = deptScores.get(dept) ?? { total: 0, count: 0 };
      entry.total += s.learningCompletion;
      entry.count++;
      deptScores.set(dept, entry);
    }
    const fastest = [...deptScores.entries()]
      .map(([dept, d]) => ({ dept, avg: d.count ? d.total / d.count : 0 }))
      .sort((a, b) => b.avg - a.avg)[0];

    const ranked = pool
      .filter((s) => s.department === fastest?.dept)
      .sort((a, b) => b.learningCompletion - a.learningCompletion)
      .slice(0, 10)
      .map((s) =>
        rankEmployee(
          s,
          ctx.userMap.get(s.employeeId)!,
          s.learningCompletion,
          `${fastest?.dept} avg ${Math.round(fastest?.avg ?? 0)}% completion`,
          ctx.dataSources
        )
      );

    return {
      headline: fastest ? `${fastest.dept} learns fastest` : "Department learning velocity",
      narrative: fastest
        ? `${fastest.dept} leads with ${Math.round(fastest.avg)}% average learning completion.`
        : "No department velocity data available.",
      ranked,
      cardType: "department_analysis",
      cardTitle: "Learning velocity by department",
      cardSummary: fastest
        ? `${fastest.dept} has the highest learning completion rate.`
        : "Insufficient data for department comparison.",
      severity: "low",
      drillDownEmployees: ranked.map((r) => r.employee),
    };
  }

  let ranked = pool
    .filter((s) =>
      fallingBehindQuery
        ? s.learningCompletion < 50
        : s.learningCompletion < 70 || (mandatoryQuery && s.learningCompletion < 100)
    )
    .sort((a, b) => a.learningCompletion - b.learningCompletion)
    .map((s) =>
      rankEmployee(
        s,
        ctx.userMap.get(s.employeeId)!,
        100 - s.learningCompletion,
        fallingBehindQuery
          ? `Falling behind — ${s.learningCompletion}% completion`
          : leadershipQuery
            ? `Learning ${s.learningCompletion}% — leadership training incomplete`
            : `Learning completion ${s.learningCompletion}%`,
        ctx.dataSources
      )
    );

  if (leadershipQuery) {
    ranked = ranked.filter((r) => r.employee.learningCompletion < 100);
  }

  const deptLabel = ctx.entities.department;
  const headline = fallingBehindQuery
    ? "Employees falling behind on learning"
    : mandatoryQuery
      ? "Employees needing mandatory training"
      : leadershipQuery
        ? "Leadership training completion status"
        : deptLabel
          ? `Learning progress in ${deptLabel}`
          : "Employees below learning completion target";

  return {
    headline,
    narrative: narrativeFromEmployees(ctx.query, ranked, headline, deptLabel),
    ranked,
    cardType: "learning_progress",
    cardTitle: fallingBehindQuery
      ? "Falling behind"
      : mandatoryQuery
        ? "Mandatory training gaps"
        : "Learning progress gaps",
    cardSummary: `${ranked.length} employee(s) below target learning completion.`,
    severity: fallingBehindQuery || mandatoryQuery ? "high" : "medium",
    drillDownEmployees: ranked.map((r) => r.employee),
  };
}
