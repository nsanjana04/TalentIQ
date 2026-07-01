import { NextRequest } from "next/server";
import { withPermission, apiSuccess } from "@/lib/api/with-auth";
import { Permission } from "@/lib/rbac/permissions";
import { certificateService } from "@/services/certificate.service";

export const GET = withPermission(Permission.COURSES_VIEW, async (_request: NextRequest, session) => {
  return apiSuccess(
    await certificateService.listCertificates({ userId: session.userId, status: "all" })
  );
});
