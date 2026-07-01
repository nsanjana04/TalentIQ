import type {
  AssignmentTargetType,
  CourseAdminStatus,
  CourseAssignmentStatus,
  CourseLevelTier,
} from "@prisma/client";

export type { AssignmentTargetType, CourseAdminStatus, CourseAssignmentStatus, CourseLevelTier };

export const COURSE_LEVEL_TIERS: CourseLevelTier[] = [
  "BASIC",
  "INTERMEDIATE",
  "ADVANCED",
  "EXPERT",
];

export const COURSE_LEVEL_TIER_LABELS: Record<CourseLevelTier, string> = {
  BASIC: "Basic",
  INTERMEDIATE: "Intermediate",
  ADVANCED: "Advanced",
  EXPERT: "Expert",
};

export const ACTIVE_ASSIGNMENT_STATUSES: CourseAssignmentStatus[] = [
  "NOT_STARTED",
  "IN_PROGRESS",
  "OVERDUE",
];

export interface AdminCourseSummary {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  category: string | null;
  adminStatus: CourseAdminStatus;
  durationMinutes: number | null;
  skillsCovered: string[];
  levelCount: number;
  assignmentCount: number;
  createdByName: string | null;
  createdAt: string;
}

export interface AdminCourseLevel {
  id: string;
  courseId: string;
  tier: CourseLevelTier;
  name: string;
  description: string | null;
  durationHours: number;
  learningObjectives: string[];
  passingScore: number;
  orderNumber: number;
  unlockRule: string | null;
  certificateEnabled: boolean;
}

export interface AssignableUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  jobTitle: string | null;
  departmentId: string | null;
  departmentName: string | null;
  teamId: string | null;
  teamName: string | null;
  roleName: string | null;
  isActive: boolean;
}

export interface AssignableDepartment {
  id: string;
  name: string;
  code: string;
  employeeCount: number;
}

export interface AssignableTeam {
  id: string;
  name: string;
  code: string;
  departmentName: string;
  memberCount: number;
}

export interface AssignableRole {
  id: string;
  name: string;
  slug: string;
  userCount: number;
}

export interface AssignmentPreviewUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  departmentName: string | null;
}

export interface AssignmentPreviewResult {
  targetType: AssignmentTargetType;
  targetLabel: string;
  usersAffected: number;
  duplicateUsers: AssignmentPreviewUser[];
  inactiveUsersSkipped: AssignmentPreviewUser[];
  prerequisiteWarnings: { userId: string; userName: string; message: string }[];
  finalAssignableUsers: AssignmentPreviewUser[];
}

export interface AssignmentBatchSummary {
  id: string;
  courseId: string;
  courseTitle: string;
  courseLevelId: string;
  levelName: string;
  levelTier: CourseLevelTier;
  targetType: AssignmentTargetType;
  targetLabel: string;
  assignedByName: string;
  assignedAt: string;
  dueDate: string;
  status: CourseAssignmentStatus;
  totalUsers: number;
  completedUsers: number;
  overdueUsers: number;
  progressPercent: number;
}

export interface AssignmentBatchDetail extends AssignmentBatchSummary {
  notes: string | null;
  priority: string | null;
  reminderSchedule: string | null;
  userAssignments: UserAssignmentSummary[];
}

export interface UserAssignmentSummary {
  id: string;
  userId: string;
  userName: string;
  email: string;
  departmentName: string | null;
  dueDate: string;
  status: CourseAssignmentStatus;
  progressPercent: number;
  startedAt: string | null;
  completedAt: string | null;
  lastActivityAt: string | null;
}

export interface MyCourseAssignment {
  id: string;
  courseId: string;
  courseTitle: string;
  courseLevelId: string;
  levelName: string;
  levelTier: CourseLevelTier;
  dueDate: string;
  status: CourseAssignmentStatus;
  progressPercent: number;
  startedAt: string | null;
  completedAt: string | null;
}

export interface LearningAdminDashboard {
  totalCourses: number;
  totalAssignments: number;
  completionRate: number;
  overdueAssignments: number;
  departmentCompletionRate: number;
  coursesByLevel: { level: string; count: number }[];
  assignmentsByAudience: { targetType: AssignmentTargetType; count: number }[];
  recentAssignments: AssignmentBatchSummary[];
}

export interface DepartmentProgressRow {
  departmentId: string;
  departmentName: string;
  totalAssignments: number;
  completed: number;
  inProgress: number;
  overdue: number;
  completionRate: number;
}

export interface LearningProgressRow {
  userId: string;
  userName: string;
  departmentName: string | null;
  courseTitle: string;
  levelName: string;
  status: CourseAssignmentStatus;
  progressPercent: number;
  dueDate: string;
  lastActivityAt: string | null;
}
