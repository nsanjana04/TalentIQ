import type { ExternalLearningProvider } from "@prisma/client";
import type { ExternalSyncInput } from "@/types/learning-lrs";

export interface ExternalLearningAdapter {
  provider: ExternalLearningProvider;
  syncUserProgress(userId: string, accessToken?: string): Promise<ExternalSyncInput["records"]>;
}

function normalizeRecord(
  externalId: string,
  title: string,
  progressPercent: number,
  extras?: Partial<ExternalSyncInput["records"][number]>
): ExternalSyncInput["records"][number] {
  return {
    externalId,
    title,
    progressPercent: Math.min(100, Math.max(0, progressPercent)),
    ...extras,
  };
}

export class LinkedInLearningAdapter implements ExternalLearningAdapter {
  provider = "LINKEDIN_LEARNING" as const;

  async syncUserProgress(userId: string, accessToken?: string) {
    void userId;
    void accessToken;
    return [
      normalizeRecord("li-aws-fundamentals", "AWS Cloud Practitioner Essentials", 65, {
        url: "https://www.linkedin.com/learning/",
        timeSpentMinutes: 180,
      }),
    ];
  }
}

export class CourseraAdapter implements ExternalLearningAdapter {
  provider = "COURSERA" as const;

  async syncUserProgress(userId: string, accessToken?: string) {
    void userId;
    void accessToken;
    return [
      normalizeRecord("coursera-ml", "Machine Learning Specialization", 40, {
        url: "https://www.coursera.org/",
        timeSpentMinutes: 240,
      }),
    ];
  }
}

export class UdemyBusinessAdapter implements ExternalLearningAdapter {
  provider = "UDEMY_BUSINESS" as const;

  async syncUserProgress(userId: string, accessToken?: string) {
    void userId;
    void accessToken;
    return [
      normalizeRecord("udemy-aws-101", "AWS 101: Cloud Fundamentals", 100, {
        url: "https://business.udemy.com/",
        timeSpentMinutes: 360,
        status: "COMPLETED",
        completedAt: new Date().toISOString(),
      }),
    ];
  }
}

export class PluralsightAdapter implements ExternalLearningAdapter {
  provider = "PLURALSIGHT" as const;

  async syncUserProgress(userId: string, accessToken?: string) {
    void userId;
    void accessToken;
    return [
      normalizeRecord("ps-react-advanced", "React Advanced Patterns", 25, {
        url: "https://www.pluralsight.com/",
        timeSpentMinutes: 90,
      }),
    ];
  }
}

export class SkillsoftAdapter implements ExternalLearningAdapter {
  provider = "SKILLSOFT" as const;

  async syncUserProgress(userId: string, accessToken?: string) {
    void userId;
    void accessToken;
    return [
      normalizeRecord("ss-compliance-2024", "Annual Compliance Training 2024", 100, {
        url: "https://www.skillsoft.com/",
        timeSpentMinutes: 120,
        status: "COMPLETED",
        completedAt: new Date().toISOString(),
      }),
    ];
  }
}

const ADAPTERS: Record<ExternalLearningProvider, ExternalLearningAdapter> = {
  LINKEDIN_LEARNING: new LinkedInLearningAdapter(),
  COURSERA: new CourseraAdapter(),
  UDEMY_BUSINESS: new UdemyBusinessAdapter(),
  PLURALSIGHT: new PluralsightAdapter(),
  SKILLSOFT: new SkillsoftAdapter(),
};

export function getExternalAdapter(provider: ExternalLearningProvider): ExternalLearningAdapter {
  return ADAPTERS[provider];
}

export function getAllExternalAdapters(): ExternalLearningAdapter[] {
  return Object.values(ADAPTERS);
}
