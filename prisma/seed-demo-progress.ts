import type { EnrollmentStatus, PrismaClient } from "@prisma/client";
import { RoleSlug } from "../constants/role-slugs";
import { UDEMY_FREE_ROADMAP_COURSES } from "../constants/udemy-free-roadmap-courses";
import { UDEMY_PROGRAMMING_COURSES } from "../constants/udemy-programming-courses";
import { RM_EYE_OPEN_COURSE_IDS } from "./rm-eye-open-courses";

function daysAgo(days: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d;
}

type ProgressSeed = {
  slug: string;
  status: EnrollmentStatus;
  progress: number;
  timeSpentMinutes: number;
  daysAgoEnrolled: number;
};

/** Primary demo employee — anna.kowalski@talentiq.com */
const ANNA_UDEMY_PROGRESS: ProgressSeed[] = [
  { slug: "python-intro-programming", status: "IN_PROGRESS", progress: 45, timeSpentMinutes: 72, daysAgoEnrolled: 14 },
  { slug: "python-beginner-intermediate-30min", status: "COMPLETED", progress: 100, timeSpentMinutes: 28, daysAgoEnrolled: 21 },
  { slug: "intro-databases-sql", status: "IN_PROGRESS", progress: 62, timeSpentMinutes: 95, daysAgoEnrolled: 10 },
  { slug: "excel-for-beginners", status: "COMPLETED", progress: 100, timeSpentMinutes: 88, daysAgoEnrolled: 30 },
  { slug: "git-expert-4-hours", status: "IN_PROGRESS", progress: 28, timeSpentMinutes: 54, daysAgoEnrolled: 5 },
  { slug: "java-multithreading", status: "IN_PROGRESS", progress: 18, timeSpentMinutes: 38, daysAgoEnrolled: 3 },
  { slug: "cloud-computing-aws", status: "ENROLLED", progress: 10, timeSpentMinutes: 12, daysAgoEnrolled: 1 },
  { slug: "quiz-app-html-css-js", status: "COMPLETED", progress: 100, timeSpentMinutes: 110, daysAgoEnrolled: 45 },
  { slug: "advanced-databases-sql", status: "ENROLLED", progress: 0, timeSpentMinutes: 0, daysAgoEnrolled: 0 },
];

/** Team leader — emily.watson@talentiq.com */
const EMILY_UDEMY_PROGRESS: ProgressSeed[] = [
  { slug: "java-design-patterns", status: "IN_PROGRESS", progress: 55, timeSpentMinutes: 140, daysAgoEnrolled: 12 },
  { slug: "aws-zero-to-hero", status: "IN_PROGRESS", progress: 32, timeSpentMinutes: 96, daysAgoEnrolled: 8 },
  { slug: "kali-linux-ethical-hacking", status: "ENROLLED", progress: 10, timeSpentMinutes: 20, daysAgoEnrolled: 2 },
  { slug: "python-201", status: "IN_PROGRESS", progress: 40, timeSpentMinutes: 180, daysAgoEnrolled: 20 },
  { slug: "front-end-web-dev", status: "COMPLETED", progress: 100, timeSpentMinutes: 220, daysAgoEnrolled: 60 },
];

const DEMO_USER_PROGRESS: Record<string, ProgressSeed[]> = {
  "anna.kowalski@talentiq.com": ANNA_UDEMY_PROGRESS,
  "emily.watson@talentiq.com": EMILY_UDEMY_PROGRESS,
  "ben.carter@talentiq.com": [
    { slug: "c-programming-free", status: "IN_PROGRESS", progress: 22, timeSpentMinutes: 40, daysAgoEnrolled: 7 },
    { slug: "html-css-programming-free", status: "ENROLLED", progress: 10, timeSpentMinutes: 15, daysAgoEnrolled: 2 },
  ],
  "chloe.dubois@talentiq.com": [
    { slug: "oop-cpp", status: "IN_PROGRESS", progress: 48, timeSpentMinutes: 130, daysAgoEnrolled: 15 },
    { slug: "advanced-databases-sql", status: "COMPLETED", progress: 100, timeSpentMinutes: 200, daysAgoEnrolled: 40 },
  ],
};

