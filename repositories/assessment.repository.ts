import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import type { AssessmentListQuery } from "@/lib/validations/assessments";

const FINISHED_STATUSES = ["PASSED", "FAILED", "GRADED", "SUBMITTED"] as const;

export const assessmentRepository = {
  async getOverview() {
    const [assessments, published, questions, bank, attempts, passed] = await Promise.all([
      prisma.assessment.count({ where: { deletedAt: null } }),
      prisma.assessment.count({ where: { deletedAt: null, isPublished: true } }),
      prisma.assessmentQuestion.count({ where: { deletedAt: null } }),
      prisma.questionBankItem.count({ where: { deletedAt: null } }),
      prisma.assessmentAttempt.count({
        where: { deletedAt: null, status: { in: [...FINISHED_STATUSES] } },
      }),
      prisma.assessmentAttempt.count({
        where: { deletedAt: null, passed: true },
      }),
    ]);
    return {
      totalAssessments: assessments,
      publishedAssessments: published,
      totalQuestions: questions,
      bankQuestions: bank,
      totalAttempts: attempts,
      passRate: attempts ? Math.round((passed / attempts) * 100) : 0,
    };
  },

  async listAssessments(query: AssessmentListQuery) {
    const where: Prisma.AssessmentWhereInput = {
      deletedAt: null,
      ...(query.search
        ? { title: { contains: query.search, mode: "insensitive" } }
        : {}),
      ...(query.published === "true" ? { isPublished: true } : {}),
      ...(query.published === "false" ? { isPublished: false } : {}),
    };
    return prisma.assessment.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      include: {
        course: { select: { title: true } },
        _count: {
          select: {
            questions: { where: { deletedAt: null } },
            attempts: { where: { deletedAt: null } },
          },
        },
        attempts: {
          where: { deletedAt: null, passed: { not: null } },
          select: { passed: true },
        },
      },
    });
  },

  async getAssessmentById(id: string) {
    return prisma.assessment.findFirst({
      where: { id, deletedAt: null },
      include: {
        course: { select: { id: true, title: true } },
        questions: {
          where: { deletedAt: null },
          orderBy: { sortOrder: "asc" },
        },
        attempts: {
          where: { deletedAt: null, score: { not: null } },
          select: { score: true, passed: true },
        },
      },
    });
  },

  async createAssessment(data: Prisma.AssessmentCreateInput) {
    return prisma.assessment.create({ data });
  },

  async updateAssessment(id: string, data: Prisma.AssessmentUpdateInput) {
    return prisma.assessment.update({ where: { id }, data });
  },

  async softDeleteAssessment(id: string) {
    return prisma.assessment.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  },

  async listBankItems(search?: string) {
    return prisma.questionBankItem.findMany({
      where: {
        deletedAt: null,
        ...(search
          ? {
              OR: [
                { question: { contains: search, mode: "insensitive" } },
                { title: { contains: search, mode: "insensitive" } },
              ],
            }
          : {}),
      },
      orderBy: { updatedAt: "desc" },
    });
  },

  async createBankItem(data: Prisma.QuestionBankItemCreateInput) {
    return prisma.questionBankItem.create({ data });
  },

  async updateBankItem(id: string, data: Prisma.QuestionBankItemUpdateInput) {
    return prisma.questionBankItem.update({ where: { id }, data });
  },

  async softDeleteBankItem(id: string) {
    return prisma.questionBankItem.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  },

  async getBankItemsByIds(ids: string[]) {
    return prisma.questionBankItem.findMany({
      where: { id: { in: ids }, deletedAt: null },
    });
  },

  async createQuestionDirect(
    assessmentId: string,
    data: {
      question: string;
      type: string;
      options?: Prisma.InputJsonValue;
      correctAnswer?: string | null;
      codeTemplate?: string | null;
      points?: number;
      bankItemId?: string;
    }
  ) {
    const maxOrder = await prisma.assessmentQuestion.aggregate({
      where: { assessmentId, deletedAt: null },
      _max: { sortOrder: true },
    });
    return prisma.assessmentQuestion.create({
      data: {
        assessmentId,
        question: data.question,
        type: data.type as "MULTIPLE_CHOICE" | "TRUE_FALSE" | "SHORT_ANSWER" | "CODE" | "ESSAY",
        options: data.options,
        correctAnswer: data.correctAnswer,
        codeTemplate: data.codeTemplate,
        points: data.points ?? 1,
        bankItemId: data.bankItemId,
        sortOrder: (maxOrder._max.sortOrder ?? -1) + 1,
      },
    });
  },

  async updateQuestion(id: string, data: Prisma.AssessmentQuestionUpdateInput) {
    return prisma.assessmentQuestion.update({ where: { id }, data });
  },

  async softDeleteQuestion(id: string) {
    return prisma.assessmentQuestion.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  },

  async getPublishedAssessment(id: string) {
    return prisma.assessment.findFirst({
      where: { id, deletedAt: null, isPublished: true },
      include: {
        course: { select: { title: true } },
        questions: {
          where: { deletedAt: null },
          orderBy: { sortOrder: "asc" },
        },
      },
    });
  },

  async listAvailableForUser(userId: string) {
    return prisma.assessment.findMany({
      where: { deletedAt: null, isPublished: true },
      include: {
        course: { select: { title: true } },
        _count: {
          select: { questions: { where: { deletedAt: null } } },
        },
        attempts: {
          where: { userId, deletedAt: null },
          orderBy: { attemptNumber: "desc" },
          select: {
            attemptNumber: true,
            status: true,
            score: true,
            maxScore: true,
            passed: true,
          },
        },
      },
      orderBy: { title: "asc" },
    });
  },

  async countUserAttempts(assessmentId: string, userId: string) {
    return prisma.assessmentAttempt.count({
      where: {
        assessmentId,
        userId,
        deletedAt: null,
        status: { in: [...FINISHED_STATUSES, "IN_PROGRESS"] },
      },
    });
  },

  async getLatestAttempt(assessmentId: string, userId: string) {
    return prisma.assessmentAttempt.findFirst({
      where: { assessmentId, userId, deletedAt: null },
      orderBy: { attemptNumber: "desc" },
    });
  },

  async getInProgressAttempt(assessmentId: string, userId: string) {
    return prisma.assessmentAttempt.findFirst({
      where: { assessmentId, userId, deletedAt: null, status: "IN_PROGRESS" },
    });
  },

  async createAttempt(data: {
    assessmentId: string;
    userId: string;
    attemptNumber: number;
    passingScore: number;
    expiresAt: Date | null;
    maxScore: number;
  }) {
    return prisma.assessmentAttempt.create({
      data: {
        assessmentId: data.assessmentId,
        userId: data.userId,
        attemptNumber: data.attemptNumber,
        passingScore: data.passingScore,
        expiresAt: data.expiresAt,
        maxScore: data.maxScore,
        status: "IN_PROGRESS",
        answers: {},
      },
    });
  },

  async getAttemptById(id: string, userId?: string) {
    return prisma.assessmentAttempt.findFirst({
      where: {
        id,
        deletedAt: null,
        ...(userId ? { userId } : {}),
      },
      include: {
        assessment: {
          include: {
            questions: {
              where: { deletedAt: null },
              orderBy: { sortOrder: "asc" },
            },
          },
        },
        user: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
    });
  },

  async updateAttempt(
    id: string,
    data: Prisma.AssessmentAttemptUpdateInput
  ) {
    return prisma.assessmentAttempt.update({ where: { id }, data });
  },

  async listAttempts(assessmentId?: string) {
    return prisma.assessmentAttempt.findMany({
      where: {
        deletedAt: null,
        ...(assessmentId ? { assessmentId } : {}),
      },
      include: {
        assessment: { select: { title: true } },
        user: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
      orderBy: { startedAt: "desc" },
      take: 100,
    });
  },
};
