import { NextRequest } from "next/server";
import { z } from "zod";
import { withAnyPermission, apiSuccess } from "@/lib/api/with-auth";
import { Permission } from "@/lib/rbac/permissions";
import { screenAccessService } from "@/services/screen-access.service";

type RouteContext = { params: Promise<{ userId: string }> };

const createOverrideSchema = z.object({
  screenId: z.string().min(1),
  overrideType: z.enum(["ALLOW", "DENY"]),
  reason: z.string().min(1, "Reason is required"),
  expiresAt: z.string().datetime().optional().nullable(),
});

export async function GET(_request: NextRequest, context: RouteContext) {
  const handler = withAnyPermission(
    [Permission.RBAC_MANAGE, Permission.USERS_VIEW],
    async () => {
      const { userId } = await context.params;
      const data = await screenAccessService.getUserOverrideDetails(userId);
      return apiSuccess(data);
    }
  );
  return handler(_request);
}

export async function POST(request: NextRequest, context: RouteContext) {
  const handler = withAnyPermission(
    [Permission.RBAC_MANAGE, Permission.USERS_VIEW],
    async (req, session) => {
      const { userId } = await context.params;
      const body = createOverrideSchema.parse(await req.json());
      const expiresAt = body.expiresAt ? new Date(body.expiresAt) : null;
      const updated = await screenAccessService.setUserOverride(
        session.userId,
        userId,
        body.screenId,
        {
          overrideType: body.overrideType,
          reason: body.reason,
          expiresAt,
        }
      );
      return apiSuccess(updated);
    }
  );
  return handler(request);
}

// Backward compatible with profile module
export async function PUT(request: NextRequest, context: RouteContext) {
  return POST(request, context);
}
