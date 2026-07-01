import { NextRequest } from "next/server";
import { withPermission, apiSuccess } from "@/lib/api/with-auth";
import { AppError } from "@/lib/errors/app-error";
import { Permission } from "@/lib/rbac/permissions";
import { roadmapPathwayService } from "@/services/roadmap-pathway.service";

export const POST = withPermission(Permission.COURSES_VIEW, async (request: NextRequest, session) => {
  const formData = await request.formData();
  const file = formData.get("file");
  const pathwaySlug = String(formData.get("pathwaySlug") ?? "");

  if (!pathwaySlug) throw new AppError("BAD_REQUEST", "pathwaySlug is required");
  if (!file || !(file instanceof File)) throw new AppError("BAD_REQUEST", "No file provided");

  const buffer = Buffer.from(await file.arrayBuffer());
  const result = await roadmapPathwayService.verifyCertificate(session.userId, pathwaySlug, {
    name: file.name,
    type: file.type || "application/octet-stream",
    buffer,
  });

  return apiSuccess(result);
});
