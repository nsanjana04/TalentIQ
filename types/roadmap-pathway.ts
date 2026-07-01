import type { TechLogoKey } from "@/components/learning-roadmap/figma/figma-tech-logos";
import type { PathwayLevelTier } from "@/constants/roadmap-pathway-levels";

export type RoadmapCourseStatus = "not_started" | "in_progress" | "completed";
export type PathwayCourseStatus = RoadmapCourseStatus;
export type PathwayLevelContentStatus = "locked" | "available" | "completed";
export type PathwayFinalAssessmentStatus = "locked" | "available" | "passed" | "failed";

export interface RoadmapPathwayCourse {
  id: string;
  slug: string;
  title: string;
  description: string;
  logo: TechLogoKey;
  pathwayName: string;
  externalUrl: string;
  courseId: string | null;
  progress: number;
  status: RoadmapCourseStatus;
  provider: string;
  estimatedHours: number;
  nextLevelName: string | null;
  finalAssessmentStatus: PathwayFinalAssessmentStatus;
  lastAssessmentScorePercent: number | null;
  /** Always 1 final assessment per course. */
  totalAssessments: number;
  passedAssessments: number;
  allAssessmentsPassed: boolean;
  certificateUnlocked: boolean;
  certificateComplete: boolean;
  levelsContentComplete: number;
  levelsContentTotal: number;
}

export interface PathwayContentTopic {
  id: string;
  title: string;
  sortOrder: number;
}

export interface PathwayLevelCurriculum {
  tier: PathwayLevelTier;
  name: string;
  courseSlug: string;
  externalUrl: string | null;
  topics: PathwayContentTopic[];
  contentStatus: PathwayLevelContentStatus;
  isLocked: boolean;
}

export interface PathwayFinalAssessmentInfo {
  assessmentId: string | null;
  title: string;
  questionCount: number;
  passingScore: number;
  status: PathwayFinalAssessmentStatus;
  unlocked: boolean;
  /** Question sections ordered Basic → Expert. */
  sections: {
    tier: PathwayLevelTier;
    name: string;
    mcqCount: number;
    codeCount: number;
  }[];
}

export interface PathwayCourseCurriculum {
  pathwaySlug: string;
  title: string;
  description: string;
  primaryCourseId: string | null;
  levels: PathwayLevelCurriculum[];
  finalAssessment: PathwayFinalAssessmentInfo;
  levelsContentComplete: number;
  levelsContentTotal: number;
  allContentComplete: boolean;
  allAssessmentsPassed: boolean;
  certificateUnlocked: boolean;
  certificateComplete: boolean;
  progress: number;
  status: PathwayCourseStatus;
}

export interface RoadmapPathwayOverview {
  pathwayName: string;
  pathwayDescription: string;
  lastUpdated: string;
  lastActivityLabel: string;
  courses: RoadmapPathwayCourse[];
  coursesTotal: number;
  coursesCompleted: number;
  coursesInProgress: number;
  certificatesEarned: number;
  overallProgressPercent: number;
  totalEstimatedHours: number;
}

export interface CertificateVerificationResult {
  verified: boolean;
  rejectionReason?: string;
  extracted?: {
    learner: string;
    course: string;
    issued: string;
    platform: string;
  };
}
