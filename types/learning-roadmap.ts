export type LevelStepStatus = "locked" | "available" | "in_progress" | "completed";

export interface RoadmapStepProgress {
  courseProgress: number | null;
  courseStatus: string | null;
  completedLessons: number | null;
  totalLessons: number | null;
  assessmentPassed: boolean | null;
  assessmentScore: number | null;
  certificateIssued: boolean;
  certificateNumber: string | null;
}

export interface RoadmapLevelStep {
  id: string;
  levelCode: string;
  levelName: string;
  levelRank: number;
  title: string;
  description: string | null;
  estimatedDays: number | null;
  status: LevelStepStatus;
  course: {
    id: string;
    slug: string;
    title: string;
    durationMinutes: number | null;
    externalUrl: string | null;
    externalUnitCount: number | null;
    moduleCount: number;
  } | null;
  assessment: {
    id: string;
    title: string;
    passingScore: number;
    questionCount: number;
    quizReady: boolean;
  } | null;
  certificate: { id: string; name: string } | null;
  progress: RoadmapStepProgress;
}

export interface SkillRoadmap {
  skillId: string;
  skillName: string;
  skillSlug: string;
  categoryName: string;
  currentLevel: { code: string; name: string; rank: number } | null;
  targetLevel: { code: string; name: string; rank: number } | null;
  overallProgress: number;
  completedSteps: number;
  totalSteps: number;
  steps: RoadmapLevelStep[];
}

export interface LearningRoadmapOverview {
  userId: string;
  userName: string;
  jobRole: string | null;
  experienceLevel: string | null;
  overallProgress: number;
  skills: SkillRoadmap[];
}
