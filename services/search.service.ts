import type { RoleSlug } from "@/constants/role-slugs";
import { ROUTES } from "@/constants/routes";
import { resolveDashboardScope } from "@/lib/dashboard/scope";
import { buildUserWhere } from "@/lib/dashboard/scope";
import { canAny } from "@/lib/rbac/check";
import { Permission } from "@/lib/rbac/permissions";
import { screenAccessService } from "@/services/screen-access.service";
import { prisma } from "@/lib/db/prisma";
import type { GlobalSearchResponse, SearchResultItem } from "@/types/search";

const LIMIT_PER_CATEGORY = 6;

export const searchRepository = {
  async searchEmployees(scope: Awaited<ReturnType<typeof resolveDashboardScope>>, q: string) {
    const where = buildUserWhere(scope);
    return prisma.user.findMany({
      where: {
        ...where,
        OR: [
          { firstName: { contains: q, mode: "insensitive" } },
          { lastName: { contains: q, mode: "insensitive" } },
          { email: { contains: q, mode: "insensitive" } },
        ],
      },
      include: {
        department: { select: { name: true } },
        jobRole: { select: { title: true } },
      },
      take: LIMIT_PER_CATEGORY,
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
    });
  },

  async searchDepartments(q: string) {
    return prisma.department.findMany({
      where: { deletedAt: null, name: { contains: q, mode: "insensitive" } },
      take: LIMIT_PER_CATEGORY,
      orderBy: { name: "asc" },
    });
  },

  async searchCourses(q: string) {
    return prisma.course.findMany({
      where: {
        deletedAt: null,
        isPublished: true,
        OR: [
          { title: { contains: q, mode: "insensitive" } },
          { description: { contains: q, mode: "insensitive" } },
          { slug: { contains: q, mode: "insensitive" } },
        ],
      },
      take: LIMIT_PER_CATEGORY,
      orderBy: { title: "asc" },
    });
  },

  async searchCertifications(q: string) {
    return prisma.certificateTemplate.findMany({
      where: { deletedAt: null, name: { contains: q, mode: "insensitive" } },
      take: LIMIT_PER_CATEGORY,
      orderBy: { name: "asc" },
    });
  },

  async searchSkills(q: string) {
    return prisma.skill.findMany({
      where: { deletedAt: null, name: { contains: q, mode: "insensitive" } },
      take: LIMIT_PER_CATEGORY,
      orderBy: { name: "asc" },
    });
  },

  async searchAssessments(q: string) {
    return prisma.assessment.findMany({
      where: {
        deletedAt: null,
        title: { contains: q, mode: "insensitive" },
      },
      take: LIMIT_PER_CATEGORY,
      orderBy: { title: "asc" },
    });
  },

  async searchLearningPaths(q: string) {
    return prisma.skillLevelPath.findMany({
      where: {
        deletedAt: null,
        OR: [
          { title: { contains: q, mode: "insensitive" } },
          { description: { contains: q, mode: "insensitive" } },
          { skill: { name: { contains: q, mode: "insensitive" } } },
          { skill: { slug: { contains: q, mode: "insensitive" } } },
          { course: { title: { contains: q, mode: "insensitive" } } },
          { skillLevel: { code: { contains: q, mode: "insensitive" } } },
        ],
      },
      include: {
        skill: { select: { id: true, name: true, slug: true } },
        skillLevel: { select: { code: true, name: true } },
        course: { select: { id: true, title: true, isPublished: true } },
      },
      take: LIMIT_PER_CATEGORY,
      orderBy: [{ skill: { name: "asc" } }, { sortOrder: "asc" }],
    });
  },
};

