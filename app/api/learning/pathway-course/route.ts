import { NextRequest } from "next/server";
import { withAnyPermission, apiSuccess } from "@/lib/api/with-auth";
import { Permission } from "@/lib/rbac/permissions";
import { prisma } from "@/lib/db/prisma";
import {
  getPathwayCourseSlugCandidates,
  pickBestPathwayCourse,
} from "@/lib/learning/resolve-pathway-course";

type PathwayCoursePayload = {
  id: string;
  slug: string;
  title: string;
  moduleCount: number;
} | null;

export const GET = withAnyPermission(
  [Permission.COURSES_VIEW, Permission.LEARNING_ENROLL, Permission.COURSES_MANAGE],
  async (request: NextRequest) => {
    const topicSlug = request.nextUrl.searchParams.get("topicSlug")?.trim();
    const levelParam = request.nextUrl.searchParams.get("level");
    const levelNumber =
      levelParam != null && levelParam !== "" ? Number.parseInt(levelParam, 10) : undefined;

    if (!topicSlug) {
      return apiSuccess<{ course: PathwayCoursePayload }>({ course: null });
    }

    const candidates = getPathwayCourseSlugCandidates(
      topicSlug,
      Number.isFinite(levelNumber) ? levelNumber : undefined
    );
    const courses = await prisma.course.findMany({
      where: {
        deletedAt: null,
        OR: candidates.map((slug) => ({
          slug: { equals: slug, mode: "insensitive" as const },
        })),
      },
      select: {
        id: true,
        slug: true,
        title: true,
        _count: { select: { modules: { where: { deletedAt: null } } } },
      },
    });

    const match = pickBestPathwayCourse(
      candidates,
      courses.map((c) => ({
        id: c.id,
        slug: c.slug,
        title: c.title,
        moduleCount: c._count.modules,
      }))
    );

    if (!match) {
      return apiSuccess<{ course: PathwayCoursePayload }>({ course: null });
    }

    return apiSuccess<{ course: PathwayCoursePayload }>({
      course: {
        id: match.id,
        slug: match.slug,
        title: match.title ?? "",
        moduleCount: match.moduleCount ?? 0,
      },
    });
  }
);
