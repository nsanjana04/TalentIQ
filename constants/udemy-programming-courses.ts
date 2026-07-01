import { PYTHON_PATH_LEVELS } from "./python-learning-path";
import { UDEMY_FREE_ROADMAP_COURSES } from "./udemy-free-roadmap-courses";

/** Free Udemy programming courses surfaced on the Courses screen. */
export interface UdemyProgrammingCourseSeed {
  slug: string;
  title: string;
  description: string;
  url: string;
  durationMinutes: number;
  totalUnits: number;
  startedProgress?: number;
}

const PYTHON_UDEMY_COURSES: UdemyProgrammingCourseSeed[] = PYTHON_PATH_LEVELS.filter(
  (level): level is (typeof PYTHON_PATH_LEVELS)[number] & { url: string } => !!level.url
).map((level) => ({
  slug: level.slug,
  title: level.title,
  description: level.description,
  url: level.url,
  durationMinutes: level.durationMinutes,
  totalUnits: level.totalUnits,
  startedProgress: 10,
}));

const ROADMAP_UDEMY_COURSES: UdemyProgrammingCourseSeed[] = UDEMY_FREE_ROADMAP_COURSES.map(
  (course) => ({
    slug: course.slug,
    title: course.title,
    description: course.description,
    url: course.url,
    durationMinutes: course.durationMinutes,
    totalUnits: course.totalUnits,
    startedProgress: course.startedProgress ?? 10,
  })
);

const slugSeen = new Set<string>();

export const UDEMY_PROGRAMMING_COURSES: UdemyProgrammingCourseSeed[] = [
  ...PYTHON_UDEMY_COURSES,
  ...ROADMAP_UDEMY_COURSES,
].filter((course) => {
  if (slugSeen.has(course.slug)) return false;
  slugSeen.add(course.slug);
  return true;
});
