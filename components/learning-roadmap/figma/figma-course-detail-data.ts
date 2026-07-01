import {
  UDEMY_FREE_ROADMAP_COURSES,
  UDEMY_ROADMAP_LEVEL_LABELS,
} from "@/constants/udemy-free-roadmap-courses";
import {
  FIGMA_ROADMAP_EXTERNAL_SOURCES,
  getFigmaRoadmapLaunchUrl,
  resolveFigmaRoadmapProvider,
} from "./figma-roadmap-external-sources";
import type { TechLogoKey } from "./figma-tech-logos";

export type LessonStatus = "completed" | "in_progress" | "locked";
export type LevelStatus = "active" | "available" | "locked";

export interface CourseLesson {
  num: string;
  title: string;
  duration: string;
  status: LessonStatus;
}

export interface CourseAssessment {
  title: string;
  questions: number;
  score?: string;
  locked?: boolean;
}

export interface CourseLevel {
  number: number;
  title: string;
  summary: string;
  status: LevelStatus;
  progress?: number;
  lessonCount: number;
  duration: string;
  /** Hosted on Udemy, Microsoft Learn, etc. */
  externalUrl?: string;
  /** Learning Content tab — lessons shown when level is expanded */
  lessons?: CourseLesson[];
  assessment?: CourseAssessment;
  /** Levels tab — show sub-items preview when locked but visible */
  showContentWhenLocked?: boolean;
}

export interface CourseResource {
  title: string;
  type: "PDF" | "Link" | "Video" | "Cheatsheet";
  description: string;
}

export interface FigmaCourseDetail {
  slug: string;
  title: string;
  description: string;
  logo: TechLogoKey;
  roadmapName: string;
  status: "in_progress" | "available";
  progress: number;
  difficulty: string;
  estimatedHours: string;
  certificate: boolean;
  totalModules: number;
  totalAssessments: number;
  overview: string;
  learningObjectives: string[];
  levels: CourseLevel[];
  resources: CourseResource[];
  /** When set, course content is hosted on Udemy. */
  externalUrl?: string;
  provider?: string;
}

const PYTHON_COURSE: FigmaCourseDetail = {
  slug: "python",
  title: "Python",
  description: "Start your Python journey and progress from beginner to expert.",
  logo: "python",
  roadmapName: "Python Learning Path",
  status: "in_progress",
  progress: 10,
  difficulty: "Beginner",
  estimatedHours: "~12 Hours",
  certificate: true,
  totalModules: 16,
  totalAssessments: 4,
  overview:
    "This Python course takes you from your first line of code through progressively harder topics to expert-level mastery. At the basic level you will learn syntax, variables, control flow, and data structures — without object-oriented programming. OOP and advanced topics begin at the intermediate level (201) and above.",
  learningObjectives: [
    "Understand Python syntax and basic programming concepts",
    "Install and configure a Python development environment",
    "Write and run your first Python scripts",
    "Work with variables, data types, and basic operators",
    "Complete a mini project to apply what you have learned",
  ],
  levels: [
    {
      number: 1,
      title: "Getting Started with Python",
      summary:
        "Learn what Python is, set up your environment, and write your first programs. Covers installation, syntax basics, and introductory exercises.",
      status: "active",
      progress: 10,
      lessonCount: 4,
      duration: "~65 min",
      lessons: [
        { num: "1.1", title: "Introduction to Python", duration: "10 min", status: "completed" },
        { num: "1.2", title: "Installing Python", duration: "15 min", status: "completed" },
        { num: "1.3", title: "Your First Python Program", duration: "20 min", status: "completed" },
        { num: "1.4", title: "Python Syntax Basics", duration: "20 min", status: "in_progress" },
      ],
      assessment: { title: "Assessment 1: Module 1 Quiz", questions: 10, score: "75%" },
    },
    {
      number: 2,
      title: "Python Fundamentals",
      summary:
        "Dive into variables, data types, operators, and input/output. Build a solid understanding of how Python handles data.",
      status: "locked",
      lessonCount: 4,
      duration: "~65 min",
      showContentWhenLocked: true,
      lessons: [
        { num: "2.1", title: "Variables and Data Types", duration: "15 min", status: "locked" },
        { num: "2.2", title: "Operators in Python", duration: "20 min", status: "locked" },
        { num: "2.3", title: "Input and Output", duration: "15 min", status: "locked" },
        { num: "2.4", title: "Type Conversion and Casting", duration: "15 min", status: "locked" },
      ],
      assessment: { title: "Assessment 2: Module 2 Quiz", questions: 10, locked: true },
    },
    {
      number: 3,
      title: "Control Flow and Functions",
      summary:
        "Master conditional statements, loops, and functions to write more powerful and reusable Python code.",
      status: "locked",
      lessonCount: 4,
      duration: "~3 Hours",
    },
    {
      number: 4,
      title: "Mini Project",
      summary:
        "Apply everything you have learned by building a small Python application from scratch with guided steps.",
      status: "locked",
      lessonCount: 4,
      duration: "~4 Hours",
    },
  ],
  resources: [
    {
      title: "Python Official Documentation",
      type: "Link",
      description: "Reference guide for Python 3 syntax and standard library.",
    },
    {
      title: "Python Syntax Cheatsheet",
      type: "Cheatsheet",
      description: "Quick reference for variables, operators, and control flow.",
    },
    {
      title: "Setup Guide — Windows & macOS",
      type: "PDF",
      description: "Step-by-step installation instructions for your operating system.",
    },
    {
      title: "Intro to Python — Video Walkthrough",
      type: "Video",
      description: "15-minute overview of the course structure and first program.",
    },
  ],
};

