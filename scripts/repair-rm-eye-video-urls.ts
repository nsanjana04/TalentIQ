/**
 * Repair open-course video URLs to match actual MP4 filenames on disk.
 * Run: npx tsx scripts/repair-rm-eye-video-urls.ts
 */
import { existsSync } from "fs";
import path from "path";
import { PrismaClient } from "@prisma/client";
import { buildRmEyeVideoUrl } from "../prisma/rm-eye-open-courses";
import { OPEN_RM_EYE_VIDEO_MAP } from "../prisma/open-rm-eye-video-map";

const prisma = new PrismaClient();
const trainingDir = path.join(process.cwd(), "public", "learning", "training");

async function main() {
  let updated = 0;
  let missing = 0;

  for (const [courseId, fileName] of Object.entries(OPEN_RM_EYE_VIDEO_MAP)) {
    const diskPath = path.join(trainingDir, fileName);
    const url = buildRmEyeVideoUrl(fileName);

    if (!existsSync(diskPath)) {
      console.warn(`⚠ Missing file: ${fileName}`);
      missing++;
    }

    const course = await prisma.openCourse.findUnique({ where: { id: courseId } });
    if (!course) continue;

    if (course.url !== url) {
      await prisma.openCourse.update({
        where: { id: courseId },
        data: { url, type: "VIDEO", provider: "Video" },
      });
      console.log(`✓ ${courseId}`);
      console.log(`  ${course.url}`);
      console.log(`  → ${url}`);
      updated++;
    }
  }

  console.log(`\nDone. Updated ${updated} course URL(s). Missing files on disk: ${missing}.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
