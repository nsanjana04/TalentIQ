import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const result = await prisma.openCourse.updateMany({
    where: { deletedAt: null },
    data: {
      deletedAt: new Date(),
      isPublished: false,
    },
  });

  console.log(`Removed ${result.count} open course(s).`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
