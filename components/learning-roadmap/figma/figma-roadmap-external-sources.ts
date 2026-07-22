import { UDEMY_FREE_ROADMAP_COURSES } from "@/constants/udemy-free-roadmap-courses";
import { detectProviderFromUrl } from "@/lib/utils/learning-url";

export interface FigmaRoadmapExternalSource {
  provider: string;
  /** One external URL per roadmap level (Basic → Expert). */
  levels: [string, string, string, string];
}

function udemy(slug: string): string {
  const course = UDEMY_FREE_ROADMAP_COURSES.find((entry) => entry.slug === slug);
  if (!course) {
    throw new Error(`Missing Udemy roadmap course: ${slug}`);
  }
  return course.url;
}

/** External learning platforms for each roadmap topic, keyed by course slug. */
export const FIGMA_ROADMAP_EXTERNAL_SOURCES: Record<string, FigmaRoadmapExternalSource> = {
  python: {
    provider: "Udemy",
    levels: [
      udemy("python-intro-programming"),
      udemy("python-beginner-intermediate-30min"),
      "https://www.udemy.com/course/the-python-mega-course/",
      "https://www.udemy.com/course/python-for-intermediate-learners-2023/",
    ],
  },
  aws: {
    provider: "Udemy",
    levels: [
      udemy("intro-cloud-computing"),
      udemy("cloud-computing-aws"),
      udemy("aws-zero-to-hero"),
      udemy("aws-zero-to-hero"),
    ],
  },
  devops: {
    provider: "Udemy",
    levels: [
      udemy("git-expert-4-hours"),
      udemy("cloud-computing-aws"),
      udemy("intro-cloud-computing"),
      udemy("aws-zero-to-hero"),
    ],
  },
  kubernetes: {
    provider: "Microsoft Learn",
    levels: [
      "https://learn.microsoft.com/en-us/training/modules/intro-to-kubernetes/",
      "https://learn.microsoft.com/en-us/training/modules/deploy-container-app-azure-kubernetes-service/",
      "https://learn.microsoft.com/en-us/training/paths/build-applications-kubernetes/",
      "https://learn.microsoft.com/en-us/training/paths/approach-containerize-aspnet-core-applications-development-operations/",
    ],
  },
  java: {
    provider: "Udemy",
    levels: [
      udemy("java-programming-free"),
      udemy("java-multithreading"),
      udemy("java-design-patterns"),
      udemy("java-design-patterns"),
    ],
  },
  javascript: {
    provider: "Udemy",
    levels: [
      udemy("quiz-app-html-css-js"),
      udemy("javascript-programming-free"),
      udemy("front-end-web-dev"),
      udemy("html-css-programming-free"),
    ],
  },
  "cyber-security": {
    provider: "Udemy",
    levels: [
      udemy("cyber-security-beginners"),
      udemy("kali-linux-ethical-hacking"),
      udemy("kali-linux-ethical-hacking"),
      udemy("kali-linux-ethical-hacking"),
    ],
  },
  "data-analytics": {
    provider: "Udemy",
    levels: [
      udemy("intro-databases-sql"),
      udemy("advanced-databases-sql"),
      udemy("advanced-databases-sql"),
      udemy("advanced-databases-sql"),
    ],
  },
};

export function getFigmaRoadmapLevelUrl(slug: string, levelNumber: number): string | undefined {
  const source = FIGMA_ROADMAP_EXTERNAL_SOURCES[slug];
  if (!source) return undefined;
  const index = Math.min(Math.max(levelNumber, 1), 4) - 1;
  return source.levels[index];
}

export function getFigmaRoadmapProvider(slug: string): string | undefined {
  return FIGMA_ROADMAP_EXTERNAL_SOURCES[slug]?.provider;
}

/** Pick the URL for the learner's current level, or the first level when not started. */
export function getFigmaRoadmapLaunchUrl(
  slug: string,
  levels: { number: number; status: string }[]
): string | undefined {
  const source = FIGMA_ROADMAP_EXTERNAL_SOURCES[slug];
  if (!source) return undefined;

  const active = levels.find((level) => level.status === "active");
  const available = levels.find((level) => level.status === "available");
  const target = active ?? available ?? levels[0];
  const levelNumber = target?.number ?? 1;
  return getFigmaRoadmapLevelUrl(slug, levelNumber);
}

export function resolveFigmaRoadmapProvider(slug: string, url?: string): string | undefined {
  const mapped = getFigmaRoadmapProvider(slug);
  if (mapped) return mapped;
  if (!url) return undefined;
  return detectProviderFromUrl(url).provider;
}