async function upsertEnrollmentProgress(
  prisma: PrismaClient,
  userId: string,
  courseId: string,
  seed: ProgressSeed
) {
  const enrolledAt = daysAgo(seed.daysAgoEnrolled);
  const completedAt = seed.status === "COMPLETED" ? daysAgo(Math.max(0, seed.daysAgoEnrolled - 3)) : null;

  const enrollment = await prisma.courseEnrollment.upsert({
    where: { userId_courseId: { userId, courseId } },
    update: {
      status: seed.status,
      progress: seed.progress,
      completedAt,
      enrolledAt,
    },
    create: {
      userId,
      courseId,
      status: seed.status,
      progress: seed.progress,
      enrolledAt,
      completedAt,
    },
  });

  const totalUnits =
    UDEMY_PROGRAMMING_COURSES.find((c) => c.slug === seed.slug)?.totalUnits ??
    UDEMY_FREE_ROADMAP_COURSES.find((c) => c.slug === seed.slug)?.totalUnits ??
    20;
  const completedLessons = Math.round((seed.progress / 100) * totalUnits);

  await prisma.courseProgressRecord.upsert({
    where: { userId_courseId: { userId, courseId } },
    update: {
      enrollmentId: enrollment.id,
      totalLessons: totalUnits,
      completedLessons,
      progressPercent: seed.progress,
      timeSpentMinutes: seed.timeSpentMinutes,
      lastActivityAt: daysAgo(Math.max(0, seed.daysAgoEnrolled - 1)),
      status: seed.status,
      startedAt: enrolledAt,
      completedAt,
    },
    create: {
      userId,
      courseId,
      enrollmentId: enrollment.id,
      totalLessons: totalUnits,
      completedLessons,
      progressPercent: seed.progress,
      timeSpentMinutes: seed.timeSpentMinutes,
      lastActivityAt: daysAgo(Math.max(0, seed.daysAgoEnrolled - 1)),
      status: seed.status,
      startedAt: enrolledAt,
      completedAt,
    },
  });

  if (seed.progress > 0) {
    await prisma.learningEvent.create({
      data: {
        userId,
        verb: "STARTED",
        actor: { name: "Demo User" },
        object: { id: `course/${courseId}`, definition: { name: { "en-US": seed.slug } } },
        courseId,
        source: "INTERNAL",
        timestamp: enrolledAt,
      },
    });
  }
  if (seed.status === "COMPLETED") {
    await prisma.learningEvent.create({
      data: {
        userId,
        verb: "COMPLETED",
        actor: { name: "Demo User" },
        object: { id: `course/${courseId}`, definition: { name: { "en-US": seed.slug } } },
        courseId,
        source: "INTERNAL",
        timestamp: completedAt ?? enrolledAt,
      },
    });
  }
}

async function backfillProgressFromEnrollments(prisma: PrismaClient) {
  const enrollments = await prisma.courseEnrollment.findMany({
    where: { deletedAt: null },
    include: { course: { select: { id: true, slug: true, durationMinutes: true } } },
  });

  let count = 0;
  for (const e of enrollments) {
    const existing = await prisma.courseProgressRecord.findUnique({
      where: { userId_courseId: { userId: e.userId, courseId: e.courseId } },
    });
    if (existing) continue;

    const timeSpent = Math.round(
      ((e.course.durationMinutes ?? 120) * e.progress) / 100 * 0.5
    );
    await prisma.courseProgressRecord.create({
      data: {
        userId: e.userId,
        courseId: e.courseId,
        enrollmentId: e.id,
        totalLessons: 20,
        completedLessons: Math.round((e.progress / 100) * 20),
        progressPercent: e.progress,
        timeSpentMinutes: timeSpent,
        lastActivityAt: e.enrolledAt ?? new Date(),
        status: e.status,
        startedAt: e.enrolledAt,
        completedAt: e.completedAt,
      },
    });
    count++;
  }
  return count;
}

