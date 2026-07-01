export type QuestionType =
  | "MULTIPLE_CHOICE"
  | "TRUE_FALSE"
  | "SHORT_ANSWER"
  | "CODE"
  | "ESSAY";

export type AttemptStatus =
  | "IN_PROGRESS"
  | "SUBMITTED"
  | "GRADED"
  | "PASSED"
  | "FAILED";

export interface AssessmentOverview {
  totalAssessments: number;
  publishedAssessments: number;
  totalQuestions: number;
  bankQuestions: number;
  totalAttempts: number;
  passRate: number;
}

export interface AssessmentListItem {
  id: string;
  title: string;
  description: string | null;
  type: string;
  courseTitle: string | null;
  questionCount: number;
  attemptCount: number;
  passingScore: number;
  timeLimitMinutes: number | null;
  maxRetakes: number;
  allowRetakes: boolean;
  isPublished: boolean;
  passRate: number;
}

export interface QuestionBankItem {
  id: string;
  title: string | null;
  question: string;
  type: QuestionType;
  options: string[] | null;
  correctAnswer: string | null;
  codeTemplate: string | null;
  points: number;
  tags: string[];
  createdAt: string;
}

export interface AssessmentQuestion {
  id: string;
  question: string;
  type: QuestionType;
  options: string[] | null;
  correctAnswer?: string | null;
  codeTemplate?: string | null;
  points: number;
  sortOrder: number;
  bankItemId: string | null;
}

export interface AssessmentDetail {
  id: string;
  title: string;
  description: string | null;
  type: string;
  courseId: string | null;
  courseTitle: string | null;
  passingScore: number;
  timeLimitMinutes: number | null;
  maxRetakes: number;
  allowRetakes: boolean;
  shuffleQuestions: boolean;
  isPublished: boolean;
  questions: AssessmentQuestion[];
  stats: {
    questionCount: number;
    attemptCount: number;
    passRate: number;
    avgScore: number;
  };
}

export interface AvailableAssessment {
  id: string;
  title: string;
  description: string | null;
  type: string;
  courseTitle: string | null;
  questionCount: number;
  passingScore: number;
  timeLimitMinutes: number | null;
  maxRetakes: number;
  allowRetakes: boolean;
  attemptsUsed: number;
  canRetake: boolean;
  bestScore: number | null;
  lastStatus: AttemptStatus | null;
  passed: boolean;
}

export interface AttemptQuestion {
  id: string;
  question: string;
  type: QuestionType;
  options: string[] | null;
  codeTemplate: string | null;
  points: number;
  sortOrder: number;
}

export interface AttemptSession {
  id: string;
  assessmentId: string;
  assessmentTitle: string;
  attemptNumber: number;
  status: AttemptStatus;
  startedAt: string;
  expiresAt: string | null;
  timeLimitMinutes: number | null;
  passingScore: number;
  questions: AttemptQuestion[];
  answers: Record<string, string>;
  remainingSeconds: number | null;
}

export interface AttemptResult {
  id: string;
  assessmentId: string;
  assessmentTitle: string;
  attemptNumber: number;
  status: AttemptStatus;
  score: number | null;
  maxScore: number | null;
  passingScore: number;
  passed: boolean | null;
  percentage: number | null;
  correctCount?: number;
  totalQuestions?: number;
  feedback: string | null;
  submittedAt: string | null;
  questionResults: {
    questionId: string;
    question: string;
    type: QuestionType;
    userAnswer: string | null;
    correctAnswer: string | null;
    points: number;
    earnedPoints: number;
    isCorrect: boolean | null;
  }[];
  canRetake: boolean;
  attemptsRemaining: number;
}

export interface AttemptRecord {
  id: string;
  assessmentId: string;
  assessmentTitle: string;
  userId: string;
  userName: string;
  userEmail: string;
  attemptNumber: number;
  status: AttemptStatus;
  score: number | null;
  maxScore: number | null;
  passed: boolean | null;
  startedAt: string;
  submittedAt: string | null;
}
