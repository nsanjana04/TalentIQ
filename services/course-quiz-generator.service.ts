import { getExternalCourseConfig } from "@/constants/external-courses";
import {
  CODING_ROUND_PASSING_COUNT,
  CODING_ROUND_QUESTION_COUNT,
  CODING_ROUND_SYSTEM_PROMPT,
  CODING_ROUND_USER_PROMPT_TEMPLATE,
  fillPromptTemplate,
  MODULE_EXAM_PASSING_COUNT,
  MODULE_PASSING_SCORE,
  MODULE_QUIZ_QUESTION_COUNT,
  MODULE_QUIZ_SYSTEM_PROMPT,
  MODULE_QUIZ_USER_PROMPT_TEMPLATE,
} from "@/constants/assessment-prompts";
import { AppError } from "@/lib/errors/app-error";
import { isLlmEnabled, queryLlm } from "@/lib/ai/llm-client";
import { generateAssessmentQuestions } from "@/lib/ai/generate-assessment-questions";
import { prisma } from "@/lib/db/prisma";
import { assessmentRepository } from "@/repositories/assessment.repository";
import { auditService } from "@/services/audit.service";
import type {
  CourseLinkedAssessment,
  GenerateCourseAssessmentQuestionsResult,
  GenerateModuleAssessmentQuestionsResult,
  ModuleAssessmentStatus,
  SetupModuleAssessmentsResult,
} from "@/types/course-admin";

interface SyllabusLesson {
  title: string;
  type: string;
  moduleTitle: string;
  content?: string | null;
}

interface CourseSyllabus {
  courseId: string;
  title: string;
  description: string | null;
  modules: { title: string; lessons: SyllabusLesson[] }[];
}

interface GeneratedQuestion {
  question: string;
  type: "MULTIPLE_CHOICE" | "TRUE_FALSE" | "SHORT_ANSWER" | "CODE";
  options?: string[];
  correctAnswer: string;
  codeTemplate?: string;
  points: number;
}

function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

async function fetchCourseSyllabus(courseId: string): Promise<CourseSyllabus | null> {
  const course = await prisma.course.findFirst({
    where: { id: courseId, deletedAt: null },
    select: {
      id: true,
      title: true,
      description: true,
      slug: true,
      modules: {
        where: { deletedAt: null },
        orderBy: { sortOrder: "asc" },
        select: {
          title: true,
          lessons: {
            where: { deletedAt: null },
            orderBy: { sortOrder: "asc" },
            select: { title: true, type: true, content: true },
          },
        },
      },
    },
  });

  if (!course) return null;

  const modules = course.modules.map((mod) => ({
    title: mod.title,
    lessons: mod.lessons.map((lesson) => ({
      title: lesson.title,
      type: lesson.type,
      moduleTitle: mod.title,
      content: lesson.content?.slice(0, 500) ?? null,
    })),
  }));

  if (modules.some((m) => m.lessons.length > 0)) {
    return {
      courseId: course.id,
      title: course.title,
      description: course.description,
      modules,
    };
  }

  const external = getExternalCourseConfig(course.slug);
  if (external) {
    const unitCount = Math.min(external.totalUnits, 8);
    const syntheticLessons = Array.from({ length: unitCount }, (_, i) => ({
      title: `Unit ${i + 1}`,
      type: "VIDEO",
      moduleTitle: course.title,
    }));
    return {
      courseId: course.id,
      title: course.title,
      description: course.description,
      modules: [{ title: course.title, lessons: syntheticLessons }],
    };
  }

  return {
    courseId: course.id,
    title: course.title,
    description: course.description,
    modules: [
      {
        title: course.title,
        lessons: [{ title: course.title, type: "VIDEO", moduleTitle: course.title }],
      },
    ],
  };
}

