import { NextRequest } from "next/server";
import { withPermission, apiSuccess } from "@/lib/api/with-auth";
import { Permission } from "@/lib/rbac/permissions";
import { searchService } from "@/services/search.service";
import { z } from "zod";

const querySchema = z.object({ q: z.string().min(2).max(100) });

export const GET = withPermission(Permission.DASHBOARD_VIEW, async (request: NextRequest, session) => {
  const q = request.nextUrl.searchParams.get("q") ?? "";
  const parsed = querySchema.safeParse({ q });
  if (!parsed.success) {
    return apiSuccess({ query: q, total: 0, groups: [] });
  }
  const results = await searchService.globalSearch(
    session.userId,
    session.role,
    parsed.data.q,
    session.permissions
  );
  return apiSuccess(results);
});