function buildCourseDetail(
  base: Pick<
    FigmaCourseDetail,
    | "slug"
    | "title"
    | "description"
    | "logo"
    | "status"
    | "progress"
    | "difficulty"
    | "overview"
    | "learningObjectives"
  >,
  levelTitles: [string, string, string, string],
  options?: { firstLevelActive?: boolean; roadmapName?: string }
): FigmaCourseDetail {
  const roadmapName =
    options?.roadmapName ??
    (base.logo === "python"
      ? "Python Learning Path"
      : base.logo === "aws"
        ? "AWS Learning Path"
        : base.logo === "kubernetes"
          ? "DevOps Learning Path"
          : base.logo === "java"
            ? "Java Learning Path"
            : base.logo === "javascript"
              ? "Web Development Path"
              : base.logo === "security"
                ? "Security Learning Path"
                : base.logo === "sql"
                  ? "Data & Analytics Path"
                  : "IT & Software Learning Path");

  return {
    ...base,
    roadmapName,
    estimatedHours: base.difficulty === "Beginner" ? "~12 Hours" : "~16 Hours",
    certificate: true,
    totalModules: 16,
    totalAssessments: 4,
    levels: levelTitles.map((title, i) => {
      const isActive = options?.firstLevelActive && i === 0 && base.status === "in_progress";
      const isAvailable = i === 0 && base.status === "available";
      const status: LevelStatus = isActive ? "active" : isAvailable ? "available" : "locked";
      return {
        number: i + 1,
        title,
        summary: `Level ${i + 1} covers ${title.toLowerCase()} through guided lessons, exercises, and an end-of-level assessment.`,
        status,
        progress: isActive ? base.progress : undefined,
        lessonCount: 4,
        duration: i === 0 ? "~65 min" : i === 3 ? "~4 Hours" : "~3 Hours",
        lessons:
          isActive
            ? [
                { num: `${i + 1}.1`, title: `Introduction to ${title}`, duration: "10 min", status: "completed" as const },
                { num: `${i + 1}.2`, title: "Core Concepts", duration: "15 min", status: "locked" as const },
                { num: `${i + 1}.3`, title: "Hands-on Exercise", duration: "20 min", status: "locked" as const },
                { num: `${i + 1}.4`, title: "Level Review", duration: "20 min", status: "locked" as const },
              ]
            : undefined,
        assessment:
          i < 3
            ? { title: `Assessment ${i + 1}: Module ${i + 1} Quiz`, questions: 10, locked: i > 0 }
            : undefined,
      };
    }),
    resources: [
      {
        title: `${base.title} — Study Guide`,
        type: "PDF",
        description: "Downloadable reference covering all key topics in this course.",
      },
      {
        title: `${base.title} — Quick Reference`,
        type: "Cheatsheet",
        description: "One-page summary of the most important concepts.",
      },
      {
        title: "Official Documentation",
        type: "Link",
        description: "External reference documentation for this technology.",
      },
    ],
  };
}

function formatEstimatedHours(minutes: number): string {
  if (minutes < 60) return `~${minutes} min`;
  const hours = Math.round(minutes / 60);
  return hours === 1 ? "~1 Hour" : `~${hours} Hours`;
}

