import { AppError } from "@/lib/errors/app-error";
import type {
  CourseListQuery,
  CreateCourseInput,
  CreateLessonInput,
  CreateModuleInput,
  UpdateCourseInput,
  UpdateLessonInput,
  UpdateModuleInput,
} from "@/lib/validations/course-admin";
import { courseAdminRepository } from "@/repositories/course-admin.repository";
import type {
  CourseAnalytics,
  CourseDetail,
  CourseListItem,
  EnrollmentRecord,
  ProgressRecord,
} from "@/types/course-admin";
import { auditService } from "@/services/audit.service";

function mapCourseListItem(
  course: Awaited<ReturnType<typeof courseAdminRepository.listCourses>>["items"][number]
): CourseListItem {
  const lessonCount = course.modules.reduce((sum, m) => sum + m._count.lessons, 0);
  const completed = course.enrollments.filter((e) => e.status === "COMPLETED").length;
  const enrollmentCount = course._count.enrollments;
  return {
    id: course.id,
    title: course.title,
    slug: course.slug,
    description: course.description,
    isPublished: course.isPublished,
    durationMinutes: course.durationMinutes,
    instructorName: course.instructor
      ? `${course.instructor.firstName} ${course.instructor.lastName}`
      : null,
    moduleCount: course._count.modules,
    lessonCount,
    enrollmentCount,
    completionRate: enrollmentCount ? Math.round((completed / enrollmentCount) * 100) : 0,
    createdAt: course.createdAt.toISOString(),
  };
}

function mapCourseDetail(
  course: NonNullable<Awaited<ReturnType<typeof courseAdminRepository.getCourseById>>>
): CourseDetail {
  const lessonCount = course.modules.reduce((sum, m) => sum + m.lessons.length, 0);
  const completed = course.enrollments.filter((e) => e.status === "COMPLETED").length;
  const enrollmentCount = course.enrollments.length;

  return {
    id: course.id,
    title: course.title,
    slug: course.slug,
    description: course.description,
    isPublished: course.isPublished,
    durationMinutes: course.durationMinutes,
    instructorId: course.instructor?.id ?? null,
    instructorName: course.instructor
      ? `${course.instructor.firstName} ${course.instructor.lastName}`
      : null,
    modules: course.modules.map((m) => ({
      id: m.id,
      title: m.title,
      sortOrder: m.sortOrder,
      assessmentId: m.assessmentId ?? null,
      assessmentTitle: m.assessment?.title ?? null,
      requireQuizPass: m.requireQuizPass,
      questionCount: m.assessment?._count.questions ?? 0,
      lessons: m.lessons.map((l) => ({
        id: l.id,
        title: l.title,
        type: l.type,
        content: l.content,
        videoUrl: l.videoUrl,
        pdfUrl: l.pdfUrl,
        assessmentId: l.assessmentId,
        assessmentTitle: l.assessment?.title ?? null,
        assignmentBrief: l.assignmentBrief,
        sortOrder: l.sortOrder,
        durationMinutes: l.durationMinutes,
      })),
    })),
    stats: {
      moduleCount: course.modules.length,
      lessonCount,
      enrollmentCount,
      completionRate: enrollmentCount ? Math.round((completed / enrollmentCount) * 100) : 0,
    },
  };
}

async function audit(
  actorId: string,
  action: "CREATE" | "UPDATE" | "DELETE",
  entityType: string,
  entityId?: string
) {
  await auditService.log({ action, entityType, entityId, actorId });
}

