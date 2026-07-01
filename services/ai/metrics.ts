import { ROUTES } from "@/constants/routes";
import type { IntelUserRecord } from "@/repositories/employee-intelligence.repository";
import type {
  AiSourceReference,
  DataSourceCounts,
  EmployeeCertificationIntel,
  EmployeeDrilldownLinks,
  EmployeeIntelSnapshot,
  RankedEmployeeResult,
} from "@/types/employee-intelligence";

export const BASE_SOURCES: AiSourceReference[] = [
  { table: "users", field: "id", description: "Active employee records" },
  { table: "employee_skills", field: "skill_level_id", description: "Verified skill proficiency levels" },
  { table: "course_enrollments", field: "progress", description: "Learning enrollment progress" },
  { table: "assessment_attempts", field: "status", description: "Assessment pass/fail outcomes" },
  { table: "certificates", field: "expires_at", description: "Certificate validity and expiry" },
  { table: "role_skill_requirements", field: "required_skill_level_id", description: "Role mandatory skill targets" },
];

export function profileHref(id: string) {
  return `${ROUTES.EMPLOYEES}/${id}`;
}

export function drilldownLinks(employeeId: string): EmployeeDrilldownLinks {
  const base = profileHref(employeeId);
  return {
    profile: base,
    skills: `${base}?tab=skills`,
    learning: `${base}?tab=learning`,
    assessments: `${base}?tab=assessments`,
    certificates: `${base}?tab=certificates`,
    performance: `${base}?tab=performance`,
  };
}

export function computeDataSourceCounts(users: IntelUserRecord[]): DataSourceCounts {
  return {
    employees: users.length,
    performanceReviews: users.reduce((s, u) => s + u.assessmentAttempts.length, 0),
    certifications: users.reduce((s, u) => s + u.certificates.length, 0),
    skillRecords: users.reduce((s, u) => s + u.employeeSkills.length, 0),
    enrollments: users.reduce((s, u) => s + u.enrollments.length, 0),
  };
}

export function computeMetrics(user: IntelUserRecord, maxSkillRank: number) {
  const skills = user.employeeSkills;
  const skillReadiness =
    skills.length > 0
      ? Math.round(
          skills.reduce((s, es) => s + (es.skillLevel.rank / maxSkillRank) * 100, 0) / skills.length
        )
      : 0;

  const enrollments = user.enrollments;
  const learningProgress =
    enrollments.length > 0
      ? Math.round(enrollments.reduce((s, e) => s + e.progress, 0) / enrollments.length)
      : 0;

  const attempts = user.assessmentAttempts;
  const passed = attempts.filter((a) => a.status === "PASSED").length;
  const assessmentPassRate =
    attempts.length > 0 ? Math.round((passed / attempts.length) * 100) : 0;

  const now = new Date();
  const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  const certs = user.certificates;
  const activeCerts = certs.filter(
    (c) => c.status === "ACTIVE" && (!c.expiresAt || c.expiresAt > now)
  ).length;
  const certCompliance = certs.length > 0 ? Math.round((activeCerts / certs.length) * 100) : 100;
  const expiringSoon = certs.filter(
    (c) => c.expiresAt && c.expiresAt > now && c.expiresAt <= in30Days
  ).length;

  const requirements = user.jobRole?.skillRequirements ?? [];
  let promotionScore = 0;
  let promotionStatus: EmployeeIntelSnapshot["promotionStatus"] = "developing";

  if (requirements.length > 0) {
    const skillMap = new Map(skills.map((es) => [es.skillId, es.skillLevel.rank]));
    let met = 0;
    for (const req of requirements) {
      const actual = skillMap.get(req.skillId) ?? 0;
      if (actual >= req.requiredSkillLevel.rank) met += 1;
    }
    promotionScore = Math.round((met / requirements.length) * 100);
    if (promotionScore >= 80) promotionStatus = "ready";
    else if (promotionScore < 50) promotionStatus = "not_ready";
  }

  const readinessScore = Math.round(
    skillReadiness * 0.35 +
      learningProgress * 0.2 +
      assessmentPassRate * 0.15 +
      certCompliance * 0.15 +
      promotionScore * 0.15
  );

  const performanceScore = Math.round(
    assessmentPassRate * 0.4 + learningProgress * 0.35 + readinessScore * 0.25
  );

  let riskScore = Math.max(0, 100 - readinessScore);
  if (expiringSoon > 0) riskScore = Math.min(100, riskScore + expiringSoon * 8);
  if (promotionStatus === "not_ready") riskScore = Math.min(100, riskScore + 10);

  const daysSinceLogin = user.lastLoginAt
    ? Math.floor((now.getTime() - user.lastLoginAt.getTime()) / (1000 * 60 * 60 * 24))
    : null;

  if (daysSinceLogin != null && daysSinceLogin >= 60) {
    riskScore = Math.min(100, riskScore + 15);
  }

  const riskLevel: EmployeeIntelSnapshot["riskLevel"] =
    riskScore >= 75 ? "critical" : riskScore >= 55 ? "high" : riskScore >= 35 ? "medium" : riskScore >= 15 ? "low" : "none";

  const skillsVerified = skills.filter((s) => s.verifiedAt).length;

  return {
    skillReadiness,
    learningProgress,
    assessmentPassRate,
    certCompliance,
    promotionScore,
    promotionStatus,
    activeCerts,
    expiringSoon,
    readinessScore,
    riskScore,
    riskLevel,
    performanceScore,
    skillsVerified,
    daysSinceLogin,
  };
}

