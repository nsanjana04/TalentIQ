import { NextRequest } from "next/server";
import { withPermission, apiSuccess } from "@/lib/api/with-auth";
import { Permission } from "@/lib/rbac/permissions";
import { updateTemplateSchema } from "@/lib/validations/certificates";
import { certificateService } from "@/services/certificate.service";

type RouteContext = { params: Promise<{ templateId: string }> };

export async function PATCH(request: NextRequest, context: RouteContext) {
  const handler = withPermission(Permission.CERTIFICATES_MANAGE, async (req, session) => {
    const { templateId } = await context.params;
    const body = updateTemplateSchema.parse(await req.json());
    const template = await certificateService.updateTemplate(templateId, body, session.userId);
    return apiSuccess(template);
  });
  return handler(request);
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  const handler = withPermission(Permission.CERTIFICATES_MANAGE, async (_req, session) => {
    const { templateId } = await context.params;
    await certificateService.deleteTemplate(templateId, session.userId);
    return apiSuccess({ deleted: true });
  });
  return handler(_request);
}
