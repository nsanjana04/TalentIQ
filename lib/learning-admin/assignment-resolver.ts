import type { AssignmentTargetType, CourseLevelTier } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { AppError } from "@/lib/errors/app-error";
import { ACTIVE_ASSIGNMENT_STATUSES } from "@/types/learning-admin";

const ACTIVE_USER_WHERE = {
  isActive: true,
  deletedAt: null,
} as const;

export interface ResolvedTargetUsers {
  userIds: string[];
  inactiveSkipped: { id: string; firstName: string; lastName: string; email: string; departmentName: string | null }[];
  targetLabel: string;
}

export async function resolveTargetLabel(
  targetType: AssignmentTargetType,
  targetId: string | null | undefined
): Promise<string> {
  switch (targetType) {
    case "USER": {
      if (!targetId) return "User";
      const user = await prisma.user.findFirst({
        where: { id: targetId, deletedAt: null },
        select: { firstName: true, lastName: true },
      });
      return user ? `${user.firstName} ${user.lastName}` : "Unknown User";
    }
    case "DEPARTMENT": {
      if (!targetId) return "Department";
      const dept = await prisma.department.findFirst({
        where: { id: targetId, deletedAt: null },
        select: { name: true },
      });
      return dept?.name ?? "Unknown Department";
    }
    case "TEAM": {
      if (!targetId) return "Team";
      const team = await prisma.team.findFirst({
        where: { id: targetId, deletedAt: null },
        select: { name: true },
      });
      return team?.name ?? "Unknown Team";
    }
    case "ROLE": {
      if (!targetId) return "Role";
      const role = await prisma.role.findFirst({
        where: { id: targetId, deletedAt: null },
        select: { name: true },
      });
      return role?.name ?? "Unknown Role";
    }
    case "ORGANIZATION":
      return "Entire Organization";
    default:
      return targetType;
  }
}

export async function resolveTargetUsers(
  targetType: AssignmentTargetType,
  targetId: string | null | undefined
): Promise<ResolvedTargetUsers> {
  switch (targetType) {
    case "USER": {
      if (!targetId) throw new AppError("BAD_REQUEST", "User target requires targetId");
      const user = await prisma.user.findFirst({
        where: { id: targetId, deletedAt: null },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          isActive: true,
          department: { select: { name: true } },
        },
      });
      if (!user) throw new AppError("NOT_FOUND", "User not found");
      const inactiveSkipped = user.isActive
        ? []
        : [
            {
              id: user.id,
              firstName: user.firstName,
              lastName: user.lastName,
              email: user.email,
              departmentName: user.department?.name ?? null,
            },
          ];
      return {
        userIds: user.isActive ? [user.id] : [],
        inactiveSkipped,
        targetLabel: `${user.firstName} ${user.lastName}`,
      };
    }
    case "DEPARTMENT": {
      if (!targetId) throw new AppError("BAD_REQUEST", "Department target requires targetId");
      const dept = await prisma.department.findFirst({
        where: { id: targetId, deletedAt: null },
        select: { id: true, name: true },
      });
      if (!dept) throw new AppError("NOT_FOUND", "Department not found");
      const users = await prisma.user.findMany({
        where: { departmentId: targetId, deletedAt: null },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          isActive: true,
          department: { select: { name: true } },
        },
      });
      return splitActiveUsers(users, dept.name);
    }
    case "TEAM": {
      if (!targetId) throw new AppError("BAD_REQUEST", "Team target requires targetId");
      const team = await prisma.team.findFirst({
        where: { id: targetId, deletedAt: null },
        select: { id: true, name: true },
      });
      if (!team) throw new AppError("NOT_FOUND", "Team not found");
      const users = await prisma.user.findMany({
        where: { teamId: targetId, deletedAt: null },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          isActive: true,
          department: { select: { name: true } },
        },
      });
      return splitActiveUsers(users, team.name);
    }
    case "ROLE": {
      if (!targetId) throw new AppError("BAD_REQUEST", "Role target requires targetId");
      const role = await prisma.role.findFirst({
        where: { id: targetId, deletedAt: null },
        select: { id: true, name: true },
      });
      if (!role) throw new AppError("NOT_FOUND", "Role not found");
      const users = await prisma.user.findMany({
        where: { roleId: targetId, deletedAt: null },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          isActive: true,
          department: { select: { name: true } },
        },
      });
      return splitActiveUsers(users, role.name);
    }
    case "ORGANIZATION": {
      const users = await prisma.user.findMany({
        where: { deletedAt: null },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          isActive: true,
          department: { select: { name: true } },
        },
      });
      return splitActiveUsers(users, "Entire Organization");
    }
    default:
      throw new AppError("BAD_REQUEST", "Invalid target type");
  }
}

