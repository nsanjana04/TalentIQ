import type { AssignmentTargetType } from "@prisma/client";
import { AppError } from "@/lib/errors/app-error";
import {
  filterBlockedByPrerequisite,
  findDuplicateAssignments,
  findPrerequisiteWarnings,
  resolveTargetLabel,
  resolveTargetUsers,
} from "@/lib/learning-admin/assignment-resolver";
import type {
  AssignmentListQuery,
  CreateAssignmentInput,
  AdminCourseListQuery,
  UpdateAssignmentInput,
} from "@/lib/validations/learning-admin";
import { learningAdminRepository } from "@/repositories/learning-admin.repository";
import { auditService } from "@/services/audit.service";
import { notificationService } from "@/services/notification.service";
import type {
  AdminCourseLevel,
  AdminCourseSummary,
  AssignmentBatchDetail,
  AssignmentBatchSummary,
  AssignmentPreviewResult,
  AssignableDepartment,
  AssignableRole,
  AssignableTeam,
  AssignableUser,
  COURSE_LEVEL_TIER_LABELS,
  DepartmentProgressRow,
  LearningAdminDashboard,
  LearningProgressRow,
  MyCourseAssignment,
  UserAssignmentSummary,
} from "@/types/learning-admin";
import { ROUTES } from "@/constants/routes";
import { isLearningManagerRole } from "@/constants/learning-manager-roles";
import type { RoleSlug } from "@/constants/role-slugs";

function mapCourseSummary(
  record: Awaited<ReturnType<typeof learningAdminRepository.listAdminCourses>>["items"][0]
): AdminCourseSummary {
  return {
    id: record.id,
    title: record.title,
    slug: record.slug,
    description: record.description,
    category: record.category,
    adminStatus: record.adminStatus,
    durationMinutes: record.durationMinutes,
    skillsCovered: record.skillsCovered,
    levelCount: record._count.adminLevels,
    assignmentCount: record._count.assignmentBatches,
    createdByName: record.createdBy
      ? `${record.createdBy.firstName} ${record.createdBy.lastName}`
      : null,
    createdAt: record.createdAt.toISOString(),
  };
}

function mapBatchSummary(
  record: Awaited<
    ReturnType<typeof learningAdminRepository.listAssignmentBatches>
  >["items"][0],
  targetLabel?: string
): AssignmentBatchSummary {
  const progress =
    record.totalUsers > 0
      ? Math.round((record.completedUsers / record.totalUsers) * 100)
      : 0;
  return {
    id: record.id,
    courseId: record.courseId,
    courseTitle: record.course.title,
    courseLevelId: record.courseLevelId,
    levelName: record.courseLevel.name,
    levelTier: record.courseLevel.tier,
    targetType: record.targetType,
    targetLabel: targetLabel ?? record.targetType,
    assignedByName: `${record.assignedBy.firstName} ${record.assignedBy.lastName}`,
    assignedAt: record.assignedAt.toISOString(),
    dueDate: record.dueDate.toISOString(),
    status: record.status,
    totalUsers: record.totalUsers,
    completedUsers: record.completedUsers,
    overdueUsers: record.overdueUsers,
    progressPercent: progress,
  };
}

function parseDueDate(input: string): Date {
  const d = new Date(input);
  if (Number.isNaN(d.getTime())) {
    throw new AppError("BAD_REQUEST", "Invalid due date");
  }
  return d;
}

function assertLearningManager(role: RoleSlug) {
  if (!isLearningManagerRole(role)) {
    throw new AppError("FORBIDDEN", "Learning manager role required");
  }
}

