import type { PrismaClient } from "@prisma/client";
import { listBundledUdemyCurriculumSlugs } from "@/constants/udemy-curricula";
import { importAllBundledUdemyCurricula } from "@/services/udemy-curriculum-import.service";

export async function seedUdemyCurriculumModules(prisma: PrismaClient) {
  console.log("\n── Udemy Curriculum Modules ──");
  console.log(`  Bundled curricula: ${listBundledUdemyCurriculumSlugs().length} courses`);

  const results = await importAllBundledUdemyCurricula(prisma);

  let imported = 0;
  let skipped = 0;

  for (const result of results) {
    if (result.skipped) {
      skipped++;
      continue;
    }
    imported++;
    console.log(
      `  ✓ ${result.slug}: ${result.modulesCreated} modules, ${result.lessonsCreated} lessons, ${result.assessmentsCreated} assessments`
    );
  }

  console.log(`  ✓ Udemy import complete (${imported} imported, ${skipped} skipped)`);
}
