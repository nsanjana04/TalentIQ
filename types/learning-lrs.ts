import type {
  EnrollmentStatus,
  ExternalLearningProvider,
  LearningEventSource,
  XapiVerb,
} from "@prisma/client";

export type LearningRealtimeEventType =
  | "course_started"
  | "lesson_completed"
  | "assessment_submitted"
  | "certificate_earned";

export interface LearningRealtimePayload {
  type: LearningRealtimeEventType;
  userId: string;
  timestamp: string;
  data: Record<string, unknown>;
}

export interface XapiActor {
  objectType: "Agent";
  name?: string;
  mbox?: string;
  account?: { homePage: string; name: string };
}

export interface XapiObject {
  objectType: "Activity" | "StatementRef";
  id: string;
  definition?: {
    name?: Record<string, string>;
    type?: string;
    description?: Record<string, string>;
  };
}

export interface XapiResult {
  score?: { scaled?: number; raw?: number; min?: number; max?: number };
  success?: boolean;
  completion?: boolean;
  duration?: string;
  response?: string;
}

export interface XapiContext {
  registration?: string;
  instructor?: XapiActor;
  team?: XapiActor;
  contextActivities?: Record<string, XapiObject[]>;
  extensions?: Record<string, unknown>;
}

export interface XapiStatement {
  id?: string;
  actor: XapiActor;
  verb: { id: string; display: Record<string, string> };
  object: XapiObject;
  result?: XapiResult;
  context?: XapiContext;
  timestamp?: string;
}

export interface RecordLearningEventInput {
  userId: string;
  verb: XapiVerb;
  objectId: string;
  objectName: string;
  objectType?: string;
  courseId?: string;
  moduleId?: string;
  lessonId?: string;
  assessmentId?: string;
  certificateId?: string;
  durationMs?: number;
  result?: XapiResult;
  context?: XapiContext;
  source?: LearningEventSource;
  rawStatement?: XapiStatement;
  actorName?: string;
  actorEmail?: string;
}

export interface LearningEventRecord {
  id: string;
  userId: string;
  verb: XapiVerb;
  timestamp: string;
  courseId: string | null;
  moduleId: string | null;
  lessonId: string | null;
  assessmentId: string | null;
  certificateId: string | null;
  durationMs: number | null;
  source: LearningEventSource;
  objectName: string;
}

export interface CourseProgressSummary {
  id: string;
  courseId: string;
  courseSlug: string;
  courseTitle: string;
  progressPercent: number;
  completedLessons: number;
  totalLessons: number;
  timeSpentMinutes: number;
  lastActivityAt: string | null;
  estimatedCompletionAt: string | null;
  status: EnrollmentStatus;
  startedAt: string | null;
  completedAt: string | null;
}

export interface EmployeeLearningDashboard {
  currentCourse: CourseProgressSummary | null;
  progressPercent: number;
  timeInvestedMinutes: number;
  lastActivityAt: string | null;
  estimatedCompletionAt: string | null;
  certificatesEarned: number;
  coursesInProgress: number;
  coursesCompleted: number;
  activeCourses: CourseProgressSummary[];
}

export interface ManagerLearningDashboard {
  teamLearningProgress: number;
  skillGapClosureRate: number;
  complianceStatus: { compliant: number; nonCompliant: number; total: number };
  certificationStatus: { active: number; expiringSoon: number; expired: number };
  trainingCompletion: { completed: number; inProgress: number; notStarted: number; total: number };
  teamMembers: {
    userId: string;
    name: string;
    progressPercent: number;
    lastActivityAt: string | null;
    certificatesEarned: number;
  }[];
}

export interface ExecutiveLearningDashboard {
  workforceReadiness: number;
  learningVelocity: number;
  certificationCompliance: number;
  promotionPipeline: number;
  successionPipeline: number;
  departmentVelocity: { department: string; velocity: number; completionRate: number }[];
  topEngaged: { userId: string; name: string; eventsCount: number; timeSpentMinutes: number }[];
}

export interface LearningAnalytics {
  learningVelocity: number;
  completionRate: number;
  dropoffRate: number;
  averageTimeToCompleteHours: number;
  skillGrowthScore: number;
  eventsByVerb: Record<string, number>;
  progressTrend: { date: string; completions: number; starts: number }[];
}

export interface ExternalSyncInput {
  userId: string;
  provider: ExternalLearningProvider;
  records: {
    externalId: string;
    title: string;
    description?: string;
    url?: string;
    progressPercent: number;
    timeSpentMinutes?: number;
    status?: EnrollmentStatus;
    completedAt?: string;
    rawPayload?: Record<string, unknown>;
  }[];
}

export interface EmployeeLearningProfile {
  courses: CourseProgressSummary[];
  assessments: {
    assessmentId: string;
    title: string;
    progressPercent: number;
    completedQuestions: number;
    totalQuestions: number;
    status: string;
    passed: boolean | null;
    bestScore: number | null;
  }[];
  certificates: {
    id: string;
    templateName: string;
    status: string;
    progressPercent: number;
    earnedAt: string | null;
    expiresAt: string | null;
  }[];
  externalRecords: {
    id: string;
    provider: ExternalLearningProvider;
    title: string;
    progressPercent: number;
    status: EnrollmentStatus;
  }[];
  timeSpentMinutes: number;
  progressHistory: { date: string; progressPercent: number }[];
  skillGrowthScore: number;
  recentEvents: LearningEventRecord[];
}

export type LearningReportFormat = "csv" | "xlsx" | "pdf";
