import type { RoleSlug } from "@/constants/role-slugs";
import type { DashboardScope } from "@/lib/dashboard/scope";
import { resolveDashboardScope } from "@/lib/dashboard/scope";
import { getAllExternalAdapters, getExternalAdapter } from "@/lib/learning/adapters";
import { getLearningEventBus } from "@/lib/learning/event-bus";
import {
  calculateAssessmentProgress,
  calculateCourseProgress,
  calculateDropoffRate,
  calculateLearningPathProgress,
  calculateLearningVelocity,
  calculateSkillGrowthScore,
  estimateCompletionDate,
} from "@/lib/learning/progress-calculator";
import { buildXapiStatement } from "@/lib/learning/xapi";
import { lrsRepository } from "@/repositories/lrs.repository";
import { auditService } from "@/services/audit.service";
import { courseQuizGeneratorService } from "@/services/course-quiz-generator.service";
import type {
  EmployeeLearningDashboard,
  EmployeeLearningProfile,
  ExecutiveLearningDashboard,
  ExternalSyncInput,
  LearningAnalytics,
  LearningEventRecord,
  LearningReportFormat,
  ManagerLearningDashboard,
  RecordLearningEventInput,
} from "@/types/learning-lrs";
import type { ExternalLearningProvider, Prisma, XapiVerb } from "@prisma/client";

function mapEvent(e: Awaited<ReturnType<typeof lrsRepository.findEvents>>[number]): LearningEventRecord {
  const obj = e.object as { definition?: { name?: Record<string, string> } };
  return {
    id: e.id,
    userId: e.userId,
    verb: e.verb,
    timestamp: e.timestamp.toISOString(),
    courseId: e.courseId,
    moduleId: e.moduleId,
    lessonId: e.lessonId,
    assessmentId: e.assessmentId,
    certificateId: e.certificateId,
    durationMs: e.durationMs,
    source: e.source,
    objectName: obj?.definition?.name?.["en-US"] ?? "Activity",
  };
}

async function refreshCourseProgress(userId: string, courseId: string, enrollmentId?: string) {
  const { completed, total } = await lrsRepository.getCompletedLessonCount(userId, courseId);
  const progressPercent = calculateCourseProgress(completed, total);

  const existing = await lrsRepository.getCourseProgress(userId, courseId);
  const prev = existing[0];
  const timeSpentMinutes = (prev?.timeSpentMinutes ?? 0);
  const lastActivityAt = new Date();
  const estimated = estimateCompletionDate(progressPercent, timeSpentMinutes, lastActivityAt);

  let status: Prisma.CourseProgressRecordCreateInput["status"] = "IN_PROGRESS";
  if (progressPercent >= 100) status = "COMPLETED";
  else if (progressPercent > 0) status = "IN_PROGRESS";
  else status = "ENROLLED";

  const record = await lrsRepository.upsertCourseProgress(userId, courseId, {
    enrollmentId,
    totalLessons: total,
    completedLessons: completed,
    progressPercent,
    timeSpentMinutes,
    lastActivityAt,
    estimatedCompletionAt: estimated,
    status,
    startedAt: prev?.startedAt ?? (progressPercent > 0 ? new Date() : undefined),
    completedAt: progressPercent >= 100 ? new Date() : undefined,
  });

  await lrsRepository.syncEnrollmentProgress(userId, courseId, progressPercent, status);

  if (progressPercent >= 100 && prev?.progressPercent !== 100) {
    await courseQuizGeneratorService.ensureQuizAfterCourseCompletion(userId, courseId);
  }

  return record;
}

async function refreshAssessmentProgress(userId: string, assessmentId: string, attemptId?: string) {
  const totalQuestions = await lrsRepository.getAssessmentQuestionCount(assessmentId);
  const records = await lrsRepository.getAssessmentProgress(userId);
  const prev = records.find((r) => r.assessmentId === assessmentId);
  const completedQuestions = prev?.completedQuestions ?? 0;
  const progressPercent = calculateAssessmentProgress(completedQuestions, totalQuestions);

  return lrsRepository.upsertAssessmentProgress(userId, assessmentId, {
    totalQuestions,
    completedQuestions,
    progressPercent,
    lastAttemptId: attemptId,
    lastActivityAt: new Date(),
  });
}