function splitActiveUsers(
  users: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    isActive: boolean;
    department: { name: string } | null;
  }[],
  targetLabel: string
): ResolvedTargetUsers {
  const active = users.filter((u) => u.isActive);
  const inactiveSkipped = users
    .filter((u) => !u.isActive)
    .map((u) => ({
      id: u.id,
      firstName: u.firstName,
      lastName: u.lastName,
      email: u.email,
      departmentName: u.department?.name ?? null,
    }));
  return {
    userIds: active.map((u) => u.id),
    inactiveSkipped,
    targetLabel,
  };
}

export async function findDuplicateAssignments(
  courseLevelId: string,
  userIds: string[]
) {
  if (!userIds.length) return [];
  const existing = await prisma.courseAssignmentUser.findMany({
    where: {
      courseLevelId,
      userId: { in: userIds },
      status: { in: ACTIVE_ASSIGNMENT_STATUSES },
    },
    select: {
      userId: true,
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          department: { select: { name: true } },
        },
      },
    },
  });
  return existing.map((e) => ({
    id: e.user.id,
    firstName: e.user.firstName,
    lastName: e.user.lastName,
    email: e.user.email,
    departmentName: e.user.department?.name ?? null,
  }));
}

export async function findPrerequisiteWarnings(
  courseId: string,
  courseLevelId: string,
  userIds: string[]
) {
  const level = await prisma.courseLevel.findFirst({
    where: { id: courseLevelId, courseId, deletedAt: null },
    select: { orderNumber: true, tier: true, unlockRule: true },
  });
  if (!level || level.orderNumber <= 1) return [];

  const previous = await prisma.courseLevel.findFirst({
    where: { courseId, orderNumber: level.orderNumber - 1, deletedAt: null },
    select: { id: true, name: true, tier: true },
  });
  if (!previous) return [];

  const block = level.unlockRule === "BLOCK_UNTIL_PREVIOUS_COMPLETE";
  const warnings: { userId: string; userName: string; message: string }[] = [];

  const incomplete = await prisma.courseAssignmentUser.findMany({
    where: {
      courseId,
      courseLevelId: previous.id,
      userId: { in: userIds },
      status: { not: "COMPLETED" },
    },
    select: {
      userId: true,
      user: { select: { firstName: true, lastName: true } },
    },
  });

  const usersWithoutPrior = await prisma.user.findMany({
    where: {
      id: {
        in: userIds.filter(
          (id) => !incomplete.some((i) => i.userId === id)
        ),
      },
    },
    select: { id: true, firstName: true, lastName: true },
  });

  const priorCompleted = await prisma.courseAssignmentUser.findMany({
    where: {
      courseLevelId: previous.id,
      userId: { in: userIds },
      status: "COMPLETED",
    },
    select: { userId: true },
  });
  const completedSet = new Set(priorCompleted.map((p) => p.userId));

  for (const userId of userIds) {
    if (completedSet.has(userId)) continue;
    const inc = incomplete.find((i) => i.userId === userId);
    const user = inc?.user ?? usersWithoutPrior.find((u) => u.id === userId);
    if (!user) continue;
    const message = block
      ? `Must complete ${previous.name} before ${level.tier}`
      : `Recommended: complete ${previous.name} first`;
    warnings.push({
      userId,
      userName: `${user.firstName} ${user.lastName}`,
      message,
    });
  }

  return warnings;
}

export function filterBlockedByPrerequisite(
  userIds: string[],
  warnings: { userId: string; message: string }[],
  unlockRule: string | null
): string[] {
  if (unlockRule !== "BLOCK_UNTIL_PREVIOUS_COMPLETE") return userIds;
  const blocked = new Set(warnings.map((w) => w.userId));
  return userIds.filter((id) => !blocked.has(id));
}

export const TIER_ORDER: Record<CourseLevelTier, number> = {
  BASIC: 1,
  INTERMEDIATE: 2,
  ADVANCED: 3,
  EXPERT: 4,
};