function buildFallbackQuestions(syllabus: CourseSyllabus): GeneratedQuestion[] {
  const questions: GeneratedQuestion[] = [];
  const allLessons = syllabus.modules.flatMap((mod) => mod.lessons);

  for (const mod of syllabus.modules) {
    if (mod.lessons.length < 2) continue;
    const correct = mod.lessons[0].title;
    const distractors = allLessons
      .filter((l) => l.title !== correct)
      .map((l) => l.title)
      .slice(0, 3);
    if (distractors.length < 2) continue;

    questions.push({
      question: `Which topic is covered in the "${mod.title}" section of ${syllabus.title}?`,
      type: "MULTIPLE_CHOICE",
      options: shuffle([correct, ...distractors]).slice(0, 4),
      correctAnswer: correct,
      points: 2,
    });
  }

  for (const lesson of allLessons.slice(0, 6)) {
    questions.push({
      question: `"${lesson.title}" is part of the ${syllabus.title} syllabus.`,
      type: "TRUE_FALSE",
      correctAnswer: "True",
      points: 1,
    });
  }

  if (syllabus.description) {
    questions.push({
      question: `Briefly describe one key learning outcome from ${syllabus.title}.`,
      type: "SHORT_ANSWER",
      correctAnswer: syllabus.title,
      points: 3,
    });
  }

  return questions.slice(0, 10);
}

function parseOptionsField(options: unknown): string[] | undefined {
  if (!options) return undefined;
  if (Array.isArray(options)) {
    return options.filter((o): o is string => typeof o === "string" && o.trim().length > 0);
  }
  if (typeof options === "object") {
    const record = options as Record<string, string>;
    return ["A", "B", "C", "D"]
      .map((key) => record[key])
      .filter((v): v is string => typeof v === "string" && v.trim().length > 0);
  }
  return undefined;
}

function resolveCorrectAnswer(correctAnswer: string, options?: string[]): string {
  if (!options?.length) return correctAnswer;
  const letter = correctAnswer.trim().toUpperCase();
  const index = { A: 0, B: 1, C: 2, D: 3 }[letter];
  if (index !== undefined && options[index]) return options[index];
  return correctAnswer;
}

function normalizeQuestionType(raw: string | undefined): GeneratedQuestion["type"] {
  const t = (raw ?? "MULTIPLE_CHOICE").toUpperCase();
  if (t === "MCQ" || t === "SCENARIO_MCQ") return "MULTIPLE_CHOICE";
  if (t === "TRUE_FALSE") return "TRUE_FALSE";
  if (t === "CODE" || t === "CODING_TASK" || t === "DEBUGGING_TASK") return "CODE";
  if (t === "SHORT_ANSWER" || t === "OUTPUT_PREDICTION") return "SHORT_ANSWER";
  return "MULTIPLE_CHOICE";
}

function normalizeGeneratedQuestion(raw: Record<string, unknown>): GeneratedQuestion | null {
  const question = typeof raw.question === "string" ? raw.question : "";
  if (!question) return null;

  const options = parseOptionsField(raw.options);
  const correctRaw =
    typeof raw.correctAnswer === "string"
      ? raw.correctAnswer
      : typeof raw.correct_answer === "string"
        ? raw.correct_answer
        : "";
  if (!correctRaw) return null;

  const type = normalizeQuestionType(
    typeof raw.type === "string"
      ? raw.type
      : typeof raw.questionType === "string"
        ? raw.questionType
        : undefined
  );

  return {
    question,
    type,
    options: type === "MULTIPLE_CHOICE" ? options : undefined,
    correctAnswer: resolveCorrectAnswer(correctRaw, options),
    codeTemplate: typeof raw.codeTemplate === "string" ? raw.codeTemplate : undefined,
    points: typeof raw.points === "number" && raw.points > 0 ? raw.points : 1,
  };
}

function extractQuestionArrayFromLlmJson(parsed: unknown): Record<string, unknown>[] {
  if (Array.isArray(parsed)) {
    return parsed.filter((q): q is Record<string, unknown> => !!q && typeof q === "object");
  }
  if (parsed && typeof parsed === "object") {
    const obj = parsed as Record<string, unknown>;
    if (Array.isArray(obj.questions)) {
      return obj.questions.filter((q): q is Record<string, unknown> => !!q && typeof q === "object");
    }
    if (Array.isArray(obj.moduleExams)) {
      const first = obj.moduleExams[0];
      if (first && typeof first === "object" && Array.isArray((first as { questions?: unknown }).questions)) {
        return (first as { questions: unknown[] }).questions.filter(
          (q): q is Record<string, unknown> => !!q && typeof q === "object"
        );
      }
    }
  }
  return [];
}

