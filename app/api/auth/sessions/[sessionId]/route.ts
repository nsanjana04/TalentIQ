import { NextRequest } from "next/server";
import { withAuth, apiSuccess } from "@/lib/api/with-auth";
import { authService } from "@/services/auth.service";

type RouteContext = { params: Promise<{ sessionId: string }> };

export async function DELETE(request: NextRequest, context: RouteContext) {
  const handler = withAuth(async (_req, session) => {
    const { sessionId } = await context.params;
    const result = await authService.revokeSession(session.userId, sessionId);
    return apiSuccess(result);
  });
  return handler(request);
}
