import { NextRequest } from "next/server";
import { certificateService } from "@/services/certificate.service";
import { handleApiError, apiSuccess } from "@/lib/errors/api-error";

type RouteContext = { params: Promise<{ token: string }> };

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const { token } = await context.params;
    const result = await certificateService.verify(token);
    return apiSuccess(result);
  } catch (error) {
    return handleApiError(error);
  }
}
