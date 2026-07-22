export interface SkillCategoryItem {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  parentId: string | null;
  parentName: string | null;
  skillCount: number;
}

export interface SkillLibraryItem {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  categoryId: string;
  categoryName: string;
  employeeCount: number;
  mappingCount: number;
}

export interface SkillLevelItem {
  id: string;
  name: string;
  code: string;
  rank: number;
  description: string | null;
  usageCount: number;
}

export interface SkillRelationItem {
  id: string;
  skillId: string;
  skillName: string;
  relatedSkillId: string;
  relatedSkillName: string;
  relationType: string;
}

export interface RoleMappingItem {
  id: string;
  jobRoleId: string;
  jobRoleTitle: string;
  experienceLevelId: string;
  experienceLevelName: string;
  skillId: string;
  skillName: string;
  requiredLevelId: string;
  requiredLevelName: string;
  isMandatory: boolean;
}

export interface CourseMappingItem {
  id: string;
  skillId: string;
  skillName: string;
  courseId: string;
  courseTitle: string;
  coveragePercent: number;
}

export interface AssessmentMappingItem {
  id: string;
  skillId: string;
  skillName: string;
  assessmentId: string;
  assessmentTitle: string;
}

export interface CertificateMappingItem {
  id: string;
  skillId: string;
  skillName: string;
  templateId: string;
  templateName: string;
}

export interface ValidityRuleItem {
  id: string;
  skillId: string;
  skillName: string;
  validityDays: number;
  gracePeriodDays: number;
  requiresRecertification: boolean;
  reassessmentDaysBeforeExpiry: number;
}

export interface WeightageRuleItem {
  id: string;
  skillId: string;
  skillName: string;
  jobRoleId: string | null;
  jobRoleTitle: string | null;
  experienceLevelId: string | null;
  experienceLevelName: string | null;
  weight: number;
  isMandatory: boolean;
}

export interface SkillAdminOverview {
  totalSkills: number;
  totalCategories: number;
  totalLevels: number;
  totalRoleMappings: number;
  totalCourseMappings: number;
  totalAssessmentMappings: number;
  totalCertificateMappings: number;
  skillsWithValidityRules: number;
  skillsWithWeightageRules: number;
}

export interface SkillAdminMeta {
  categories: { id: string; name: string }[];
  skills: { id: string; name: string }[];
  levels: { id: string; name: string; rank: number }[];
  jobRoles: { id: string; title: string }[];
  experienceLevels: { id: string; name: string }[];
  courses: { id: string; title: string }[];
  assessments: { id: string; title: string }[];
  certificateTemplates: { id: string; name: string }[];
}