export const searchService = {
  async globalSearch(
    userId: string,
    role: RoleSlug,
    query: string,
    permissions: Permission[] = []
  ): Promise<GlobalSearchResponse> {
    const q = query.trim();
    if (q.length < 2) {
      return { query: q, total: 0, groups: [] };
    }

    const scope = await resolveDashboardScope(userId, role);
    const groups: GlobalSearchResponse["groups"] = [];

    const canViewUsers = canAny(permissions, [Permission.USERS_VIEW]);
    const canViewDepartments = canAny(permissions, [
      Permission.DEPARTMENTS_VIEW,
      Permission.DEPARTMENTS_MANAGE,
    ]);
    const canViewCourses = canAny(permissions, [Permission.COURSES_VIEW, Permission.COURSES_MANAGE]);
    const canViewLearning = canAny(permissions, [
      Permission.COURSES_VIEW,
      Permission.COURSES_MANAGE,
      Permission.LEARNING_ENROLL,
    ]);
    const canViewCerts = canAny(permissions, [
      Permission.CERTIFICATES_SELF_VIEW,
      Permission.CERTIFICATES_VIEW,
      Permission.CERTIFICATES_MANAGE,
    ]);
    const canViewAssessments = canAny(permissions, [
      Permission.ASSESSMENTS_TAKE,
      Permission.ASSESSMENTS_MANAGE,
    ]);
    const canViewReports = canAny(permissions, [Permission.REPORTS_VIEW]);

    const tasks: Promise<void>[] = [];

    if (canViewUsers) {
      tasks.push(
        searchRepository.searchEmployees(scope, q).then((employees) => {
          const items: SearchResultItem[] = employees.map((u) => ({
            id: u.id,
            category: "employees",
            title: `${u.firstName} ${u.lastName}`,
            subtitle: u.jobRole?.title ?? u.email,
            href: ROUTES.adminUser(u.id),
            meta: u.department?.name ?? undefined,
          }));
          if (items.length) groups.push({ category: "employees", label: "Employees", items });
        })
      );
    } else {
      const personalScope = {
        type: "personal" as const,
        label: "Your Overview",
        userFilter: { id: userId },
      };
      tasks.push(
        searchRepository.searchEmployees(personalScope, q).then((employees) => {
          const items: SearchResultItem[] = employees.map((u) => ({
            id: u.id,
            category: "employees",
            title: `${u.firstName} ${u.lastName}`,
            subtitle: u.jobRole?.title ?? u.email,
            href: ROUTES.ACCOUNT,
            meta: "Your profile",
          }));
          if (items.length) groups.push({ category: "employees", label: "Employees", items });
        })
      );
    }

    if (canViewDepartments) {
      tasks.push(
        searchRepository.searchDepartments(q).then((departments) => {
          const items: SearchResultItem[] = departments.map((d) => ({
            id: d.id,
            category: "departments",
            title: d.name,
            subtitle: d.code ?? null,
            href: ROUTES.ADMIN_DEPARTMENTS,
          }));
          if (items.length) groups.push({ category: "departments", label: "Departments", items });
        })
      );
    }

    if (canViewCourses) {
      tasks.push(
        searchRepository.searchCourses(q).then((courses) => {
          const items: SearchResultItem[] = courses.map((c) => ({
            id: c.id,
            category: "courses",
            title: c.title,
            subtitle: c.description?.slice(0, 80) ?? null,
            href: ROUTES.coursePlayer(c.id),
          }));
          if (items.length) groups.push({ category: "courses", label: "Courses", items });
        })
      );
    }

    if (canViewLearning) {
      tasks.push(
        searchRepository.searchLearningPaths(q).then((paths) => {
          const items: SearchResultItem[] = paths
            .filter((p) => p.course?.isPublished !== false)
            .map((p) => ({
              id: p.id,
              category: "courses",
              title: p.title ?? `${p.skill.name} ${p.skillLevel.code}`,
              subtitle: p.course?.title ?? p.description?.slice(0, 80) ?? null,
              href: p.course
                ? ROUTES.coursePlayer(p.course.id)
                : `${ROUTES.LEARNING}?skillId=${p.skill.id}`,
              meta: `${p.skill.name} · Level ${p.skillLevel.code}`,
            }));
          if (items.length) {
            groups.push({ category: "courses", label: "Learning pathways", items });
          }
        })
      );
    }

    if (canViewCerts) {
      tasks.push(
        searchRepository.searchCertifications(q).then((certifications) => {
          const items: SearchResultItem[] = certifications.map((c) => ({
            id: c.id,
            category: "certifications",
            title: c.name,
            subtitle: c.description?.slice(0, 80) ?? null,
            href: ROUTES.CERTIFICATIONS,
          }));
          if (items.length) groups.push({ category: "certifications", label: "Certifications", items });
        })
      );
    }


    if (canViewAssessments) {
      tasks.push(
        searchRepository.searchAssessments(q).then((assessments) => {
          const items: SearchResultItem[] = assessments.map((a) => ({
            id: a.id,
            category: "assessments",
            title: a.title,
            subtitle: a.type,
            href: ROUTES.ASSESSMENTS,
          }));
          if (items.length) groups.push({ category: "assessments", label: "Assessments", items });
        })
      );
    }

    await Promise.all(tasks);

    const qLower = q.toLowerCase();
    const accessibleScreens = await screenAccessService.getAccessibleScreens(userId);
    const navPages = accessibleScreens.filter(
      (screen) =>
        !screen.isPersonal &&
        (screen.label.toLowerCase().includes(qLower) ||
          screen.key.replace(/-/g, " ").includes(qLower) ||
          (qLower.includes("setting") && screen.route.includes("/settings")) ||
          (qLower.includes("account") && screen.route.includes("/account")) ||
          (qLower.includes("department") && screen.route.includes("department")) ||
          (qLower.includes("report") && screen.route.includes("report")) ||
          ((qLower.includes("learning") ||
            qLower.includes("pathway") ||
            qLower.includes("roadmap") ||
            qLower.includes("course")) &&
            (screen.route.includes("/learning") || screen.route.includes("/courses"))))
    );

    const pageItems: SearchResultItem[] = navPages.slice(0, 8).map((screen) => ({
      id: screen.key,
      category: "reports" as const,
      title: screen.label,
      subtitle: screen.description ?? null,
      href: screen.route,
    }));

    if (
      (qLower.includes("account") || qLower.includes("profile")) &&
      !pageItems.some((p) => p.href === ROUTES.ACCOUNT)
    ) {
      pageItems.unshift({
        id: "account",
        category: "reports",
        title: "Account",
        subtitle: "Profile and personal settings",
        href: ROUTES.ACCOUNT,
      });
    }

    if (pageItems.length) {
      groups.push({ category: "reports", label: "Pages", items: pageItems });
    }

    const total = groups.reduce((s, g) => s + g.items.length, 0);
    return { query: q, total, groups };
  },
};
