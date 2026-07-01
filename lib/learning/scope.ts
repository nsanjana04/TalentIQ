import type { RoleSlug } from "@/constants/role-slugs";
import { RoleSlug as RS } from "@/constants/role-slugs";
import { isLearningManagerRole } from "@/constants/learning-manager-roles";
import { AppError } from "@/lib/errors/app-error";
import { isZohoPeopleEnabled } from "@/lib/integrations/zoho/config";
import { prisma } from "@/lib/db/prisma";
import { zohoPeopleService } from "@/services/zoho-people.service";

const ASSIGNABLE_EMPLOYEE_WHERE = {
  isActive: true,
  deletedAt: null,
  role: { slug: RS.EMPLOYEE },
} as const;

export async function assertLearningManagerRole(role: RoleSlug) {
  if (!isLearningManagerRole(role)) {
    throw new AppError("FORBIDDEN", "You do not have permission to manage learning content");
  }
}

export async function listAssignableUsers(_actorId: string, role: RoleSlug) {
  await assertLearningManagerRole(role);

  if (await isZohoPeopleEnabled()) {
    return zohoPeopleService.getAssignableEmployees();
  }

  const users = await prisma.user.findMany({
    where: ASSIGNABLE_EMPLOYEE_WHERE,
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      team: { select: { name: true } },
      department: { select: { name: true } },
    },
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
  });

  return {
    scopeLabel: "Employees",
    scopeType: "organization" as const,
    users: users.map((u) => ({
      id: u.id,
      firstName: u.firstName,
      lastName: u.lastName,
      email: u.email,
      teamName: u.team?.name ?? null,
      departmentName: u.department?.name ?? null,
    })),
  };
}

export async function resolveAssigneeUserIds(
  _actorId: string,
  role: RoleSlug,
  userIds: string[] | undefined,
  assignAll: boolean
): Promise<string[]> {
  await assertLearningManagerRole(role);

  if (await isZohoPeopleEnabled()) {
    const assignable = await zohoPeopleService.getAssignableEmployees();
    const allowedIds = new Set(assignable.users.map((u) => u.id));

    if (assignAll) {
      return assignable.users.map((u) => u.id);
    }

    if (!userIds?.length) {
      throw new AppError("BAD_REQUEST", "Select at least one employee or choose assign all");
    }

    const invalid = userIds.filter((id) => !allowedIds.has(id));
    if (invalid.length > 0) {
      throw new AppError("BAD_REQUEST", "Some selected employees are not in Zoho People / TalentIQ");
    }

    return userIds;
  }

  if (assignAll) {
    const users = await prisma.user.findMany({
      where: ASSIGNABLE_EMPLOYEE_WHERE,
      select: { id: true },
    });
    return users.map((u) => u.id);
  }

  if (!userIds?.length) {
    throw new AppError("BAD_REQUEST", "Select at least one employee or choose assign all");
  }

  const allowed = await prisma.user.findMany({
    where: { ...ASSIGNABLE_EMPLOYEE_WHERE, id: { in: userIds } },
    select: { id: true },
  });
  const allowedSet = new Set(allowed.map((u) => u.id));
  const invalid = userIds.filter((id) => !allowedSet.has(id));

  if (invalid.length > 0) {
    throw new AppError("BAD_REQUEST", "Some selected users are not active employees");
  }

  return userIds;
}

export function canSetOrgWideMandatory(role: RoleSlug): boolean {
  return role === "ADMIN" || role === "MANAGER";
}
