import { NextRequest } from "next/server";
import { withAuth, apiSuccess } from "@/lib/api/with-auth";
import { navigationService } from "@/services/navigation.service";

export const GET = withAuth(async (request: NextRequest, session) => {
  const itemsParam = request.nextUrl.searchParams.get("items") ?? "";
  const visibleItemIds = itemsParam ? itemsParam.split(",").filter(Boolean) : [];

  const badges = await navigationService.getBadgeCounts(
    session.userId,
    session.role,
    session.permissions,
    visibleItemIds
  );
  return apiSuccess({ badges });
});
