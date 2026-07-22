import type { RoleSlug } from "@/constants/role-slugs";
import { RoleSlug as RS } from "@/constants/role-slugs";
import { prisma } from "@/lib/db/prisma";

export type DashboardScopeType = "organization" | "department" | "team" | "personal";

export interface DashboardScope {
  type: DashboardScopeType;
  label: string;
  userFilter?: { id?: string; departmentId?: string; teamId?: string };
}

const ORG_WIDE_ROLES: RoleSlug[] = [RS.ADMIN];

export async function resolveDashboardScope(
  userId: string,
  role: RoleSlug
): Promise<DashboardScope> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      departmentId: true,
      team: { select: { name: true } },
      department: { select: { name: true } },
    },
  });

  if (ORG_WIDE_ROLES.includes(role)) {
    return { type: "organization", label: "Organization-wide" };
  }

  if (role === RS.MANAGER && user?.departmentId) {
    return {
      type: "department",
      label: user.department?.name ?? "Your Department",
      userFilter: { departmentId: user.departmentId },
    };
  }

  if (role === RS.MANAGER && user?.team) {
    const dbUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { teamId: true, team: { select: { name: true } } },
    });
    if (dbUser?.teamId) {
      return {
        type: "team",
        label: dbUser.team?.name ?? "Your Team",
        userFilter: { teamId: dbUser.teamId },
      };
    }
  }

  return {
    type: "personal",
    label: "Your Overview",
    userFilter: { id: userId },
  };
}

export function buildUserWhere(scope: DashboardScope) {
  const base = { isActive: true, deletedAt: null };
  if (!scope.userFilter) return base;
  if (scope.userFilter.id) return { ...base, id: scope.userFilter.id };
  if (scope.userFilter.departmentId)
    return { ...base, departmentId: scope.userFilter.departmentId };
  if (scope.userFilter.teamId) return { ...base, teamId: scope.userFilter.teamId };
  return base;
}