function parseLlmQuestions(raw: string, maxCount = MODULE_QUIZ_QUESTION_COUNT): GeneratedQuestion[] {
  const jsonMatch = raw.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
  if (!jsonMatch) return [];

  try {
    const parsed = JSON.parse(jsonMatch[0]) as unknown;
    const rows = extractQuestionArrayFromLlmJson(parsed);
    return rows
      .map(normalizeGeneratedQuestion)
      .filter((q): q is GeneratedQuestion => !!q)
      .slice(0, maxCount);
  } catch {
    return [];
  }
}

function buildModuleFallbackQuestions(
  moduleTitle: string,
  courseTitle: string,
  lessons: SyllabusLesson[],
  targetCount = MODULE_QUIZ_QUESTION_COUNT
): GeneratedQuestion[] {
  const topics = lessons.length
    ? lessons.map((l) => l.title)
    : [moduleTitle, `${moduleTitle} overview`, `${moduleTitle} practice`];

  const difficulties = [
    ...Array(5).fill("medium"),
    ...Array(5).fill("easy"),
    ...Array(5).fill("moderately_tough"),
  ] as const;

  const questions: GeneratedQuestion[] = [];

  for (let i = 0; i < targetCount; i++) {
    const topic = topics[i % topics.length];
    const distractors = topics.filter((t) => t !== topic).slice(0, 3);
    while (distractors.length < 3) {
      distractors.push(`Unrelated topic ${distractors.length + 1}`);
    }
    const options = shuffle([topic, ...distractors.slice(0, 3)]);

    questions.push({
      question: `[${difficulties[i]}] Which topic is covered in "${moduleTitle}" (${courseTitle})? Reference: ${topic}.`,
      type: "MULTIPLE_CHOICE",
      options,
      correctAnswer: topic,
      points: 1,
    });
  }

  return questions;
}

function buildFallbackCodingQuestions(courseTitle: string, modules: string[]): GeneratedQuestion[] {
  const moduleList = modules.slice(0, 5).join(", ");
  return [
    {
      question: `Write a function that returns the sum of a list of numbers. This tests fundamentals from ${courseTitle} (${moduleList}).`,
      type: "CODE",
      correctAnswer: "sum",
      codeTemplate: "def total(nums):\n    # your code here\n    pass",
      points: 5,
    },
    {
      question: `Implement a function to check if a string is a palindrome.`,
      type: "CODE",
      correctAnswer: "palindrome",
      codeTemplate: "def is_palindrome(s):\n    # your code here\n    pass",
      points: 5,
    },
  ];
}

