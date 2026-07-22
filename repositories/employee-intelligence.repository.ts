import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import type { DashboardScope } from "@/lib/dashboard/scope";
import { buildUserWhere } from "@/lib/dashboard/scope";

export type IntelUserRecord = Prisma.UserGetPayload<{
  include: {
    role: { select: { name: true; slug: true } };
    department: { select: { id: true; name: true } };
    team: { select: { id: true; name: true } };
    manager: { select: { id: true; firstName: true; lastName: true } };
    experienceLevel: { select: { name: true } };
    jobRole: {
      include: {
        skillRequirements: {
          where: { isMandatory: true; deletedAt: null };
          include: { requiredSkillLevel: true; skill: { select: { id: true } } };
        };
      };
    };
    employeeSkills: {
      include: { skill: { select: { id: true; name: true } }; skillLevel: true };
    };
    enrollments: { where: { deletedAt: null } };
    assessmentAttempts: { where: { deletedAt: null }; include: { assessment: { select: { title: true } } } };
    certificates: {
      where: { deletedAt: null };
      include: { template: { select: { name: true } } };
    };
  };
}>;

export const employeeIntelligenceRepository = {
  async loadScopedUsers(
    scope: DashboardScope,
    filters?: { departmentId?: string; teamId?: string }
  ): Promise<{ users: IntelUserRecord[]; maxSkillRank: number }> {
    const where = buildUserWhere(scope) as Prisma.UserWhereInput;
    if (filters?.departmentId) where.departmentId = filters.departmentId;
    if (filters?.teamId) where.teamId = filters.teamId;

    const [users, skillLevels] = await Promise.all([
      prisma.user.findMany({
        where: { ...where, isActive: true },
        include: {
          role: { select: { name: true, slug: true } },
          department: { select: { id: true, name: true } },
          team: { select: { id: true, name: true } },
          manager: { select: { id: true, firstName: true, lastName: true } },
          experienceLevel: { select: { name: true } },
          jobRole: {
            include: {
              skillRequirements: {
                where: { isMandatory: true, deletedAt: null },
                include: { requiredSkillLevel: true, skill: { select: { id: true } } },
              },
            },
          },
          employeeSkills: {
            where: { deletedAt: null },
            include: {
              skill: { select: { id: true, name: true } },
              skillLevel: true,
            },
          },
          enrollments: { where: { deletedAt: null } },
          assessmentAttempts: {
            where: { deletedAt: null },
            include: { assessment: { select: { title: true } } },
            orderBy: { submittedAt: "desc" },
          },
          certificates: {
            where: { deletedAt: null },
            include: { template: { select: { name: true } } },
            orderBy: { issuedAt: "desc" },
          },
        },
        orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
      }),
      prisma.skillLevel.findMany({ orderBy: { rank: "asc" } }),
    ]);

    return { users, maxSkillRank: Math.max(...skillLevels.map((l) => l.rank), 4) };
  },

  async findUserById(userId: string) {
    const user = await prisma.user.findFirst({
      where: { id: userId, deletedAt: null },
      include: {
        role: { select: { name: true, slug: true } },
        department: { select: { id: true, name: true } },
        team: { select: { id: true, name: true } },
        jobRole: {
          include: {
            skillRequirements: {
              where: { isMandatory: true, deletedAt: null },
              include: { requiredSkillLevel: true, skill: { select: { id: true } } },
            },
          },
        },
        manager: { select: { id: true, firstName: true, lastName: true } },
        experienceLevel: { select: { name: true } },
        employeeSkills: {
          where: { deletedAt: null },
          include: {
            skill: { select: { id: true, name: true } },
            skillLevel: true,
          },
        },
        enrollments: {
          where: { deletedAt: null },
          include: { course: { select: { title: true } } },
          orderBy: { enrolledAt: "desc" },
        },
        assessmentAttempts: {
          where: { deletedAt: null },
          include: { assessment: { select: { title: true } } },
          orderBy: { submittedAt: "desc" },
          take: 25,
        },
        certificates: {
          where: { deletedAt: null },
          include: { template: { select: { name: true } } },
          orderBy: { issuedAt: "desc" },
        },
      },
    });

    const skillLevels = await prisma.skillLevel.findMany({ orderBy: { rank: "asc" } });
    const maxSkillRank = Math.max(...skillLevels.map((l) => l.rank), 4);

    const activityTimeline = await prisma.auditLog.findMany({
      where: { OR: [{ actorId: userId }, { entityType: "User", entityId: userId }] },
      orderBy: { createdAt: "desc" },
      take: 25,
    });

    return user ? { user, maxSkillRank, activityTimeline } : null;
  },
};
