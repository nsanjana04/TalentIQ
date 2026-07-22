/**
 * Import Udemy syllabus sections into TalentIQ as course modules + lessons.
 *
 * Usage:
 *   npx tsx scripts/import-udemy-curriculum.ts
 *   npx tsx scripts/import-udemy-curriculum.ts --replace
 *   npx tsx scripts/import-udemy-curriculum.ts --slug python-101 --replace
 */
import { PrismaClient } from "@prisma/client";
import {
  getBundledUdemyCurriculum,
  listBundledUdemyCurriculumSlugs,
} from "@/constants/udemy-curricula";
import {
  importAllBundledUdemyCurricula,
  importUdemyCurriculumForCourse,
} from "@/services/udemy-curriculum-import.service";

const prisma = new PrismaClient();

async function main() {
  const args = process.argv.slice(2);
  const replace = args.includes("--replace");
  const slugIndex = args.indexOf("--slug");
  const slug = slugIndex >= 0 ? args[slugIndex + 1] : null;

  if (slug) {
    const course = await prisma.course.findFirst({
      where: { slug, deletedAt: null },
      select: { id: true, slug: true, title: true },
    });
    if (!course) {
      console.error(`Course not found: ${slug}`);
      process.exit(1);
    }
    if (!getBundledUdemyCurriculum(slug)) {
      console.error(`No bundled Udemy curriculum for slug: ${slug}`);
      console.error(`Available: ${listBundledUdemyCurriculumSlugs().join(", ")}`);
      process.exit(1);
    }
    const result = await importUdemyCurriculumForCourse(
      prisma,
      course.id,
      course.slug,
      course.title,
      { replace }
    );
    console.log(JSON.stringify(result, null, 2));
    return;
  }

  const results = await importAllBundledUdemyCurricula(prisma, { replace });
  for (const result of results) {
    if (result.skipped) {
      console.log(`⊘ ${result.slug}: skipped (${result.reason})`);
    } else {
      console.log(
        `✓ ${result.slug}: ${result.modulesCreated} modules, ${result.lessonsCreated} lessons`
      );
    }
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
