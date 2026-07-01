export type LearningResourceType =
  | "LINK"
  | "YOUTUBE"
  | "PDF"
  | "DOCUMENT"
  | "VIDEO"
  | "MICROSOFT_LEARN"
  | "UDEMY"
  | "COURSERA"
  | "OTHER";

export type OpenCourseCategory = "PRODUCT" | "HR_POLICIES" | "SECURITY" | "GENERAL";

export interface LearningNavigationInfo {
  href: string;
  openInNewTab: boolean;
  embedUrl: string | null;
  provider: string;
}

export interface LearningResource {
  id: string;
  title: string;
  description: string | null;
  type: LearningResourceType;
  url: string;
  provider: string | null;
  isPublished: boolean;
  tags: string[];
  sortOrder: number;
  navigation: LearningNavigationInfo;
  isAssigned?: boolean;
  assignmentCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface OpenCourse {
  id: string;
  title: string;
  description: string | null;
  category: OpenCourseCategory;
  type: LearningResourceType;
  url: string;
  provider: string | null;
  thumbnailUrl: string | null;
  durationMinutes: number | null;
  isMandatory: boolean;
  isPublished: boolean;
  sortOrder: number;
  navigation: LearningNavigationInfo;
  completionStatus: "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED" | null;
  completedAt: string | null;
  isAssigned: boolean;
  assignmentCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface LearningContentOverview {
  resourceCount: number;
  publishedResources: number;
  openCourseCount: number;
  publishedOpenCourses: number;
  mandatoryOpenCourses: number;
}

export interface PublishedLearningContentOverview {
  resourceCount: number;
  openCourseCount: number;
  mandatoryOpenCourses: number;
}

export interface AssignableEmployee {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  teamName: string | null;
  departmentName: string | null;
}

export interface AssignableEmployeesResponse {
  scopeLabel: string;
  scopeType: string;
  users: AssignableEmployee[];
}

export interface OpenCourseAssignmentSummary {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  assignedAt: string;
  completionStatus: "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED" | null;
}

export interface AssignOpenCourseResult {
  openCourseId: string;
  assignedCount: number;
  userIds: string[];
}

export interface LearningResourceAssignmentSummary {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  assignedAt: string;
}

export interface AssignLearningResourceResult {
  resourceId: string;
  assignedCount: number;
  userIds: string[];
}

export interface OpenCourseLibrarySummary {
  total: number;
  mandatoryTotal: number;
  mandatoryCompleted: number;
  optionalTotal: number;
  optionalCompleted: number;
  byCategory: { category: OpenCourseCategory; total: number; completed: number }[];
}

export interface OpenCourseCurriculumLesson {
  id: string;
  openCourseId: string;
  title: string;
  type: LearningResourceType;
  durationMinutes: number | null;
  completionStatus: OpenCourse["completionStatus"];
}

export interface OpenCourseCurriculumModule {
  id: string;
  openCourseId: string;
  title: string;
  sortOrder: number;
  completionStatus: OpenCourse["completionStatus"];
  lessons: OpenCourseCurriculumLesson[];
}

export interface OpenCourseCurriculum {
  programTitle: string;
  modules: OpenCourseCurriculumModule[];
  completedModules: number;
  totalModules: number;
}

export interface OpenCoursePlayerData {
  course: OpenCourse;
  curriculum: OpenCourseCurriculum;
  canComplete: boolean;
  canManage: boolean;
}
