import { NextRequest } from "next/server";
import { apiSuccess, withResourceLibraryAdmin } from "@/lib/api/with-auth";
import { updateLearningResourceSchema } from "@/lib/validations/learning-content";
import { learningContentService } from "@/services/learning-content.service";

type RouteContext = { params: Promise<{ resourceId: string }> };

export async function PATCH(request: NextRequest, context: RouteContext) {
  const handler = withResourceLibraryAdmin(async (req, session) => {
    const { resourceId } = await context.params;
    const body = updateLearningResourceSchema.parse(await req.json());
    return apiSuccess(await learningContentService.updateResource(resourceId, body, session.userId));
  });
  return handler(request);
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  const handler = withResourceLibraryAdmin(async (_req, session) => {
    const { resourceId } = await context.params;
    return apiSuccess(await learningContentService.deleteResource(resourceId, session.userId));
  });
  return handler(_request);
}
