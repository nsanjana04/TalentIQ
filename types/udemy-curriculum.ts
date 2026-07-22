export interface UdemyCurriculumLecture {
  title: string;
  durationMinutes?: number;
}

export interface UdemyCurriculumSection {
  title: string;
  lectures: UdemyCurriculumLecture[];
}

/** Udemy course syllabus mapped to TalentIQ course slug. */
export interface UdemyCurriculum {
  slug: string;
  sourceUrl: string;
  /** ISO date when curriculum was captured from Udemy. */
  capturedAt: string;
  sections: UdemyCurriculumSection[];
}

export interface UdemyCurriculumImportResult {
  slug: string;
  courseId: string;
  modulesCreated: number;
  lessonsCreated: number;
  assessmentsCreated: number;
  skipped?: boolean;
  reason?: string;
}
