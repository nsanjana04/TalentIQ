import { AppError } from "@/lib/errors/app-error";
import type {
  CreateAssessmentInput,
  CreateAssessmentQuestionInput,
  CreateBankQuestionInput,
  UpdateAssessmentInput,
} from "@/lib/validations/assessments";
import { assessmentRepository } from "@/repositories/assessment.repository";
import type {
  AssessmentDetail,
  AssessmentListItem,
  AttemptRecord,
  AttemptResult,
  AttemptSession,
  AvailableAssessment,
  QuestionBankItem,
} from "@/types/assessments";
import { auditService } from "@/services/audit.service";
import { courseLearningService } from "@/services/course-learning.service";
import {
  countCorrectAnswers,
  formatAttemptScoreSummary,
  normalizeStoredScorePercent,
} from "@/lib/assessments/attempt-scoring";

type QuestionRow = {
  id: string;
  question: string;
  type: string;
  options: unknown;
  correctAnswer: string | null;
  codeTemplate: string | null;
  points: number;
};

function parseOptions(options: unknown): string[] | null {
  if (!options) return null;
  if (Array.isArray(options)) return options as string[];
  return null;
}

function normalizeAnswer(value: string | null | undefined): string {
  return (value ?? "").trim().toLowerCase();
}

function gradeQuestion(
  q: QuestionRow,
  userAnswer: string | undefined
): { earned: number; isCorrect: boolean | null } {
  const answer = userAnswer?.trim() ?? "";

  switch (q.type) {
    case "MULTIPLE_CHOICE":
    case "TRUE_FALSE":
    case "SHORT_ANSWER":
    case "CODE": {
      if (!q.correctAnswer) return { earned: 0, isCorrect: null };
      const correct = normalizeAnswer(q.correctAnswer) === normalizeAnswer(answer);
      return { earned: correct ? q.points : 0, isCorrect: correct };
    }
    case "ESSAY":
      return { earned: 0, isCorrect: null };
    default:
      return { earned: 0, isCorrect: null };
  }
}

function mapBankItem(item: {
  id: string;
  title: string | null;
  question: string;
  type: string;
  options: unknown;
  correctAnswer: string | null;
  codeTemplate: string | null;
  points: number;
  tags: string[];
  createdAt: Date;
}): QuestionBankItem {
  return {
    id: item.id,
    title: item.title,
    question: item.question,
    type: item.type as QuestionBankItem["type"],
    options: parseOptions(item.options),
    correctAnswer: item.correctAnswer,
    codeTemplate: item.codeTemplate,
    points: item.points,
    tags: item.tags,
    createdAt: item.createdAt.toISOString(),
  };
}

async function audit(
  actorId: string,
  action: "CREATE" | "UPDATE" | "DELETE",
  entityType: string,
  entityId?: string
) {
  await auditService.log({ action, entityType, entityId, actorId });
}

