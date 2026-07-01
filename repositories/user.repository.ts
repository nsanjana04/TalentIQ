import type { User } from "@prisma/client";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import type { RoleSlug } from "@/constants/role-slugs";
import { buildUserSearchWhere } from "@/lib/users/search-filter";

export type UserWithoutPassword = Omit<User, "passwordHash">;

const userSelect = {
  id: true,
  email: true,
  firstName: true,
  lastName: true,
  roleId: true,
  isActive: true,
  departmentId: true,
  teamId: true,
  jobRoleId: true,
  experienceLevelId: true,
  managerId: true,
  createdAt: true,
  updatedAt: true,
  emailVerifiedAt: true,
  lastLoginAt: true,
  passwordChangedAt: true,
  deletedAt: true,
  role: {
    select: {
      id: true,
      slug: true,
      name: true,
    },
  },
} as const;

export type UserWithRole = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  roleId: string;
  roleSlug: RoleSlug;
  isActive: boolean;
};

function mapUserWithRole(
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    roleId: string;
    isActive: boolean;
    role: { slug: string };
  } | null
): UserWithRole | null {
  if (!user) return null;
  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    roleId: user.roleId,
    roleSlug: user.role.slug as RoleSlug,
    isActive: user.isActive,
  };
}

export const userRepository = {
  async findByEmail(email: string) {
    return prisma.user.findUnique({
      where: { email },
      include: { role: true },
    });
  },

  async findByIdWithRole(id: string) {
    return prisma.user.findUnique({
      where: { id },
      include: { role: true },
    });
  },

  async findById(id: string) {
    const user = await prisma.user.findUnique({
      where: { id },
      select: userSelect,
    });
    return mapUserWithRole(
      user
        ? {
            ...user,
            role: user.role,
          }
        : null
    );
  },

  async create(data: {
    email: string;
    passwordHash: string;
    firstName: string;
    lastName: string;
    roleId: string;
    departmentId?: string | null;
    teamId?: string | null;
  }) {
    const user = await prisma.user.create({
      data: {
        email: data.email,
        passwordHash: data.passwordHash,
        firstName: data.firstName,
        lastName: data.lastName,
        roleId: data.roleId,
        departmentId: data.departmentId ?? undefined,
        teamId: data.teamId ?? undefined,
        isActive: true,
      },
      select: userSelect,
    });
    return mapUserWithRole(user)!;
  },

  async updateLastLogin(id: string): Promise<void> {
    await prisma.user.update({
      where: { id },
      data: { lastLoginAt: new Date() },
    });
  },

  async updatePassword(id: string, passwordHash: string) {
    return prisma.user.update({
      where: { id },
      data: { passwordHash, passwordChangedAt: new Date() },
    });
  },

  async setPasswordResetToken(id: string, tokenHash: string, expiresAt: Date) {
    return prisma.user.update({
      where: { id },
      data: {
        passwordResetTokenHash: tokenHash,
        passwordResetExpiresAt: expiresAt,
      },
    });
  },

  async clearPasswordResetToken(id: string) {
    return prisma.user.update({
      where: { id },
      data: {
        passwordResetTokenHash: null,
        passwordResetExpiresAt: null,
      },
    });
  },

  async findByPasswordResetToken(email: string, tokenHash: string) {
    return prisma.user.findFirst({
      where: {
        email,
        passwordResetTokenHash: tokenHash,
        passwordResetExpiresAt: { gt: new Date() },
        isActive: true,
        deletedAt: null,
      },
      include: { role: true },
    });
  },

  async setEmailVerificationToken(id: string, tokenHash: string, expiresAt: Date) {
    return prisma.user.update({
      where: { id },
      data: {
        emailVerificationTokenHash: tokenHash,
        emailVerificationExpiresAt: expiresAt,
      },
    });
  },

  async verifyEmail(id: string) {
    return prisma.user.update({
      where: { id },
      data: {
        emailVerifiedAt: new Date(),
        emailVerificationTokenHash: null,
        emailVerificationExpiresAt: null,
      },
    });
  },

  async findByEmailVerificationToken(email: string, tokenHash: string) {
    return prisma.user.findFirst({
      where: {
        email,
        emailVerificationTokenHash: tokenHash,
        emailVerificationExpiresAt: { gt: new Date() },
        isActive: true,
        deletedAt: null,
      },
      include: { role: true },
    });
  },

  async findMany(params?: { roleId?: string; isActive?: boolean }) {
    const users = await prisma.user.findMany({
      where: {
        deletedAt: null,
        ...(params?.roleId && { roleId: params.roleId }),
        ...(params?.isActive !== undefined && { isActive: params.isActive }),
      },
      select: userSelect,
      orderBy: { createdAt: "desc" },
    });

    return users
      .map((user) => mapUserWithRole(user))
      .filter((u): u is UserWithRole => u !== null);
  },

  async findManyPaginated(params: {
    page: number;
    pageSize: number;
    search?: string;
    roleId?: string;
    departmentId?: string;
    status?: "all" | "active" | "inactive";
  }) {
    const { page, pageSize, search, roleId, departmentId, status } = params;
    const skip = (page - 1) * pageSize;

    const where = {
      deletedAt: null,
      ...(roleId && { roleId }),
      ...(departmentId && { departmentId }),
      ...(status === "active" && { isActive: true }),
      ...(status === "inactive" && { isActive: false }),
      ...(search ? buildUserSearchWhere(search) : {}),
    };

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          ...userSelect,
          department: { select: { id: true, name: true, code: true } },
          team: { select: { id: true, name: true, code: true } },
          jobRole: { select: { id: true, title: true, code: true } },
          _count: {
            select: {
              employeeSkills: { where: { deletedAt: null } },
              certificates: { where: { deletedAt: null } },
            },
          },
          enrollments: {
            where: { deletedAt: null },
            select: { progress: true },
          },
        },
        orderBy: [{ isActive: "desc" }, { lastName: "asc" }, { firstName: "asc" }],
        skip,
        take: pageSize,
      }),
      prisma.user.count({ where }),
    ]);

    return { users, total, page, pageSize };
  },

  async findProfileById(id: string) {
    return prisma.user.findFirst({
      where: { id, deletedAt: null },
      select: {
        ...userSelect,
        department: { select: { id: true, name: true, code: true } },
        team: { select: { id: true, name: true, code: true } },
        jobRole: { select: { id: true, title: true, code: true } },
        experienceLevel: { select: { id: true, name: true, code: true } },
        manager: {
          select: { id: true, email: true, firstName: true, lastName: true },
        },
        employeeSkills: {
          where: { deletedAt: null },
          select: {
            id: true,
            verifiedAt: true,
            skill: { select: { name: true } },
            skillLevel: { select: { name: true, rank: true } },
          },
          orderBy: { skill: { name: "asc" } },
        },
        certificates: {
          where: { deletedAt: null },
          select: {
            id: true,
            certificateNumber: true,
            issuedAt: true,
            expiresAt: true,
          },
          orderBy: { issuedAt: "desc" },
          take: 10,
        },
        enrollments: {
          where: { deletedAt: null },
          select: {
            id: true,
            progress: true,
            status: true,
            course: { select: { title: true } },
          },
          orderBy: { enrolledAt: "desc" },
          take: 10,
        },
        assessmentAttempts: {
          where: { deletedAt: null },
          select: {
            id: true,
            score: true,
            maxScore: true,
            passed: true,
            status: true,
            submittedAt: true,
            assessment: { select: { title: true } },
          },
          orderBy: { submittedAt: "desc" },
          take: 15,
        },
      },
    });
  },

  async findActivityTimeline(userId: string, limit = 20) {
    return prisma.auditLog.findMany({
      where: {
        OR: [{ actorId: userId }, { entityType: "User", entityId: userId }],
      },
      orderBy: { createdAt: "desc" },
      take: limit,
      include: {
        actor: { select: { firstName: true, lastName: true } },
      },
    });
  },

  async updateById(
    id: string,
    data: {
      firstName?: string;
      lastName?: string;
      email?: string;
      roleId?: string;
      departmentId?: string | null;
      teamId?: string | null;
      isActive?: boolean;
    }
  ) {
    return prisma.user.update({
      where: { id },
      data,
      select: userSelect,
    });
  },

  async emailExists(email: string, excludeId?: string) {
    const user = await prisma.user.findFirst({
      where: {
        email,
        deletedAt: null,
        ...(excludeId && { NOT: { id: excludeId } }),
      },
      select: { id: true },
    });
    return !!user;
  },
};