function buildUdemyCourseDetail(
  course: (typeof UDEMY_FREE_ROADMAP_COURSES)[number],
  index: number
): FigmaCourseDetail {
  const levelLabel = UDEMY_ROADMAP_LEVEL_LABELS[course.level];
  const status = index === 0 ? "in_progress" : "available";
  const progress = index === 0 ? 10 : 0;

  return {
    slug: course.slug,
    title: course.title,
    description: course.description,
    logo: course.logo,
    roadmapName: "IT & Software Learning Path",
    status,
    progress,
    difficulty: levelLabel,
    estimatedHours: formatEstimatedHours(course.durationMinutes),
    certificate: false,
    totalModules: course.totalUnits,
    totalAssessments: 0,
    externalUrl: course.url,
    provider: "Udemy",
    overview: `${course.description} This free Udemy course is part of the ${levelLabel} track in the IT & Software Learning Path. Open the course on Udemy to watch lectures and complete exercises at your own pace.`,
    learningObjectives: [
      `Complete the ${levelLabel.toLowerCase()} curriculum for ${course.title}`,
      "Follow along with Udemy video lectures and hands-on exercises",
      "Apply concepts through practical examples and projects",
      "Track your progress and mark completion in TalentIQ when finished",
    ],
    levels: [
      {
        number: 1,
        title: course.title,
        summary: course.description,
        status: status === "in_progress" ? "active" : "available",
        progress: status === "in_progress" ? progress : undefined,
        lessonCount: course.totalUnits,
        duration: formatEstimatedHours(course.durationMinutes),
        lessons:
          status === "in_progress"
            ? [
                {
                  num: "1.1",
                  title: "Course Introduction",
                  duration: "5 min",
                  status: "completed",
                },
                {
                  num: "1.2",
                  title: "Core Concepts",
                  duration: "20 min",
                  status: "in_progress",
                },
                {
                  num: "1.3",
                  title: "Hands-on Practice",
                  duration: "30 min",
                  status: "locked",
                },
              ]
            : undefined,
      },
    ],
    resources: [
      {
        title: "Open on Udemy",
        type: "Link",
        description: `Free course hosted on Udemy — ${course.title}`,
      },
      {
        title: "Class Central — Udemy Free Courses",
        type: "Link",
        description: "Browse thousands of free Udemy courses curated on Class Central.",
      },
      {
        title: "Udemy Free Courses Catalog",
        type: "Link",
        description: "Explore the full catalog of free courses on Udemy.",
      },
    ],
  };
}

const UDEMY_COURSE_DETAILS = Object.fromEntries(
  UDEMY_FREE_ROADMAP_COURSES.map((course, index) => [
    course.slug,
    buildUdemyCourseDetail(course, index),
  ])
) satisfies Record<string, FigmaCourseDetail>;

