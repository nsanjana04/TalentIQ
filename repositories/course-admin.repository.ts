import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { toSlug } from "@/lib/utils/slug";
import type { CourseListQuery, CreateCourseInput, UpdateCourseInput } from "@/lib/validations/course-admin";

const courseListSelect = {
  id: true,
  title: true,
  slug: true,
  description: true,
  isPublished: true,
  durationMinutes: true,
  createdAt: true,
  instructor: { select: { firstName: true, lastName: true } },
  _count: {
    select: {
      modules: { where: { deletedAt: null } },
      enrollments: { where: { deletedAt: null } },
    },
  },
  modules: {
    where: { deletedAt: null },
    select: {
      _count: { select: { lessons: { where: { deletedAt: null } } } },
    },
  },
  enrollments: {
    where: { deletedAt: null },
    select: { status: true, progress: true },
  },
} satisfies Prisma.CourseSelect;

export const courseAdminRepository = {
  async getOverview() {
    const [courses, modules, lessons, enrollments, completed] = await Promise.all([
      prisma.course.count({ where: { deletedAt: null } }),
      prisma.courseModule.count({ where: { deletedAt: null } }),
      prisma.lesson.count({ where: { deletedAt: null } }),
      prisma.courseEnrollment.count({ where: { deletedAt: null } }),
      prisma.courseEnrollment.count({ where: { deletedAt: null, status: "COMPLETED" } }),
    ]);
    const published = await prisma.course.count({
      where: { deletedAt: null, isPublished: true },
    });
    return {
      totalCourses: courses,
      publishedCourses: published,
      totalModules: modules,
      totalLessons: lessons,
      totalEnrollments: enrollments,
      avgCompletionRate: enrollments ? Math.round((completed / enrollments) * 100) : 0,
    };
  },

  async getMeta() {
    const [instructors, assessments] = await Promise.all([
      prisma.user.findMany({
        where: {
          deletedAt: null,
          isActive: true,
          role: { slug: { in: ["instructor", "admin", "department_manager"] } },
        },
        select: { id: true, firstName: true, lastName: true, email: true },
        orderBy: { firstName: "asc" },
      }),
      prisma.assessment.findMany({
        where: { deletedAt: null, isPublished: true },
        select: { id: true, title: true, courseId: true },
        orderBy: { title: "asc" },
      }),
    ]);
    return {
      instructors: instructors.map((i) => ({
        id: i.id,
        name: `${i.firstName} ${i.lastName}`,
        email: i.email,
      })),
      assessments,
    };
  },

  async listCourses(query: CourseListQuery) {
    const where: Prisma.CourseWhereInput = {
      deletedAt: null,
      ...(query.search
        ? {
            OR: [
              { title: { contains: query.search, mode: "insensitive" } },
              { slug: { contains: query.search, mode: "insensitive" } },
            ],
          }
        : {}),
      ...(query.published === "true" ? { isPublished: true } : {}),
      ...(query.published === "false" ? { isPublished: false } : {}),
    };

    const [items, total] = await Promise.all([
      prisma.course.findMany({
        where,
        select: courseListSelect,
        orderBy: { updatedAt: "desc" },
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
      prisma.course.count({ where }),
    ]);

    return { items, total, page: query.page, pageSize: query.pageSize };
  },

  async getCourseById(courseId: string) {
    return prisma.course.findFirst({
      where: { id: courseId, deletedAt: null },
      include: {
        instructor: { select: { id: true, firstName: true, lastName: true } },
        modules: {
          where: { deletedAt: null },
          orderBy: { sortOrder: "asc" },
          include: {
            assessment: {
              select: {
                id: true,
                title: true,
                _count: { select: { questions: { where: { deletedAt: null } } } },
              },
            },
            lessons: {
              where: { deletedAt: null },
              orderBy: { sortOrder: "asc" },
              include: {
                assessment: { select: { id: true, title: true } },
              },
            },
          },
        },
        enrollments: {
          where: { deletedAt: null },
          select: { status: true, progress: true },
        },
      },
    });
  },

  async createCourse(data: CreateCourseInput) {
    const baseSlug = toSlug(data.title);
    let slug = baseSlug;
    let suffix = 1;
    while (await prisma.course.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${suffix++}`;
    }
    return prisma.course.create({
      data: {
        title: data.title,
        slug,
        description: data.description,
        instructorId: data.instructorId,
        durationMinutes: data.durationMinutes,
        isPublished: data.isPublished ?? false,
      },
    });
  },

  async updateCourse(courseId: string, data: UpdateCourseInput) {
    return prisma.course.update({
      where: { id: courseId },
      data: {
        ...(data.title && { title: data.title, slug: toSlug(data.title) }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.instructorId !== undefined && { instructorId: data.instructorId || null }),
        ...(data.durationMinutes !== undefined && { durationMinutes: data.durationMinutes }),
        ...(data.isPublished !== undefined && { isPublished: data.isPublished }),
      },
    });
  },

  async softDeleteCourse(courseId: string) {
    return prisma.course.update({
      where: { id: courseId },
      data: { deletedAt: new Date() },
    });
  },

  async createModule(courseId: string, title: string, sortOrder?: number) {
    const maxOrder = await prisma.courseModule.aggregate({
      where: { courseId, deletedAt: null },
      _max: { sortOrder: true },
    });
    return prisma.courseModule.create({
      data: {
        courseId,
        title,
        sortOrder: sortOrder ?? (maxOrder._max.sortOrder ?? -1) + 1,
      },
    });
  },

  async updateModule(moduleId: string, data: { title?: string; sortOrder?: number }) {
    return prisma.courseModule.update({
      where: { id: moduleId },
      data,
    });
  },

  async softDeleteModule(moduleId: string) {
    return prisma.courseModule.update({
      where: { id: moduleId },
      data: { deletedAt: new Date() },
    });
  },

  async createLesson(
    moduleId: string,
    data: {
      title: string;
      type: string;
      content?: string;
      videoUrl?: string;
      pdfUrl?: string;
      assessmentId?: string;
      assignmentBrief?: string;
      sortOrder?: number;
      durationMinutes?: number;
    }
  ) {
    const module = await prisma.courseModule.findFirst({
      where: { id: moduleId, deletedAt: null },
    });
    if (!module) return null;

    const maxOrder = await prisma.lesson.aggregate({
      where: { moduleId, deletedAt: null },
      _max: { sortOrder: true },
    });

    return prisma.lesson.create({
      data: {
        moduleId,
        title: data.title,
        type: data.type as "VIDEO" | "PDF" | "QUIZ" | "ASSIGNMENT",
        content: data.content,
        videoUrl: data.videoUrl || null,
        pdfUrl: data.pdfUrl || null,
        assessmentId: data.assessmentId || null,
        assignmentBrief: data.assignmentBrief,
        sortOrder: data.sortOrder ?? (maxOrder._max.sortOrder ?? -1) + 1,
        durationMinutes: data.durationMinutes,
      },
    });
  },

  async updateLesson(
    lessonId: string,
    data: Partial<{
      title: string;
      type: string;
      content: string;
      videoUrl: string;
      pdfUrl: string;
      assessmentId: string;
      assignmentBrief: string;
      sortOrder: number;
      durationMinutes: number;
    }>
  ) {
    return prisma.lesson.update({
      where: { id: lessonId },
      data: {
        ...(data.title && { title: data.title }),
        ...(data.type && { type: data.type as "VIDEO" | "PDF" | "QUIZ" | "ASSIGNMENT" }),
        ...(data.content !== undefined && { content: data.content }),
        ...(data.videoUrl !== undefined && { videoUrl: data.videoUrl || null }),
        ...(data.pdfUrl !== undefined && { pdfUrl: data.pdfUrl || null }),
        ...(data.assessmentId !== undefined && { assessmentId: data.assessmentId || null }),
        ...(data.assignmentBrief !== undefined && { assignmentBrief: data.assignmentBrief }),
        ...(data.sortOrder !== undefined && { sortOrder: data.sortOrder }),
        ...(data.durationMinutes !== undefined && { durationMinutes: data.durationMinutes }),
      },
    });
  },

  async softDeleteLesson(lessonId: string) {
    return prisma.lesson.update({
      where: { id: lessonId },
      data: { deletedAt: new Date() },
    });
  },

  async getCourseAnalytics(courseId: string) {
    const course = await prisma.course.findFirst({
      where: { id: courseId, deletedAt: null },
      select: {
        id: true,
        title: true,
        enrollments: {
          where: { deletedAt: null },
          select: {
            status: true,
            progress: true,
            enrolledAt: true,
            completedAt: true,
          },
        },
        modules: {
          where: { deletedAt: null },
          select: {
            lessons: {
              where: { deletedAt: null },
              select: {
                id: true,
                title: true,
                type: true,
                progress: {
                  where: { deletedAt: null, status: "COMPLETED" },
                  select: { id: true },
                },
                _count: {
                  select: {
                    progress: { where: { deletedAt: null } },
                  },
                },
              },
            },
          },
        },
      },
    });
    return course;
  },

  async getEnrollments(courseId: string) {
    const course = await prisma.course.findFirst({
      where: { id: courseId, deletedAt: null },
      select: {
        modules: {
          where: { deletedAt: null },
          select: {
            lessons: {
              where: { deletedAt: null },
              select: { id: true },
            },
          },
        },
      },
    });
    const totalLessons =
      course?.modules.reduce((sum, m) => sum + m.lessons.length, 0) ?? 0;

    const enrollments = await prisma.courseEnrollment.findMany({
      where: { courseId, deletedAt: null },
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
        lessonProgress: {
          where: { deletedAt: null, status: "COMPLETED" },
          select: { id: true },
        },
      },
      orderBy: { enrolledAt: "desc" },
    });

    return { enrollments, totalLessons };
  },

  async getProgress(courseId: string) {
    const course = await prisma.course.findFirst({
      where: { id: courseId, deletedAt: null },
      select: {
        modules: {
          where: { deletedAt: null },
          orderBy: { sortOrder: "asc" },
          select: {
            lessons: {
              where: { deletedAt: null },
              orderBy: { sortOrder: "asc" },
              select: { id: true, title: true, type: true },
            },
          },
        },
      },
    });

    const lessons =
      course?.modules.flatMap((m) => m.lessons) ?? [];
    const lessonIds = lessons.map((l) => l.id);

    const enrollments = await prisma.courseEnrollment.findMany({
      where: { courseId, deletedAt: null },
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        lessonProgress: {
          where: { deletedAt: null, lessonId: { in: lessonIds } },
          select: {
            lessonId: true,
            status: true,
            progressPercent: true,
            timeSpentMinutes: true,
            updatedAt: true,
          },
        },
      },
      orderBy: { progress: "desc" },
    });

    return { lessons, enrollments };
  },
};
