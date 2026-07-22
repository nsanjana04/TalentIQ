import { apiSuccess } from "@/lib/errors/api-error";
import { ssoService } from "@/services/sso.service";

export async function GET() {
  const config = await ssoService.getPublicConfig();
  return apiSuccess(config);
}
