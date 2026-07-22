/** Python skill path — 101 → 401 with Udemy links for learning roadmap and course catalog. */
export const PYTHON_PATH_LEVELS = [
  {
    level: "101",
    slug: "python-101",
    title: "Python for Beginners",
    days: 14,
    description:
      "Learn Python fundamentals with hands-on practice — variables, loops, functions, and mini-projects. " +
      "Alternative: Python for Absolute Beginners (udemy.com/course/free-python/).",
    url: "https://www.udemy.com/course/free-python-course-for-beginners/",
    durationMinutes: 480,
    totalUnits: 40,
  },
  {
    level: "201",
    slug: "python-201",
    title: "Python for Intermediate",
    days: 21,
    description:
      "OOP, recursion, file handling, exception handling, dictionaries, searching, and sorting algorithms.",
    url: "https://www.udemy.com/course/python-for-intermediate-learners-2023/",
    durationMinutes: 540,
    totalUnits: 36,
  },
  {
    level: "301",
    slug: "python-301",
    title: "Python for Advanced",
    days: 28,
    description:
      "Advanced Python concepts and real-world projects — build 10 applications. " +
      "Often discounted on Udemy; check current pricing before enrolling.",
    url: "https://www.udemy.com/course/the-python-mega-course/",
    durationMinutes: 600,
    totalUnits: 48,
  },
  {
    level: "401",
    slug: "python-401",
    title: "Python for Expert",
    days: 35,
    description:
      "Expert topics: design patterns, concurrency & AsyncIO, performance optimization, and enterprise architecture — " +
      "completed via capstone assessment in TalentIQ.",
    url: null,
    durationMinutes: 720,
    totalUnits: 0,
  },
] as const;

export const PYTHON_ROADMAP_PATH = PYTHON_PATH_LEVELS.map(({ level, slug, title, days }) => ({
  level,
  slug,
  title,
  days,
}));