export const learningAdminService = {
  async listCourses(query: AdminCourseListQuery) {
    const { items, total } = await learningAdminRepository.listAdminCourses(query);
    return {
      items: items.map(mapCourseSummary),
      total,
      page: query.page,
      pageSize: query.pageSize,
    };
  },

  async getCourseLevels(courseId: string): Promise<AdminCourseLevel[]> {
    const course = await learningAdminRepository.findCourseById(courseId);
    if (!course) throw new AppError("NOT_FOUND", "Course not found");
    return course.adminLevels.map((l) => ({
      id: l.id,
      courseId: l.courseId,
      tier: l.tier,
      name: l.name,
      description: l.description,
      durationHours: l.durationHours,
      learningObjectives: l.learningObjectives,
      passingScore: l.passingScore,
      orderNumber: l.orderNumber,
      unlockRule: l.unlockRule,
      certificateEnabled: l.certificateEnabled,
    }));
  },

  async getAssignableUsers(search?: string): Promise<AssignableUser[]> {
    const users = await learningAdminRepository.listAssignableUsers(search);
    return users.map((u) => ({
      id: u.id,
      firstName: u.firstName,
      lastName: u.lastName,
      email: u.email,
      jobTitle: u.jobRole?.title ?? null,
      departmentId: u.departmentId,
      departmentName: u.department?.name ?? null,
      teamId: u.teamId,
      teamName: u.team?.name ?? null,
      roleName: u.role.name,
      isActive: u.isActive,
    }));
  },

  async getDepartments(): Promise<AssignableDepartment[]> {
    const rows = await learningAdminRepository.listDepartments();
    return rows.map((d) => ({
      id: d.id,
      name: d.name,
      code: d.code,
      employeeCount: d._count.users,
    }));
  },

  async getTeams(): Promise<AssignableTeam[]> {
    const rows = await learningAdminRepository.listTeams();
    return rows.map((t) => ({
      id: t.id,
      name: t.name,
      code: t.code,
      departmentName: t.department.name,
      memberCount: t._count.members,
    }));
  },

  async getRoles(): Promise<AssignableRole[]> {
    const rows = await learningAdminRepository.listRolesWithUserCounts();
    return rows.map((r) => ({
      id: r.id,
      name: r.name,
      slug: r.slug,
      userCount: r._count.users,
    }));
  },

  async previewAssignment(input: {
    courseId: string;
    courseLevelId: string;
    targetType: AssignmentTargetType;
    targetId?: string | null;
  }): Promise<AssignmentPreviewResult> {
    const level = await learningAdminRepository.findCourseLevel(
      input.courseLevelId,
      input.courseId
    );
    if (!level) throw new AppError("NOT_FOUND", "Course level not found");
    if (level.course.adminStatus !== "ACTIVE") {
      throw new AppError("BAD_REQUEST", "Cannot assign an inactive course");
    }

    const resolved = await resolveTargetUsers(input.targetType, input.targetId);
    const duplicates = await findDuplicateAssignments(
      input.courseLevelId,
      resolved.userIds
    );
    const duplicateIds = new Set(duplicates.map((d) => d.id));
    const withoutDuplicates = resolved.userIds.filter((id) => !duplicateIds.has(id));

    const prerequisiteWarnings = await findPrerequisiteWarnings(
      input.courseId,
      input.courseLevelId,
      withoutDuplicates
    );
    const finalIds = filterBlockedByPrerequisite(
      withoutDuplicates,
      prerequisiteWarnings,
      level.unlockRule
    );

    const finalUsers = await learningAdminRepository.listAssignableUsers();
    const finalSet = new Set(finalIds);

    return {
      targetType: input.targetType,
      targetLabel: resolved.targetLabel,
      usersAffected: resolved.userIds.length,
      duplicateUsers: duplicates,
      inactiveUsersSkipped: resolved.inactiveSkipped,
      prerequisiteWarnings,
      finalAssignableUsers: finalUsers
        .filter((u) => finalSet.has(u.id))
        .map((u) => ({
          id: u.id,
          firstName: u.firstName,
          lastName: u.lastName,
          email: u.email,
          departmentName: u.department?.name ?? null,
        })),
    };
  },

  async createAssignment(
    actorId: string,
    role: RoleSlug,
    input: CreateAssignmentInput
  ): Promise<AssignmentBatchDetail> {
    assertLearningManager(role);

    const preview = await this.previewAssignment(input);
    if (!preview.finalAssignableUsers.length) {
      throw new AppError(
        "BAD_REQUEST",
        "No users eligible for assignment after validation"
      );
    }

    const dueDate = parseDueDate(input.dueDate);
    const level = await learningAdminRepository.findCourseLevel(
      input.courseLevelId,
      input.courseId
    );
    if (!level) throw new AppError("NOT_FOUND", "Course level not found");

    if (!input.courseLevelId) {
      throw new AppError(
        "BAD_REQUEST",
        "Assignments must include a course level. Generic course-only assignment is not allowed."
      );
    }

    const batch = await learningAdminRepository.createAssignmentBatch({
      course: { connect: { id: input.courseId } },
      courseLevel: { connect: { id: input.courseLevelId } },
      targetType: input.targetType,
      targetId: input.targetId ?? null,
      assignedBy: { connect: { id: actorId } },
      dueDate,
      totalUsers: preview.finalAssignableUsers.length,
      status: "NOT_STARTED",
      priority: input.priority ?? null,
      notes: input.notes ?? null,
      reminderSchedule: input.reminderSchedule ?? null,
    });

    await learningAdminRepository.createUserAssignments(
      preview.finalAssignableUsers.map((u) => ({
        batchId: batch.id,
        courseId: input.courseId,
        courseLevelId: input.courseLevelId,
        userId: u.id,
        assignedByUserId: actorId,
        dueDate,
        status: "NOT_STARTED",
      }))
    );

    for (const u of preview.finalAssignableUsers) {
      await learningAdminRepository.upsertEnrollment(u.id, input.courseId);
      await notificationService.notify({
        userId: u.id,
        type: "ACTION_REQUIRED",
        title: "New course assignment",
        message: `You have been assigned ${level.course.title} — ${level.name}. Due ${dueDate.toLocaleDateString()}.`,
        actionUrl: ROUTES.LEARNING,
      });
    }

    await auditService.log({
      action: "CREATE",
      entityType: "CourseAssignmentBatch",
      entityId: batch.id,
      actorId,
      metadata: {
        courseId: input.courseId,
        courseLevelId: input.courseLevelId,
        targetType: input.targetType,
        userCount: preview.finalAssignableUsers.length,
      },
    });

    const detail = await learningAdminRepository.findAssignmentBatch(batch.id);
    if (!detail) throw new AppError("INTERNAL_ERROR", "Failed to load created assignment");
    return this.mapBatchDetail(detail, preview.targetLabel);
  },

  mapBatchDetail(
    record: NonNullable<Awaited<ReturnType<typeof learningAdminRepository.findAssignmentBatch>>>,
    targetLabel?: string
  ): AssignmentBatchDetail {
    const summary = mapBatchSummary(record, targetLabel);
    const userAssignments: UserAssignmentSummary[] = record.userAssignments.map((ua) => ({
      id: ua.id,
      userId: ua.userId,
      userName: `${ua.user.firstName} ${ua.user.lastName}`,
      email: ua.user.email,
      departmentName: ua.user.department?.name ?? null,
      dueDate: ua.dueDate.toISOString(),
      status: ua.status,
      progressPercent: ua.progressPercent,
      startedAt: ua.startedAt?.toISOString() ?? null,
      completedAt: ua.completedAt?.toISOString() ?? null,
      lastActivityAt: ua.lastActivityAt?.toISOString() ?? null,
    }));
    return {
      ...summary,
      notes: record.notes,
      priority: record.priority,
      reminderSchedule: record.reminderSchedule,
      userAssignments,
    };
  },

  async listAssignments(query: AssignmentListQuery) {
    await learningAdminRepository.syncOverdueStatuses();
    const { items, total } = await learningAdminRepository.listAssignmentBatches(query);
    const mapped = await Promise.all(
      items.map(async (i) => {
        const targetLabel = await resolveTargetLabel(i.targetType, i.targetId);
        return mapBatchSummary(i, targetLabel);
      })
    );
    return {
      items: mapped,
      total,
      page: query.page,
      pageSize: query.pageSize,
    };
  },

  async getAssignment(id: string): Promise<AssignmentBatchDetail> {
    const record = await learningAdminRepository.findAssignmentBatch(id);
    if (!record) throw new AppError("NOT_FOUND", "Assignment not found");
    const targetLabel = await resolveTargetLabel(record.targetType, record.targetId);
    return this.mapBatchDetail(record, targetLabel);
  },

  async updateAssignment(
    actorId: string,
    id: string,
    input: UpdateAssignmentInput
  ): Promise<AssignmentBatchDetail> {
    const existing = await learningAdminRepository.findAssignmentBatch(id);
    if (!existing) throw new AppError("NOT_FOUND", "Assignment not found");

    if (input.dueDate) {
      await learningAdminRepository.extendBatchDueDate(id, parseDueDate(input.dueDate));
    }
    if (input.status === "CANCELLED") {
      await learningAdminRepository.cancelBatchAssignments(id);
      await learningAdminRepository.updateAssignmentBatch(id, { status: "CANCELLED" });
    } else if (input.status || input.notes || input.priority) {
      await learningAdminRepository.updateAssignmentBatch(id, {
        ...(input.status ? { status: input.status } : {}),
        ...(input.notes !== undefined ? { notes: input.notes } : {}),
        ...(input.priority !== undefined ? { priority: input.priority } : {}),
      });
    }

    await auditService.log({
      action: "UPDATE",
      entityType: "CourseAssignmentBatch",
      entityId: id,
      actorId,
      metadata: input as Record<string, unknown>,
    });

    return this.getAssignment(id);
  },

  async remindAssignment(actorId: string, id: string) {
    const batch = await learningAdminRepository.findAssignmentBatch(id);
    if (!batch) throw new AppError("NOT_FOUND", "Assignment not found");

    const pending = batch.userAssignments.filter((u) =>
      ["NOT_STARTED", "IN_PROGRESS", "OVERDUE"].includes(u.status)
    );

    for (const ua of pending) {
      await notificationService.notify({
        userId: ua.userId,
        type: "WARNING",
        title: "Course assignment reminder",
        message: `Reminder: complete ${batch.course.title} — ${batch.courseLevel.name} by ${ua.dueDate.toLocaleDateString()}.`,
        actionUrl: ROUTES.LEARNING,
      });
    }

    await auditService.log({
      action: "UPDATE",
      entityType: "CourseAssignmentBatch",
      entityId: id,
      actorId,
      metadata: { action: "remind", recipientCount: pending.length },
    });

    return { reminded: pending.length };
  },

  async cancelAssignment(actorId: string, id: string) {
    return this.updateAssignment(actorId, id, { status: "CANCELLED" });
  },

  async getDashboard(): Promise<LearningAdminDashboard> {
    await learningAdminRepository.syncOverdueStatuses();
    const stats = await learningAdminRepository.getDashboardStats();
    const completionRate =
      stats.totalAssignments > 0
        ? Math.round((stats.completedAssignments / stats.totalAssignments) * 100)
        : 0;

    return {
      totalCourses: stats.totalCourses,
      totalAssignments: stats.totalAssignments,
      completionRate,
      overdueAssignments: stats.overdueAssignments,
      departmentCompletionRate: stats.departmentCompletionRate,
      coursesByLevel: stats.levelCounts.map((l) => ({
        level: l.tier,
        count: l._count.id,
      })),
      assignmentsByAudience: stats.audienceCounts.map((a) => ({
        targetType: a.targetType,
        count: a._count.id,
      })),
      recentAssignments: stats.recent.map((r) => mapBatchSummary(r)),
    };
  },

  async getLearningProgress(): Promise<LearningProgressRow[]> {
    await learningAdminRepository.syncOverdueStatuses();
    const rows = await learningAdminRepository.listLearningProgress();
    return rows.map((r) => ({
      userId: r.user.id,
      userName: `${r.user.firstName} ${r.user.lastName}`,
      departmentName: r.user.department?.name ?? null,
      courseTitle: r.course.title,
      levelName: r.courseLevel.name,
      status: r.status,
      progressPercent: r.progressPercent,
      dueDate: r.dueDate.toISOString(),
      lastActivityAt: r.lastActivityAt?.toISOString() ?? null,
    }));
  },

  async getDepartmentProgress(): Promise<DepartmentProgressRow[]> {
    const rows = await learningAdminRepository.listDepartmentProgress();
    return rows.map((r) => ({
      departmentId: r.departmentId,
      departmentName: r.name,
      totalAssignments: r.total,
      completed: r.completed,
      inProgress: r.inProgress,
      overdue: r.overdue,
      completionRate: r.total > 0 ? Math.round((r.completed / r.total) * 100) : 0,
    }));
  },

  async getOverdueAssignments() {
    await learningAdminRepository.syncOverdueStatuses();
    return learningAdminRepository.listOverdueAssignments();
  },

  async getMyAssignments(userId: string): Promise<MyCourseAssignment[]> {
    await learningAdminRepository.syncOverdueStatuses();
    const rows = await learningAdminRepository.listUserAssignmentsForEmployee(userId);
    return rows.map((r) => ({
      id: r.id,
      courseId: r.courseId,
      courseTitle: r.course.title,
      courseLevelId: r.courseLevelId,
      levelName: r.courseLevel.name,
      levelTier: r.courseLevel.tier,
      dueDate: r.dueDate.toISOString(),
      status: r.status,
      progressPercent: r.progressPercent,
      startedAt: r.startedAt?.toISOString() ?? null,
      completedAt: r.completedAt?.toISOString() ?? null,
    }));
  },
};