export const FIGMA_COURSE_DETAILS: Record<string, FigmaCourseDetail> = {
  ...UDEMY_COURSE_DETAILS,
  python: PYTHON_COURSE,
  aws: buildCourseDetail(
    {
      slug: "aws",
      title: "AWS Cloud",
      description: "Learn AWS fundamentals and design scalable cloud architectures.",
      logo: "aws",
      status: "available",
      progress: 0,
      difficulty: "Beginner",
      overview:
        "AWS Cloud covers everything from core services like EC2, S3, and IAM through well-architected design patterns. Progress through four levels to build, deploy, and architect production-ready applications on Amazon Web Services.",
      learningObjectives: [
        "Understand AWS global infrastructure and core services",
        "Configure IAM, EC2, and S3 for real workloads",
        "Design highly available and fault-tolerant architectures",
        "Apply security and cost optimization best practices",
        "Prepare for AWS certification paths",
      ],
    },
    ["Cloud Concepts & IAM", "Compute with EC2", "Storage & Networking", "Solutions Architecture"]
  ),
  devops: buildCourseDetail(
    {
      slug: "devops",
      title: "DevOps",
      description: "Introduction to DevOps practices, CI/CD, and infrastructure as code.",
      logo: "devops",
      status: "available",
      progress: 0,
      difficulty: "Intermediate",
      overview:
        "DevOps introduces the culture, tools, and practices that unify software development and IT operations. Learn CI/CD pipelines, infrastructure as code, containerization, and monitoring across four hands-on levels.",
      learningObjectives: [
        "Understand DevOps culture and collaborative workflows",
        "Build CI/CD pipelines with industry-standard tools",
        "Manage infrastructure as code",
        "Introduce containerization with Docker",
        "Implement monitoring and feedback loops",
      ],
    },
    ["DevOps Culture & CI/CD", "Infrastructure as Code", "Containerization", "DevOps Project"]
  ),
  kubernetes: buildCourseDetail(
    {
      slug: "kubernetes",
      title: "Kubernetes",
      description: "Understand Kubernetes basics and manage containerized workloads.",
      logo: "kubernetes",
      status: "available",
      progress: 0,
      difficulty: "Intermediate",
      overview:
        "Kubernetes teaches you to deploy, scale, and manage containerized applications in production. Learn cluster architecture, workloads, networking, and day-two operations across four structured levels.",
      learningObjectives: [
        "Understand Kubernetes architecture and components",
        "Deploy applications using pods and deployments",
        "Configure services and ingress for networking",
        "Manage configuration with ConfigMaps and Secrets",
        "Monitor and troubleshoot cluster workloads",
      ],
    },
    ["K8s Architecture", "Workloads & Deployments", "Networking & Services", "Cluster Operations"]
  ),
  java: buildCourseDetail(
    {
      slug: "java",
      title: "Java",
      description: "Build enterprise applications with Java from fundamentals to advanced patterns.",
      logo: "java",
      status: "available",
      progress: 0,
      difficulty: "Beginner",
      overview:
        "Java is one of the most widely used languages in enterprise software. This course takes you from syntax and object-oriented basics through collections, concurrency, and production-ready application design across four progressive levels.",
      learningObjectives: [
        "Write Java programs using core syntax and OOP principles",
        "Work with collections, exceptions, and file I/O",
        "Build REST APIs and integrate with databases",
        "Apply design patterns and testing best practices",
        "Prepare for enterprise Java development roles",
      ],
    },
    ["Java Basics & OOP", "Collections & APIs", "Enterprise Java", "Advanced Java Patterns"]
  ),
  javascript: buildCourseDetail(
    {
      slug: "javascript",
      title: "JavaScript",
      description: "Master modern JavaScript for web apps, APIs, and full-stack development.",
      logo: "javascript",
      status: "available",
      progress: 0,
      difficulty: "Beginner",
      overview:
        "JavaScript powers the modern web. Learn ES6+ syntax, DOM manipulation, async programming, and framework-ready patterns through four hands-on levels designed for front-end and full-stack developers.",
      learningObjectives: [
        "Understand variables, functions, and modern ES6+ syntax",
        "Manipulate the DOM and handle browser events",
        "Work with promises, async/await, and fetch APIs",
        "Structure modular applications with best practices",
        "Connect to backends and build interactive UIs",
      ],
    },
    ["JS Fundamentals", "DOM & Events", "Async & APIs", "Modern JS Applications"]
  ),
  "cyber-security": buildCourseDetail(
    {
      slug: "cyber-security",
      title: "Cyber Security",
      description: "Learn security fundamentals, risk management, and enterprise compliance.",
      logo: "security",
      status: "available",
      progress: 0,
      difficulty: "Beginner",
      overview:
        "Cyber Security Fundamentals equips every employee with the knowledge to protect organizational assets. Cover threat landscapes, secure practices, incident response, and compliance requirements across four structured levels.",
      learningObjectives: [
        "Identify common cyber threats and attack vectors",
        "Apply password, phishing, and device security best practices",
        "Understand risk management and security policies",
        "Respond to security incidents appropriately",
        "Meet enterprise compliance and governance requirements",
      ],
    },
    ["Security Foundations", "Threat Awareness", "Risk & Compliance", "Incident Response"]
  ),
  "data-analytics": buildCourseDetail(
    {
      slug: "data-analytics",
      title: "Data Analytics",
      description: "Turn data into insights with SQL, visualization, and analytics workflows.",
      logo: "sql",
      status: "available",
      progress: 0,
      difficulty: "Beginner",
      overview:
        "Data Analytics teaches you to extract, analyze, and present data for business decisions. Progress from SQL queries and data cleaning through visualization, dashboards, and storytelling across four practical levels.",
      learningObjectives: [
        "Write SQL queries to extract and aggregate data",
        "Clean, transform, and validate datasets",
        "Create charts and dashboards for stakeholders",
        "Interpret trends and communicate insights",
        "Apply analytics workflows to real business problems",
      ],
    },
    ["SQL & Data Basics", "Data Cleaning", "Visualization", "Analytics Projects"]
  ),
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

function enrichCourseWithExternalSources(detail: FigmaCourseDetail): FigmaCourseDetail {
  const source = FIGMA_ROADMAP_EXTERNAL_SOURCES[detail.slug];
  if (!source) return detail;

  const levels = detail.levels.map((level, index) => ({
    ...level,
    externalUrl: level.externalUrl ?? source.levels[index],
  }));

  const launchUrl =
    detail.externalUrl ?? getFigmaRoadmapLaunchUrl(detail.slug, levels) ?? source.levels[0];

  return {
    ...detail,
    levels,
    externalUrl: launchUrl,
    provider: detail.provider ?? resolveFigmaRoadmapProvider(detail.slug, launchUrl),
  };
}

export function getCourseDetailBySlug(slug: string): FigmaCourseDetail | undefined {
  const resolved = SLUG_ALIASES[slug] ?? slug;
  const detail = FIGMA_COURSE_DETAILS[resolved];
  if (!detail) return undefined;
  return enrichCourseWithExternalSources(detail);
}
