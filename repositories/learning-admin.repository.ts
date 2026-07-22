import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { canonicalRoleWhere, sortCanonicalRoles } from "@/lib/rbac/canonical-roles";
import type { AssignmentListQuery, AdminCourseListQuery } from "@/lib/validations/learning-admin";
import { ACTIVE_ASSIGNMENT_STATUSES } from "@/types/learning-admin";

export const learningAdminRepository = {
  async listAdminCourses(query: AdminCourseListQuery) {
    const where: Prisma.CourseWhereInput = {
      deletedAt: null,
      ...(query.search
        ? {
            OR: [
              { title: { contains: query.search, mode: "insensitive" } },
              { category: { contains: query.search, mode: "insensitive" } },
            ],
          }
        : {}),
      ...(query.category ? { category: query.category } : {}),
      ...(query.status ? { adminStatus: query.status } : {}),
    };
    const skip = (query.page - 1) * query.pageSize;
    const [items, total] = await Promise.all([
      prisma.course.findMany({
        where,
        skip,
        take: query.pageSize,
        orderBy: { title: "asc" },
        include: {
          createdBy: { select: { firstName: true, lastName: true } },
          _count: { select: { adminLevels: true, assignmentBatches: true } },
        },
      }),
      prisma.course.count({ where }),
    ]);
    return { items, total };
  },

  async findCourseById(courseId: string) {
    return prisma.course.findFirst({
      where: { id: courseId, deletedAt: null },
      include: {
        createdBy: { select: { firstName: true, lastName: true } },
        adminLevels: { where: { deletedAt: null }, orderBy: { orderNumber: "asc" } },
      },
    });
  },

  async findCourseLevel(courseLevelId: string, courseId?: string) {
    return prisma.courseLevel.findFirst({
      where: {
        id: courseLevelId,
        deletedAt: null,
        ...(courseId ? { courseId } : {}),
      },
      include: { course: { select: { id: true, title: true, adminStatus: true } } },
    });
  },

  async listCourseLevels(courseId: string) {
    return prisma.courseLevel.findMany({
      where: { courseId, deletedAt: null },
      orderBy: { orderNumber: "asc" },
    });
  },

  async listDepartments() {
    return prisma.department.findMany({
      where: { deletedAt: null },
      orderBy: { name: "asc" },
      include: { _count: { select: { users: { where: { isActive: true, deletedAt: null } } } } },
    });
  },

  async listTeams() {
    return prisma.team.findMany({
      where: { deletedAt: null },
      orderBy: { name: "asc" },
      include: {
        department: { select: { name: true } },
        _count: { select: { members: { where: { isActive: true, deletedAt: null } } } },
      },
    });
  },

  async listRolesWithUserCounts() {
    const roles = await prisma.role.findMany({
      where: canonicalRoleWhere,
      orderBy: { name: "asc" },
      include: { _count: { select: { users: { where: { isActive: true, deletedAt: null } } } } },
    });
    return sortCanonicalRoles(roles);
  },

  async listAssignableUsers(search?: string) {
    return prisma.user.findMany({
      where: {
        isActive: true,
        deletedAt: null,
        ...(search
          ? {
              OR: [
                { firstName: { contains: search, mode: "insensitive" } },
                { lastName: { contains: search, mode: "insensitive" } },
                { email: { contains: search, mode: "insensitive" } },
              ],
            }
          : {}),
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        isActive: true,
        departmentId: true,
        teamId: true,
        department: { select: { name: true } },
        team: { select: { name: true } },
        jobRole: { select: { title: true } },
        role: { select: { name: true } },
      },
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
      take: 200,
    });
  },

  async createAssignmentBatch(data: Prisma.CourseAssignmentBatchCreateInput) {
    return prisma.courseAssignmentBatch.create({ data });
  },

  async createUserAssignments(data: Prisma.CourseAssignmentUserCreateManyInput[]) {
    if (!data.length) return { count: 0 };
    return prisma.courseAssignmentUser.createMany({ data, skipDuplicates: true });
  },

  async listAssignmentBatches(query: AssignmentListQuery) {
    const where: Prisma.CourseAssignmentBatchWhereInput = {
      ...(query.courseId ? { courseId: query.courseId } : {}),
      ...(query.courseLevelId ? { courseLevelId: query.courseLevelId } : {}),
      ...(query.status ? { status: query.status } : {}),
      ...(query.targetType ? { targetType: query.targetType } : {}),
      ...(query.dueBefore ? { dueDate: { lte: new Date(query.dueBefore) } } : {}),
      ...(query.dueAfter ? { dueDate: { gte: new Date(query.dueAfter) } } : {}),
      ...(query.userId
        ? { userAssignments: { some: { userId: query.userId } } }
        : {}),
      ...(query.departmentId
        ? {
            userAssignments: {
              some: { user: { departmentId: query.departmentId } },
            },
          }
        : {}),
    };
    const skip = (query.page - 1) * query.pageSize;
    const [items, total] = await Promise.all([
      prisma.courseAssignmentBatch.findMany({
        where,
        skip,
        take: query.pageSize,
        orderBy: { assignedAt: "desc" },
        include: {
          course: { select: { title: true } },
          courseLevel: { select: { name: true, tier: true } },
          assignedBy: { select: { firstName: true, lastName: true } },
        },
      }),
      prisma.courseAssignmentBatch.count({ where }),
    ]);
    return { items, total };
  },

  async findAssignmentBatch(id: string) {
    return prisma.courseAssignmentBatch.findUnique({
      where: { id },
      include: {
        course: { select: { title: true } },
        courseLevel: { select: { name: true, tier: true } },
        assignedBy: { select: { firstName: true, lastName: true } },
        userAssignments: {
          include: {
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
          orderBy: { user: { lastName: "asc" } },
        },
      },
    });
  },

  async updateAssignmentBatch(id: string, data: Prisma.CourseAssignmentBatchUpdateInput) {
    return prisma.courseAssignmentBatch.update({ where: { id }, data });
  },

  async cancelBatchAssignments(batchId: string) {
    return prisma.courseAssignmentUser.updateMany({
      where: { batchId, status: { in: ACTIVE_ASSIGNMENT_STATUSES } },
      data: { status: "CANCELLED" },
    });
  },

  async extendBatchDueDate(batchId: string, dueDate: Date) {
    await prisma.courseAssignmentUser.updateMany({
      where: { batchId, status: { in: ACTIVE_ASSIGNMENT_STATUSES } },
      data: { dueDate },
    });
    return prisma.courseAssignmentBatch.update({
      where: { id: batchId },
      data: { dueDate },
    });
  },

  async listUserAssignmentsForEmployee(userId: string) {
    return prisma.courseAssignmentUser.findMany({
      where: {
        userId,
        status: { not: "CANCELLED" },
      },
      include: {
        course: { select: { id: true, title: true } },
        courseLevel: { select: { id: true, name: true, tier: true } },
      },
      orderBy: { dueDate: "asc" },
    });
  },

  async getDashboardStats() {
    const now = new Date();
    const [
      totalCourses,
      totalAssignments,
      completedAssignments,
      overdueAssignments,
      batches,
      levelCounts,
      audienceCounts,
      recent,
    ] = await Promise.all([
      prisma.course.count({ where: { deletedAt: null, adminStatus: "ACTIVE" } }),
      prisma.courseAssignmentUser.count({
        where: { status: { not: "CANCELLED" } },
      }),
      prisma.courseAssignmentUser.count({ where: { status: "COMPLETED" } }),
      prisma.courseAssignmentUser.count({
        where: {
          status: { in: ["NOT_STARTED", "IN_PROGRESS"] },
          dueDate: { lt: now },
        },
      }),
      prisma.courseAssignmentBatch.count(),
      prisma.courseLevel.groupBy({
        by: ["tier"],
        where: { deletedAt: null },
        _count: { id: true },
      }),
      prisma.courseAssignmentBatch.groupBy({
        by: ["targetType"],
        _count: { id: true },
      }),
      prisma.courseAssignmentBatch.findMany({
        take: 5,
        orderBy: { assignedAt: "desc" },
        include: {
          course: { select: { title: true } },
          courseLevel: { select: { name: true, tier: true } },
          assignedBy: { select: { firstName: true, lastName: true } },
        },
      }),
    ]);

    const deptRows = await prisma.courseAssignmentUser.groupBy({
      by: ["status"],
      _count: { id: true },
    });
    const deptCompleted =
      deptRows.find((r) => r.status === "COMPLETED")?._count.id ?? 0;
    const deptTotal = deptRows.reduce((s, r) => s + r._count.id, 0);

    return {
      totalCourses,
      totalAssignments,
      completedAssignments,
      overdueAssignments,
      batches,
      levelCounts,
      audienceCounts,
      recent,
      departmentCompletionRate:
        deptTotal > 0 ? Math.round((deptCompleted / deptTotal) * 100) : 0,
    };
  },

  async listLearningProgress() {
    return prisma.courseAssignmentUser.findMany({
      where: { status: { not: "CANCELLED" } },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            department: { select: { name: true } },
          },
        },
        course: { select: { title: true } },
        courseLevel: { select: { name: true } },
      },
      orderBy: { updatedAt: "desc" },
      take: 500,
    });
  },

  async listDepartmentProgress() {
    const users = await prisma.user.findMany({
      where: { isActive: true, deletedAt: null, departmentId: { not: null } },
      select: {
        departmentId: true,
        department: { select: { id: true, name: true } },
        courseAssignmentsReceived: {
          where: { status: { not: "CANCELLED" } },
          select: { status: true, dueDate: true },
        },
      },
    });

    const map = new Map<
      string,
      { name: string; total: number; completed: number; inProgress: number; overdue: number }
    >();
    const now = new Date();
    for (const u of users) {
      if (!u.departmentId || !u.department) continue;
      const row = map.get(u.departmentId) ?? {
        name: u.department.name,
        total: 0,
        completed: 0,
        inProgress: 0,
        overdue: 0,
      };
      for (const a of u.courseAssignmentsReceived) {
        row.total++;
        if (a.status === "COMPLETED") row.completed++;
        else if (a.status === "IN_PROGRESS" || a.status === "NOT_STARTED") {
          if (a.dueDate < now) row.overdue++;
          else row.inProgress++;
        }
      }
      map.set(u.departmentId, row);
    }
    return [...map.entries()].map(([departmentId, row]) => ({
      departmentId,
      ...row,
    }));
  },

  async listOverdueAssignments() {
    const now = new Date();
    return prisma.courseAssignmentUser.findMany({
      where: {
        status: { in: ["NOT_STARTED", "IN_PROGRESS"] },
        dueDate: { lt: now },
      },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
            department: { select: { name: true } },
          },
        },
        course: { select: { title: true } },
        courseLevel: { select: { name: true, tier: true } },
        batch: { select: { id: true } },
      },
      orderBy: { dueDate: "asc" },
    });
  },

  async syncOverdueStatuses() {
    const now = new Date();
    return prisma.courseAssignmentUser.updateMany({
      where: {
        status: { in: ["NOT_STARTED", "IN_PROGRESS"] },
        dueDate: { lt: now },
      },
      data: { status: "OVERDUE" },
    });
  },

  async upsertEnrollment(userId: string, courseId: string) {
    return prisma.courseEnrollment.upsert({
      where: { userId_courseId: { userId, courseId } },
      create: { userId, courseId, status: "ENROLLED" },
      update: {},
    });
  },
};