async function generateQuestionsFromSyllabus(
  syllabus: CourseSyllabus,
  questionCount = 8,
  prompts?: { system: string; user: string }
): Promise<{ questions: GeneratedQuestion[]; aiPowered: boolean }> {
  const syllabusText = JSON.stringify(
    {
      course: syllabus.title,
      description: syllabus.description,
      modules: syllabus.modules.map((m) => ({
        module: m.title,
        lessons: m.lessons.map((l) => ({
          title: l.title,
          type: l.type,
          content: l.content ?? undefined,
        })),
      })),
    },
    null,
    2
  );

  const systemPrompt =
    prompts?.system ??
    `You generate quiz questions strictly from the provided course syllabus.
Each item must have: question (string), type ("MULTIPLE_CHOICE"|"TRUE_FALSE"|"SHORT_ANSWER"),
options (string array, required for MULTIPLE_CHOICE), correctAnswer (string), points (number 1-3).
Do not include topics outside the syllabus.`;

  const userPrompt =
    prompts?.user ?? `Generate ${questionCount} quiz questions for this syllabus:\n${syllabusText}`;

  const { questions: generated, aiPowered } = await generateAssessmentQuestions(
    systemPrompt,
    userPrompt
  );

  if (generated.length >= Math.min(3, questionCount)) {
    const parsed = generated.slice(0, questionCount).map((q) => ({
      question: q.question,
      type: q.type as GeneratedQuestion["type"],
      options: q.options,
      correctAnswer: q.correctAnswer,
      codeTemplate: q.codeTemplate,
      points: q.points ?? 1,
    }));
    return { questions: parsed, aiPowered };
  }

  if (syllabus.modules.length === 1 && syllabus.modules[0].lessons.length >= 0) {
    return {
      questions: buildModuleFallbackQuestions(
        syllabus.modules[0].title,
        syllabus.title.split(" — ")[0] ?? syllabus.title,
        syllabus.modules[0].lessons,
        questionCount
      ),
      aiPowered: false,
    };
  }

  return { questions: buildFallbackQuestions(syllabus).slice(0, questionCount), aiPowered: false };
}

async function fetchModuleSyllabus(moduleId: string): Promise<{
  moduleId: string;
  moduleTitle: string;
  courseId: string;
  courseTitle: string;
  description: string | null;
  lessons: SyllabusLesson[];
} | null> {
  const module = await prisma.courseModule.findFirst({
    where: { id: moduleId, deletedAt: null },
    select: {
      id: true,
      title: true,
      course: {
        select: {
          id: true,
          title: true,
          description: true,
        },
      },
      lessons: {
        where: { deletedAt: null, type: { not: "QUIZ" } },
        orderBy: { sortOrder: "asc" },
        select: { title: true, type: true, content: true },
      },
    },
  });

  if (!module) return null;

  return {
    moduleId: module.id,
    moduleTitle: module.title,
    courseId: module.course.id,
    courseTitle: module.course.title,
    description: module.course.description,
    lessons: module.lessons.map((lesson) => ({
      title: lesson.title,
      type: lesson.type,
      moduleTitle: module.title,
      content: lesson.content?.slice(0, 500) ?? null,
    })),
  };
}

async function ensureModuleAssessmentRecord(
  moduleId: string,
  actorId: string
): Promise<{ id: string; title: string; courseId: string; moduleTitle: string }> {
  const module = await prisma.courseModule.findFirst({
    where: { id: moduleId, deletedAt: null },
    include: {
      assessment: { select: { id: true, title: true } },
      course: { select: { id: true, title: true } },
    },
  });

  if (!module) throw new AppError("NOT_FOUND", "Module not found");

  if (module.assessment) {
    return {
      id: module.assessment.id,
      title: module.assessment.title,
      courseId: module.course.id,
      moduleTitle: module.title,
    };
  }

  const assessment = await prisma.assessment.create({
    data: {
      title: `${module.course.title} — ${module.title} Quiz`,
      description: `Module checkpoint quiz for "${module.title}" in ${module.course.title}.`,
      courseId: module.course.id,
      type: "QUIZ",
      passingScore: MODULE_PASSING_SCORE,
      maxRetakes: 3,
      allowRetakes: true,
      isPublished: true,
    },
    select: { id: true, title: true },
  });

  await prisma.courseModule.update({
    where: { id: moduleId },
    data: { assessmentId: assessment.id },
  });

  await auditService.log({
    action: "CREATE",
    entityType: "Assessment",
    entityId: assessment.id,
    actorId,
    metadata: { courseId: module.course.id, moduleId, source: "module_quiz_setup" },
  });

  return {
    id: assessment.id,
    title: assessment.title,
    courseId: module.course.id,
    moduleTitle: module.title,
  };
}

