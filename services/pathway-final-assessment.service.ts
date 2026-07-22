import { prisma } from "@/lib/db/prisma";
import { AppError } from "@/lib/errors/app-error";
import { isLlmEnabled } from "@/lib/ai/llm-client";
import { generateAssessmentQuestions } from "@/lib/ai/generate-assessment-questions";
import {
  PATHWAY_FINAL_ASSESSMENT_SYSTEM_PROMPT,
  PATHWAY_FINAL_MAX_RETAKES,
  PATHWAY_FINAL_PASSING_SCORE,
  PATHWAY_FINAL_TIER_QUESTION_PLAN,
  pathwayFinalAssessmentDescription,
  pathwayFinalAssessmentUserPrompt,
  pathwayLevelContentObjectId,
} from "@/constants/pathway-final-assessment";
import {
  getPathwayLevelDefinitions,
  PATHWAY_LEVEL_TIER_ORDER,
  type PathwayLevelTier,
} from "@/constants/roadmap-pathway-levels";
import { getPathwayDefinition } from "@/constants/roadmap-pathway";
import { assessmentRepository } from "@/repositories/assessment.repository";
import { auditService } from "@/services/audit.service";
import { lrsService } from "@/services/lrs.service";

interface TierSyllabus {
  tier: PathwayLevelTier;
  tierLabel: string;
  courseSlug: string;
  courseTitle: string;
  modules: { title: string; lessons: { title: string; content?: string | null }[] }[];
}

interface GeneratedQuestion {
  question: string;
  type: "MULTIPLE_CHOICE" | "CODE";
  options?: string[];
  correctAnswer: string;
  codeTemplate?: string;
  points: number;
}

function parseOptionsField(value: unknown): string[] | undefined {
  if (Array.isArray(value)) return value as string[];
  if (value && typeof value === "object") {
    return Object.values(value as Record<string, string>);
  }
  return undefined;
}

function parseLlmQuestions(raw: string): GeneratedQuestion[] {
  const jsonMatch = raw.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
  if (!jsonMatch) return [];

  try {
    const parsed = JSON.parse(jsonMatch[0]) as unknown;
    const rows = Array.isArray(parsed) ? parsed : [];
    const questions: GeneratedQuestion[] = [];

    for (const item of rows) {
      if (!item || typeof item !== "object") continue;
      const rawItem = item as Record<string, unknown>;
      const question = typeof rawItem.question === "string" ? rawItem.question : "";
      const correctAnswer =
        typeof rawItem.correctAnswer === "string" ? rawItem.correctAnswer : "";
      if (!question || !correctAnswer) continue;

      const typeRaw =
        typeof rawItem.type === "string" ? rawItem.type.toUpperCase() : "MULTIPLE_CHOICE";
      const type: GeneratedQuestion["type"] = typeRaw === "CODE" ? "CODE" : "MULTIPLE_CHOICE";

      questions.push({
        question,
        type,
        options: type === "MULTIPLE_CHOICE" ? parseOptionsField(rawItem.options) : undefined,
        correctAnswer,
        codeTemplate:
          typeof rawItem.codeTemplate === "string" ? rawItem.codeTemplate : undefined,
        points:
          typeof rawItem.points === "number" && rawItem.points > 0
            ? rawItem.points
            : type === "CODE"
              ? 2
              : 1,
      });
    }

    return questions;
  } catch {
    return [];
  }
}

function buildTierFallbackQuestions(
  tierLabel: string,
  courseTitle: string,
  modules: TierSyllabus["modules"],
  mcqCount: number,
  codeCount: number
): GeneratedQuestion[] {
  const topics = modules.flatMap((module) =>
    module.lessons.length
      ? module.lessons.map((lesson) => lesson.title)
      : [module.title]
  );
  const pool = topics.length ? topics : [`${tierLabel} concepts`, `${courseTitle} fundamentals`];
  const questions: GeneratedQuestion[] = [];

  for (let i = 0; i < mcqCount; i++) {
    const topic = pool[i % pool.length]!;
    const distractors = pool.filter((t) => t !== topic).slice(0, 3);
    while (distractors.length < 3) distractors.push(`Option ${distractors.length + 1}`);
    questions.push({
      question: `[${tierLabel}] Which statement best describes "${topic}" in ${courseTitle}?`,
      type: "MULTIPLE_CHOICE",
      options: [topic, ...distractors.slice(0, 3)],
      correctAnswer: topic,
      points: 1,
    });
  }

  for (let i = 0; i < codeCount; i++) {
    const topic = pool[i % pool.length]!;
    questions.push({
      question: `[${tierLabel}] Write code to demonstrate understanding of "${topic}".`,
      type: "CODE",
      codeTemplate: `// ${topic}\nfunction solution() {\n  // your code\n}`,
      correctAnswer: `Working implementation covering ${topic}`,
      points: 2,
    });
  }

  return questions;
}

