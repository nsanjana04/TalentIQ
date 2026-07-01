import { NextRequest } from "next/server";
import { withPermission, apiSuccess } from "@/lib/api/with-auth";
import { Permission } from "@/lib/rbac/permissions";
import { createTemplateSchema } from "@/lib/validations/certificates";
import { certificateService } from "@/services/certificate.service";

export const GET = withPermission(Permission.CERTIFICATES_MANAGE, async () => {
  return apiSuccess(await certificateService.listTemplates());
});

export const POST = withPermission(Permission.CERTIFICATES_MANAGE, async (request: NextRequest, session) => {
  const body = createTemplateSchema.parse(await request.json());
  const template = await certificateService.createTemplate(body, session.userId);
  return apiSuccess(template);
});
