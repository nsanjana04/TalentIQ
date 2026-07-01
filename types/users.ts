import type { RoleSlug } from "@/constants/role-slugs";

export interface UserRoleInfo {
  id: string;
  slug: RoleSlug;
  name: string;
}

export interface UserDepartmentInfo {
  id: string;
  name: string;
  code: string;
}

export interface UserTeamInfo {
  id: string;
  name: string;
  code: string;
}

export interface UserJobRoleInfo {
  id: string;
  title: string;
  code: string;
}

export interface UserListItem {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  initials: string;
  avatarColor: string;
  role: UserRoleInfo;
  department: UserDepartmentInfo | null;
  team: UserTeamInfo | null;
  jobRole: UserJobRoleInfo | null;
  isActive: boolean;
  skillCount: number;
  certificateCount: number;
  learningProgress: number;
  lastLoginAt: string | null;
  createdAt: string;
}

export interface UserSkillInfo {
  id: string;
  name: string;
  level: string;
  levelRank: number;
  verified: boolean;
}

export interface UserCertificateInfo {
  id: string;
  certificateNumber: string;
  issuedAt: string;
  expiresAt: string | null;
}

export interface UserEnrollmentInfo {
  id: string;
  courseTitle: string;
  progress: number;
  status: string;
}

export interface UserAssessmentInfo {
  id: string;
  assessmentTitle: string;
  score: number | null;
  maxScore: number | null;
  passed: boolean | null;
  status: string;
  submittedAt: string | null;
}

export interface UserActivityItem {
  id: string;
  action: string;
  entityType: string;
  description: string;
  createdAt: string;
  actorName: string | null;
}

export interface UserAnalyticsSnapshot {
  skillScore: number;
  learningScore: number;
  assessmentScore: number;
  certificateScore: number;
  workforceReadinessScore: number;
  riskLevel: "critical" | "high" | "medium" | "low" | "none";
}

export interface UserProfile extends UserListItem {
  experienceLevel: { id: string; name: string; code: string } | null;
  manager: { id: string; fullName: string; email: string } | null;
  emailVerified: boolean;
  skills: UserSkillInfo[];
  certificates: UserCertificateInfo[];
  enrollments: UserEnrollmentInfo[];
  assessments: UserAssessmentInfo[];
  activityTimeline: UserActivityItem[];
  analytics: UserAnalyticsSnapshot;
  updatedAt: string;
}

export interface PaginatedUsers {
  items: UserListItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface UserFiltersMeta {
  roles: { id: string; slug: string; name: string }[];
  departments: { id: string; name: string; code: string }[];
}

export interface UserListParams {
  page?: number;
  pageSize?: number;
  search?: string;
  roleId?: string;
  departmentId?: string;
  status?: "all" | "active" | "inactive";
}

export interface UpdateUserInput {
  firstName?: string;
  lastName?: string;
  email?: string;
  roleId?: string;
  departmentId?: string | null;
  teamId?: string | null;
  isActive?: boolean;
}
