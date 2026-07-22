import { NextRequest } from "next/server";
import { withPermission, apiSuccess } from "@/lib/api/with-auth";
import { AppError } from "@/lib/errors/app-error";
import { Permission } from "@/lib/rbac/permissions";
import { roadmapPathwayService } from "@/services/roadmap-pathway.service";

export const POST = withPermission(Permission.COURSES_VIEW, async (request: NextRequest, session) => {
  const body = await request.json();
  const pathwaySlug = String(body.pathwaySlug ?? "");
  if (!pathwaySlug) throw new AppError("BAD_REQUEST", "pathwaySlug is required");

  const result = await roadmapPathwayService.completeWithCertificate(session.userId, pathwaySlug);
  return apiSuccess(result);
});
