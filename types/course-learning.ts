import type { LessonType } from "@/types/course-admin";

export interface CoursePlayerLessonProgress {
  status: "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED";
  progressPercent: number;
  timeSpentMinutes: number | null;
}

export interface CoursePlayerLesson {
  id: string;
  title: string;
  type: LessonType;
  content: string | null;
  videoUrl: string | null;
  pdfUrl: string | null;
  assignmentBrief: string | null;
  durationMinutes: number | null;
  sortOrder: number;
  isAccessible: boolean;
  progress: CoursePlayerLessonProgress;
}

export interface CoursePlayerModuleQuiz {
  assessmentId: string;
  title: string;
  questionCount: number;
  passingScore: number;
  isAvailable: boolean;
  isPassed: boolean;
  canRetake: boolean;
  bestScore: number | null;
  attemptsUsed: number;
  maxRetakes: number;
  attemptsRemaining: number;
}

export interface CoursePlayerModule {
  id: string;
  title: string;
  sortOrder: number;
  isUnlocked: boolean;
  isComplete: boolean;
  isContentComplete: boolean;
  lessonsComplete: number;
  totalLessons: number;
  lessons: CoursePlayerLesson[];
  moduleQuiz: CoursePlayerModuleQuiz | null;
}

export interface CompleteModuleResult {
  moduleId: string;
  courseId: string;
  player: CoursePlayerData;
}

export interface PrepareModuleAssessmentResult {
  moduleId: string;
  assessmentId: string;
  assessmentTitle: string;
  questionCount: number;
  generated: boolean;
}

export interface CoursePlayerCodingRound {
  assessmentId: string;
  title: string;
  questionCount: number;
  passingScore: number;
  isAvailable: boolean;
  isPassed: boolean;
  canRetake: boolean;
  bestScore: number | null;
  attemptsUsed: number;
  maxRetakes: number;
  attemptsRemaining: number;
}

export interface CoursePlayerData {
  course: {
    id: string;
    title: string;
    slug: string;
    description: string | null;
    durationMinutes: number | null;
    externalUrl: string | null;
    externalProvider: string | null;
  };
  enrollment: {
    id: string;
    status: string;
    progress: number;
  } | null;
  modules: CoursePlayerModule[];
  overallProgress: number;
  selectedLessonId: string | null;
  codingRound: CoursePlayerCodingRound | null;
}

export interface CompleteLessonResult {
  lessonId: string;
  moduleId: string;
  courseId: string;
  player: CoursePlayerData;
}
