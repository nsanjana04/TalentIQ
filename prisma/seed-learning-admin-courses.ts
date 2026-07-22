import type { CourseLevelTier } from "@prisma/client";
import { PrismaClient } from "@prisma/client";

const TIER_CONFIG: {
  tier: CourseLevelTier;
  name: string;
  order: number;
  durationHours: number;
  passingScore: number;
  unlockRule: string | null;
}[] = [
  { tier: "BASIC", name: "Basic", order: 1, durationHours: 4, passingScore: 70, unlockRule: null },
  {
    tier: "INTERMEDIATE",
    name: "Intermediate",
    order: 2,
    durationHours: 6,
    passingScore: 75,
    unlockRule: "BLOCK_UNTIL_PREVIOUS_COMPLETE",
  },
  {
    tier: "ADVANCED",
    name: "Advanced",
    order: 3,
    durationHours: 8,
    passingScore: 80,
    unlockRule: "BLOCK_UNTIL_PREVIOUS_COMPLETE",
  },
  {
    tier: "EXPERT",
    name: "Expert",
    order: 4,
    durationHours: 10,
    passingScore: 85,
    unlockRule: "BLOCK_UNTIL_PREVIOUS_COMPLETE",
  },
];

export const ENTERPRISE_ADMIN_COURSES = [
  {
    title: "Cyber Security Fundamentals",
    category: "Security",
    skills: ["Security", "Risk Management", "Compliance"],
    description: "Enterprise security foundations for every employee.",
  },
  {
    title: "Data Privacy and Security",
    category: "Compliance",
    skills: ["Privacy", "GDPR", "Data Protection"],
    description: "Protect sensitive data and meet regulatory requirements.",
  },
  {
    title: "Leadership Skills",
    category: "Leadership",
    skills: ["Leadership", "Coaching", "Decision Making"],
    description: "Develop people-first leadership capabilities.",
  },
  {
    title: "Project Management",
    category: "Business",
    skills: ["Planning", "Stakeholders", "Delivery"],
    description: "Plan, execute, and deliver projects on time.",
  },
  {
    title: "Data Analytics",
    category: "Data",
    skills: ["Analytics", "SQL", "Visualization"],
    description: "Turn data into actionable business insights.",
  },
  {
    title: "AI Fundamentals",
    category: "Technology",
    skills: ["AI", "Machine Learning", "Ethics"],
    description: "Understand AI concepts for the modern enterprise.",
  },
  {
    title: "Machine Learning Basics",
    category: "Technology",
    skills: ["ML", "Models", "Evaluation"],
    description: "Core machine learning workflows and terminology.",
  },
  {
    title: "Cloud Computing",
    category: "Technology",
    skills: ["Cloud", "Architecture", "Security"],
    description: "Cloud platforms, services, and deployment models.",
  },
  {
    title: "DevOps Essentials",
    category: "Engineering",
    skills: ["CI/CD", "Automation", "Monitoring"],
    description: "Build reliable delivery pipelines and operations culture.",
  },
  {
    title: "Agile and Scrum",
    category: "Business",
    skills: ["Agile", "Scrum", "Team Delivery"],
    description: "Agile frameworks for iterative product delivery.",
  },
  {
    title: "Communication Skills",
    category: "Professional",
    skills: ["Communication", "Presentation", "Collaboration"],
    description: "Communicate clearly across teams and stakeholders.",
  },
  {
    title: "Compliance Training",
    category: "Compliance",
    skills: ["Policy", "Ethics", "Governance"],
    description: "Mandatory compliance and ethical conduct training.",
  },
  {
    title: "Workplace Safety",
    category: "Operations",
    skills: ["Safety", "Risk", "Procedures"],
    description: "Workplace safety standards and incident prevention.",
  },
  {
    title: "HR Policy Training",
    category: "HR",
    skills: ["HR Policy", "Conduct", "Benefits"],
    description: "Organization HR policies and employee responsibilities.",
  },
  {
    title: "Customer Success",
    category: "Business",
    skills: ["Customer Success", "Retention", "Support"],
    description: "Drive customer outcomes and long-term value.",
  },
  {
    title: "Sales Enablement",
    category: "Sales",
    skills: ["Sales", "Discovery", "Closing"],
    description: "Enable revenue teams with product and process knowledge.",
  },
  {
    title: "Product Management",
    category: "Product",
    skills: ["Product Strategy", "Roadmaps", "Discovery"],
    description: "Build products customers love at enterprise scale.",
  },
  {
    title: "Software Engineering Best Practices",
    category: "Engineering",
    skills: ["Engineering", "Code Quality", "Architecture"],
    description: "Modern software engineering standards and practices.",
  },
  {
    title: "Database Fundamentals",
    category: "Data",
    skills: ["Databases", "SQL", "Modeling"],
    description: "Relational databases, modeling, and query fundamentals.",
  },
  {
    title: "Business Intelligence",
    category: "Data",
    skills: ["BI", "Dashboards", "Reporting"],
    description: "Enterprise reporting and business intelligence workflows.",
  },
] as const;

function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export async function seedLearningAdminCourses(prisma: PrismaClient, createdById?: string) {
  let created = 0;
  for (const course of ENTERPRISE_ADMIN_COURSES) {
    const slug = slugify(course.title);
    const record = await prisma.course.upsert({
      where: { slug },
      update: {
        title: course.title,
        description: course.description,
        category: course.category,
        skillsCovered: [...course.skills],
        adminStatus: "ACTIVE",
        isPublished: true,
        durationMinutes: 480,
        ...(createdById ? { createdById } : {}),
      },
      create: {
        title: course.title,
        slug,
        description: course.description,
        category: course.category,
        skillsCovered: [...course.skills],
        adminStatus: "ACTIVE",
        isPublished: true,
        durationMinutes: 480,
        ...(createdById ? { createdById } : {}),
      },
    });

    for (const tier of TIER_CONFIG) {
      await prisma.courseLevel.upsert({
        where: { courseId_tier: { courseId: record.id, tier: tier.tier } },
        update: {
          name: tier.name,
          description: `${tier.name} level for ${course.title}`,
          durationHours: tier.durationHours,
          learningObjectives: [
            `Master ${tier.name.toLowerCase()} concepts in ${course.title}`,
            `Apply ${tier.name.toLowerCase()} skills in workplace scenarios`,
          ],
          passingScore: tier.passingScore,
          orderNumber: tier.order,
          unlockRule: tier.unlockRule,
          certificateEnabled: true,
        },
        create: {
          courseId: record.id,
          tier: tier.tier,
          name: tier.name,
          description: `${tier.name} level for ${course.title}`,
          durationHours: tier.durationHours,
          learningObjectives: [
            `Master ${tier.name.toLowerCase()} concepts in ${course.title}`,
            `Apply ${tier.name.toLowerCase()} skills in workplace scenarios`,
          ],
          passingScore: tier.passingScore,
          orderNumber: tier.order,
          unlockRule: tier.unlockRule,
          certificateEnabled: true,
        },
      });
    }
    created++;
  }
  return created;
}
