import { PrismaClient } from "@prisma/client";
import { RoleSlug } from "../constants/role-slugs";
import { seedLearningAdminCourses } from "../prisma/seed-learning-admin-courses";

const prisma = new PrismaClient();

async function main() {
  const admin = await prisma.user.findFirst({
    where: { role: { slug: RoleSlug.ADMIN } },
    select: { id: true },
  });
  const count = await seedLearningAdminCourses(prisma, admin?.id);
  const levels = await prisma.courseLevel.count();
  console.log(`Seeded ${count} enterprise courses; ${levels} course levels in database.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