async function fetchTierSyllabus(
  levelDefs: ReturnType<typeof getPathwayLevelDefinitions>,
  courseIdBySlug: Map<string, string>,
  courseTitle: string
): Promise<TierSyllabus[]> {
  const result: TierSyllabus[] = [];

  for (const level of levelDefs) {
    const courseId = courseIdBySlug.get(level.courseSlug);
    let modules: TierSyllabus["modules"] = [];

    if (courseId) {
      const dbModules = await prisma.courseModule.findMany({
        where: { courseId, deletedAt: null },
        orderBy: { sortOrder: "asc" },
        select: {
          title: true,
          lessons: {
            where: { deletedAt: null },
            orderBy: { sortOrder: "asc" },
            select: { title: true, content: true },
          },
        },
      });

      if (dbModules.length) {
        modules = dbModules.map((module) => ({
          title: module.title,
          lessons: module.lessons.map((lesson) => ({
            title: lesson.title,
            content: lesson.content,
          })),
        }));
      }
    }

    if (!modules.length) {
      modules = level.conceptTitles.map((title) => ({
        title,
        lessons: [{ title, content: `Study "${title}" on the provider platform.` }],
      }));
    }

    result.push({
      tier: level.tier,
      tierLabel: level.name,
      courseSlug: level.courseSlug,
      courseTitle,
      modules,
    });
  }

  return result;
}

async function persistQuestions(assessmentId: string, courseId: string, userId: string, questions: GeneratedQuestion[]) {
  await prisma.assessmentQuestion.updateMany({
    where: { assessmentId, deletedAt: null },
    data: { deletedAt: new Date() },
  });

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
    actorId: userId,
    metadata: { courseId, source: "pathway_final_assessment", questionCount: questions.length },
  });
}

async function ensureAssessmentRecord(pathwaySlug: string, courseId: string, courseTitle: string) {
  const marker = pathwayFinalAssessmentDescription(pathwaySlug);
  const existing = await prisma.assessment.findFirst({
    where: { courseId, description: marker, deletedAt: null },
    select: { id: true, title: true },
  });

  if (existing) return existing;

  return prisma.assessment.create({
    data: {
      title: `${courseTitle} — Final Evaluation`,
      description: marker,
      courseId,
      type: "QUIZ",
      passingScore: PATHWAY_FINAL_PASSING_SCORE,
      maxRetakes: PATHWAY_FINAL_MAX_RETAKES,
      allowRetakes: true,
      shuffleQuestions: false,
      isPublished: true,
    },
    select: { id: true, title: true },
  });
}