function mapCertifications(user: IntelUserRecord): EmployeeCertificationIntel[] {
  const now = Date.now();
  return user.certificates.map((c) => ({
    id: c.id,
    certificateNumber: c.certificateNumber,
    templateName: c.template.name,
    status: c.status,
    issuedAt: c.issuedAt.toISOString(),
    expiresAt: c.expiresAt?.toISOString() ?? null,
    daysUntilExpiry: c.expiresAt
      ? Math.ceil((c.expiresAt.getTime() - now) / (1000 * 60 * 60 * 24))
      : null,
  }));
}

export function buildRecommendations(snapshot: EmployeeIntelSnapshot): string[] {
  const recs: string[] = [];
  if (snapshot.promotionStatus === "ready") recs.push("Schedule promotion review with department leadership");
  if (snapshot.expiringCertCount > 0) recs.push(`Renew ${snapshot.expiringCertCount} expiring certification(s) within 30 days`);
  if (snapshot.learningCompletion < 55) recs.push("Assign role-aligned learning pathway to accelerate completion");
  if (snapshot.readinessScore < 65) recs.push("Close priority skill gaps through targeted assessments");
  if (snapshot.riskScore >= 55) recs.push("Add to manager coaching watchlist for readiness remediation");
  if (recs.length === 0) recs.push("Maintain current development plan and monitor quarterly readiness");
  return recs.slice(0, 4);
}

export function mapSnapshot(user: IntelUserRecord, maxSkillRank: number): EmployeeIntelSnapshot {
  const m = computeMetrics(user, maxSkillRank);
  const skillScores = user.employeeSkills.map((es) => ({
    skillId: es.skill.id,
    skillName: es.skill.name,
    level: es.skillLevel.name,
    levelRank: es.skillLevel.rank,
    score: Math.round((es.skillLevel.rank / maxSkillRank) * 100),
    verified: !!es.verifiedAt,
  }));

  const snapshot: EmployeeIntelSnapshot = {
    employeeId: user.id,
    employeeName: `${user.firstName} ${user.lastName}`,
    email: user.email,
    role: user.role.name,
    roleSlug: user.role.slug,
    department: user.department?.name ?? null,
    departmentId: user.department?.id ?? null,
    team: user.team?.name ?? null,
    teamId: user.team?.id ?? null,
    manager: user.manager ? `${user.manager.firstName} ${user.manager.lastName}` : null,
    managerId: user.manager?.id ?? null,
    jobTitle: user.jobRole?.title ?? null,
    readinessScore: m.readinessScore,
    performanceScore: m.performanceScore,
    skillScores,
    skillsVerified: m.skillsVerified,
    certifications: mapCertifications(user),
    learningProgress: m.learningProgress,
    learningCompletion: m.learningProgress,
    assessmentPassRate: m.assessmentPassRate,
    promotionScore: m.promotionScore,
    promotionStatus: m.promotionStatus,
    promotionTarget: user.jobRole?.title ?? user.experienceLevel?.name ?? "Next role level",
    riskScore: m.riskScore,
    riskLevel: m.riskLevel,
    activeCertCount: m.activeCerts,
    expiringCertCount: m.expiringSoon,
    daysSinceLogin: m.daysSinceLogin,
    recommendations: [],
    profileHref: profileHref(user.id),
    drilldown: drilldownLinks(user.id),
  };

  snapshot.recommendations = buildRecommendations(snapshot);
  return snapshot;
}

export function confidenceFor(user: IntelUserRecord, dataSources: DataSourceCounts): number {
  let score = 40;
  if (user.employeeSkills.length) score += 12;
  if (user.enrollments.length) score += 8;
  if (user.assessmentAttempts.length) score += 12;
  if (user.certificates.length) score += 8;
  if (user.jobRole?.skillRequirements.length) score += 10;
  if (dataSources.employees >= 5) score += 5;
  if (dataSources.employees >= 20) score += 5;
  return Math.min(98, score);
}

export function rankEmployee(
  employee: EmployeeIntelSnapshot,
  user: IntelUserRecord,
  relevanceScore: number,
  matchReason: string,
  dataSources: DataSourceCounts
): RankedEmployeeResult {
  return {
    employee,
    relevanceScore,
    confidence: confidenceFor(user, dataSources),
    sources: BASE_SOURCES,
    matchReason,
  };
}

export function narrativeFromEmployees(
  query: string,
  ranked: RankedEmployeeResult[],
  headline: string,
  deptLabel?: string
): string {
  if (ranked.length === 0) {
    return [
      `No qualifying records found.`,
      `${headline}${deptLabel ? ` in ${deptLabel}` : ""}: zero employees matched live database records in your scope.`,
      `Suggestions: run bootstrap (npm run bootstrap), add promotion readiness data, or assign skills/certifications.`,
    ].join(" ");
  }
  const lines = ranked.slice(0, 8).map((r, i) => {
    const e = r.employee;
    return `${i + 1}. ${e.employeeName} — ${e.role}, ${e.department ?? "Unassigned"}, manager ${e.manager ?? "N/A"}, readiness ${e.readinessScore}%, performance ${e.performanceScore}%, ${e.skillsVerified} skills verified, ${e.activeCertCount} certs, learning ${e.learningCompletion}%, target ${e.promotionTarget}`;
  });
  return `${headline}${deptLabel ? ` in ${deptLabel}` : ""} (${ranked.length} employees):\n${lines.join("\n")}`;
}

export function globalConfidence(ranked: RankedEmployeeResult[], dataSources: DataSourceCounts): number {
  if (ranked.length === 0) return 55;
  const avg = ranked.reduce((s, r) => s + r.confidence, 0) / ranked.length;
  const coverageBoost = Math.min(10, Math.floor(dataSources.employees / 10));
  return Math.min(98, Math.round(avg + coverageBoost));
}
