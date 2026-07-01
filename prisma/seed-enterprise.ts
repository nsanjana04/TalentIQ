import type { PrismaClient } from "@prisma/client";

export async function seedEnterpriseModules(prisma: PrismaClient) {
  console.log("\n── Enterprise Modules ──");

  const users = await prisma.user.findMany({
    where: { isActive: true, deletedAt: null },
    include: {
      role: { select: { slug: true } },
      jobRole: { select: { id: true, title: true } },
      department: { select: { id: true, name: true } },
      manager: { select: { id: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  if (users.length === 0) {
    console.log("  ⚠ No users — skipping enterprise seed");
    return;
  }

  const managers = users.filter((u) =>
    ["ceo", "department_manager", "team_leader", "hr_manager", "admin"].includes(u.role.slug)
  );
  const employees = users.filter((u) => !managers.some((m) => m.id === u.id));

  const reviewer = managers[0] ?? users[0];

  for (const emp of employees.slice(0, 20)) {
    const score = 3 + Math.random() * 2;
    const rec =
      score >= 4.5 ? "STRONG" : score >= 4 ? "RECOMMENDED" : score >= 3 ? "NEUTRAL" : "NOT_READY";
    await prisma.performanceReview.upsert({
      where: { id: `seed-review-${emp.id}` },
      update: {},
      create: {
        id: `seed-review-${emp.id}`,
        userId: emp.id,
        reviewerId: emp.managerId ?? reviewer.id,
        periodStart: new Date(new Date().getFullYear(), 0, 1),
        periodEnd: new Date(),
        rating: score >= 4.5 ? "EXCEPTIONAL" : score >= 4 ? "EXCEEDS" : "MEETS",
        score: Math.round(score * 10) / 10,
        managerRecommendation: rec as "STRONG" | "RECOMMENDED" | "NEUTRAL" | "NOT_READY",
        promotionTarget: emp.jobRole?.title
          ? `Senior ${emp.jobRole.title}`
          : "Next level role",
      },
    });
  }
  console.log(`  ✓ Performance reviews: ${Math.min(employees.length, 20)}`);

  const criticalTitles = [
    { title: "VP Engineering", dept: "Engineering" },
    { title: "Director of Operations", dept: "Operations" },
    { title: "Head of HR", dept: "Human Resources" },
    { title: "Chief Technology Officer", dept: "Engineering" },
  ];

  const departments = await prisma.department.findMany();
  const jobRoles = await prisma.jobRole.findMany();

  for (let i = 0; i < criticalTitles.length; i++) {
    const spec = criticalTitles[i];
    const dept = departments.find((d) => d.name.includes(spec.dept.split(" ")[0])) ?? departments[0];
    const holder = managers[i % managers.length];
    const jobRole = jobRoles.find((j) => j.departmentId === dept?.id) ?? jobRoles[0];

    const role = await prisma.criticalRole.upsert({
      where: { id: `seed-critical-${i}` },
      update: {},
      create: {
        id: `seed-critical-${i}`,
        title: spec.title,
        departmentId: dept?.id,
        jobRoleId: jobRole?.id,
        holderId: holder?.id,
        retirementRiskScore: 20 + i * 15,
        attritionRiskScore: 10 + i * 10,
        benchStrength: 40 + i * 10,
        coverageScore: 55 + i * 8,
        riskScore: 30 + i * 12,
      },
    });

    const candidates = employees
      .filter((e) => e.departmentId === dept?.id || e.departmentId === holder?.departmentId)
      .slice(0, 4);

    for (let j = 0; j < candidates.length; j++) {
      const readiness =
        j === 0 ? "READY_NOW" : j === 1 ? "READY_6_MONTHS" : j === 2 ? "READY_12_MONTHS" : "DEVELOPING";
      await prisma.successionSuccessor.upsert({
        where: {
          criticalRoleId_candidateId: {
            criticalRoleId: role.id,
            candidateId: candidates[j].id,
          },
        },
        update: {},
        create: {
          criticalRoleId: role.id,
          candidateId: candidates[j].id,
          readiness: readiness as "READY_NOW" | "READY_6_MONTHS" | "READY_12_MONTHS" | "DEVELOPING",
          readinessScore: 95 - j * 12,
          skillGapSummary: j > 0 ? `${j} mandatory skills below target level` : null,
        },
      });
    }
  }
  console.log(`  ✓ Critical roles & successors: ${criticalTitles.length}`);

  const skills = await prisma.skill.findMany({ take: 5 });
  const hrUser = users.find((u) => u.role.slug === "hr_manager") ?? reviewer;

  const opportunities = [
    {
      title: "Senior Software Engineer — Platform Team",
      type: "PROMOTION" as const,
      description: "Lead platform modernization initiatives across engineering.",
      learningNeeded: "Complete Advanced Architecture learning path",
    },
    {
      title: "Cross-functional Product Analyst",
      type: "CROSS_FUNCTIONAL" as const,
      description: "Bridge product and analytics for workforce intelligence features.",
      learningNeeded: "Product analytics certification",
    },
    {
      title: "Operations Program Lead",
      type: "LATERAL" as const,
      description: "Drive operational excellence programs across departments.",
      learningNeeded: null,
    },
  ];

  for (let i = 0; i < opportunities.length; i++) {
    const opp = opportunities[i];
    const dept = departments[i % departments.length];
    const jobRole = jobRoles[i % jobRoles.length];

    await prisma.talentOpportunity.upsert({
      where: { id: `seed-opp-${i}` },
      update: {},
      create: {
        id: `seed-opp-${i}`,
        title: opp.title,
        type: opp.type,
        departmentId: dept?.id,
        jobRoleId: jobRole?.id,
        description: opp.description,
        learningNeeded: opp.learningNeeded,
        requiredSkills: skills.slice(0, 3).map((s, idx) => ({
          skillId: s.id,
          minLevel: 2 + idx,
        })),
        postedById: hrUser.id,
        isOpen: true,
      },
    });
  }
  console.log(`  ✓ Talent opportunities: ${opportunities.length}`);
}