export const pathwayFinalAssessmentService = {
  async getCompletedContentTiers(userId: string, pathwaySlug: string): Promise<Set<PathwayLevelTier>> {
    const events = await prisma.learningEvent.findMany({
      where: { userId, verb: "COMPLETED", deletedAt: null },
      select: { object: true },
    });

    const prefix = `pathway-level:${pathwaySlug}:`;
    const tiers = new Set<PathwayLevelTier>();

    for (const event of events) {
      const obj = event.object as { id?: string } | null;
      const id = obj?.id;
      if (!id?.startsWith(prefix)) continue;
      const tier = id.slice(prefix.length) as PathwayLevelTier;
      if (PATHWAY_LEVEL_TIER_ORDER.includes(tier)) tiers.add(tier);
    }

    return tiers;
  },

  async markLevelContentComplete(userId: string, pathwaySlug: string, tier: PathwayLevelTier) {
    const definition = getPathwayDefinition(pathwaySlug);
    if (!definition) throw new AppError("NOT_FOUND", "Pathway course not found");

    const levelDefs = getPathwayLevelDefinitions(pathwaySlug);
    const levelIndex = levelDefs.findIndex((level) => level.tier === tier);
    if (levelIndex === -1) throw new AppError("NOT_FOUND", "Level not found");

    const completed = await this.getCompletedContentTiers(userId, pathwaySlug);
    if (levelIndex > 0) {
      const prevTier = levelDefs[levelIndex - 1]!.tier;
      if (!completed.has(prevTier)) {
        throw new AppError("FORBIDDEN", "Complete the previous level's content first.");
      }
    }

    if (completed.has(tier)) {
      return { tier, alreadyComplete: true };
    }

    const objectId = pathwayLevelContentObjectId(pathwaySlug, tier);
    await lrsService.recordEvent({
      userId,
      verb: "COMPLETED",
      objectId,
      objectName: `${definition.title} — ${tier} content`,
      objectType: "PathwayLevel",
    });

    return { tier, alreadyComplete: false };
  },

  async hasPassedFinalAssessment(userId: string, assessmentId: string | null): Promise<boolean> {
    if (!assessmentId) return false;

    const attempt = await prisma.assessmentAttempt.findFirst({
      where: { userId, assessmentId, status: "PASSED", deletedAt: null },
      select: { id: true },
    });

    return Boolean(attempt);
  },

  async getFinalAssessmentMeta(pathwaySlug: string, primaryCourseId: string | null) {
    if (!primaryCourseId) return null;

    const marker = pathwayFinalAssessmentDescription(pathwaySlug);
    const assessment = await prisma.assessment.findFirst({
      where: { courseId: primaryCourseId, description: marker, deletedAt: null },
      select: {
        id: true,
        title: true,
        passingScore: true,
        _count: { select: { questions: { where: { deletedAt: null } } } },
      },
    });

    return assessment;
  },

  async ensureFinalAssessment(userId: string, pathwaySlug: string, primaryCourseId: string) {
    const definition = getPathwayDefinition(pathwaySlug);
    if (!definition) throw new AppError("NOT_FOUND", "Pathway course not found");

    const levelDefs = getPathwayLevelDefinitions(pathwaySlug);
    const courseSlugs = levelDefs.map((level) => level.courseSlug);
    const dbCourses = await prisma.course.findMany({
      where: { slug: { in: courseSlugs }, deletedAt: null },
      select: { id: true, slug: true, title: true },
    });
    const courseIdBySlug = new Map(dbCourses.map((course) => [course.slug, course.id]));

    const assessment = await ensureAssessmentRecord(pathwaySlug, primaryCourseId, definition.title);

    const existingCount = await prisma.assessmentQuestion.count({
      where: { assessmentId: assessment.id, deletedAt: null },
    });

    if (existingCount > 0) {
      return {
        assessmentId: assessment.id,
        assessmentTitle: assessment.title,
        questionCount: existingCount,
        generated: false,
        aiPowered: isLlmEnabled(),
      };
    }

    const tierSyllabi = await fetchTierSyllabus(levelDefs, courseIdBySlug, definition.title);
    const allQuestions: GeneratedQuestion[] = [];

    for (const tierSyllabus of tierSyllabi) {
      const plan = PATHWAY_FINAL_TIER_QUESTION_PLAN[tierSyllabus.tier];
      const syllabusJson = JSON.stringify(
        {
          tier: tierSyllabus.tierLabel,
          modules: tierSyllabus.modules,
        },
        null,
        2
      );

      const userPrompt = pathwayFinalAssessmentUserPrompt(
        tierSyllabus.tierLabel,
        definition.title,
        plan.mcq,
        plan.code,
        syllabusJson
      );

      const { questions: generated } = await generateAssessmentQuestions(
        PATHWAY_FINAL_ASSESSMENT_SYSTEM_PROMPT,
        userPrompt
      );

      let tierQuestions: GeneratedQuestion[] = generated
        .filter((q) => q.type === "MULTIPLE_CHOICE" || q.type === "CODE")
        .map((q) => ({
          question: q.question,
          type: q.type as GeneratedQuestion["type"],
          options: q.options,
          correctAnswer: q.correctAnswer,
          codeTemplate: q.codeTemplate,
          points: q.points ?? (q.type === "CODE" ? 2 : 1),
        }));

      const needed = plan.mcq + plan.code;
      if (tierQuestions.length < needed) {
        tierQuestions = buildTierFallbackQuestions(
          tierSyllabus.tierLabel,
          definition.title,
          tierSyllabus.modules,
          plan.mcq,
          plan.code
        );
      }

      const mcqs = tierQuestions.filter((q) => q.type === "MULTIPLE_CHOICE").slice(0, plan.mcq);
      const codes = tierQuestions.filter((q) => q.type === "CODE").slice(0, plan.code);
      allQuestions.push(...mcqs, ...codes);
    }

    if (!allQuestions.length) {
      throw new AppError("BAD_REQUEST", "Could not generate final assessment questions.");
    }

    await persistQuestions(assessment.id, primaryCourseId, userId, allQuestions);

    return {
      assessmentId: assessment.id,
      assessmentTitle: assessment.title,
      questionCount: allQuestions.length,
      generated: true,
      aiPowered: Boolean(isLlmEnabled()),
    };
  },
};
