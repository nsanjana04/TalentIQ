import { RoleSlug, type RoleSlug as RoleSlugType } from "@/constants/role-slugs";
import { normalizeStoredScorePercent } from "@/lib/assessments/attempt-scoring";
import { AppError } from "@/lib/errors/app-error";
import { getAvatarColor, getInitials } from "@/lib/users/avatar";
import type { UpdateUserInput, UserListQuery, CreateUserInput } from "@/lib/validations/users";
import { departmentRepository } from "@/repositories/department.repository";
import { roleRepository } from "@/repositories/role.repository";
import { userRepository } from "@/repositories/user.repository";
import { auditService } from "@/services/audit.service";
import { hashPassword } from "@/lib/auth/password";
import type {
  PaginatedUsers,
  UserFiltersMeta,
  UserListItem,
  UserProfile,
} from "@/types/users";

function mapListUser(
  user: Awaited<ReturnType<typeof userRepository.findManyPaginated>>["users"][number]
): UserListItem {
  const progress =
    user.enrollments.length > 0
      ? Math.round(
          user.enrollments.reduce((sum, e) => sum + e.progress, 0) / user.enrollments.length
        )
      : 0;

  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    fullName: `${user.firstName} ${user.lastName}`,
    initials: getInitials(user.firstName, user.lastName),
    avatarColor: getAvatarColor(user.id),
    role: {
      id: user.role.id,
      slug: user.role.slug as RoleSlug,
      name: user.role.name,
    },
    department: user.department,
    team: user.team,
    jobRole: user.jobRole,
    isActive: user.isActive,
    skillCount: user._count.employeeSkills,
    certificateCount: user._count.certificates,
    learningProgress: progress,
    lastLoginAt: user.lastLoginAt?.toISOString() ?? null,
    createdAt: user.createdAt.toISOString(),
  };
}

