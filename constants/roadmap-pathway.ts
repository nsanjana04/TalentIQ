import type { TechLogoKey } from "@/components/learning-roadmap/figma/figma-tech-logos";
import { FIGMA_TOPIC_COURSE_SLUGS } from "@/constants/demo-learning-stats";
import { getExternalCourseUrl } from "@/constants/external-courses";

export interface RoadmapPathwayDefinition {
  slug: string;
  title: string;
  description: string;
  logo: TechLogoKey;
  provider: string;
  /** Approximate study time on external platform. */
  estimatedHours: number;
  /** Primary DB / external course slug for enroll + completion. */
  primaryCourseSlug: string;
  /** Keywords searched inside uploaded certificates. */
  certificateKeywords: string[];
}

export const ROADMAP_PATHWAY_NAME = "IT & Software Learning Path";

export const ROADMAP_PATHWAY_COURSES: RoadmapPathwayDefinition[] = [
  {
    slug: "python",
    title: "Python",
    description: "Start your Python journey and progress from beginner to expert.",
    logo: "python",
    provider: "Udemy",
    estimatedHours: 40,
    primaryCourseSlug: "python-101",
    certificateKeywords: ["python", "programming"],
  },
  {
    slug: "aws",
    title: "AWS Cloud",
    description: "Learn AWS fundamentals and design scalable cloud architectures.",
    logo: "aws",
    provider: "Udemy",
    estimatedHours: 35,
    primaryCourseSlug: "aws-zero-to-hero",
    certificateKeywords: ["aws", "cloud", "amazon"],
  },
  {
    slug: "devops",
    title: "DevOps",
    description: "Introduction to DevOps practices, CI/CD, and infrastructure as code.",
    logo: "devops",
    provider: "Udemy",
    estimatedHours: 30,
    primaryCourseSlug: "git-expert-4-hours",
    certificateKeywords: ["devops", "git", "ci/cd", "pipeline"],
  },
  {
    slug: "data-analytics",
    title: "Data Analytics",
    description: "Turn data into insights with SQL, visualization, and analytics workflows.",
    logo: "sql",
    provider: "Udemy",
    estimatedHours: 28,
    primaryCourseSlug: "intro-databases-sql",
    certificateKeywords: ["data", "analytics", "sql", "database"],
  },
  {
    slug: "kubernetes",
    title: "Kubernetes",
    description: "Understand Kubernetes basics and manage containerized workloads.",
    logo: "kubernetes",
    provider: "Udemy",
    estimatedHours: 25,
    primaryCourseSlug: "intro-cloud-computing",
    certificateKeywords: ["kubernetes", "k8s", "container"],
  },
  {
    slug: "cyber-security",
    title: "Cyber Security",
    description: "Learn security fundamentals, risk management, and enterprise compliance.",
    logo: "security",
    provider: "Udemy",
    estimatedHours: 32,
    primaryCourseSlug: "cyber-security-beginners",
    certificateKeywords: ["security", "cyber", "ethical", "hacking"],
  },
];

export const ACCEPTED_CERTIFICATE_PLATFORMS = [
  "Coursera",
  "Udemy",
  "Microsoft Learn",
  "Google",
  "LinkedIn Learning",
  "AWS",
  "Pluralsight",
] as const;

export function resolvePathwayExternalUrl(primaryCourseSlug: string): string {
  return (
    getExternalCourseUrl(primaryCourseSlug) ??
    `https://www.udemy.com/course/${primaryCourseSlug}/`
  );
}

export function getPathwayDefinition(slug: string): RoadmapPathwayDefinition | undefined {
  return ROADMAP_PATHWAY_COURSES.find((course) => course.slug === slug);
}

export function relatedDbSlugsForPathway(topicSlug: string): string[] {
  return FIGMA_TOPIC_COURSE_SLUGS[topicSlug] ?? [];
}