async function mapModuleAssessmentStatus(
  module: {
    id: string;
    title: string;
    sortOrder: number;
    requireQuizPass: boolean;
    assessment: {
      id: string;
      title: string;
      isPublished: boolean;
      _count: { questions: number };
    } | null;
  }
): Promise<ModuleAssessmentStatus> {
  return {
    moduleId: module.id,
    moduleTitle: module.title,
    sortOrder: module.sortOrder,
    assessmentId: module.assessment?.id ?? null,
    assessmentTitle: module.assessment?.title ?? null,
    questionCount: module.assessment?._count.questions ?? 0,
    isPublished: module.assessment?.isPublished ?? false,
    requireQuizPass: module.requireQuizPass,
  };
}

async function resolveAssessmentForCourse(
  courseId: string,
  assessmentId?: string,
  options?: { requirePublished?: boolean }
) {
  if (assessmentId) {
    const assessment = await prisma.assessment.findFirst({
      where: { id: assessmentId, deletedAt: null },
      select: { id: true, title: true, courseId: true, isPublished: true },
    });
    if (!assessment) {
      throw new AppError("NOT_FOUND", "Assessment not found");
    }

    const linkedViaLesson = await prisma.lesson.findFirst({
      where: {
        assessmentId: assessment.id,
        deletedAt: null,
        module: { courseId, deletedAt: null },
      },
      select: { id: true },
    });

    if (assessment.courseId !== courseId && !linkedViaLesson) {
      throw new AppError("BAD_REQUEST", "Assessment is not linked to this course");
    }

    if (options?.requirePublished && !assessment.isPublished) {
      throw new AppError("NOT_FOUND", "No published assessment linked to this course");
    }

    return assessment;
  }

  const assessment = await prisma.assessment.findFirst({
    where: {
      courseId,
      deletedAt: null,
      ...(options?.requirePublished ? { isPublished: true } : {}),
    },
    orderBy: { updatedAt: "desc" },
    select: { id: true, title: true, courseId: true, isPublished: true },
  });

  if (!assessment) {
    throw new AppError(
      "NOT_FOUND",
      "No assessment linked to this course. Link an assessment in the Assessments tab or assign one to a quiz lesson."
    );
  }

  return assessment;
}

async function persistGeneratedQuestions(
  assessmentId: string,
  courseId: string,
  actorId: string,
  questions: GeneratedQuestion[],
  replaceExisting: boolean,
  source: string
) {
  if (replaceExisting) {
    await prisma.assessmentQuestion.updateMany({
      where: { assessmentId, deletedAt: null },
      data: { deletedAt: new Date() },
    });
  }

  for (const q of questions) {
    await assessmentRepository.createQuestionDirect(assessmentId, {
      question: q.question,
      type: q.type,
      options: q.options,
      correctAnswer: q.correctAnswer,
      codeTemplate: q.codeTemplate,
      points: q.points,
    });
  }

  await auditService.log({
    action: "CREATE",
    entityType: "AssessmentQuestion",
    entityId: assessmentId,
    actorId,
    metadata: {
      courseId,
      source,
      questionCount: questions.length,
    },
  });
}

