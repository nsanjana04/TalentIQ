import { withPermission, apiSuccess } from "@/lib/api/with-auth";
import { Permission } from "@/lib/rbac/permissions";
import { certificateService } from "@/services/certificate.service";

export const GET = withPermission(Permission.CERTIFICATES_MANAGE, async () => {
  return apiSuccess(await certificateService.getOverview());
});
