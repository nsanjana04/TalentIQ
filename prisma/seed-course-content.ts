import type { PrismaClient } from "@prisma/client";

const COURSE_CONTENT: Record<
  string,
  {
    modules: {
      title: string;
      lessons: {
        title: string;
        type: "VIDEO" | "PDF" | "QUIZ" | "ASSIGNMENT";
        durationMinutes?: number;
        videoUrl?: string;
        pdfUrl?: string;
        assessmentSlug?: string;
        assignmentBrief?: string;
      }[];
    }[];
  }
> = {
  "react-advanced": {
    modules: [
      {
        title: "Advanced Patterns",
        lessons: [
          {
            title: "Compound Components",
            type: "VIDEO",
            durationMinutes: 25,
            videoUrl: "https://example.com/videos/compound-components",
          },
          {
            title: "Pattern Reference Guide",
            type: "PDF",
            pdfUrl: "https://example.com/docs/react-patterns.pdf",
          },
          {
            title: "Patterns Knowledge Check",
            type: "QUIZ",
            assessmentSlug: "react-advanced",
          },
        ],
      },
      {
        title: "Performance & Architecture",
        lessons: [
          {
            title: "React Performance Deep Dive",
            type: "VIDEO",
            durationMinutes: 35,
            videoUrl: "https://example.com/videos/react-performance",
          },
          {
            title: "Build a Performance Dashboard",
            type: "ASSIGNMENT",
            assignmentBrief:
              "Implement a virtualized list with memoization. Submit code review link.",
          },
        ],
      },
    ],
  },
  "java-101": {
    modules: [
      {
        title: "Java Foundations",
        lessons: [
          {
            title: "Introduction to Java",
            type: "VIDEO",
            durationMinutes: 20,
            videoUrl: "https://example.com/videos/java-intro",
          },
          {
            title: "Java Syntax Cheatsheet",
            type: "PDF",
            pdfUrl: "https://example.com/docs/java-101.pdf",
          },
          {
            title: "Java Basics Quiz",
            type: "QUIZ",
            assessmentSlug: "java-101",
          },
        ],
      },
      {
        title: "Object-Oriented Java",
        lessons: [
          {
            title: "Classes and Objects",
            type: "VIDEO",
            durationMinutes: 30,
          },
          {
            title: "OOP Assignment",
            type: "ASSIGNMENT",
            assignmentBrief: "Design a simple banking domain model with encapsulation.",
          },
        ],
      },
    ],
  },
  "nodejs-backend": {
    modules: [
      {
        title: "Server Fundamentals",
        lessons: [
          { title: "Express.js Overview", type: "VIDEO", durationMinutes: 22 },
          { title: "REST API Design PDF", type: "PDF", pdfUrl: "https://example.com/docs/rest.pdf" },
          { title: "Node.js Practical Exam", type: "QUIZ", assessmentSlug: "nodejs-backend" },
        ],
      },
    ],
  },
};

export async function seedCourseContent(prisma: PrismaClient) {
  console.log("\n── Course Content ──");

  let moduleCount = 0;
  let lessonCount = 0;
  let progressCount = 0;

  for (const [slug, content] of Object.entries(COURSE_CONTENT)) {
    const course = await prisma.course.findUnique({ where: { slug } });
    if (!course) continue;

    const existingModules = await prisma.courseModule.count({
      where: { courseId: course.id, deletedAt: null },
    });
    if (existingModules > 0) continue;

    for (let mi = 0; mi < content.modules.length; mi++) {
      const mod = content.modules[mi];
      const module = await prisma.courseModule.create({
        data: { courseId: course.id, title: mod.title, sortOrder: mi },
      });
      moduleCount++;

      for (let li = 0; li < mod.lessons.length; li++) {
        const lesson = mod.lessons[li];
        let assessmentId: string | undefined;
        if (lesson.assessmentSlug) {
          const assessment = await prisma.assessment.findFirst({
            where: {
              OR: [
                { id: `seed-path-assessment-${lesson.assessmentSlug}` },
                { id: `seed-assessment-${lesson.assessmentSlug}` },
              ],
            },
          });
          assessmentId = assessment?.id;
        }

        await prisma.lesson.create({
          data: {
            moduleId: module.id,
            title: lesson.title,
            type: lesson.type,
            durationMinutes: lesson.durationMinutes,
            videoUrl: lesson.videoUrl,
            pdfUrl: lesson.pdfUrl,
            assessmentId,
            assignmentBrief: lesson.assignmentBrief,
            sortOrder: li,
          },
        });
        lessonCount++;
      }
    }
  }

  const enrollments = await prisma.courseEnrollment.findMany({
    where: { deletedAt: null, status: { in: ["IN_PROGRESS", "COMPLETED"] } },
    include: {
      course: {
        include: {
          modules: {
            where: { deletedAt: null },
            include: {
              lessons: { where: { deletedAt: null }, orderBy: { sortOrder: "asc" } },
            },
          },
        },
      },
    },
    take: 30,
  });

  for (const enrollment of enrollments) {
    const lessons = enrollment.course.modules.flatMap((m) => m.lessons);
    if (!lessons.length) continue;

    const completeCount =
      enrollment.status === "COMPLETED"
        ? lessons.length
        : Math.max(1, Math.floor(lessons.length * (enrollment.progress / 100)));

    for (let i = 0; i < lessons.length; i++) {
      const lesson = lessons[i];
      const isComplete = i < completeCount;
      const isCurrent = i === completeCount && enrollment.status === "IN_PROGRESS";

      await prisma.lessonProgress.upsert({
        where: { userId_lessonId: { userId: enrollment.userId, lessonId: lesson.id } },
        update: {},
        create: {
          userId: enrollment.userId,
          lessonId: lesson.id,
          enrollmentId: enrollment.id,
          status: isComplete ? "COMPLETED" : isCurrent ? "IN_PROGRESS" : "NOT_STARTED",
          progressPercent: isComplete ? 100 : isCurrent ? 45 : 0,
          completedAt: isComplete ? new Date() : undefined,
          timeSpentMinutes: isComplete ? 20 + i * 5 : isCurrent ? 10 : 0,
        },
      });
      progressCount++;
    }
  }

  console.log(`  ✓ Modules: ${moduleCount}`);
  console.log(`  ✓ Lessons: ${lessonCount}`);
  console.log(`  ✓ Lesson progress records: ${progressCount}`);
}
