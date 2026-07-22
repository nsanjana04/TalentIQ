import type { PrismaClient } from "@prisma/client";

const BANK_QUESTIONS = [
  {
    id: "seed-bank-mcq-1",
    question: "Which hook is used for side effects in React?",
    type: "MULTIPLE_CHOICE" as const,
    options: ["useState", "useEffect", "useMemo", "useRef"],
    correctAnswer: "useEffect",
    points: 2,
    tags: ["react"],
  },
  {
    id: "seed-bank-tf-1",
    question: "TypeScript is a superset of JavaScript.",
    type: "TRUE_FALSE" as const,
    correctAnswer: "True",
    points: 1,
    tags: ["typescript"],
  },
  {
    id: "seed-bank-essay-1",
    question: "Describe the SOLID principles and give one example of each in backend design.",
    type: "ESSAY" as const,
    points: 10,
    tags: ["architecture"],
  },
  {
    id: "seed-bank-code-1",
    question: "Implement a function that returns the sum of an array of numbers.",
    type: "CODE" as const,
    codeTemplate: "function sum(arr: number[]): number {\n  // your code\n}",
    correctAnswer: "function sum(arr) { return arr.reduce((a,b)=>a+b,0); }",
    points: 5,
    tags: ["javascript"],
  },
  {
    id: "seed-bank-mcq-2",
    question: "What does REST stand for?",
    type: "MULTIPLE_CHOICE" as const,
    options: [
      "Representational State Transfer",
      "Remote Execution Service Technology",
      "Reactive Event Stream Transport",
      "Resource Endpoint Standard Template",
    ],
    correctAnswer: "Representational State Transfer",
    points: 2,
    tags: ["api"],
  },
];

export async function seedAssessments(prisma: PrismaClient) {
  console.log("\n── Assessments Module ──");

  for (const q of BANK_QUESTIONS) {
    await prisma.questionBankItem.upsert({
      where: { id: q.id },
      update: {
        question: q.question,
        type: q.type,
        options: "options" in q ? q.options : undefined,
        correctAnswer: "correctAnswer" in q ? q.correctAnswer : undefined,
        codeTemplate: "codeTemplate" in q ? q.codeTemplate : undefined,
        points: q.points,
        tags: q.tags,
      },
      create: {
        id: q.id,
        question: q.question,
        type: q.type,
        options: "options" in q ? q.options : undefined,
        correctAnswer: "correctAnswer" in q ? q.correctAnswer : undefined,
        codeTemplate: "codeTemplate" in q ? q.codeTemplate : undefined,
        points: q.points,
        tags: q.tags,
      },
    });
  }
  console.log(`  ✓ Question bank: ${BANK_QUESTIONS.length}`);

  const assessments = await prisma.assessment.findMany({
    where: { deletedAt: null },
    select: { id: true, title: true },
  });

  for (const a of assessments) {
    await prisma.assessment.update({
      where: { id: a.id },
      data: {
        maxRetakes: 3,
        allowRetakes: true,
        timeLimitMinutes: a.title.includes("Practical") ? 45 : 30,
        isPublished: true,
      },
    });

    const existingQ = await prisma.assessmentQuestion.count({
      where: { assessmentId: a.id, deletedAt: null },
    });
    if (existingQ > 0) continue;

    const bankItems = await prisma.questionBankItem.findMany({
      where: { deletedAt: null },
      take: 3,
    });

    for (let i = 0; i < bankItems.length; i++) {
      const item = bankItems[i];
      await prisma.assessmentQuestion.create({
        data: {
          assessmentId: a.id,
          bankItemId: item.id,
          question: item.question,
          type: item.type,
          options: item.options ?? undefined,
          correctAnswer: item.correctAnswer,
          codeTemplate: item.codeTemplate,
          points: item.points,
          sortOrder: i,
        },
      });
    }
  }
  console.log(`  ✓ Assessment questions linked`);

  const demoUser = await prisma.user.findFirst({
    where: { email: "emily.watson@talentiq.com" },
    select: { id: true },
  });

  const reactAssessment = await prisma.assessment.findFirst({
    where: { title: { contains: "React" } },
    include: { questions: { where: { deletedAt: null } } },
  });

  if (demoUser && reactAssessment && reactAssessment.questions.length) {
    const maxScore = reactAssessment.questions.reduce((s, q) => s + q.points, 0);
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000);

    const attempt = await prisma.assessmentAttempt.upsert({
      where: { id: "seed-attempt-emily-react" },
      update: {},
      create: {
        id: "seed-attempt-emily-react",
        assessmentId: reactAssessment.id,
        userId: demoUser.id,
        attemptNumber: 1,
        status: "PASSED",
        score: 85,
        maxScore,
        passingScore: reactAssessment.passingScore,
        passed: true,
        answers: {},
        feedback: "Congratulations! You passed the assessment.",
        submittedAt: new Date(),
        expiresAt,
      },
    });

    console.log(`  ✓ Demo attempt: ${attempt.id}`);
  }
}
