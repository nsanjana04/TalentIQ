import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const courses = await prisma.openCourse.findMany({
    where: { deletedAt: null, isPublished: true },
    select: { id: true, title: true, url: true, type: true, sortOrder: true },
    orderBy: { sortOrder: "asc" },
    take: 5,
  });
  console.log("Published open courses (first 5):");
  console.log(JSON.stringify(courses, null, 2));

  const target = await prisma.openCourse.findFirst({
    where: {
      OR: [
        { id: "seed-open-rm-eye" },
        { title: { contains: "Meeting Recording", mode: "insensitive" } },
      ],
    },
    select: { id: true, title: true, url: true, type: true, description: true },
  });
  console.log("\nTarget course:");
  console.log(JSON.stringify(target, null, 2));

  const training = await prisma.openCourse.findMany({
    where: {
      deletedAt: null,
      isPublished: true,
      url: { contains: "/learning/training/" },
    },
    select: { id: true, title: true, url: true },
    orderBy: { sortOrder: "asc" },
  });
  console.log("\nTraining videos in DB:");
  console.log(JSON.stringify(training, null, 2));
  console.log("\nTraining video count:", training.length);
}

main()
  .finally(() => prisma.$disconnect());
