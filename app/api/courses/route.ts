import { NextRequest } from "next/server";
import { withPermission, apiSuccess } from "@/lib/api/with-auth";
import { Permission } from "@/lib/rbac/permissions";
import { courseListQuerySchema, createCourseSchema } from "@/lib/validations/course-admin";
import { courseAdminService } from "@/services/course-admin.service";

export const GET = withPermission(Permission.COURSES_MANAGE, async (request: NextRequest) => {
  const params = Object.fromEntries(request.nextUrl.searchParams.entries());
  const query = courseListQuerySchema.parse(params);
  return apiSuccess(await courseAdminService.listCourses(query));
});

export const POST = withPermission(Permission.COURSES_MANAGE, async (request: NextRequest, session) => {
  const body = createCourseSchema.parse(await request.json());
  const course = await courseAdminService.createCourse(body, session.userId);
  return apiSuccess(course);
});
