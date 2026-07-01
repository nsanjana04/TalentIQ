import { NextRequest } from "next/server";
import { apiSuccess, withResourceLibraryAdmin } from "@/lib/api/with-auth";
import {
  createLearningResourceSchema,
  learningResourceListQuerySchema,
} from "@/lib/validations/learning-content";
import { learningContentService } from "@/services/learning-content.service";

export const GET = withResourceLibraryAdmin(async (request: NextRequest) => {
  const query = learningResourceListQuerySchema.parse(
    Object.fromEntries(request.nextUrl.searchParams)
  );
  return apiSuccess(await learningContentService.listResources(query));
});

export const POST = withResourceLibraryAdmin(async (request: NextRequest, session) => {
  const body = createLearningResourceSchema.parse(await request.json());
  return apiSuccess(await learningContentService.createResource(body, session.userId));
});
