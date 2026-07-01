import type { SkillRoadmap } from "@/types/learning-roadmap";
import type { LevelStepStatus } from "@/types/learning-roadmap";

export function getSkillPathStatus(skill: SkillRoadmap): LevelStepStatus {
  if (skill.completedSteps >= skill.totalSteps && skill.totalSteps > 0) return "completed";
  if (skill.steps.some((s) => s.status === "in_progress")) return "in_progress";
  if (skill.steps.some((s) => s.status === "available")) return "available";
  return "locked";
}

export function getCurrentRoadmapSkill(skills: SkillRoadmap[]): SkillRoadmap | null {
  if (!skills.length) return null;
  return (
    skills.find((s) => s.steps.some((st) => st.status === "in_progress")) ??
    skills.find((s) => s.steps.some((st) => st.status === "available")) ??
    skills[0] ??
    null
  );
}

export function getCardTitle(skill: SkillRoadmap): string {
  const active =
    skill.steps.find((s) => s.status === "in_progress") ??
    skill.steps.find((s) => s.status === "available") ??
    skill.steps[0];
  return active?.course?.title ?? active?.title ?? skill.skillName;
}

export function getSkillPathDescription(skill: SkillRoadmap): string {
  const active = skill.steps.find((s) => s.status === "in_progress") ?? skill.steps[0];
  if (active?.description) return active.description;
  const first = skill.steps.find((s) => s.description)?.description;
  if (first) return first;
  return `Master ${skill.skillName} through ${skill.totalSteps} structured levels — from fundamentals to advanced topics.`;
}

export function getSkillPathHours(skill: SkillRoadmap): number {
  const minutes = skill.steps.reduce((sum, step) => sum + (step.course?.durationMinutes ?? 180), 0);
  return Math.max(1, Math.round(minutes / 60));
}

export function getActiveStep(skill: SkillRoadmap) {
  return (
    skill.steps.find((s) => s.status === "in_progress") ??
    skill.steps.find((s) => s.status === "available") ??
    skill.steps[0]
  );
}

export function getSkillInitials(name: string): string {
  return name
    .split(/\s+/)
    .map((w) => w[0] ?? "")
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

const SKILL_ACCENTS = ["#3776ab", "#ff9900", "#326ce5", "#2496ed", "#0b3b75", "#7c3aed"];

export function getSkillAccent(slug: string): string {
  const hash = slug.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return SKILL_ACCENTS[hash % SKILL_ACCENTS.length] ?? SKILL_ACCENTS[0]!;
}

export function getDifficultyLabel(skill: SkillRoadmap): string {
  return skill.currentLevel?.name ?? skill.steps[0]?.levelName ?? "Beginner";
}
