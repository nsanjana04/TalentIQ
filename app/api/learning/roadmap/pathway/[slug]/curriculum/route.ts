import { NextRequest } from "next/server";
import { withPermission, apiSuccess } from "@/lib/api/with-auth";
import { AppError } from "@/lib/errors/app-error";
import { Permission } from "@/lib/rbac/permissions";
import { roadmapPathwayService } from "@/services/roadmap-pathway.service";

type Ctx = { params: Promise<{ slug: string }> };

export async function GET(request: NextRequest, context: Ctx) {
  const handler = withPermission(Permission.COURSES_VIEW, async (_req, session) => {
    const { slug } = await context.params;
    if (!slug) throw new AppError("BAD_REQUEST", "pathway slug is required");

    const curriculum = await roadmapPathwayService.getCourseCurriculum(session.userId, slug);
    return apiSuccess(curriculum);
  });
  return handler(request);
}
