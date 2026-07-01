import { PrismaClient } from "@prisma/client";

const p = new PrismaClient();

async function main() {
  try {
    const count = await p.learningResource.count();
    console.log("learning_resources OK, count:", count);
  } catch (e) {
    console.error("FAIL:", e instanceof Error ? e.message : e);
    process.exit(1);
  }
}

main().finally(() => p.$disconnect());