export const courseQuizGeneratorService = {
  async getLinkedAssessments(courseId: string): Promise<CourseLinkedAssessment[]> {
    const course = await prisma.course.findFirst({
      where: { id: courseId, deletedAt: null },
      select: { id: true },
    });
    if (!course) throw new AppError("NOT_FOUND", "Course not found");

    const [directAssessments, lessonLinks] = await Promise.all([
      prisma.assessment.findMany({
        where: { courseId, deletedAt: null },
        select: {
          id: true,
          title: true,
          isPublished: true,
          _count: { select: { questions: { where: { deletedAt: null } } } },
        },
        orderBy: { updatedAt: "desc" },
      }),
      prisma.lesson.findMany({
        where: {
          deletedAt: null,
          assessmentId: { not: null },
          module: { courseId, deletedAt: null },
        },
        select: {
          title: true,
          assessment: {
            select: {
              id: true,
              title: true,
              isPublished: true,
              _count: { select: { questions: { where: { deletedAt: null } } } },
            },
          },
        },
      }),
    ]);

    const map = new Map<string, CourseLinkedAssessment>();

    for (const assessment of directAssessments) {
      map.set(assessment.id, {
        id: assessment.id,
        title: assessment.title,
        isPublished: assessment.isPublished,
        questionCount: assessment._count.questions,
        linkType: "course",
      });
    }

    for (const lesson of lessonLinks) {
      if (!lesson.assessment) continue;
      const existing = map.get(lesson.assessment.id);
      map.set(lesson.assessment.id, {
        id: lesson.assessment.id,
        title: lesson.assessment.title,
        isPublished: lesson.assessment.isPublished,
        questionCount: lesson.assessment._count.questions,
        linkType: existing?.linkType ?? "lesson",
        lessonTitle: lesson.title,
      });
    }

    return [...map.values()];
  },

  async generateForCourseAdmin(
    courseId: string,
    actorId: string,
    options?: { assessmentId?: string; force?: boolean; questionCount?: number }
  ): Promise<GenerateCourseAssessmentQuestionsResult> {
    const assessment = await resolveAssessmentForCourse(courseId, options?.assessmentId);

    const questionCount = await prisma.assessmentQuestion.count({
      where: { assessmentId: assessment.id, deletedAt: null },
    });

    if (questionCount > 0 && !options?.force) {
      return {
        assessmentId: assessment.id,
        assessmentTitle: assessment.title,
        questionCount,
        generated: false,
        aiPowered: isLlmEnabled(),
      };
    }

    const syllabus = await fetchCourseSyllabus(courseId);
    if (!syllabus) throw new AppError("NOT_FOUND", "Course not found");

    const targetCount = options?.questionCount ?? 8;
    const { questions, aiPowered } = await generateQuestionsFromSyllabus(syllabus, targetCount);
    if (!questions.length) {
      throw new AppError("BAD_REQUEST", "Could not generate questions from course syllabus");
    }

    await persistGeneratedQuestions(
      assessment.id,
      courseId,
      actorId,
      questions,
      Boolean(options?.force && questionCount > 0),
      "course_admin_ai_generator"
    );

    return {
      assessmentId: assessment.id,
      assessmentTitle: assessment.title,
      questionCount: questions.length,
      generated: true,
      aiPowered,
    };
  },
  async generateForCourse(
    courseId: string,
    actorId: string,
    options?: { force?: boolean }
  ): Promise<{ assessmentId: string; questionCount: number; generated: boolean }> {
    const assessment = await resolveAssessmentForCourse(courseId, undefined, {
      requirePublished: true,
    });

    const questionCount = await prisma.assessmentQuestion.count({
      where: { assessmentId: assessment.id, deletedAt: null },
    });

    if (questionCount > 0 && !options?.force) {
      return { assessmentId: assessment.id, questionCount, generated: false };
    }

    const syllabus = await fetchCourseSyllabus(courseId);
    if (!syllabus) throw new AppError("NOT_FOUND", "Course not found");

    const { questions } = await generateQuestionsFromSyllabus(syllabus);
    if (!questions.length) {
      throw new AppError("BAD_REQUEST", "Could not generate questions from course syllabus");
    }

    await persistGeneratedQuestions(
      assessment.id,
      courseId,
      actorId,
      questions,
      Boolean(options?.force && questionCount > 0),
      "syllabus_quiz_generator"
    );

    return {
      assessmentId: assessment.id,
      questionCount: questions.length,
      generated: true,
    };
  },

  async ensureQuizAfterCourseCompletion(userId: string, courseId: string) {
    try {
      return await this.generateForCourse(courseId, userId);
    } catch (error) {
      console.error("[course-quiz-generator] Failed to generate quiz", { courseId, userId, error });
      return null;
    }
  },

  async getModuleAssessments(courseId: string): Promise<ModuleAssessmentStatus[]> {
    const course = await prisma.course.findFirst({
      where: { id: courseId, deletedAt: null },
      select: { id: true },
    });
    if (!course) throw new AppError("NOT_FOUND", "Course not found");

    const modules = await prisma.courseModule.findMany({
      where: { courseId, deletedAt: null },
      orderBy: { sortOrder: "asc" },
      select: {
        id: true,
        title: true,
        sortOrder: true,
        requireQuizPass: true,
        assessment: {
          select: {
            id: true,
            title: true,
            isPublished: true,
            _count: { select: { questions: { where: { deletedAt: null } } } },
          },
        },
      },
    });

    return Promise.all(modules.map(mapModuleAssessmentStatus));
  },

  async setupModuleAssessments(courseId: string, actorId: string): Promise<SetupModuleAssessmentsResult> {
    const modules = await prisma.courseModule.findMany({
      where: { courseId, deletedAt: null },
      orderBy: { sortOrder: "asc" },
      select: { id: true, assessmentId: true },
    });

    if (!modules.length) {
      throw new AppError("BAD_REQUEST", "Course has no modules. Add modules in Course Builder first.");
    }

    let created = 0;
    let skipped = 0;

    for (const mod of modules) {
      if (mod.assessmentId) {
        skipped++;
        continue;
      }
      await ensureModuleAssessmentRecord(mod.id, actorId);
      created++;
    }

    const statuses = await this.getModuleAssessments(courseId);
    return { created, skipped, modules: statuses };
  },

  async generateForModule(
    moduleId: string,
    actorId: string,
    options?: { force?: boolean; questionCount?: number }
  ): Promise<GenerateModuleAssessmentQuestionsResult> {
    const assessment = await ensureModuleAssessmentRecord(moduleId, actorId);
    const syllabus = await fetchModuleSyllabus(moduleId);
    if (!syllabus) throw new AppError("NOT_FOUND", "Module not found");

    const questionCount = await prisma.assessmentQuestion.count({
      where: { assessmentId: assessment.id, deletedAt: null },
    });

    const targetCount = options?.questionCount ?? MODULE_QUIZ_QUESTION_COUNT;

    if (questionCount > 0 && !options?.force && questionCount >= targetCount) {
      return {
        moduleId,
        moduleTitle: assessment.moduleTitle,
        assessmentId: assessment.id,
        assessmentTitle: assessment.title,
        questionCount,
        generated: false,
        aiPowered: isLlmEnabled(),
      };
    }

    const moduleSyllabus: CourseSyllabus = {
      courseId: syllabus.courseId,
      title: `${syllabus.courseTitle} — ${syllabus.moduleTitle}`,
      description: syllabus.description,
      modules: [{ title: syllabus.moduleTitle, lessons: syllabus.lessons }],
    };

    if (!syllabus.lessons.length) {
      moduleSyllabus.modules[0].lessons.push({
        title: syllabus.moduleTitle,
        type: "VIDEO",
        moduleTitle: syllabus.moduleTitle,
      });
    }

    const syllabusJson = JSON.stringify(
      {
        module: syllabus.moduleTitle,
        lessons: syllabus.lessons.map((l) => ({
          title: l.title,
          type: l.type,
          content: l.content ?? undefined,
        })),
      },
      null,
      2
    );
    const modulePrompts = {
      system: MODULE_QUIZ_SYSTEM_PROMPT,
      user: fillPromptTemplate(MODULE_QUIZ_USER_PROMPT_TEMPLATE, {
        questionCount: targetCount,
        passingCount: MODULE_EXAM_PASSING_COUNT,
        moduleTitle: syllabus.moduleTitle,
        courseTitle: syllabus.courseTitle,
        syllabusJson,
      }),
    };
    const { questions, aiPowered } = await generateQuestionsFromSyllabus(
      moduleSyllabus,
      targetCount,
      modulePrompts
    );
    if (!questions.length) {
      throw new AppError("BAD_REQUEST", "Could not generate questions from module content");
    }

    await persistGeneratedQuestions(
      assessment.id,
      syllabus.courseId,
      actorId,
      questions,
      questionCount > 0 || Boolean(options?.force),
      "module_quiz_generator"
    );

    await prisma.assessment.update({
      where: { id: assessment.id },
      data: { passingScore: MODULE_PASSING_SCORE },
    });

    return {
      moduleId,
      moduleTitle: assessment.moduleTitle,
      assessmentId: assessment.id,
      assessmentTitle: assessment.title,
      questionCount: questions.length,
      generated: true,
      aiPowered,
    };
  },

  async generateAllModuleAssessments(
    courseId: string,
    actorId: string,
    options?: { force?: boolean; questionCount?: number; setupMissing?: boolean }
  ) {
    if (options?.setupMissing !== false) {
      await this.setupModuleAssessments(courseId, actorId);
    }

    const modules = await prisma.courseModule.findMany({
      where: { courseId, deletedAt: null },
      orderBy: { sortOrder: "asc" },
      select: { id: true, title: true },
    });

    const results: GenerateModuleAssessmentQuestionsResult[] = [];
    for (const mod of modules) {
      const result = await this.generateForModule(mod.id, actorId, {
        force: options?.force,
        questionCount: options?.questionCount,
      });
      results.push(result);
    }

    return {
      generatedCount: results.filter((r) => r.generated).length,
      skippedCount: results.filter((r) => !r.generated).length,
      results,
    };
  },

  async ensureModuleAssessmentLink(moduleId: string, actorId: string) {
    return ensureModuleAssessmentRecord(moduleId, actorId);
  },

  async ensureModuleQuiz(moduleId: string, userId: string) {
    return this.generateForModule(moduleId, userId);
  },

  async generateCodingRound(
    courseId: string,
    userId: string,
    options?: { force?: boolean; questionCount?: number }
  ) {
    const levelPath = await prisma.skillLevelPath.findFirst({
      where: { courseId, deletedAt: null, assessmentId: { not: null } },
      select: {
        assessment: {
          select: { id: true, title: true, passingScore: true },
        },
        course: { select: { id: true, title: true, description: true } },
      },
    });

    if (!levelPath?.assessment || !levelPath.course) {
      throw new AppError("NOT_FOUND", "No coding round assessment linked to this course");
    }

    const assessment = levelPath.assessment;
    const courseTitle = levelPath.course.title;
    const questionCount = await prisma.assessmentQuestion.count({
      where: { assessmentId: assessment.id, deletedAt: null },
    });

    if (questionCount > 0 && !options?.force) {
      return {
        assessmentId: assessment.id,
        assessmentTitle: assessment.title,
        questionCount,
        generated: false,
        aiPowered: isLlmEnabled(),
      };
    }

    const modules = await prisma.courseModule.findMany({
      where: { courseId, deletedAt: null },
      orderBy: { sortOrder: "asc" },
      select: { title: true },
    });

    const modulesSummary = modules.map((m, i) => `${i + 1}. ${m.title}`).join("\n");
    const targetCount = options?.questionCount ?? CODING_ROUND_QUESTION_COUNT;

    const userPrompt = fillPromptTemplate(CODING_ROUND_USER_PROMPT_TEMPLATE, {
      questionCount: targetCount,
      passingCount: CODING_ROUND_PASSING_COUNT,
      courseTitle,
      modulesSummary: modulesSummary || courseTitle,
    });

    const llmResult = await queryLlm(CODING_ROUND_SYSTEM_PROMPT, userPrompt);
    let questions: GeneratedQuestion[] = [];

    if (llmResult) {
      questions = parseLlmQuestions(llmResult).filter((q) => q.type === "CODE");
    }

    if (questions.length < 2) {
      questions = buildFallbackCodingQuestions(
        courseTitle,
        modules.map((m) => m.title)
      );
    }

    await persistGeneratedQuestions(
      assessment.id,
      courseId,
      userId,
      questions.slice(0, targetCount),
      Boolean(options?.force && questionCount > 0),
      "coding_round_generator"
    );

    return {
      assessmentId: assessment.id,
      assessmentTitle: assessment.title,
      questionCount: Math.min(questions.length, targetCount),
      generated: true,
      aiPowered: !!llmResult,
    };
  },

  async ensureCodingRound(courseId: string, userId: string) {
    return this.generateCodingRound(courseId, userId);
  },
};
