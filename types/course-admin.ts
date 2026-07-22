export type LessonType = "VIDEO" | "PDF" | "QUIZ" | "ASSIGNMENT";

export interface CourseAdminOverview {
  totalCourses: number;
  publishedCourses: number;
  totalModules: number;
  totalLessons: number;
  totalEnrollments: number;
  avgCompletionRate: number;
}

export interface CourseListItem {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  isPublished: boolean;
  durationMinutes: number | null;
  instructorName: string | null;
  moduleCount: number;
  lessonCount: number;
  enrollmentCount: number;
  completionRate: number;
  createdAt: string;
}

export interface LessonDetail {
  id: string;
  title: string;
  type: LessonType;
  content: string | null;
  videoUrl: string | null;
  pdfUrl: string | null;
  assessmentId: string | null;
  assessmentTitle: string | null;
  assignmentBrief: string | null;
  sortOrder: number;
  durationMinutes: number | null;
}

export interface ModuleDetail {
  id: string;
  title: string;
  sortOrder: number;
  assessmentId: string | null;
  assessmentTitle: string | null;
  requireQuizPass: boolean;
  questionCount: number;
  lessons: LessonDetail[];
}

export interface ModuleAssessmentStatus {
  moduleId: string;
  moduleTitle: string;
  sortOrder: number;
  assessmentId: string | null;
  assessmentTitle: string | null;
  questionCount: number;
  isPublished: boolean;
  requireQuizPass: boolean;
}

export interface GenerateModuleAssessmentQuestionsResult {
  moduleId: string;
  moduleTitle: string;
  assessmentId: string;
  assessmentTitle: string;
  questionCount: number;
  generated: boolean;
  aiPowered: boolean;
}

export interface SetupModuleAssessmentsResult {
  created: number;
  skipped: number;
  modules: ModuleAssessmentStatus[];
}

export interface CourseDetail {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  isPublished: boolean;
  durationMinutes: number | null;
  instructorId: string | null;
  instructorName: string | null;
  modules: ModuleDetail[];
  stats: {
    moduleCount: number;
    lessonCount: number;
    enrollmentCount: number;
    completionRate: number;
  };
}

export interface CourseLinkedAssessment {
  id: string;
  title: string;
  isPublished: boolean;
  questionCount: number;
  linkType: "course" | "lesson";
  lessonTitle?: string | null;
}

export interface GenerateCourseAssessmentQuestionsResult {
  assessmentId: string;
  questionCount: number;
  generated: boolean;
  aiPowered: boolean;
  assessmentTitle: string;
}

export interface CourseMeta {
  instructors: { id: string; name: string; email: string }[];
  assessments: { id: string; title: string; courseId: string | null }[];
}

export interface CourseAnalytics {
  courseId: string;
  courseTitle: string;
  totalEnrollments: number;
  activeLearners: number;
  completedLearners: number;
  droppedLearners: number;
  avgProgress: number;
  completionRate: number;
  enrollmentsByStatus: { status: string; count: number }[];
  lessonCompletionRates: { lessonId: string; lessonTitle: string; type: LessonType; completionRate: number }[];
  progressTrend: { month: string; enrollments: number; completions: number }[];
}

export interface EnrollmentRecord {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  department: string | null;
  status: string;
  progress: number;
  lessonsCompleted: number;
  totalLessons: number;
  enrolledAt: string;
  completedAt: string | null;
}

export interface ProgressRecord {
  userId: string;
  userName: string;
  userEmail: string;
  enrollmentId: string;
  status: string;
  courseProgress: number;
  lessonsCompleted: number;
  totalLessons: number;
  timeSpentMinutes: number;
  lastActivityAt: string | null;
  lessonBreakdown: {
    lessonId: string;
    lessonTitle: string;
    type: LessonType;
    status: string;
    progressPercent: number;
  }[];
}
