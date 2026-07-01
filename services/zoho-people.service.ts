import { RoleSlug as RS } from "@/constants/role-slugs";
import { prisma } from "@/lib/db/prisma";
import { AppError } from "@/lib/errors/app-error";
import { isZohoPeopleEnabled } from "@/lib/integrations/zoho/config";
import { fetchAllZohoEmployees } from "@/lib/integrations/zoho/people-client";
import type { AssignableEmployeesResponse } from "@/types/learning-content";
import type { ZohoPeopleFetchResult, ZohoPeopleConfigStatus } from "@/types/zoho-people";
import { getZohoPeopleConfigStatus } from "@/lib/integrations/zoho/config";

export const zohoPeopleService = {
  async getStatus(): Promise<ZohoPeopleConfigStatus> {
    return getZohoPeopleConfigStatus();
  },

  async fetchEmployees(): Promise<ZohoPeopleFetchResult> {
    if (!(await isZohoPeopleEnabled())) {
      throw new AppError(
        "BAD_REQUEST",
        "Zoho People integration is disabled or not configured"
      );
    }

    const employees = await fetchAllZohoEmployees();
    return {
      employees,
      total: employees.length,
      source: "zoho",
    };
  },

  async getAssignableEmployees(): Promise<AssignableEmployeesResponse> {
    if (!(await isZohoPeopleEnabled())) {
      throw new AppError(
        "BAD_REQUEST",
        "Zoho People integration is disabled or not configured"
      );
    }

    const zohoEmployees = await fetchAllZohoEmployees();
    const emails = zohoEmployees.map((e) => e.email);

    if (!emails.length) {
      return { scopeLabel: "Zoho People", scopeType: "organization", users: [] };
    }

    const localUsers = await prisma.user.findMany({
      where: {
        isActive: true,
        deletedAt: null,
        role: { slug: RS.EMPLOYEE },
        email: { in: emails, mode: "insensitive" },
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        team: { select: { name: true } },
        department: { select: { name: true } },
      },
    });

    const localByEmail = new Map(localUsers.map((u) => [u.email.toLowerCase(), u]));
    const zohoByEmail = new Map(zohoEmployees.map((e) => [e.email.toLowerCase(), e]));

    const users = localUsers
      .map((user) => {
        const zoho = zohoByEmail.get(user.email.toLowerCase());
        return {
          id: user.id,
          firstName: zoho?.firstName || user.firstName,
          lastName: zoho?.lastName || user.lastName,
          email: user.email,
          teamName: zoho?.team ?? user.team?.name ?? null,
          departmentName: zoho?.department ?? user.department?.name ?? null,
        };
      })
      .sort((a, b) => a.lastName.localeCompare(b.lastName) || a.firstName.localeCompare(b.firstName));

    const unmatchedCount = zohoEmployees.filter((z) => !localByEmail.has(z.email.toLowerCase())).length;

    return {
      scopeLabel: unmatchedCount
        ? `Zoho People (${unmatchedCount} not in TalentIQ yet)`
        : "Zoho People",
      scopeType: "organization",
      users,
    };
  },
};
