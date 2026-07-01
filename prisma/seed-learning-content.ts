import type { PrismaClient } from "@prisma/client";
import { RoleSlug } from "../constants/role-slugs";
import {
  RM_EYE_OPEN_COURSE_IDS,
  RM_EYE_OPEN_COURSES,
  toOpenCourseSeed,
} from "./rm-eye-open-courses";

export async function seedLearningContent(prisma: PrismaClient) {
  console.log("\n── Learning Content (Admin Templates) ──");

  const admin = await prisma.user.findFirst({
    where: { role: { slug: RoleSlug.ADMIN } },
    select: { id: true },
  });

  const resources = [
    {
      title: "Introduction to Java on Azure",
      description: "Microsoft Learn beginner module for Java on Azure",
      type: "MICROSOFT_LEARN" as const,
      url: "https://learn.microsoft.com/en-us/training/modules/intro-to-java-azure/",
      provider: "Microsoft Learn",
      tags: ["java", "azure", "beginner"],
      sortOrder: 0,
    },
    {
      title: "React Official Docs",
      description: "Official React documentation",
      type: "LINK" as const,
      url: "https://react.dev/learn",
      provider: "External Link",
      tags: ["react", "documentation"],
      sortOrder: 1,
    },
    {
      title: "Sample Security Policy PDF",
      description: "Example PDF resource link",
      type: "PDF" as const,
      url: "https://www.w3.org/WAI/WCAG21/Techniques/pdf/img/table-word.pdf",
      provider: "PDF",
      tags: ["security", "policy"],
      sortOrder: 2,
    },
  ];

  for (const r of resources) {
    await prisma.learningResource.upsert({
      where: { id: `seed-resource-${r.sortOrder}` },
      update: {
        title: r.title,
        description: r.description,
        type: r.type,
        url: r.url,
        provider: r.provider,
        tags: r.tags,
        isPublished: true,
        sortOrder: r.sortOrder,
      },
      create: {
        id: `seed-resource-${r.sortOrder}`,
        ...r,
        isPublished: true,
        createdById: admin?.id,
      },
    });
  }

  for (const course of RM_EYE_OPEN_COURSES) {
    const seed = toOpenCourseSeed(course, admin?.id);
    await prisma.openCourse.upsert({
      where: { id: seed.id },
      update: {
        title: seed.title,
        description: seed.description,
        category: seed.category,
        type: seed.type,
        url: seed.url,
        provider: seed.provider,
        durationMinutes: seed.durationMinutes,
        isMandatory: seed.isMandatory,
        isPublished: true,
        sortOrder: seed.sortOrder,
        deletedAt: null,
      },
      create: seed,
    });
  }

  const removed = await prisma.openCourse.updateMany({
    where: {
      id: { notIn: RM_EYE_OPEN_COURSE_IDS },
      deletedAt: null,
    },
    data: {
      deletedAt: new Date(),
      isPublished: false,
    },
  });

  console.log(`  ✓ Learning resources: ${resources.length}`);
  console.log(`  ✓ Open courses (RM Eye): ${RM_EYE_OPEN_COURSES.length}`);
  if (removed.count > 0) {
    console.log(`  ✓ Removed other open courses: ${removed.count}`);
  }
}
