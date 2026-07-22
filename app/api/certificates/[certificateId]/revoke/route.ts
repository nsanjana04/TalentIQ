import { NextRequest } from "next/server";
import { withPermission, apiSuccess } from "@/lib/api/with-auth";
import { Permission } from "@/lib/rbac/permissions";
import { revokeCertificateSchema } from "@/lib/validations/certificates";
import { certificateService } from "@/services/certificate.service";

type RouteContext = { params: Promise<{ certificateId: string }> };

export async function POST(request: NextRequest, context: RouteContext) {
  const handler = withPermission(Permission.CERTIFICATES_MANAGE, async (req, session) => {
    const { certificateId } = await context.params;
    const body = revokeCertificateSchema.parse(await req.json());
    const result = await certificateService.revokeCertificate(
      certificateId,
      body.reason,
      session.userId
    );
    return apiSuccess(result);
  });
  return handler(request);
}