export const lrsService = {
  async recordEvent(input: RecordLearningEventInput): Promise<LearningEventRecord> {
    const user = await lrsRepository.getUserWithDepartment(input.userId);
    const statement = buildXapiStatement({
      ...input,
      actorName: input.actorName ?? (user ? `${user.firstName} ${user.lastName}` : undefined),
      actorEmail: input.actorEmail ?? user?.email,
    });

    const event = await lrsRepository.createLearningEvent({
      user: { connect: { id: input.userId } },
      verb: input.verb,
      actor: statement.actor as unknown as Prisma.InputJsonValue,
      object: statement.object as unknown as Prisma.InputJsonValue,
      result: input.result as unknown as Prisma.InputJsonValue | undefined,
      context: input.context as unknown as Prisma.InputJsonValue | undefined,
      course: input.courseId ? { connect: { id: input.courseId } } : undefined,
      assessment: input.assessmentId ? { connect: { id: input.assessmentId } } : undefined,
      moduleId: input.moduleId,
      lessonId: input.lessonId,
      certificateId: input.certificateId,
      durationMs: input.durationMs,
      rawStatement: (input.rawStatement ?? statement) as unknown as Prisma.InputJsonValue,
      source: input.source ?? "INTERNAL",
    });

    await auditService.log({
      action: "CREATE",
      entityType: "LearningEvent",
      entityId: event.id,
      actorId: input.userId,
      metadata: {
        verb: input.verb,
        courseId: input.courseId,
        moduleId: input.moduleId,
        lessonId: input.lessonId,
        assessmentId: input.assessmentId,
      },
    });

    if (input.courseId) {
      const enrollment = await lrsRepository.getEnrollment(input.userId, input.courseId);
      await refreshCourseProgress(input.userId, input.courseId, enrollment?.id);
    }
    if (input.assessmentId) {
      await refreshAssessmentProgress(input.userId, input.assessmentId);
    }

    const bus = getLearningEventBus();
    const realtimeType = mapVerbToRealtime(input.verb);
    if (realtimeType) {
      bus.publish(input.userId, {
        type: realtimeType,
        userId: input.userId,
        timestamp: event.timestamp.toISOString(),
        data: {
          courseId: input.courseId,
          lessonId: input.lessonId,
          assessmentId: input.assessmentId,
          certificateId: input.certificateId,
          departmentId: user?.departmentId,
          teamId: user?.teamId,
          verb: input.verb,
        },
      });
    }

    return mapEvent(event);
  },

  async importXapiStatement(userId: string, statement: import("@/types/learning-lrs").XapiStatement) {
    const { parseXapiStatement } = await import("@/lib/learning/xapi");
    const parsed = parseXapiStatement(statement);
    return this.recordEvent({
      userId,
      verb: parsed.verb!,
      objectId: parsed.objectId!,
      objectName: parsed.objectName!,
      objectType: parsed.objectType,
      result: parsed.result,
      context: parsed.context,
      source: "XAPI",
      rawStatement: statement,
    });
  },

  async syncExternalProvider(userId: string, provider: ExternalLearningProvider, accessToken?: string) {
    const adapter = getExternalAdapter(provider);
    const records = await adapter.syncUserProgress(userId, accessToken);

    for (const rec of records) {
      await lrsRepository.upsertExternalRecord(userId, provider, rec.externalId, {
        title: rec.title,
        description: rec.description,
        url: rec.url,
        progressPercent: rec.progressPercent,
        timeSpentMinutes: rec.timeSpentMinutes ?? 0,
        status: rec.status ?? (rec.progressPercent >= 100 ? "COMPLETED" : "IN_PROGRESS"),
        completedAt: rec.completedAt ? new Date(rec.completedAt) : undefined,
        rawPayload: rec.rawPayload as Prisma.InputJsonValue | undefined,
      });
    }

    await auditService.log({
      action: "IMPORT",
      entityType: "ExternalLearningRecord",
      actorId: userId,
      metadata: { provider, count: records.length },
    });

    return records.length;
  },

  async syncAllExternalProviders(userId: string) {
    const adapters = getAllExternalAdapters();
    let total = 0;
    for (const adapter of adapters) {
      total += await this.syncExternalProvider(userId, adapter.provider);
    }
    return total;
  },

  async getEmployeeDashboard(userId: string): Promise<EmployeeLearningDashboard> {
    const [progress, certs, events] = await Promise.all([
      lrsRepository.getCourseProgress(userId),
      lrsRepository.countCertificatesEarned(userId),
      lrsRepository.findEvents({ userId, limit: 1 }),
    ]);

    const activeCourses = progress.map((p) => ({
      id: p.id,
      courseId: p.courseId,
      courseSlug: p.course.slug,
      courseTitle: p.course.title,
      progressPercent: p.progressPercent,
      completedLessons: p.completedLessons,
      totalLessons: p.totalLessons,
      timeSpentMinutes: p.timeSpentMinutes,
      lastActivityAt: p.lastActivityAt?.toISOString() ?? null,
      estimatedCompletionAt: p.estimatedCompletionAt?.toISOString() ?? null,
      status: p.status,
      startedAt: p.startedAt?.toISOString() ?? null,
      completedAt: p.completedAt?.toISOString() ?? null,
    }));

    const inProgress = activeCourses.filter((c) => c.status === "IN_PROGRESS" || c.status === "ENROLLED");
    const completed = activeCourses.filter((c) => c.status === "COMPLETED");
    const current = inProgress.sort((a, b) => (b.lastActivityAt ?? "").localeCompare(a.lastActivityAt ?? ""))[0] ?? null;

    const totalTime = activeCourses.reduce((sum, c) => sum + c.timeSpentMinutes, 0);
    const avgProgress =
      activeCourses.length > 0
        ? Math.round(activeCourses.reduce((s, c) => s + c.progressPercent, 0) / activeCourses.length)
        : 0;

    return {
      currentCourse: current,
      progressPercent: current?.progressPercent ?? avgProgress,
      timeInvestedMinutes: totalTime,
      lastActivityAt: events[0]?.timestamp.toISOString() ?? current?.lastActivityAt ?? null,
      estimatedCompletionAt: current?.estimatedCompletionAt ?? null,
      certificatesEarned: certs,
      coursesInProgress: inProgress.length,
      coursesCompleted: completed.length,
      activeCourses,
    };
  },

  async getManagerDashboard(userId: string, role: RoleSlug): Promise<ManagerLearningDashboard> {
    const scope = await resolveDashboardScope(userId, role);
    const [progressRecords, certCounts] = await Promise.all([
      lrsRepository.getScopedCourseProgress(scope),
      lrsRepository.getScopedEvents(scope),
    ]);

    const memberMap = new Map<string, { name: string; progress: number[]; lastActivity: Date | null; certs: number }>();
    for (const p of progressRecords) {
      const key = p.userId;
      const entry = memberMap.get(key) ?? {
        name: `${p.user.firstName} ${p.user.lastName}`,
        progress: [],
        lastActivity: null,
        certs: 0,
      };
      entry.progress.push(p.progressPercent);
      if (p.lastActivityAt && (!entry.lastActivity || p.lastActivityAt > entry.lastActivity)) {
        entry.lastActivity = p.lastActivityAt;
      }
      memberMap.set(key, entry);
    }

    const teamMembers = [...memberMap.entries()].map(([uid, m]) => ({
      userId: uid,
      name: m.name,
      progressPercent: m.progress.length ? Math.round(m.progress.reduce((a, b) => a + b, 0) / m.progress.length) : 0,
      lastActivityAt: m.lastActivity?.toISOString() ?? null,
      certificatesEarned: m.certs,
    }));

    const avgProgress =
      progressRecords.length > 0
        ? Math.round(progressRecords.reduce((s, p) => s + p.progressPercent, 0) / progressRecords.length)
        : 0;

    const completed = progressRecords.filter((p) => p.status === "COMPLETED").length;
    const inProgress = progressRecords.filter((p) => p.status === "IN_PROGRESS").length;
    const notStarted = progressRecords.filter((p) => p.status === "ENROLLED").length;

    return {
      teamLearningProgress: avgProgress,
      skillGapClosureRate: Math.min(100, avgProgress + 10),
      complianceStatus: {
        compliant: completed,
        nonCompliant: notStarted,
        total: progressRecords.length,
      },
      certificationStatus: { active: 0, expiringSoon: 0, expired: 0 },
      trainingCompletion: {
        completed,
        inProgress,
        notStarted,
        total: progressRecords.length,
      },
      teamMembers,
    };
  },

  async getExecutiveDashboard(userId: string, role: RoleSlug): Promise<ExecutiveLearningDashboard> {
    const scope = await resolveDashboardScope(userId, role);
    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const [progressRecords, events, pathData] = await Promise.all([
      lrsRepository.getScopedCourseProgress(scope),
      lrsRepository.getScopedEvents(scope, since),
      lrsRepository.getLearningPathProgress(userId),
    ]);

    const completions = progressRecords.filter((p) => p.status === "COMPLETED").length;
    const activeLearners = new Set(progressRecords.map((p) => p.userId)).size;
    const velocity = calculateLearningVelocity(completions, Math.max(activeLearners, 1));
    const completionRate =
      progressRecords.length > 0 ? Math.round((completions / progressRecords.length) * 100) : 0;

    const deptMap = new Map<string, { completions: number; total: number; events: number }>();
    for (const p of progressRecords) {
      const dept = p.user.department?.name ?? "Unassigned";
      const entry = deptMap.get(dept) ?? { completions: 0, total: 0, events: 0 };
      entry.total++;
      if (p.status === "COMPLETED") entry.completions++;
      deptMap.set(dept, entry);
    }
    for (const e of events) {
      const dept = e.user.department?.name ?? "Unassigned";
      const entry = deptMap.get(dept) ?? { completions: 0, total: 0, events: 0 };
      entry.events++;
      deptMap.set(dept, entry);
    }

    const departmentVelocity = [...deptMap.entries()].map(([department, d]) => ({
      department,
      velocity: d.total > 0 ? Math.round((d.completions / d.total) * 10) / 10 : 0,
      completionRate: d.total > 0 ? Math.round((d.completions / d.total) * 100) : 0,
    }));

    const userEvents = new Map<string, { count: number; time: number; name: string }>();
    for (const e of events) {
      const entry = userEvents.get(e.userId) ?? {
        count: 0,
        time: 0,
        name: `${e.user.firstName} ${e.user.lastName}`,
      };
      entry.count++;
      entry.time += Math.round((e.durationMs ?? 0) / 60000);
      userEvents.set(e.userId, entry);
    }

    const topEngaged = [...userEvents.entries()]
      .map(([uid, d]) => ({
        userId: uid,
        name: d.name,
        eventsCount: d.count,
        timeSpentMinutes: d.time,
      }))
      .sort((a, b) => b.eventsCount - a.eventsCount)
      .slice(0, 10);

    const pathProgress = calculateLearningPathProgress(pathData.completedLevels, pathData.totalLevels);

    return {
      workforceReadiness: Math.round((completionRate + pathProgress) / 2),
      learningVelocity: velocity,
      certificationCompliance: completionRate,
      promotionPipeline: Math.round(pathProgress * 0.8),
      successionPipeline: Math.round(pathProgress * 0.6),
      departmentVelocity,
      topEngaged,
    };
  },

  async getAnalytics(userId: string, role: RoleSlug): Promise<LearningAnalytics> {
    const scope = await resolveDashboardScope(userId, role);
    const since30 = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const since60 = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000);

    const [progressRecords, events, currentSkillAvg] = await Promise.all([
      lrsRepository.getScopedCourseProgress(scope),
      lrsRepository.getScopedEvents(scope, since30),
      lrsRepository.getSkillRankHistory(userId),
    ]);

    const started = progressRecords.filter((p) => p.startedAt).length;
    const completed = progressRecords.filter((p) => p.status === "COMPLETED").length;
    const completionRate = progressRecords.length > 0 ? Math.round((completed / progressRecords.length) * 100) : 0;
    const dropoffRate = calculateDropoffRate(started, completed);
    const activeLearners = new Set(progressRecords.map((p) => p.userId)).size;
    const velocity = calculateLearningVelocity(completed, Math.max(activeLearners, 1));

    const completedWithTime = progressRecords.filter(
      (p) => p.status === "COMPLETED" && p.startedAt && p.completedAt
    );
    const avgHours =
      completedWithTime.length > 0
        ? completedWithTime.reduce((sum, p) => {
            const hrs = (p.completedAt!.getTime() - p.startedAt!.getTime()) / 3600000;
            return sum + hrs;
          }, 0) / completedWithTime.length
        : 0;

    const eventsByVerb: Record<string, number> = {};
    for (const e of events) {
      eventsByVerb[e.verb] = (eventsByVerb[e.verb] ?? 0) + 1;
    }

    const trendMap = new Map<string, { completions: number; starts: number }>();
    for (const e of events) {
      const date = e.timestamp.toISOString().slice(0, 10);
      const entry = trendMap.get(date) ?? { completions: 0, starts: 0 };
      if (e.verb === "COMPLETED") entry.completions++;
      if (e.verb === "STARTED") entry.starts++;
      trendMap.set(date, entry);
    }

    const progressTrend = [...trendMap.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, d]) => ({ date, ...d }));

    const previousSkillAvg = currentSkillAvg * 0.9;
    const skillGrowthScore = calculateSkillGrowthScore(currentSkillAvg * 20, previousSkillAvg * 20);

    return {
      learningVelocity: velocity,
      completionRate,
      dropoffRate,
      averageTimeToCompleteHours: Math.round(avgHours * 10) / 10,
      skillGrowthScore,
      eventsByVerb,
      progressTrend,
    };
  },

  async getEmployeeLearningProfile(userId: string): Promise<EmployeeLearningProfile> {
    const [courses, assessments, certificates, external, events, skillAvg] = await Promise.all([
      lrsRepository.getCourseProgress(userId),
      lrsRepository.getAssessmentProgress(userId),
      lrsRepository.getCertificateProgress(userId),
      lrsRepository.getExternalRecords(userId),
      lrsRepository.findEvents({ userId, limit: 20 }),
      lrsRepository.getSkillRankHistory(userId),
    ]);

    const courseSummaries = courses.map((p) => ({
      id: p.id,
      courseId: p.courseId,
      courseSlug: p.course.slug,
      courseTitle: p.course.title,
      progressPercent: p.progressPercent,
      completedLessons: p.completedLessons,
      totalLessons: p.totalLessons,
      timeSpentMinutes: p.timeSpentMinutes,
      lastActivityAt: p.lastActivityAt?.toISOString() ?? null,
      estimatedCompletionAt: p.estimatedCompletionAt?.toISOString() ?? null,
      status: p.status,
      startedAt: p.startedAt?.toISOString() ?? null,
      completedAt: p.completedAt?.toISOString() ?? null,
    }));

    const progressHistory = courseSummaries
      .filter((c) => c.completedAt)
      .map((c) => ({ date: c.completedAt!, progressPercent: c.progressPercent }));

    return {
      courses: courseSummaries,
      assessments: assessments.map((a) => ({
        assessmentId: a.assessmentId,
        title: a.assessment.title,
        progressPercent: a.progressPercent,
        completedQuestions: a.completedQuestions,
        totalQuestions: a.totalQuestions,
        status: a.status,
        passed: a.passed,
        bestScore: a.bestScore,
      })),
      certificates: certificates.map((c) => ({
        id: c.id,
        templateName: c.template?.name ?? "Certificate",
        status: c.status,
        progressPercent: c.progressPercent,
        earnedAt: c.earnedAt?.toISOString() ?? null,
        expiresAt: c.expiresAt?.toISOString() ?? null,
      })),
      externalRecords: external.map((e) => ({
        id: e.id,
        provider: e.provider,
        title: e.title,
        progressPercent: e.progressPercent,
        status: e.status,
      })),
      timeSpentMinutes: courseSummaries.reduce((s, c) => s + c.timeSpentMinutes, 0),
      progressHistory,
      skillGrowthScore: calculateSkillGrowthScore(skillAvg * 20, skillAvg * 18),
      recentEvents: events.map(mapEvent),
    };
  },

  async getEvents(scope: DashboardScope, params?: { userId?: string; courseId?: string; limit?: number }) {
    const events = await lrsRepository.findEvents({ ...params, scope });
    return events.map(mapEvent);
  },

  async exportReport(
    userId: string,
    role: RoleSlug,
    format: LearningReportFormat
  ): Promise<{ buffer: Buffer; contentType: string; filename: string }> {
    const scope = await resolveDashboardScope(userId, role);
    const progress = await lrsRepository.getScopedCourseProgress(scope);
    const { exportLearningReport } = await import("@/lib/exports/learning-report-export");
    return exportLearningReport(progress, format, scope.label);
  },

  async recalculateCourseProgress(userId: string, courseId: string) {
    const enrollment = await lrsRepository.getEnrollment(userId, courseId);
    return refreshCourseProgress(userId, courseId, enrollment?.id);
  },
};

function mapVerbToRealtime(verb: XapiVerb): import("@/types/learning-lrs").LearningRealtimeEventType | null {
  switch (verb) {
    case "STARTED":
      return "course_started";
    case "COMPLETED":
      return "lesson_completed";
    case "PASSED":
    case "FAILED":
      return "assessment_submitted";
    case "CERTIFIED":
      return "certificate_earned";
    default:
      return null;
  }
}
