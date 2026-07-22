import { PYTHON_PATH_LEVELS } from "./python-learning-path";

/** Number of modules (and module assessments) per skill-path level course. */
export const MODULES_PER_LEVEL = 10;

const PYTHON_101_TOPICS = [
  "Getting Started with Python",
  "Variables and Data Types",
  "Operators and Expressions",
  "Control Flow — Conditionals",
  "Loops and Iteration",
  "Functions and Scope",
  "Lists and Tuples",
  "Dictionaries and Sets",
  "File Handling Basics",
  "Error Handling and Mini Project",
];

const PYTHON_201_TOPICS = [
  "OOP Fundamentals",
  "Classes and Inheritance",
  "Recursion Patterns",
  "Exception Handling Deep Dive",
  "File I/O and Context Managers",
  "Dictionaries and Collections",
  "Searching Algorithms",
  "Sorting Algorithms",
  "Modules and Packages",
  "Intermediate Project Review",
];

const PYTHON_301_TOPICS = [
  "Advanced OOP and Design",
  "Decorators and Generators",
  "Working with APIs",
  "Database Integration",
  "Web Scraping Basics",
  "Data Analysis with Pandas",
  "GUI Applications",
  "Automation Scripts",
  "Testing and Debugging",
  "Capstone Project Planning",
];

const PYTHON_401_TOPICS = [
  "Design Patterns in Python",
  "Concurrency Fundamentals",
  "AsyncIO and Async Patterns",
  "Performance Optimization",
  "Memory and Profiling",
  "Enterprise Architecture",
  "Security Best Practices",
  "Microservices with Python",
  "System Design Patterns",
  "Expert Capstone Review",
];

const GENERIC_TOPICS = Array.from(
  { length: MODULES_PER_LEVEL },
  (_, i) => `Module ${i + 1} — Core Concepts`
);

const TOPICS_BY_SLUG: Record<string, readonly string[]> = {
  "python-101": PYTHON_101_TOPICS,
  "python-201": PYTHON_201_TOPICS,
  "python-301": PYTHON_301_TOPICS,
  "python-401": PYTHON_401_TOPICS,
};

for (const level of PYTHON_PATH_LEVELS) {
  if (!TOPICS_BY_SLUG[level.slug]) {
    TOPICS_BY_SLUG[level.slug] = GENERIC_TOPICS;
  }
}

export function getModuleTopicsForCourse(slug: string): string[] {
  const topics = TOPICS_BY_SLUG[slug];
  if (topics) return [...topics];
  return [...GENERIC_TOPICS];
}
