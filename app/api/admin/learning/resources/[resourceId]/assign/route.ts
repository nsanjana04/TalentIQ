import { NextRequest } from "next/server";
import { AppError } from "@/lib/errors/app-error";
import { apiSuccess, withResourceLibraryAdmin } from "@/lib/api/with-auth";
import { learningContentService } from "@/services/learning-content.service";

type RouteContext = { params: Promise<{ resourceId: string }> };

export async function GET(_request: NextRequest, context: RouteContext) {
  const handler = withResourceLibraryAdmin(async () => {
    const { resourceId } = await context.params;
    return apiSuccess(await learningContentService.listLearningResourceAssignments(resourceId));
  });
  return handler(_request);
}

export async function POST(request: NextRequest, context: RouteContext) {
  const handler = withResourceLibraryAdmin(async () => {
    throw new AppError(
      "BAD_REQUEST",
      "Generic resource assignment is disabled. Use Admin → Learning → Assignments to assign Course + Level + Audience + Due Date."
    );
  });
  return handler(request);
}
