import { NextRequest } from "next/server";
import { withPermission, apiSuccess } from "@/lib/api/with-auth";
import { Permission } from "@/lib/rbac/permissions";
import { resolveDashboardScope } from "@/lib/dashboard/scope";
import { recordLearningEventSchema } from "@/lib/validations/lrs";
import { lrsService } from "@/services/lrs.service";

export const POST = withPermission(Permission.COURSES_VIEW, async (request: NextRequest, session) => {
  const body = recordLearningEventSchema.parse(await request.json());
  const event = await lrsService.recordEvent({
    userId: session.userId,
    ...body,
  });
  return apiSuccess(event);
});

export const GET = withPermission(Permission.COURSES_VIEW, async (request: NextRequest, session) => {
  const params = request.nextUrl.searchParams;
  const userId = params.get("userId") ?? session.userId;
  const courseId = params.get("courseId") ?? undefined;
  const limit = params.get("limit") ? parseInt(params.get("limit")!, 10) : 50;

  const scope = await resolveDashboardScope(session.userId, session.role);
  const events = await lrsService.getEvents(scope, { userId, courseId, limit });
  return apiSuccess(events);
});
