import { NextRequest } from "next/server";
import { withPermission, apiSuccess } from "@/lib/api/with-auth";
import { Permission } from "@/lib/rbac/permissions";
import {
  certificateListQuerySchema,
  issueCertificateSchema,
} from "@/lib/validations/certificates";
import { certificateService } from "@/services/certificate.service";

export const GET = withPermission(Permission.CERTIFICATES_MANAGE, async (request: NextRequest) => {
  const params = Object.fromEntries(request.nextUrl.searchParams.entries());
  const query = certificateListQuerySchema.parse(params);
  return apiSuccess(await certificateService.listCertificates(query));
});

export const POST = withPermission(Permission.CERTIFICATES_MANAGE, async (request: NextRequest, session) => {
  const body = issueCertificateSchema.parse(await request.json());
  const cert = await certificateService.issueCertificate(body, session.userId);
  return apiSuccess(cert);
});
