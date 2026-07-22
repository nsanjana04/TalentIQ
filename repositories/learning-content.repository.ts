import { prisma } from "@/lib/db/prisma";
import type {
  CreateLearningResourceInput,
  CreateOpenCourseInput,
  LearningResourceListQuery,
  OpenCourseListQuery,
  UpdateLearningResourceInput,
  UpdateOpenCourseInput,
} from "@/lib/validations/learning-content";

function publishedFilter(published: string | undefined) {
  if (published === "true") return true;
  if (published === "false") return false;
  return undefined;
}

type ListViewerOptions = {
  userId?: string;
  assignedOnly?: boolean;
};

export const learningContentRepository = {
  async getOverview() {
    const [resourceCount, publishedResources, openCourseCount, publishedOpenCourses, mandatoryOpenCourses] =
      await Promise.all([
        prisma.learningResource.count({ where: { deletedAt: null } }),
        prisma.learningResource.count({ where: { deletedAt: null, isPublished: true } }),
        prisma.openCourse.count({ where: { deletedAt: null } }),
        prisma.openCourse.count({ where: { deletedAt: null, isPublished: true } }),
        prisma.openCourse.count({ where: { deletedAt: null, isPublished: true, isMandatory: true } }),
      ]);
    return { resourceCount, publishedResources, openCourseCount, publishedOpenCourses, mandatoryOpenCourses };
  },

  async listResources(query: LearningResourceListQuery, viewer?: ListViewerOptions) {
    const isPublished = publishedFilter(query.published);
    const { userId, assignedOnly } = viewer ?? {};
    return prisma.learningResource.findMany({
      where: {
        deletedAt: null,
        ...(query.search
          ? {
              OR: [
                { title: { contains: query.search, mode: "insensitive" } },
                { description: { contains: query.search, mode: "insensitive" } },
                { provider: { contains: query.search, mode: "insensitive" } },
              ],
            }
          : {}),
        ...(query.type ? { type: query.type } : {}),
        ...(isPublished !== undefined ? { isPublished } : {}),
        ...(assignedOnly && userId
          ? { assignments: { some: { userId, deletedAt: null } } }
          : {}),
      },
      orderBy: [{ sortOrder: "asc" }, { title: "asc" }],
      include: userId
        ? {
            assignments: {
              where: { userId, deletedAt: null },
              take: 1,
            },
          }
        : {
            _count: {
              select: { assignments: { where: { deletedAt: null } } },
            },
          },
    });
  },

  async getResourceById(id: string, userId?: string) {
    return prisma.learningResource.findFirst({
      where: { id, deletedAt: null },
      include: userId
        ? {
            assignments: {
              where: { userId, deletedAt: null },
              take: 1,
            },
          }
        : {
            _count: {
              select: { assignments: { where: { deletedAt: null } } },
            },
          },
    });
  },

  async createResource(
    data: CreateLearningResourceInput & {
      provider: string;
      url: string;
      type: CreateLearningResourceInput["type"];
      createdById: string;
    }
  ) {
    return prisma.learningResource.create({
      data: {
        title: data.title,
        description: data.description ?? null,
        type: data.type,
        url: data.url,
        provider: data.provider,
        isPublished: data.isPublished ?? true,
        tags: data.tags ?? [],
        sortOrder: data.sortOrder ?? 0,
        createdById: data.createdById,
      },
    });
  },

  async updateResource(
    id: string,
    data: UpdateLearningResourceInput & { provider?: string; url?: string; type?: CreateLearningResourceInput["type"] }
  ) {
    return prisma.learningResource.update({
      where: { id },
      data: {
        ...(data.title !== undefined ? { title: data.title } : {}),
        ...(data.description !== undefined ? { description: data.description ?? null } : {}),
        ...(data.type !== undefined ? { type: data.type } : {}),
        ...(data.url !== undefined ? { url: data.url } : {}),
        ...(data.provider !== undefined ? { provider: data.provider } : {}),
        ...(data.isPublished !== undefined ? { isPublished: data.isPublished } : {}),
        ...(data.tags !== undefined ? { tags: data.tags } : {}),
        ...(data.sortOrder !== undefined ? { sortOrder: data.sortOrder } : {}),
      },
    });
  },

  async softDeleteResource(id: string) {
    return prisma.learningResource.update({
      where: { id },
      data: { deletedAt: new Date(), isPublished: false },
    });
  },

  async listOpenCourses(query: OpenCourseListQuery, viewer?: ListViewerOptions) {
    const isPublished = publishedFilter(query.published);
    const { userId, assignedOnly } = viewer ?? {};
    const courses = await prisma.openCourse.findMany({
      where: {
        deletedAt: null,
        ...(query.search
          ? {
              OR: [
                { title: { contains: query.search, mode: "insensitive" } },
                { description: { contains: query.search, mode: "insensitive" } },
              ],
            }
          : {}),
        ...(query.category ? { category: query.category } : {}),
        ...(query.mandatory === "true" ? { isMandatory: true } : query.mandatory === "false" ? { isMandatory: false } : {}),
        ...(isPublished !== undefined ? { isPublished } : {}),
        ...(assignedOnly && userId
          ? { assignments: { some: { userId, deletedAt: null } } }
          : {}),
      },
      orderBy: [{ sortOrder: "asc" }, { title: "asc" }],
      include: userId
        ? {
            completions: {
              where: { userId, deletedAt: null },
              take: 1,
            },
            assignments: {
              where: { userId, deletedAt: null },
              take: 1,
            },
          }
        : {
            _count: {
              select: { assignments: { where: { deletedAt: null } } },
            },
          },
    });
    return courses;
  },

  async getOpenCourseById(id: string, userId?: string) {
    return prisma.openCourse.findFirst({
      where: { id, deletedAt: null },
      include: userId
        ? {
            completions: {
              where: { userId, deletedAt: null },
              take: 1,
            },
            assignments: {
              where: { userId, deletedAt: null },
              take: 1,
            },
          }
        : {
            _count: {
              select: { assignments: { where: { deletedAt: null } } },
            },
          },
    });
  },

  async createOpenCourse(
    data: CreateOpenCourseInput & {
      provider: string;
      url: string;
      type: CreateOpenCourseInput["type"];
      createdById: string;
    }
  ) {
    return prisma.openCourse.create({
      data: {
        title: data.title,
        description: data.description ?? null,
        category: data.category ?? "GENERAL",
        type: data.type,
        url: data.url,
        provider: data.provider,
        thumbnailUrl: data.thumbnailUrl || null,
        durationMinutes: data.durationMinutes ?? null,
        isMandatory: data.isMandatory ?? false,
        isPublished: data.isPublished ?? true,
        sortOrder: data.sortOrder ?? 0,
        createdById: data.createdById,
      },
    });
  },

  async updateOpenCourse(
    id: string,
    data: UpdateOpenCourseInput & {
      provider?: string;
      url?: string;
      type?: CreateOpenCourseInput["type"];
      thumbnailUrl?: string | null;
    }
  ) {
    return prisma.openCourse.update({
      where: { id },
      data: {
        ...(data.title !== undefined ? { title: data.title } : {}),
        ...(data.description !== undefined ? { description: data.description ?? null } : {}),
        ...(data.category !== undefined ? { category: data.category } : {}),
        ...(data.type !== undefined ? { type: data.type } : {}),
        ...(data.url !== undefined ? { url: data.url } : {}),
        ...(data.provider !== undefined ? { provider: data.provider } : {}),
        ...(data.thumbnailUrl !== undefined ? { thumbnailUrl: data.thumbnailUrl || null } : {}),
        ...(data.durationMinutes !== undefined ? { durationMinutes: data.durationMinutes ?? null } : {}),
        ...(data.isMandatory !== undefined ? { isMandatory: data.isMandatory } : {}),
        ...(data.isPublished !== undefined ? { isPublished: data.isPublished } : {}),
        ...(data.sortOrder !== undefined ? { sortOrder: data.sortOrder } : {}),
      },
    });
  },

  async softDeleteOpenCourse(id: string) {
    return prisma.openCourse.update({
      where: { id },
      data: { deletedAt: new Date(), isPublished: false },
    });
  },

  async upsertOpenCourseCompletion(userId: string, openCourseId: string, status: "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED" = "COMPLETED") {
    const completed = status === "COMPLETED";
    return prisma.openCourseCompletion.upsert({
      where: { userId_openCourseId: { userId, openCourseId } },
      update: completed
        ? { status: "COMPLETED", completedAt: new Date() }
        : { status },
      create: {
        userId,
        openCourseId,
        status,
        completedAt: completed ? new Date() : null,
      },
    });
  },

  async listOpenCourseAssignments(openCourseId: string) {
    return prisma.openCourseAssignment.findMany({
      where: { openCourseId, deletedAt: null },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
      orderBy: { assignedAt: "desc" },
    });
  },

  async assignOpenCourseToUsers(openCourseId: string, userIds: string[], assignedById: string) {
    if (!userIds.length) return [];

    await prisma.$transaction(
      userIds.map((userId) =>
        prisma.openCourseAssignment.upsert({
          where: { openCourseId_userId: { openCourseId, userId } },
          update: { assignedById, assignedAt: new Date(), deletedAt: null },
          create: { openCourseId, userId, assignedById },
        })
      )
    );

    await prisma.$transaction(
      userIds.map((userId) =>
        prisma.openCourseCompletion.upsert({
          where: { userId_openCourseId: { userId, openCourseId } },
          update: {},
          create: {
            userId,
            openCourseId,
            status: "NOT_STARTED",
          },
        })
      )
    );

    return userIds;
  },

  async listLearningResourceAssignments(learningResourceId: string) {
    return prisma.learningResourceAssignment.findMany({
      where: { learningResourceId, deletedAt: null },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
      orderBy: { assignedAt: "desc" },
    });
  },

  async assignLearningResourceToUsers(
    learningResourceId: string,
    userIds: string[],
    assignedById: string
  ) {
    if (!userIds.length) return [];

    await prisma.$transaction(
      userIds.map((userId) =>
        prisma.learningResourceAssignment.upsert({
          where: { learningResourceId_userId: { learningResourceId, userId } },
          update: { assignedById, assignedAt: new Date(), deletedAt: null },
          create: { learningResourceId, userId, assignedById },
        })
      )
    );

    return userIds;
  },
};
