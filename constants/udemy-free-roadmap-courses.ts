/** Free Udemy courses for the IT learning path roadmap (Basic → Expert). */
export type UdemyRoadmapLevel = "basic" | "intermediate" | "advanced" | "expert";

export type UdemyRoadmapLogo =
  | "python"
  | "java"
  | "aws"
  | "web"
  | "sql"
  | "excel"
  | "git"
  | "security"
  | "cpp"
  | "javascript"
  | "general";

export interface UdemyFreeRoadmapCourse {
  slug: string;
  title: string;
  description: string;
  url: string;
  level: UdemyRoadmapLevel;
  logo: UdemyRoadmapLogo;
  durationMinutes: number;
  totalUnits: number;
  startedProgress?: number;
}

export const UDEMY_ROADMAP_LEVEL_LABELS: Record<UdemyRoadmapLevel, string> = {
  basic: "Basic (Beginner)",
  intermediate: "Intermediate",
  advanced: "Advanced",
  expert: "Expert",
};

export const UDEMY_FREE_ROADMAP_COURSES: UdemyFreeRoadmapCourse[] = [
  // Basic (Beginner)
  {
    slug: "python-intro-programming",
    title: "Introduction To Python Programming",
    description: "Beginner Python fundamentals — syntax, variables, and your first programs.",
    url: "https://www.udemy.com/course/pythonforbeginnersintro/",
    level: "basic",
    logo: "python",
    durationMinutes: 180,
    totalUnits: 20,
  },
  {
    slug: "excel-for-beginners",
    title: "Useful Excel for Beginners",
    description: "Excel basics for new users — spreadsheets, formulas, and everyday workflows.",
    url: "https://www.udemy.com/course/useful-excel-for-beginners/",
    level: "basic",
    logo: "excel",
    durationMinutes: 120,
    totalUnits: 15,
  },
  {
    slug: "quiz-app-html-css-js",
    title: "Build a Quiz App with HTML, CSS, and JavaScript",
    description: "Intro web development project — build an interactive quiz from scratch.",
    url: "https://www.udemy.com/course/build-a-quiz-app-with-html-css-and-javascript/",
    level: "basic",
    logo: "web",
    durationMinutes: 150,
    totalUnits: 18,
  },
  {
    slug: "intro-databases-sql",
    title: "Introduction to Databases and SQL Querying",
    description: "SQL and database basics — tables, queries, and relational data fundamentals.",
    url: "https://www.udemy.com/course/introduction-to-databases-and-sql-querying/",
    level: "basic",
    logo: "sql",
    durationMinutes: 200,
    totalUnits: 22,
  },
  {
    slug: "c-programming-free",
    title: "C Programming for Beginners",
    description: "Free introduction to C — syntax, data types, control structures, and foundational coding.",
    url: "https://www.udemy.com/course/c-programming-for-beginners-/",
    level: "basic",
    logo: "cpp",
    durationMinutes: 300,
    totalUnits: 30,
  },
  // Intermediate
  {
    slug: "python-beginner-intermediate-30min",
    title: "Python from Beginner to Intermediate in 30 min",
    description: "Bridges beginner concepts to practical Python with focused hands-on examples.",
    url: "https://www.udemy.com/course/python-from-beginner-to-intermediate-in-30-minutes/",
    level: "intermediate",
    logo: "python",
    durationMinutes: 30,
    totalUnits: 8,
  },
  {
    slug: "java-multithreading",
    title: "Java Multithreading",
    description: "Concurrent programming concepts in Java — threads, synchronization, and parallelism.",
    url: "https://www.udemy.com/course/java-multithreading/",
    level: "intermediate",
    logo: "java",
    durationMinutes: 240,
    totalUnits: 24,
  },
  {
    slug: "git-expert-4-hours",
    title: "Git: Become an Expert in Git & GitHub in 4 Hours",
    description: "Version control beyond the basics — branching, merging, and collaborative workflows.",
    url: "https://www.udemy.com/course/git-expert-4-hours/",
    level: "intermediate",
    logo: "git",
    durationMinutes: 240,
    totalUnits: 28,
  },
  {
    slug: "cloud-computing-aws",
    title: "Cloud Computing With Amazon Web Services",
    description: "Practical AWS concepts — core services, deployment patterns, and cloud fundamentals.",
    url: "https://www.udemy.com/course/cloud-computing-with-amazon-web-services/",
    level: "intermediate",
    logo: "aws",
    durationMinutes: 300,
    totalUnits: 32,
  },
  {
    slug: "java-programming-free",
    title: "Java for Total Beginners",
    description: "Essential Java programming concepts and hands-on programs for absolute beginners.",
    url: "https://www.udemy.com/course/easy-to-follow-java-programming/",
    level: "intermediate",
    logo: "java",
    durationMinutes: 104,
    totalUnits: 22,
  },
  // Advanced
  {
    slug: "advanced-databases-sql",
    title: "Advanced Databases and SQL Querying",
    description: "Advanced SQL techniques — joins, subqueries, indexing, and performance tuning.",
    url: "https://www.udemy.com/course/advanced-databases-and-sql-querying/",
    level: "advanced",
    logo: "sql",
    durationMinutes: 280,
    totalUnits: 30,
  },
  {
    slug: "java-design-patterns",
    title: "Java Design Patterns and Architecture",
    description: "Enterprise-level software design — patterns, SOLID principles, and architecture.",
    url: "https://www.udemy.com/course/java-design-patterns-and-architecture/",
    level: "advanced",
    logo: "java",
    durationMinutes: 360,
    totalUnits: 36,
  },
  {
    slug: "oop-cpp",
    title: "Object Oriented Programming in C++",
    description: "Deep dive into OOP concepts — classes, inheritance, polymorphism, and abstraction.",
    url: "https://www.udemy.com/course/object-oriented-programming-in-c-plus-plus/",
    level: "advanced",
    logo: "cpp",
    durationMinutes: 320,
    totalUnits: 34,
  },
  {
    slug: "front-end-web-dev",
    title: "Foundations of Front-End Web Development",
    description: "Advanced frontend engineering — responsive layouts, tooling, and modern practices.",
    url: "https://www.udemy.com/course/foundations-of-front-end-web-development/",
    level: "advanced",
    logo: "web",
    durationMinutes: 400,
    totalUnits: 40,
  },
  {
    slug: "javascript-programming-free",
    title: "Free JavaScript Programming — Part 1",
    description: "JavaScript fundamentals — language basics, functions, and OOP concepts.",
    url: "https://www.udemy.com/course/free-java-script-programming-language-course-part-1/",
    level: "advanced",
    logo: "javascript",
    durationMinutes: 90,
    totalUnits: 10,
  },
  // Expert
  {
    slug: "kali-linux-ethical-hacking",
    title: "Start Kali Linux, Ethical Hacking and Penetration Testing!",
    description: "Security-focused learning path — reconnaissance, exploitation, and ethical hacking.",
    url: "https://www.udemy.com/course/start-kali-linux-ethical-hacking-and-penetration-testing/",
    level: "expert",
    logo: "security",
    durationMinutes: 480,
    totalUnits: 42,
  },
  {
    slug: "aws-zero-to-hero",
    title: "Amazon Web Services (AWS) – Zero to Hero",
    description: "Cloud engineering progression — design, deploy, and operate production AWS workloads.",
    url: "https://www.udemy.com/course/amazon-web-services-aws-v2/",
    level: "expert",
    logo: "aws",
    durationMinutes: 540,
    totalUnits: 48,
  },
  {
    slug: "intro-cloud-computing",
    title: "Introduction to Cloud Computing",
    description: "Cloud architecture fundamentals leading toward expert certification tracks.",
    url: "https://www.udemy.com/course/introduction-to-cloud-computing/",
    level: "expert",
    logo: "aws",
    durationMinutes: 300,
    totalUnits: 28,
  },
  {
    slug: "cyber-security-beginners",
    title: "Cyber Security Course for Beginners – Level 01",
    description: "Starting point for advanced cybersecurity specialization and defense strategies.",
    url: "https://www.udemy.com/course/cyber-security-course-for-beginners/",
    level: "expert",
    logo: "security",
    durationMinutes: 360,
    totalUnits: 32,
  },
  {
    slug: "html-css-programming-free",
    title: "HTML & CSS for Beginners",
    description: "Build web pages with semantic markup, styling, and layout basics in a crash course.",
    url: "https://www.udemy.com/course/html-and-css-for-beginners-crash-course-learn-fast-easy/",
    level: "expert",
    logo: "web",
    durationMinutes: 180,
    totalUnits: 24,
  },
];
