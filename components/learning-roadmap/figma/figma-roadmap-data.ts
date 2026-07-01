import type { TechLogoKey } from "./figma-tech-logos";

import {
  DEMO_EMPLOYEE_LEARNING_STATS,
  DEMO_ROADMAP_COURSE_PROGRESS,
} from "@/constants/demo-learning-stats";

export type LevelCircleState = "active" | "available" | "locked";

export interface FigmaRoadmapCourse {
  id: string;
  slug: string;
  title: string;
  description: string;
  logo: TechLogoKey;
  status: "in_progress" | "available";
  progress: number;
  levels: LevelCircleState[];
}

/** One card per course topic — four progressive levels live on the course detail page only. */
export const FIGMA_ROADMAP_COURSES: FigmaRoadmapCourse[] = [
  {
    id: "1",
    slug: "python",
    title: "Python",
    description: "Start your Python journey and progress from beginner to expert.",
    logo: "python",
    status: DEMO_ROADMAP_COURSE_PROGRESS.python.status,
    progress: DEMO_ROADMAP_COURSE_PROGRESS.python.progress,
    levels: ["active", "locked", "locked", "locked"],
  },
  {
    id: "2",
    slug: "aws",
    title: "AWS Cloud",
    description: "Learn AWS fundamentals and design scalable cloud architectures.",
    logo: "aws",
    status: DEMO_ROADMAP_COURSE_PROGRESS.aws.status,
    progress: DEMO_ROADMAP_COURSE_PROGRESS.aws.progress,
    levels: ["active", "locked", "locked", "locked"],
  },
  {
    id: "3",
    slug: "devops",
    title: "DevOps",
    description: "Introduction to DevOps practices, CI/CD, and infrastructure as code.",
    logo: "devops",
    status: DEMO_ROADMAP_COURSE_PROGRESS.devops.status,
    progress: DEMO_ROADMAP_COURSE_PROGRESS.devops.progress,
    levels: ["active", "locked", "locked", "locked"],
  },
  {
    id: "4",
    slug: "kubernetes",
    title: "Kubernetes",
    description: "Understand Kubernetes basics and manage containerized workloads.",
    logo: "kubernetes",
    status: DEMO_ROADMAP_COURSE_PROGRESS.kubernetes.status,
    progress: DEMO_ROADMAP_COURSE_PROGRESS.kubernetes.progress,
    levels: ["available", "locked", "locked", "locked"],
  },
  {
    id: "5",
    slug: "java",
    title: "Java",
    description: "Build enterprise applications with Java from fundamentals to advanced patterns.",
    logo: "java",
    status: DEMO_ROADMAP_COURSE_PROGRESS.java.status,
    progress: DEMO_ROADMAP_COURSE_PROGRESS.java.progress,
    levels: ["active", "locked", "locked", "locked"],
  },
  {
    id: "6",
    slug: "javascript",
    title: "JavaScript",
    description: "Master modern JavaScript for web apps, APIs, and full-stack development.",
    logo: "javascript",
    status: DEMO_ROADMAP_COURSE_PROGRESS.javascript.status,
    progress: DEMO_ROADMAP_COURSE_PROGRESS.javascript.progress,
    levels: ["active", "locked", "locked", "locked"],
  },
  {
    id: "7",
    slug: "cyber-security",
    title: "Cyber Security",
    description: "Learn security fundamentals, risk management, and enterprise compliance.",
    logo: "security",
    status: DEMO_ROADMAP_COURSE_PROGRESS["cyber-security"].status,
    progress: DEMO_ROADMAP_COURSE_PROGRESS["cyber-security"].progress,
    levels: ["available", "locked", "locked", "locked"],
  },
  {
    id: "8",
    slug: "data-analytics",
    title: "Data Analytics",
    description: "Turn data into insights with SQL, visualization, and analytics workflows.",
    logo: "sql",
    status: DEMO_ROADMAP_COURSE_PROGRESS["data-analytics"].status,
    progress: DEMO_ROADMAP_COURSE_PROGRESS["data-analytics"].progress,
    levels: ["active", "locked", "locked", "locked"],
  },
];

/** Skill filter labels derived from roadmap courses (title keyword match). */
export const FIGMA_ROADMAP_SKILL_FILTERS = [
  "All Skills",
  "Python",
  "AWS",
  "DevOps",
  "Kubernetes",
  "Java",
  "JavaScript",
  "Security",
  "Data",
] as const;

export const ROADMAP_ADMIN_TITLE_KEYWORDS: Record<string, string> = {
  python: "Software Engineering",
  aws: "Cloud Computing",
  devops: "DevOps Essentials",
  kubernetes: "DevOps",
  java: "Software Engineering",
  javascript: "Software Engineering",
  "cyber-security": "Cyber Security",
  "data-analytics": "Data Analytics",
};

const SLUG_ALIASES: Record<string, string> = {
  "python-for-beginners": "python",
  "python-for-intermediate": "python",
  "python-for-advanced": "python",
  "python-for-expert": "python",
  "aws-cloud-basics": "aws",
  "aws-solutions-architect": "aws",
  "devops-fundamentals": "devops",
  "kubernetes-basics": "kubernetes",
};

export function findRoadmapCourseBySlug(slug: string): FigmaRoadmapCourse | undefined {
  const resolved = SLUG_ALIASES[slug] ?? slug;
  return FIGMA_ROADMAP_COURSES.find((course) => course.slug === resolved);
}

export function toRoadmapCourse(input: {
  slug: string;
  title: string;
  description: string;
  logo: TechLogoKey;
  status?: "in_progress" | "available";
  progress?: number;
}): FigmaRoadmapCourse {
  const existing = findRoadmapCourseBySlug(input.slug);
  if (existing) return existing;
  return {
    id: input.slug,
    slug: SLUG_ALIASES[input.slug] ?? input.slug,
    title: input.title,
    description: input.description,
    logo: input.logo,
    status: input.status ?? "available",
    progress: input.progress ?? 0,
    levels: ["available", "locked", "locked", "locked"],
  };
}