export const courseAdminService = {
  getOverview: () => courseAdminRepository.getOverview(),
  getMeta: () => courseAdminRepository.getMeta(),

  async listCourses(query: CourseListQuery) {
    const result = await courseAdminRepository.listCourses(query);
    const items = result.items
      .map(mapCourseListItem)
      .sort((a, b) => {
        const aPython = a.slug.startsWith("python-") ? 0 : 1;
        const bPython = b.slug.startsWith("python-") ? 0 : 1;
        if (aPython !== bPython) return aPython - bPython;
        if (aPython === 0) return a.slug.localeCompare(b.slug);
        return 0;
      });
    return {
      items,
      total: result.total,
      page: result.page,
      pageSize: result.pageSize,
      totalPages: Math.ceil(result.total / result.pageSize),
    };
  },

  async getCourse(courseId: string): Promise<CourseDetail> {
    const course = await courseAdminRepository.getCourseById(courseId);
    if (!course) throw new AppError("NOT_FOUND", "Course not found");
    return mapCourseDetail(course);
  },

  async createCourse(input: CreateCourseInput, actorId: string) {
    const course = await courseAdminRepository.createCourse(input);
    await audit(actorId, "CREATE", "Course", course.id);
    return course;
  },

  async updateCourse(courseId: string, input: UpdateCourseInput, actorId: string) {
    const existing = await courseAdminRepository.getCourseById(courseId);
    if (!existing) throw new AppError("NOT_FOUND", "Course not found");
    const course = await courseAdminRepository.updateCourse(courseId, input);
    await audit(actorId, "UPDATE", "Course", courseId);
    return course;
  },

  async deleteCourse(courseId: string, actorId: string) {
    const existing = await courseAdminRepository.getCourseById(courseId);
    if (!existing) throw new AppError("NOT_FOUND", "Course not found");
    await courseAdminRepository.softDeleteCourse(courseId);
    await audit(actorId, "DELETE", "Course", courseId);
  },

  async createModule(courseId: string, input: CreateModuleInput, actorId: string) {
    const existing = await courseAdminRepository.getCourseById(courseId);
    if (!existing) throw new AppError("NOT_FOUND", "Course not found");
    const module = await courseAdminRepository.createModule(courseId, input.title, input.sortOrder);
    await audit(actorId, "CREATE", "CourseModule", module.id);
    return module;
  },

  async updateModule(moduleId: string, input: UpdateModuleInput, actorId: string) {
    const module = await courseAdminRepository.updateModule(moduleId, input);
    await audit(actorId, "UPDATE", "CourseModule", moduleId);
    return module;
  },

  async deleteModule(moduleId: string, actorId: string) {
    await courseAdminRepository.softDeleteModule(moduleId);
    await audit(actorId, "DELETE", "CourseModule", moduleId);
  },

  async createLesson(moduleId: string, input: CreateLessonInput, actorId: string) {
    const lesson = await courseAdminRepository.createLesson(moduleId, input);
    if (!lesson) throw new AppError("NOT_FOUND", "Module not found");
    await audit(actorId, "CREATE", "Lesson", lesson.id);
    return lesson;
  },

  async updateLesson(lessonId: string, input: UpdateLessonInput, actorId: string) {
    const lesson = await courseAdminRepository.updateLesson(lessonId, input);
    await audit(actorId, "UPDATE", "Lesson", lessonId);
    return lesson;
  },

  async deleteLesson(lessonId: string, actorId: string) {
    await courseAdminRepository.softDeleteLesson(lessonId);
    await audit(actorId, "DELETE", "Lesson", lessonId);
  },

  async getAnalytics(courseId: string): Promise<CourseAnalytics> {
    const data = await courseAdminRepository.getCourseAnalytics(courseId);
    if (!data) throw new AppError("NOT_FOUND", "Course not found");

    const enrollments = data.enrollments;
    const total = enrollments.length;
    const statusCounts = ["ENROLLED", "IN_PROGRESS", "COMPLETED", "DROPPED"].map((status) => ({
      status,
      count: enrollments.filter((e) => e.status === status).length,
    }));

    const lessons = data.modules.flatMap((m) => m.lessons);
    const lessonCompletionRates = lessons.map((l) => {
      const started = l._count.progress;
      const completed = l.progress.length;
      return {
        lessonId: l.id,
        lessonTitle: l.title,
        type: l.type,
        completionRate: started ? Math.round((completed / started) * 100) : 0,
      };
    });

    const monthBuckets = new Map<string, { enrollments: number; completions: number }>();
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const key = d.toLocaleString("en-US", { month: "short", year: "2-digit" });
      monthBuckets.set(key, { enrollments: 0, completions: 0 });
    }
    for (const e of enrollments) {
      const key = e.enrolledAt.toLocaleString("en-US", { month: "short", year: "2-digit" });
      if (monthBuckets.has(key)) monthBuckets.get(key)!.enrollments++;
      if (e.completedAt) {
        const cKey = e.completedAt.toLocaleString("en-US", { month: "short", year: "2-digit" });
        if (monthBuckets.has(cKey)) monthBuckets.get(cKey)!.completions++;
      }
    }

    const avgProgress = total
      ? Math.round(enrollments.reduce((sum, e) => sum + e.progress, 0) / total)
      : 0;
    const completed = enrollments.filter((e) => e.status === "COMPLETED").length;

    return {
      courseId: data.id,
      courseTitle: data.title,
      totalEnrollments: total,
      activeLearners: enrollments.filter((e) =>
        ["ENROLLED", "IN_PROGRESS"].includes(e.status)
      ).length,
      completedLearners: completed,
      droppedLearners: enrollments.filter((e) => e.status === "DROPPED").length,
      avgProgress,
      completionRate: total ? Math.round((completed / total) * 100) : 0,
      enrollmentsByStatus: statusCounts,
      lessonCompletionRates,
      progressTrend: Array.from(monthBuckets.entries()).map(([month, v]) => ({
        month,
        ...v,
      })),
    };
  },

  async getEnrollments(courseId: string): Promise<EnrollmentRecord[]> {
    const { enrollments, totalLessons } = await courseAdminRepository.getEnrollments(courseId);
    return enrollments.map((e) => ({
      id: e.id,
      userId: e.user.id,
      userName: `${e.user.firstName} ${e.user.lastName}`,
      userEmail: e.user.email,
      department: e.user.department?.name ?? null,
      status: e.status,
      progress: e.progress,
      lessonsCompleted: e.lessonProgress.length,
      totalLessons,
      enrolledAt: e.enrolledAt.toISOString(),
      completedAt: e.completedAt?.toISOString() ?? null,
    }));
  },

  async getProgress(courseId: string): Promise<ProgressRecord[]> {
    const { lessons, enrollments } = await courseAdminRepository.getProgress(courseId);
    const totalLessons = lessons.length;

    return enrollments.map((e) => {
      const progressMap = new Map(e.lessonProgress.map((p) => [p.lessonId, p]));
      const timeSpent = e.lessonProgress.reduce((sum, p) => sum + (p.timeSpentMinutes ?? 0), 0);
      const lastActivity = e.lessonProgress.reduce<Date | null>((latest, p) => {
        if (!latest || p.updatedAt > latest) return p.updatedAt;
        return latest;
      }, null);
      const lessonsCompleted = e.lessonProgress.filter((p) => p.status === "COMPLETED").length;

      return {
        userId: e.user.id,
        userName: `${e.user.firstName} ${e.user.lastName}`,
        userEmail: e.user.email,
        enrollmentId: e.id,
        status: e.status,
        courseProgress: e.progress,
        lessonsCompleted,
        totalLessons,
        timeSpentMinutes: timeSpent,
        lastActivityAt: lastActivity?.toISOString() ?? null,
        lessonBreakdown: lessons.map((l) => {
          const p = progressMap.get(l.id);
          return {
            lessonId: l.id,
            lessonTitle: l.title,
            type: l.type,
            status: p?.status ?? "NOT_STARTED",
            progressPercent: p?.progressPercent ?? 0,
          };
        }),
      };
    });
  },
};
