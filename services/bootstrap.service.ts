import { prisma } from "@/lib/db/prisma";
import { ALL_PERMISSIONS } from "@/lib/rbac/permissions";

export interface BootstrapCheck {
  key: string;
  label: string;
  count: number;
  required: boolean;
  ok: boolean;
}

export const bootstrapService = {
  async checkHealth(): Promise<{ checks: BootstrapCheck[]; needsBootstrap: boolean }> {
    const [
      roles,
      permissions,
      rolePermissions,
      departments,
      teams,
      users,
      skills,
      skillLevels,
      courses,
      assessments,
      certificates,
      learningEvents,
      criticalRoles,
      performanceReviews,
    ] = await Promise.all([
      prisma.role.count({ where: { deletedAt: null } }),
      prisma.permission.count({ where: { deletedAt: null } }),
      prisma.rolePermission.count(),
      prisma.department.count({ where: { deletedAt: null } }),
      prisma.team.count({ where: { deletedAt: null } }),
      prisma.user.count({ where: { deletedAt: null, isActive: true } }),
      prisma.skill.count({ where: { deletedAt: null } }),
      prisma.skillLevel.count({ where: { deletedAt: null } }),
      prisma.course.count({ where: { deletedAt: null } }),
      prisma.assessment.count({ where: { deletedAt: null } }),
      prisma.certificate.count({ where: { deletedAt: null } }),
      prisma.learningEvent.count({ where: { deletedAt: null } }),
      prisma.criticalRole.count({ where: { deletedAt: null } }),
      prisma.performanceReview.count({ where: { deletedAt: null } }),
    ]);

    const checks: BootstrapCheck[] = [
      { key: "roles", label: "Roles", count: roles, required: true, ok: roles >= 3 },
      { key: "permissions", label: "Permissions", count: permissions, required: true, ok: permissions >= ALL_PERMISSIONS.length - 5 },
      { key: "role_permissions", label: "Role permissions", count: rolePermissions, required: true, ok: rolePermissions > 0 },
      { key: "departments", label: "Departments", count: departments, required: true, ok: departments >= 1 },
      { key: "teams", label: "Teams", count: teams, required: true, ok: teams >= 1 },
      { key: "users", label: "Users", count: users, required: true, ok: users >= 3 },
      { key: "skills", label: "Skills", count: skills, required: true, ok: skills >= 1 },
      { key: "skill_levels", label: "Skill levels", count: skillLevels, required: true, ok: skillLevels >= 4 },
      { key: "courses", label: "Courses", count: courses, required: false, ok: courses >= 1 },
      { key: "assessments", label: "Assessments", count: assessments, required: false, ok: assessments >= 1 },
      { key: "certificates", label: "Certificates", count: certificates, required: false, ok: certificates >= 0 },
      { key: "learning_events", label: "Learning events", count: learningEvents, required: false, ok: learningEvents >= 0 },
      { key: "succession", label: "Succession data", count: criticalRoles, required: false, ok: criticalRoles >= 0 },
      { key: "promotion", label: "Promotion reviews", count: performanceReviews, required: false, ok: performanceReviews >= 0 },
    ];

    const needsBootstrap = checks.some((c) => c.required && !c.ok);
    return { checks, needsBootstrap };
  },

  async runBootstrap(): Promise<{ seeded: boolean; message: string }> {
    const { needsBootstrap, checks } = await this.checkHealth();
    const needsEnterprise = checks.some(
      (c) => (c.key === "succession" || c.key === "promotion") && c.count === 0
    );

    if (!needsBootstrap && !needsEnterprise) {
      return { seeded: false, message: "Database already has required starter data." };
    }

    const { spawn } = await import("child_process");

    if (needsBootstrap) {
      await new Promise<void>((resolve, reject) => {
        const child = spawn("npx", ["tsx", "prisma/seed-auth.ts"], {
          cwd: process.cwd(),
          stdio: "inherit",
          env: process.env,
        });
        child.on("close", (code) => (code === 0 ? resolve() : reject(new Error(`Seed exited ${code}`))));
      });
      return { seeded: true, message: "Starter data injected successfully." };
    }

    const { PrismaClient } = await import("@prisma/client");
    const { seedEnterpriseModules } = await import("../prisma/seed-enterprise");
    const enterprisePrisma = new PrismaClient();
    try {
      await seedEnterpriseModules(enterprisePrisma);
    } finally {
      await enterprisePrisma.$disconnect();
    }

    return { seeded: true, message: "Enterprise module data injected successfully." };
  },
};
