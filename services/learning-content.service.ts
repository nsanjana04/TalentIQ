import type { Prisma } from "@prisma/client";
import { AppError } from "@/lib/errors/app-error";
import {
  detectProviderFromUrl,
  normalizeLearningUrl,
  OPEN_COURSE_CATEGORY_LABELS,
  resolveLearningNavigation,
} from "@/lib/utils/learning-url";
import type {
  AssignLearningResourceInput,
  AssignOpenCourseInput,
  CreateLearningResourceInput,
  CreateOpenCourseInput,
  LearningResourceListQuery,
  OpenCourseListQuery,
  UpdateLearningResourceInput,
  UpdateOpenCourseInput,
} from "@/lib/validations/learning-content";
import { learningContentRepository } from "@/repositories/learning-content.repository";
import type {
  AssignLearningResourceResult,
  AssignOpenCourseResult,
  AssignableEmployeesResponse,
  LearningContentOverview,
  LearningResource,
  LearningResourceAssignmentSummary,
  OpenCourse,
  OpenCourseAssignmentSummary,
  OpenCourseCategory,
  OpenCourseCurriculum,
  OpenCourseLibrarySummary,
  OpenCoursePlayerData,
} from "@/types/learning-content";
import { auditService } from "@/services/audit.service";
import type { RoleSlug } from "@/constants/role-slugs";
import {
  canSetOrgWideMandatory,
  listAssignableUsers,
  resolveAssigneeUserIds,
} from "@/lib/learning/scope";
import { resolveRmEyeVideoUrl } from "@/prisma/open-rm-eye-video-map";

type ResourceRecord =
  | Prisma.LearningResourceGetPayload<{
      include: { assignments: true };
    }>
  | Prisma.LearningResourceGetPayload<{
      include: { _count: { select: { assignments: true } } };
    }>;

type OpenCourseRecord =
  | Prisma.OpenCourseGetPayload<{
      include: { completions: true; assignments: true };
    }>
  | Prisma.OpenCourseGetPayload<{
      include: { _count: { select: { assignments: true } } };
    }>;