export const userService = {
  async list(query: UserListQuery): Promise<PaginatedUsers> {
    const result = await userRepository.findManyPaginated(query);
    return {
      items: result.users.map(mapListUser),
      total: result.total,
      page: result.page,
      pageSize: result.pageSize,
      totalPages: Math.ceil(result.total / result.pageSize) || 1,
    };
  },

  async getFiltersMeta(): Promise<UserFiltersMeta> {
    const [roles, departments] = await Promise.all([
      roleRepository.findAll(),
      departmentRepository.findAll(),
    ]);
    return {
      roles: roles.map((r) => ({ id: r.id, slug: r.slug, name: r.name })),
      departments,
    };
  },

  async create(input: CreateUserInput, actorId: string): Promise<UserListItem> {
    const taken = await userRepository.emailExists(input.email);
    if (taken) throw new AppError("CONFLICT", "Email is already in use");

    const role = await roleRepository.findById(input.roleId);
    if (!role) throw new AppError("VALIDATION_ERROR", "Invalid role");

    if (input.departmentId) {
      const dept = await departmentRepository.findById(input.departmentId);
      if (!dept) throw new AppError("VALIDATION_ERROR", "Invalid department");
    }

    const passwordHash = await hashPassword(input.password);
    const user = await userRepository.create({
      email: input.email.trim().toLowerCase(),
      passwordHash,
      firstName: input.firstName.trim(),
      lastName: input.lastName.trim(),
      roleId: input.roleId,
      departmentId: input.departmentId ?? null,
      teamId: input.teamId ?? null,
    });

    await auditService.log({
      action: "CREATE",
      entityType: "User",
      entityId: user.id,
      actorId,
      metadata: { email: user.email, roleId: input.roleId },
    });

    const profile = await this.getProfile(user.id);
    return profile;
  },

  async getProfile(userId: string): Promise<UserProfile> {
    const [user, activityLogs] = await Promise.all([
      userRepository.findProfileById(userId),
      userRepository.findActivityTimeline(userId),
    ]);
    if (!user) {
      throw new AppError("NOT_FOUND", "User not found");
    }

    const progress =
      user.enrollments.length > 0
        ? Math.round(
            user.enrollments.reduce((sum, e) => sum + e.progress, 0) / user.enrollments.length
          )
        : 0;

    const scoredAttempts = user.assessmentAttempts.filter((a) => a.score != null);
    const assessmentScore =
      scoredAttempts.length > 0
        ? Math.round(
            scoredAttempts.reduce((sum, a) => {
              const pct = normalizeStoredScorePercent(a.score, a.maxScore) ?? 0;
              return sum + pct;
            }, 0) / scoredAttempts.length
          )
        : 0;

    const skillScore =
      user.employeeSkills.length > 0
        ? Math.round(
            (user.employeeSkills.reduce((sum, s) => sum + s.skillLevel.rank * 25, 0) /
              user.employeeSkills.length)
          )
        : 0;

    const certificateScore = Math.min(100, user.certificates.length * 20);
    const workforceReadinessScore = Math.round(
      skillScore * 0.4 + progress * 0.3 + assessmentScore * 0.2 + certificateScore * 0.1
    );

    const riskLevel: UserProfile["analytics"]["riskLevel"] =
      workforceReadinessScore < 40
        ? "critical"
        : workforceReadinessScore < 55
          ? "high"
          : workforceReadinessScore < 70
            ? "medium"
            : workforceReadinessScore < 85
              ? "low"
              : "none";

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      fullName: `${user.firstName} ${user.lastName}`,
      initials: getInitials(user.firstName, user.lastName),
      avatarColor: getAvatarColor(user.id),
      role: {
        id: user.role.id,
        slug: user.role.slug as RoleSlug,
        name: user.role.name,
      },
      department: user.department,
      team: user.team,
      jobRole: user.jobRole,
      isActive: user.isActive,
      skillCount: user.employeeSkills.length,
      certificateCount: user.certificates.length,
      learningProgress: progress,
      lastLoginAt: user.lastLoginAt?.toISOString() ?? null,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
      experienceLevel: user.experienceLevel,
      manager: user.manager
        ? {
            id: user.manager.id,
            fullName: `${user.manager.firstName} ${user.manager.lastName}`,
            email: user.manager.email,
          }
        : null,
      emailVerified: !!user.emailVerifiedAt,
      skills: user.employeeSkills.map((es) => ({
        id: es.id,
        name: es.skill.name,
        level: es.skillLevel.name,
        levelRank: es.skillLevel.rank,
        verified: !!es.verifiedAt,
      })),
      certificates: user.certificates.map((c) => ({
        id: c.id,
        certificateNumber: c.certificateNumber,
        issuedAt: c.issuedAt.toISOString(),
        expiresAt: c.expiresAt?.toISOString() ?? null,
      })),
      enrollments: user.enrollments.map((e) => ({
        id: e.id,
        courseTitle: e.course.title,
        progress: e.progress,
        status: e.status,
      })),
      assessments: user.assessmentAttempts.map((a) => ({
        id: a.id,
        assessmentTitle: a.assessment.title,
        score: a.score,
        maxScore: a.maxScore,
        passed: a.passed,
        status: a.status,
        submittedAt: a.submittedAt?.toISOString() ?? null,
      })),
      activityTimeline: activityLogs.map((log) => ({
        id: log.id,
        action: log.action,
        entityType: log.entityType,
        description: `${log.action} · ${log.entityType}${log.entityId ? ` (${log.entityId.slice(0, 8)})` : ""}`,
        createdAt: log.createdAt.toISOString(),
        actorName: log.actor
          ? `${log.actor.firstName} ${log.actor.lastName}`
          : null,
      })),
      analytics: {
        skillScore,
        learningScore: progress,
        assessmentScore,
        certificateScore,
        workforceReadinessScore,
        riskLevel,
      },
    };
  },

  async update(
    userId: string,
    input: UpdateUserInput,
    actorId: string
  ): Promise<UserListItem> {
    const existing = await userRepository.findProfileById(userId);
    if (!existing) {
      throw new AppError("NOT_FOUND", "User not found");
    }

    if (input.email && input.email !== existing.email) {
      const taken = await userRepository.emailExists(input.email, userId);
      if (taken) {
        throw new AppError("CONFLICT", "Email is already in use");
      }
    }

    if (input.roleId && input.roleId !== existing.roleId) {
      const role = await roleRepository.findById(input.roleId);
      if (!role) {
        throw new AppError("VALIDATION_ERROR", "Invalid role");
      }
    }

    if (input.departmentId) {
      const dept = await departmentRepository.findById(input.departmentId);
      if (!dept) {
        throw new AppError("VALIDATION_ERROR", "Invalid department");
      }
    }

    await userRepository.updateById(userId, input);

    await auditService.log({
      action: "UPDATE",
      entityType: "User",
      entityId: userId,
      actorId,
      metadata: { fields: Object.keys(input) },
    });

    const profile = await this.getProfile(userId);
    return profile;
  },

  async deactivate(userId: string, actorId: string): Promise<void> {
    if (userId === actorId) {
      throw new AppError("VALIDATION_ERROR", "You cannot deactivate your own account");
    }

    const existing = await userRepository.findProfileById(userId);
    if (!existing) {
      throw new AppError("NOT_FOUND", "User not found");
    }

    if (!existing.isActive) {
      throw new AppError("VALIDATION_ERROR", "User is already inactive");
    }

    await userRepository.updateById(userId, { isActive: false });

    await auditService.log({
      action: "UPDATE",
      entityType: "User",
      entityId: userId,
      actorId,
      metadata: { action: "deactivate" },
    });
  },
};
