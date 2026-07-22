import { NextRequest } from "next/server";
import { withPermission, apiSuccess } from "@/lib/api/with-auth";
import { Permission } from "@/lib/rbac/permissions";
import { certificateService } from "@/services/certificate.service";

type RouteContext = { params: Promise<{ certificateId: string }> };

export async function POST(_request: NextRequest, context: RouteContext) {
  const handler = withPermission(Permission.CERTIFICATES_MANAGE, async (_req, session) => {
    const { certificateId } = await context.params;
    const result = await certificateService.expireCertificate(certificateId, session.userId);
    return apiSuccess(result);
  });
  return handler(_request);
}