async function seedOpenCourseCompletions(prisma: PrismaClient) {
  const demoUsers = await prisma.user.findMany({
    where: {
      email: {
        in: [
          "anna.kowalski@talentiq.com",
          "emily.watson@talentiq.com",
          "ben.carter@talentiq.com",
        ],
      },
    },
    select: { id: true, email: true },
  });

  let count = 0;
  for (const user of demoUsers) {
    const completedCount =
      user.email === "anna.kowalski@talentiq.com"
        ? 5
        : user.email === "emily.watson@talentiq.com"
          ? 8
          : 2;

    for (let i = 0; i < Math.min(completedCount, RM_EYE_OPEN_COURSE_IDS.length); i++) {
      await prisma.openCourseCompletion.upsert({
        where: {
          userId_openCourseId: {
            userId: user.id,
            openCourseId: RM_EYE_OPEN_COURSE_IDS[i],
          },
        },
        update: { status: "COMPLETED", completedAt: daysAgo(i * 3) },
        create: {
          userId: user.id,
          openCourseId: RM_EYE_OPEN_COURSE_IDS[i],
          status: "COMPLETED",
          completedAt: daysAgo(i * 3),
        },
      });
      count++;
    }

    const inProgressId = RM_EYE_OPEN_COURSE_IDS[completedCount];
    if (inProgressId) {
      await prisma.openCourseCompletion.upsert({
        where: {
          userId_openCourseId: { userId: user.id, openCourseId: inProgressId },
        },
        update: { status: "IN_PROGRESS" },
        create: {
          userId: user.id,
          openCourseId: inProgressId,
          status: "IN_PROGRESS",
        },
      });
      count++;
    }
  }
  return count;
}

export async function seedDemoProgress(prisma: PrismaClient) {
  console.log("\n── Demo Learning Progress ──");

  const courseBySlug = new Map(
    (
      await prisma.course.findMany({
        where: { deletedAt: null },
        select: { id: true, slug: true },
      })
    ).map((c) => [c.slug, c.id])
  );

  let udemyCount = 0;
  for (const [email, seeds] of Object.entries(DEMO_USER_PROGRESS)) {
    const user = await prisma.user.findUnique({ where: { email }, select: { id: true } });
    if (!user) continue;

    for (const seed of seeds) {
      const courseId = courseBySlug.get(seed.slug);
      if (!courseId) continue;
      await upsertEnrollmentProgress(prisma, user.id, courseId, seed);
      udemyCount++;
    }
  }
  console.log(`  ✓ Udemy demo enrollments + LRS progress: ${udemyCount}`);

  const backfilled = await backfillProgressFromEnrollments(prisma);
  console.log(`  ✓ Backfilled course progress records: ${backfilled}`);

  const openCount = await seedOpenCourseCompletions(prisma);
  console.log(`  ✓ Open course completions: ${openCount}`);

  const employees = await prisma.user.findMany({
    where: { role: { slug: RoleSlug.EMPLOYEE }, isActive: true },
    select: { id: true },
    take: 15,
  });

  let eventCount = 0;
  for (let i = 0; i < employees.length; i++) {
    const courses = await prisma.courseEnrollment.findMany({
      where: { userId: employees[i].id, status: "IN_PROGRESS" },
      take: 1,
      select: { courseId: true },
    });
    if (!courses[0]) continue;

    await prisma.learningEvent.create({
      data: {
        userId: employees[i].id,
        verb: "VIEWED",
        actor: { name: "Employee" },
        object: {
          id: `course/${courses[0].courseId}`,
          definition: { name: { "en-US": "Learning activity" } },
        },
        courseId: courses[0].courseId,
        source: "INTERNAL",
        timestamp: daysAgo(i % 7),
        durationMs: 30 * 60 * 1000,
      },
    });
    eventCount++;
  }
  console.log(`  ✓ Learning events: ${eventCount}`);

  const anna = await prisma.user.findUnique({
    where: { email: "anna.kowalski@talentiq.com" },
    select: { id: true },
  });
  const template = await prisma.certificateTemplate.findFirst({
    where: { name: { contains: "Standard" } },
    select: { id: true },
  });

  if (anna && template) {
    const annaCerts = [
      { number: "TIQ-ANNA-PYTHON-101", slug: "python-beginner-intermediate-30min" },
      { number: "TIQ-ANNA-SQL-101", slug: "excel-for-beginners" },
    ];
    for (const cert of annaCerts) {
      const course = await prisma.course.findUnique({
        where: { slug: cert.slug },
        select: { id: true },
      });
      if (!course) continue;
      await prisma.certificate.upsert({
        where: { certificateNumber: cert.number },
        update: {},
        create: {
          userId: anna.id,
          templateId: template.id,
          courseId: course.id,
          certificateNumber: cert.number,
          verificationToken: `demo-anna-${cert.number}`,
          issuedAt: daysAgo(20),
          expiresAt: daysAgo(-345),
        },
      });
    }
    console.log(`  ✓ Demo employee certificates: ${annaCerts.length}`);
  }
}