function mapResource(record: ResourceRecord): LearningResource {
  const assignment = "assignments" in record ? record.assignments?.[0] : undefined;
  const assignmentCount =
    "_count" in record && record._count ? record._count.assignments : undefined;

  return {
    id: record.id,
    title: record.title,
    description: record.description,
    type: record.type,
    url: record.url,
    provider: record.provider,
    isPublished: record.isPublished,
    tags: record.tags,
    sortOrder: record.sortOrder,
    navigation: resolveLearningNavigation(record.type, record.url),
    isAssigned: Boolean(assignment),
    assignmentCount,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

function mapOpenCourse(record: OpenCourseRecord): OpenCourse {
  const completion = "completions" in record ? record.completions?.[0] : undefined;
  const assignment = "assignments" in record ? record.assignments?.[0] : undefined;
  const assignmentCount =
    "_count" in record && record._count ? record._count.assignments : undefined;

  const url = resolveRmEyeVideoUrl(record.id, record.url);

  return {
    id: record.id,
    title: record.title,
    description: record.description,
    category: record.category,
    type: record.type,
    url,
    provider: record.provider,
    thumbnailUrl: record.thumbnailUrl,
    durationMinutes: record.durationMinutes,
    isMandatory: record.isMandatory,
    isPublished: record.isPublished,
    sortOrder: record.sortOrder,
    navigation: resolveLearningNavigation(record.type, url),
    completionStatus: completion?.status ?? null,
    completedAt: completion?.completedAt?.toISOString() ?? null,
    isAssigned: Boolean(assignment),
    assignmentCount,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

function prepareUrlFields(type: CreateLearningResourceInput["type"], rawUrl: string) {
  try {
    const url = normalizeLearningUrl(rawUrl);
    const detected = detectProviderFromUrl(url);
    const effectiveType = type === "LINK" || type === "OTHER" ? detected.type : type;
    return {
      url,
      type: effectiveType,
      provider: detected.provider,
    };
  } catch (error) {
    throw new AppError(
      "BAD_REQUEST",
      error instanceof Error ? error.message : "Invalid URL"
    );
  }
}

const PUBLISHED_OPEN_COURSE_QUERY: OpenCourseListQuery = {
  published: "true",
  mandatory: "all",
};

function resolveProgramTitle(courses: OpenCourse[]): string {
  if (courses.length === 0) return "Training Library";
  if (courses.every((course) => course.title.includes("RM Eye"))) {
    return "RM Eye Product Training";
  }
  const categories = new Set(courses.map((course) => course.category));
  if (categories.size === 1) {
    const category = [...categories][0] as OpenCourseCategory;
    return `${OPEN_COURSE_CATEGORY_LABELS[category]} Training`;
  }
  return "Company Training Library";
}

function buildOpenCourseCurriculum(courses: OpenCourse[]): OpenCourseCurriculum {
  const modules = courses.map((course, index) => ({
    id: course.id,
    openCourseId: course.id,
    title: `Module ${index + 1}: ${course.title}`,
    sortOrder: course.sortOrder,
    completionStatus: course.completionStatus,
    lessons: [
      {
        id: `${course.id}-lesson`,
        openCourseId: course.id,
        title: course.title,
        type: course.type,
        durationMinutes: course.durationMinutes,
        completionStatus: course.completionStatus,
      },
    ],
  }));

  const completedModules = modules.filter(
    (module) => module.completionStatus === "COMPLETED"
  ).length;

  return {
    programTitle: resolveProgramTitle(courses),
    modules,
    completedModules,
    totalModules: modules.length,
  };
}

export const learningContentService = {
  async getOverview(): Promise<LearningContentOverview> {
    return learningContentRepository.getOverview();
  },

  async getPublishedOverview(userId: string): Promise<import("@/types/learning-content").PublishedLearningContentOverview> {
    const viewer = { userId, assignedOnly: true };
    const [resources, courses] = await Promise.all([
      learningContentRepository.listResources({ published: "true" }, viewer),
      learningContentRepository.listOpenCourses(PUBLISHED_OPEN_COURSE_QUERY, viewer),
    ]);

    return {
      resourceCount: resources.length,
      openCourseCount: courses.length,
      mandatoryOpenCourses: courses.filter((c) => c.isMandatory).length,
    };
  },

  async listResources(
    query: LearningResourceListQuery,
    viewer?: { userId: string; assignedOnly?: boolean }
  ): Promise<LearningResource[]> {
    const records = await learningContentRepository.listResources(query, viewer);
    return records.map((r) => mapResource(r as ResourceRecord));
  },

  async createResource(input: CreateLearningResourceInput, actorId: string): Promise<LearningResource> {
    const prepared = prepareUrlFields(input.type, input.url);
    const record = await learningContentRepository.createResource({
      title: input.title,
      description: input.description,
      isPublished: input.isPublished,
      tags: input.tags,
      sortOrder: input.sortOrder,
      ...prepared,
      createdById: actorId,
    });

    await auditService.log({
      action: "CREATE",
      entityType: "LearningResource",
      entityId: record.id,
      actorId,
      metadata: { title: record.title, type: record.type },
    });

    const refreshed = await learningContentRepository.getResourceById(record.id);
    return mapResource(refreshed as ResourceRecord);
  },

  async updateResource(id: string, input: UpdateLearningResourceInput, actorId: string): Promise<LearningResource> {
    const existing = await learningContentRepository.getResourceById(id);
    if (!existing) throw new AppError("NOT_FOUND", "Resource not found");

    const prepared =
      input.url || input.type
        ? prepareUrlFields(input.type ?? existing.type, input.url ?? existing.url)
        : {};

    const record = await learningContentRepository.updateResource(id, { ...input, ...prepared });

    await auditService.log({
      action: "UPDATE",
      entityType: "LearningResource",
      entityId: id,
      actorId,
      metadata: { title: record.title },
    });

    const refreshed = await learningContentRepository.getResourceById(id);
    return mapResource(refreshed as ResourceRecord);
  },

  async listLearningResourceAssignments(
    resourceId: string
  ): Promise<LearningResourceAssignmentSummary[]> {
    const resource = await learningContentRepository.getResourceById(resourceId);
    if (!resource) throw new AppError("NOT_FOUND", "Resource not found");

    const assignments =
      await learningContentRepository.listLearningResourceAssignments(resourceId);

    return assignments.map((assignment) => ({
      id: assignment.id,
      userId: assignment.userId,
      userName: `${assignment.user.firstName} ${assignment.user.lastName}`,
      userEmail: assignment.user.email,
      assignedAt: assignment.assignedAt.toISOString(),
    }));
  },

  async assignLearningResource(
    resourceId: string,
    input: AssignLearningResourceInput,
    actorId: string,
    role: RoleSlug
  ): Promise<AssignLearningResourceResult> {
    const resource = await learningContentRepository.getResourceById(resourceId);
    if (!resource) throw new AppError("NOT_FOUND", "Resource not found");

    const userIds = await resolveAssigneeUserIds(
      actorId,
      role,
      input.userIds,
      input.assignAll ?? false
    );

    await learningContentRepository.assignLearningResourceToUsers(resourceId, userIds, actorId);

    await auditService.log({
      action: "CREATE",
      entityType: "LearningResourceAssignment",
      entityId: resourceId,
      actorId,
      metadata: { resourceId, assignedCount: userIds.length, assignAll: input.assignAll ?? false },
    });

    return { resourceId, assignedCount: userIds.length, userIds };
  },

  async deleteResource(id: string, actorId: string) {
    const existing = await learningContentRepository.getResourceById(id);
    if (!existing) throw new AppError("NOT_FOUND", "Resource not found");
    await learningContentRepository.softDeleteResource(id);
    await auditService.log({
      action: "DELETE",
      entityType: "LearningResource",
      entityId: id,
      actorId,
      metadata: { title: existing.title },
    });
    return { id };
  },

  async listOpenCourses(
    query: OpenCourseListQuery,
    viewer?: { userId: string; assignedOnly?: boolean }
  ): Promise<OpenCourse[]> {
    const records = await learningContentRepository.listOpenCourses(query, viewer);
    return records.map((r) => mapOpenCourse(r as OpenCourseRecord));
  },

  async getOpenCoursePlayer(
    courseId: string,
    userId: string,
    options?: { adminCatalog?: boolean }
  ): Promise<OpenCoursePlayerData> {
    const activeRecord = await learningContentRepository.getOpenCourseById(courseId, userId);
    if (!activeRecord || !activeRecord.isPublished) {
      throw new AppError("NOT_FOUND", "Open course not found");
    }

    const viewer = options?.adminCatalog ? undefined : { userId, assignedOnly: true };
    const catalogRecords = await learningContentRepository.listOpenCourses(
      PUBLISHED_OPEN_COURSE_QUERY,
      viewer
    );
    const catalog = catalogRecords.map((record) => mapOpenCourse(record as OpenCourseRecord));

    if (!options?.adminCatalog && !catalog.some((course) => course.id === courseId)) {
      throw new AppError("FORBIDDEN", "This course has not been assigned to you");
    }

    const activeCourse = mapOpenCourse(activeRecord as OpenCourseRecord);
    const curriculumCourses =
      options?.adminCatalog || catalog.some((course) => course.id === courseId)
        ? catalog
        : [activeCourse];

    const canManage = Boolean(options?.adminCatalog);

    const canComplete = Boolean(
      canManage ||
        ("assignments" in activeRecord &&
          Array.isArray(activeRecord.assignments) &&
          activeRecord.assignments.length > 0) ||
        activeRecord.isMandatory
    );

    return {
      course: activeCourse,
      curriculum: buildOpenCourseCurriculum(curriculumCourses),
      canComplete,
      canManage,
    };
  },

  async getOpenCourseLibrarySummary(userId: string): Promise<OpenCourseLibrarySummary> {
    const viewer = { userId, assignedOnly: true };
    const courses = await learningContentRepository.listOpenCourses(PUBLISHED_OPEN_COURSE_QUERY, viewer);
    const mapped = courses.map((r) => mapOpenCourse(r as OpenCourseRecord));

    const mandatory = mapped.filter((c) => c.isMandatory);
    const optional = mapped.filter((c) => !c.isMandatory);
    const isDone = (c: OpenCourse) => c.completionStatus === "COMPLETED";

    const categories: OpenCourseCategory[] = ["PRODUCT", "HR_POLICIES", "SECURITY", "GENERAL"];
    const byCategory = categories.map((category) => {
      const items = mapped.filter((c) => c.category === category);
      return {
        category,
        total: items.length,
        completed: items.filter(isDone).length,
      };
    });

    return {
      total: mapped.length,
      mandatoryTotal: mandatory.length,
      mandatoryCompleted: mandatory.filter(isDone).length,
      optionalTotal: optional.length,
      optionalCompleted: optional.filter(isDone).length,
      byCategory,
    };
  },

  async createOpenCourse(input: CreateOpenCourseInput, actorId: string, role: RoleSlug): Promise<OpenCourse> {
    const prepared = prepareUrlFields(input.type, input.url);
    const isMandatory = canSetOrgWideMandatory(role) ? (input.isMandatory ?? false) : false;
    const record = await learningContentRepository.createOpenCourse({
      title: input.title,
      description: input.description,
      category: input.category,
      thumbnailUrl: input.thumbnailUrl || undefined,
      durationMinutes: input.durationMinutes,
      isMandatory,
      isPublished: input.isPublished,
      sortOrder: input.sortOrder,
      ...prepared,
      createdById: actorId,
    });

    await auditService.log({
      action: "CREATE",
      entityType: "OpenCourse",
      entityId: record.id,
      actorId,
      metadata: { title: record.title, category: record.category, isMandatory: record.isMandatory },
    });

    const refreshed = await learningContentRepository.getOpenCourseById(record.id);
    return mapOpenCourse(refreshed as OpenCourseRecord);
  },

  async updateOpenCourse(id: string, input: UpdateOpenCourseInput, actorId: string, role: RoleSlug): Promise<OpenCourse> {
    const existing = await learningContentRepository.getOpenCourseById(id);
    if (!existing) throw new AppError("NOT_FOUND", "Open course not found");

    const prepared =
      input.url || input.type
        ? prepareUrlFields(input.type ?? existing.type, input.url ?? existing.url)
        : {};

    const isMandatory =
      input.isMandatory !== undefined
        ? canSetOrgWideMandatory(role)
          ? input.isMandatory
          : existing.isMandatory
        : undefined;

    const { thumbnailUrl, ...restInput } = input;

    const record = await learningContentRepository.updateOpenCourse(
      id,
      {
        ...restInput,
        ...prepared,
        ...(isMandatory !== undefined ? { isMandatory } : {}),
        ...(thumbnailUrl !== undefined
          ? { thumbnailUrl: thumbnailUrl === "" ? null : thumbnailUrl }
          : {}),
      } as Parameters<typeof learningContentRepository.updateOpenCourse>[1]
    );

    await auditService.log({
      action: "UPDATE",
      entityType: "OpenCourse",
      entityId: id,
      actorId,
      metadata: { title: record.title },
    });

    const refreshed = await learningContentRepository.getOpenCourseById(id);
    return mapOpenCourse(refreshed as OpenCourseRecord);
  },

  async deleteOpenCourse(id: string, actorId: string) {
    const existing = await learningContentRepository.getOpenCourseById(id);
    if (!existing) throw new AppError("NOT_FOUND", "Open course not found");
    await learningContentRepository.softDeleteOpenCourse(id);
    await auditService.log({
      action: "DELETE",
      entityType: "OpenCourse",
      entityId: id,
      actorId,
      metadata: { title: existing.title },
    });
    return { id };
  },

  async completeOpenCourse(
    userId: string,
    openCourseId: string,
    options?: { bypassAssignmentCheck?: boolean }
  ) {
    const course = (await learningContentRepository.getOpenCourseById(
      openCourseId,
      userId
    )) as OpenCourseRecord | null;
    if (!course || !course.isPublished) throw new AppError("NOT_FOUND", "Open course not found");

    const hasAssignment =
      "assignments" in course &&
      Array.isArray(course.assignments) &&
      course.assignments.length > 0;

    if (!options?.bypassAssignmentCheck && !hasAssignment && !course.isMandatory) {
      throw new AppError("FORBIDDEN", "This course has not been assigned to you");
    }

    const completion = await learningContentRepository.upsertOpenCourseCompletion(userId, openCourseId);

    await auditService.log({
      action: "UPDATE",
      entityType: "OpenCourseCompletion",
      entityId: completion.id,
      actorId: userId,
      metadata: { openCourseId, title: course.title },
    });

    return { openCourseId, status: completion.status, completedAt: completion.completedAt?.toISOString() ?? null };
  },

  async getAssignableEmployees(actorId: string, role: RoleSlug): Promise<AssignableEmployeesResponse> {
    return listAssignableUsers(actorId, role);
  },

  async listOpenCourseAssignments(openCourseId: string): Promise<OpenCourseAssignmentSummary[]> {
    const course = await learningContentRepository.getOpenCourseById(openCourseId);
    if (!course) throw new AppError("NOT_FOUND", "Open course not found");

    const assignments = await learningContentRepository.listOpenCourseAssignments(openCourseId);
    const completions = await Promise.all(
      assignments.map((a) =>
        learningContentRepository.getOpenCourseById(openCourseId, a.userId)
      )
    );

    return assignments.map((assignment, index) => {
      const completionRecord = completions[index] as OpenCourseRecord | null;
      const completionStatus =
        completionRecord &&
        "completions" in completionRecord &&
        completionRecord.completions?.[0]
          ? completionRecord.completions[0].status
          : "NOT_STARTED";

      return {
        id: assignment.id,
        userId: assignment.userId,
        userName: `${assignment.user.firstName} ${assignment.user.lastName}`,
        userEmail: assignment.user.email,
        assignedAt: assignment.assignedAt.toISOString(),
        completionStatus,
      };
    });
  },

  async assignOpenCourse(
    openCourseId: string,
    input: AssignOpenCourseInput,
    actorId: string,
    role: RoleSlug
  ): Promise<AssignOpenCourseResult> {
    const course = await learningContentRepository.getOpenCourseById(openCourseId);
    if (!course) throw new AppError("NOT_FOUND", "Open course not found");

    const userIds = await resolveAssigneeUserIds(
      actorId,
      role,
      input.userIds,
      input.assignAll ?? false
    );

    await learningContentRepository.assignOpenCourseToUsers(openCourseId, userIds, actorId);

    await auditService.log({
      action: "CREATE",
      entityType: "OpenCourseAssignment",
      entityId: openCourseId,
      actorId,
      metadata: { openCourseId, assignedCount: userIds.length, assignAll: input.assignAll ?? false },
    });

    return { openCourseId, assignedCount: userIds.length, userIds };
  },
};