export const assessmentService = {
  getOverview: () => assessmentRepository.getOverview(),

  async listAssessments(query: Parameters<typeof assessmentRepository.listAssessments>[0]) {
    const items = await assessmentRepository.listAssessments(query);
    return items.map(
      (a): AssessmentListItem => ({
        id: a.id,
        title: a.title,
        description: a.description,
        type: a.type,
        courseTitle: a.course?.title ?? null,
        questionCount: a._count.questions,
        attemptCount: a._count.attempts,
        passingScore: a.passingScore,
        timeLimitMinutes: a.timeLimitMinutes,
        maxRetakes: a.maxRetakes,
        allowRetakes: a.allowRetakes,
        isPublished: a.isPublished,
        passRate: a.attempts.length
          ? Math.round(
              (a.attempts.filter((x) => x.passed).length / a.attempts.length) * 100
            )
          : 0,
      })
    );
  },

  async getAssessment(id: string): Promise<AssessmentDetail> {
    const a = await assessmentRepository.getAssessmentById(id);
    if (!a) throw new AppError("NOT_FOUND", "Assessment not found");

    const scores = a.attempts.map((x) => x.score!).filter((s) => s !== null);
    return {
      id: a.id,
      title: a.title,
      description: a.description,
      type: a.type,
      courseId: a.courseId,
      courseTitle: a.course?.title ?? null,
      passingScore: a.passingScore,
      timeLimitMinutes: a.timeLimitMinutes,
      maxRetakes: a.maxRetakes,
      allowRetakes: a.allowRetakes,
      shuffleQuestions: a.shuffleQuestions,
      isPublished: a.isPublished,
      questions: a.questions.map((q) => ({
        id: q.id,
        question: q.question,
        type: q.type as AssessmentDetail["questions"][0]["type"],
        options: parseOptions(q.options),
        correctAnswer: q.correctAnswer,
        codeTemplate: q.codeTemplate,
        points: q.points,
        sortOrder: q.sortOrder,
        bankItemId: q.bankItemId,
      })),
      stats: {
        questionCount: a.questions.length,
        attemptCount: a.attempts.length,
        passRate: a.attempts.length
          ? Math.round(
              (a.attempts.filter((x) => x.passed).length / a.attempts.length) * 100
            )
          : 0,
        avgScore: scores.length
          ? Math.round(scores.reduce((s, v) => s + v, 0) / scores.length)
          : 0,
      },
    };
  },

  async createAssessment(input: CreateAssessmentInput, actorId: string) {
    const a = await assessmentRepository.createAssessment({
      title: input.title,
      description: input.description,
      type: input.type,
      passingScore: input.passingScore,
      timeLimitMinutes: input.timeLimitMinutes,
      maxRetakes: input.maxRetakes,
      allowRetakes: input.allowRetakes,
      shuffleQuestions: input.shuffleQuestions,
      isPublished: input.isPublished,
      ...(input.courseId ? { course: { connect: { id: input.courseId } } } : {}),
    });
    await audit(actorId, "CREATE", "Assessment", a.id);
    return a;
  },

  async updateAssessment(id: string, input: UpdateAssessmentInput, actorId: string) {
    const existing = await assessmentRepository.getAssessmentById(id);
    if (!existing) throw new AppError("NOT_FOUND", "Assessment not found");
    const a = await assessmentRepository.updateAssessment(id, {
      ...(input.title && { title: input.title }),
      ...(input.description !== undefined && { description: input.description }),
      ...(input.type && { type: input.type }),
      ...(input.passingScore !== undefined && { passingScore: input.passingScore }),
      ...(input.timeLimitMinutes !== undefined && { timeLimitMinutes: input.timeLimitMinutes }),
      ...(input.maxRetakes !== undefined && { maxRetakes: input.maxRetakes }),
      ...(input.allowRetakes !== undefined && { allowRetakes: input.allowRetakes }),
      ...(input.shuffleQuestions !== undefined && { shuffleQuestions: input.shuffleQuestions }),
      ...(input.isPublished !== undefined && { isPublished: input.isPublished }),
      ...(input.courseId !== undefined && {
        course: input.courseId ? { connect: { id: input.courseId } } : { disconnect: true },
      }),
    });
    await audit(actorId, "UPDATE", "Assessment", id);
    return a;
  },

  async deleteAssessment(id: string, actorId: string) {
    const existing = await assessmentRepository.getAssessmentById(id);
    if (!existing) throw new AppError("NOT_FOUND", "Assessment not found");
    await assessmentRepository.softDeleteAssessment(id);
    await audit(actorId, "DELETE", "Assessment", id);
  },

  async listBank(search?: string) {
    const items = await assessmentRepository.listBankItems(search);
    return items.map(mapBankItem);
  },

  async createBankItem(input: CreateBankQuestionInput, actorId: string) {
    const item = await assessmentRepository.createBankItem({
      title: input.title,
      question: input.question,
      type: input.type,
      options: input.options,
      correctAnswer: input.correctAnswer,
      codeTemplate: input.codeTemplate,
      points: input.points,
      tags: input.tags ?? [],
    });
    await audit(actorId, "CREATE", "QuestionBankItem", item.id);
    return mapBankItem(item);
  },

  async updateBankItem(
    id: string,
    input: Partial<CreateBankQuestionInput>,
    actorId: string
  ) {
    const item = await assessmentRepository.updateBankItem(id, {
      ...(input.title !== undefined && { title: input.title }),
      ...(input.question && { question: input.question }),
      ...(input.type && { type: input.type }),
      ...(input.options !== undefined && { options: input.options }),
      ...(input.correctAnswer !== undefined && { correctAnswer: input.correctAnswer }),
      ...(input.codeTemplate !== undefined && { codeTemplate: input.codeTemplate }),
      ...(input.points !== undefined && { points: input.points }),
      ...(input.tags !== undefined && { tags: input.tags }),
    });
    await audit(actorId, "UPDATE", "QuestionBankItem", id);
    return mapBankItem(item);
  },

  async deleteBankItem(id: string, actorId: string) {
    await assessmentRepository.softDeleteBankItem(id);
    await audit(actorId, "DELETE", "QuestionBankItem", id);
  },

  async addQuestion(
    assessmentId: string,
    input: CreateAssessmentQuestionInput,
    actorId: string
  ) {
    const assessment = await assessmentRepository.getAssessmentById(assessmentId);
    if (!assessment) throw new AppError("NOT_FOUND", "Assessment not found");

    const q = await assessmentRepository.createQuestionDirect(assessmentId, {
      question: input.question,
      type: input.type,
      options: input.options,
      correctAnswer: input.correctAnswer,
      codeTemplate: input.codeTemplate,
      points: input.points ?? 1,
      ...(input.bankItemId ? { bankItemId: input.bankItemId } : {}),
    });
    await audit(actorId, "CREATE", "AssessmentQuestion", q.id);
    return q;
  },

  async importFromBank(assessmentId: string, bankItemIds: string[], actorId: string) {
    const assessment = await assessmentRepository.getAssessmentById(assessmentId);
    if (!assessment) throw new AppError("NOT_FOUND", "Assessment not found");

    const items = await assessmentRepository.getBankItemsByIds(bankItemIds);
    const created = [];
    for (const item of items) {
      const q = await assessmentRepository.createQuestionDirect(assessmentId, {
        bankItemId: item.id,
        question: item.question,
        type: item.type,
        options: item.options ?? undefined,
        correctAnswer: item.correctAnswer,
        codeTemplate: item.codeTemplate,
        points: item.points,
      });
      created.push(q);
    }
    await audit(actorId, "CREATE", "Assessment", assessmentId);
    return created;
  },

  async deleteQuestion(questionId: string, actorId: string) {
    await assessmentRepository.softDeleteQuestion(questionId);
    await audit(actorId, "DELETE", "AssessmentQuestion", questionId);
  },

  async listAttempts(assessmentId?: string): Promise<AttemptRecord[]> {
    const attempts = await assessmentRepository.listAttempts(assessmentId);
    return attempts.map((a) => ({
      id: a.id,
      assessmentId: a.assessmentId,
      assessmentTitle: a.assessment.title,
      userId: a.user.id,
      userName: `${a.user.firstName} ${a.user.lastName}`,
      userEmail: a.user.email,
      attemptNumber: a.attemptNumber,
      status: a.status as AttemptRecord["status"],
      score: a.score,
      maxScore: a.maxScore,
      passed: a.passed,
      startedAt: a.startedAt.toISOString(),
      submittedAt: a.submittedAt?.toISOString() ?? null,
    }));
  },

  async listAvailable(userId: string): Promise<AvailableAssessment[]> {
    const items = await assessmentRepository.listAvailableForUser(userId);
    return items.map((a) => {
      const finished = a.attempts.filter((x) =>
        ["PASSED", "FAILED", "GRADED", "SUBMITTED"].includes(x.status)
      );
      const best = finished.reduce<number | null>((max, x) => {
        const normalized = normalizeStoredScorePercent(x.score, x.maxScore);
        if (normalized === null) return max;
        return max === null ? normalized : Math.max(max, normalized);
      }, null);
      const last = a.attempts[0];
      const passed = a.attempts.some((x) => x.passed === true);
      const attemptsUsed = a.attempts.length;
      const canRetake =
        a.allowRetakes &&
        !passed &&
        attemptsUsed < a.maxRetakes &&
        (!last || last.status !== "IN_PROGRESS");

      return {
        id: a.id,
        title: a.title,
        description: a.description,
        type: a.type,
        courseTitle: a.course?.title ?? null,
        questionCount: a._count.questions,
        passingScore: a.passingScore,
        timeLimitMinutes: a.timeLimitMinutes,
        maxRetakes: a.maxRetakes,
        allowRetakes: a.allowRetakes,
        attemptsUsed,
        canRetake,
        bestScore: best,
        lastStatus: (last?.status as AvailableAssessment["lastStatus"]) ?? null,
        passed,
      };
    });
  },

  async startAttempt(assessmentId: string, userId: string): Promise<AttemptSession> {
    const assessment = await assessmentRepository.getPublishedAssessment(assessmentId);
    if (!assessment) throw new AppError("NOT_FOUND", "Assessment not available");

    await courseLearningService.assertModuleAssessmentEligible(userId, assessmentId);

    if (!assessment.questions.length) {
      throw new AppError("BAD_REQUEST", "Assessment has no questions");
    }

    const inProgress = await assessmentRepository.getInProgressAttempt(assessmentId, userId);
    if (inProgress) {
      return this.buildSession(inProgress.id, userId);
    }

    const latest = await assessmentRepository.getLatestAttempt(assessmentId, userId);
    const attemptCount = await assessmentRepository.countUserAttempts(assessmentId, userId);

    if (latest?.passed) {
      throw new AppError("CONFLICT", "You have already passed this assessment");
    }

    if (!assessment.allowRetakes && attemptCount > 0) {
      throw new AppError("CONFLICT", "Retakes are not allowed for this assessment");
    }

    if (attemptCount >= assessment.maxRetakes) {
      throw new AppError("CONFLICT", "Maximum retakes exceeded");
    }

    const maxScore = 100;
    const expiresAt = assessment.timeLimitMinutes
      ? new Date(Date.now() + assessment.timeLimitMinutes * 60 * 1000)
      : null;

    const attempt = await assessmentRepository.createAttempt({
      assessmentId,
      userId,
      attemptNumber: (latest?.attemptNumber ?? 0) + 1,
      passingScore: assessment.passingScore,
      expiresAt,
      maxScore,
    });

    return this.buildSession(attempt.id, userId);
  },

  async buildSession(attemptId: string, userId: string): Promise<AttemptSession> {
    const attempt = await assessmentRepository.getAttemptById(attemptId, userId);
    if (!attempt) throw new AppError("NOT_FOUND", "Attempt not found");

    if (attempt.status !== "IN_PROGRESS") {
      throw new AppError("BAD_REQUEST", "Attempt is no longer active");
    }

    if (attempt.expiresAt && new Date() > attempt.expiresAt) {
      await this.submitAttempt(attemptId, userId, (attempt.answers as Record<string, string>) ?? {});
      throw new AppError("BAD_REQUEST", "Time expired — attempt auto-submitted");
    }

    let questions = attempt.assessment.questions;
    if (attempt.assessment.shuffleQuestions) {
      questions = [...questions].sort(() => Math.random() - 0.5);
    }

    const remainingSeconds = attempt.expiresAt
      ? Math.max(0, Math.floor((attempt.expiresAt.getTime() - Date.now()) / 1000))
      : null;

    return {
      id: attempt.id,
      assessmentId: attempt.assessmentId,
      assessmentTitle: attempt.assessment.title,
      attemptNumber: attempt.attemptNumber,
      status: attempt.status as AttemptSession["status"],
      startedAt: attempt.startedAt.toISOString(),
      expiresAt: attempt.expiresAt?.toISOString() ?? null,
      timeLimitMinutes: attempt.assessment.timeLimitMinutes,
      passingScore: attempt.passingScore ?? attempt.assessment.passingScore,
      questions: questions.map((q) => ({
        id: q.id,
        question: q.question,
        type: q.type as AttemptSession["questions"][0]["type"],
        options: parseOptions(q.options),
        codeTemplate: q.codeTemplate,
        points: q.points,
        sortOrder: q.sortOrder,
      })),
      answers: (attempt.answers as Record<string, string>) ?? {},
      remainingSeconds,
    };
  },

  async saveAnswers(attemptId: string, userId: string, answers: Record<string, string>) {
    const attempt = await assessmentRepository.getAttemptById(attemptId, userId);
    if (!attempt || attempt.status !== "IN_PROGRESS") {
      throw new AppError("BAD_REQUEST", "Invalid attempt");
    }
    if (attempt.expiresAt && new Date() > attempt.expiresAt) {
      return this.submitAttempt(attemptId, userId, answers);
    }
    await assessmentRepository.updateAttempt(attemptId, { answers });
    return { saved: true };
  },

  async submitAttempt(
    attemptId: string,
    userId: string,
    answers: Record<string, string>
  ): Promise<AttemptResult> {
    const attempt = await assessmentRepository.getAttemptById(attemptId, userId);
    if (!attempt) throw new AppError("NOT_FOUND", "Attempt not found");
    if (attempt.status !== "IN_PROGRESS") {
      throw new AppError("BAD_REQUEST", "Attempt already submitted");
    }

    const questions = attempt.assessment.questions;
    let needsManualGrade = false;
    const questionResults = questions.map((q) => {
      const userAnswer = answers[q.id] ?? null;
      const { isCorrect } = gradeQuestion(q, userAnswer ?? undefined);
      if (q.type === "ESSAY") needsManualGrade = true;
      const correct = isCorrect === true;
      return {
        questionId: q.id,
        question: q.question,
        type: q.type as AttemptResult["questionResults"][0]["type"],
        userAnswer,
        correctAnswer: q.correctAnswer,
        points: 1,
        earnedPoints: correct ? 1 : 0,
        isCorrect,
      };
    });

    const { correctCount, totalGradable, percentage } = countCorrectAnswers(questionResults);
    const passingScore = attempt.passingScore ?? attempt.assessment.passingScore;

    let status: "PASSED" | "FAILED" | "SUBMITTED" = "FAILED";
    let passed: boolean | null = false;

    if (needsManualGrade) {
      status = "SUBMITTED";
      passed = null;
    } else {
      passed = percentage >= passingScore;
      status = passed ? "PASSED" : "FAILED";
    }

    const scoreSummary = formatAttemptScoreSummary(correctCount, totalGradable, percentage);

    await assessmentRepository.updateAttempt(attemptId, {
      answers,
      score: percentage,
      status,
      passed,
      submittedAt: new Date(),
      feedback:
        passed === true
          ? `Congratulations! You passed with ${scoreSummary}.`
          : passed === false
            ? `${scoreSummary} — minimum ${passingScore}% required to pass.`
            : "Submitted for manual review.",
    });

    return this.getResult(attemptId, userId);
  },

  async getResult(attemptId: string, userId: string): Promise<AttemptResult> {
    const attempt = await assessmentRepository.getAttemptById(attemptId, userId);
    if (!attempt) throw new AppError("NOT_FOUND", "Attempt not found");

    const answers = (attempt.answers as Record<string, string>) ?? {};
    const questions = attempt.assessment.questions;
    const questionResults = questions.map((q) => {
      const userAnswer = answers[q.id] ?? null;
      const { isCorrect } = gradeQuestion(q, userAnswer ?? undefined);
      const correct = isCorrect === true;
      return {
        questionId: q.id,
        question: q.question,
        type: q.type as AttemptResult["questionResults"][0]["type"],
        userAnswer,
        correctAnswer: q.correctAnswer,
        points: 1,
        earnedPoints: correct ? 1 : 0,
        isCorrect,
      };
    });

    const { correctCount, totalGradable, percentage } = countCorrectAnswers(questionResults);

    const attemptCount = await assessmentRepository.countUserAttempts(
      attempt.assessmentId,
      userId
    );
    const passed = attempt.passed === true;
    const canRetake =
      attempt.assessment.allowRetakes &&
      !passed &&
      attemptCount < attempt.assessment.maxRetakes;

    return {
      id: attempt.id,
      assessmentId: attempt.assessmentId,
      assessmentTitle: attempt.assessment.title,
      attemptNumber: attempt.attemptNumber,
      status: attempt.status as AttemptResult["status"],
      score: percentage,
      maxScore: attempt.maxScore ?? 100,
      passingScore: attempt.passingScore ?? attempt.assessment.passingScore,
      passed: attempt.passed,
      percentage,
      correctCount,
      totalQuestions: totalGradable,
      feedback: attempt.feedback,
      submittedAt: attempt.submittedAt?.toISOString() ?? null,
      questionResults,
      canRetake,
      attemptsRemaining: Math.max(0, attempt.assessment.maxRetakes - attemptCount),
    };
  },
};
