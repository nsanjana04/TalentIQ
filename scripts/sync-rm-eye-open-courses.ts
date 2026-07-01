/**
 * Sync open courses to the 14 RM Eye training videos only.
 * Run: npx tsx scripts/sync-rm-eye-open-courses.ts
 */
import { PrismaClient } from "@prisma/client";
import { RoleSlug } from "../constants/role-slugs";
import {
  RM_EYE_OPEN_COURSE_IDS,
  RM_EYE_OPEN_COURSES,
  toOpenCourseSeed,
} from "../prisma/rm-eye-open-courses";

const prisma = new PrismaClient();

async function main() {
  const admin = await prisma.user.findFirst({
    where: { role: { slug: RoleSlug.ADMIN } },
    select: { id: true },
  });

  for (const course of RM_EYE_OPEN_COURSES) {
    const seed = toOpenCourseSeed(course, admin?.id ?? undefined);
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

  console.log(`Synced ${RM_EYE_OPEN_COURSES.length} RM Eye open courses.`);
  console.log(`Removed ${removed.count} other open course(s).`);
  console.log("\nPlace MP4 files in: public/learning/training/");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
