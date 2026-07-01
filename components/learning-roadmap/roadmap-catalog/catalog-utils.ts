import type { LevelStepStatus, RoadmapLevelStep, SkillRoadmap } from "@/types/learning-roadmap";

export type CatalogStatus = "not_started" | "in_progress" | "completed" | "locked";

export const CATALOG_PAGE_SIZE = 12;

export function getCatalogStatus(skill: SkillRoadmap): CatalogStatus {
  if (skill.completedSteps >= skill.totalSteps && skill.totalSteps > 0) return "completed";
  if (skill.steps.every((s) => s.status === "locked")) return "locked";
  if (skill.steps.some((s) => s.status === "in_progress")) return "in_progress";
  if (skill.overallProgress > 0) return "in_progress";
  return "not_started";
}

export function getCatalogStatusLabel(status: CatalogStatus): string {
  switch (status) {
    case "not_started":
      return "Not Started";
    case "in_progress":
      return "In Progress";
    case "completed":
      return "Completed";
    case "locked":
      return "Locked";
  }
}

export function getCourseDisplayName(skill: SkillRoadmap): string {
  const active = getActiveStep(skill);
  return active?.course?.title ?? active?.title ?? skill.skillName;
}

export function getCourseDescription(skill: SkillRoadmap): string {
  const active = getActiveStep(skill);
  if (active?.description) return active.description;
  const first = skill.steps.find((s) => s.description)?.description;
  if (first) return first;
  const name = getCourseDisplayName(skill);
  return `Complete ${name}, pass the assessment, and earn your certificate.`;
}

export function getActiveStep(skill: SkillRoadmap): RoadmapLevelStep | undefined {
  return (
    skill.steps.find((s) => s.status === "in_progress") ??
    skill.steps.find((s) => s.status === "available") ??
    skill.steps[0]
  );
}

export function getEstimatedHours(skill: SkillRoadmap): number {
  const minutes = skill.steps.reduce((sum, step) => sum + (step.course?.durationMinutes ?? 180), 0);
  return Math.max(1, Math.round(minutes / 60));
}

export function getCourseInitials(skill: SkillRoadmap): string {
  const name = skill.skillName || getCourseDisplayName(skill);
  return name
    .split(/\s+/)
    .map((w) => w[0] ?? "")
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

const ACCENTS = ["#0B3B75", "#3776AB", "#FF9900", "#326CE5", "#2496ED", "#7C3AED"];

export function getCourseAccent(skill: SkillRoadmap): string {
  const hash = skill.skillSlug.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return ACCENTS[hash % ACCENTS.length] ?? ACCENTS[0]!;
}

export function getDifficulty(skill: SkillRoadmap): string {
  return skill.currentLevel?.name ?? skill.steps[0]?.levelName ?? "Beginner";
}

export function getCurrentLevelLabel(skill: SkillRoadmap): string {
  const active = getActiveStep(skill);
  return active ? `Level ${active.levelRank}` : "Level 1";
}

export function hasCertificate(skill: SkillRoadmap): boolean {
  return skill.steps.some((s) => s.certificate);
}

export function getLevelMilestoneStatus(step: RoadmapLevelStep): LevelStepStatus {
  return step.status;
}

export function countTotalModules(skill: SkillRoadmap): number {
  return skill.steps.reduce((sum, s) => sum + (s.course?.moduleCount ?? 0), 0);
}

export function countTotalAssessments(skill: SkillRoadmap): number {
  return skill.steps.filter((s) => s.assessment).length;
}

export function getLearningOutcomes(skill: SkillRoadmap): string[] {
  return skill.steps
    .map((s) => s.title)
    .filter(Boolean)
    .slice(0, 4);
}

export function getPrerequisites(skill: SkillRoadmap): string {
  const locked = skill.steps.filter((s) => s.status === "locked");
  if (!locked.length) return "No prerequisites — you can begin immediately.";
  return `Complete ${locked[0]?.levelCode ?? "prior levels"} to unlock advanced content.`;
}
