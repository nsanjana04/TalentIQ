import { NextRequest } from "next/server";
import { withPermission, apiSuccess } from "@/lib/api/with-auth";
import { Permission } from "@/lib/rbac/permissions";
import { AppError } from "@/lib/errors/app-error";
import { employeeIntelligenceService } from "@/services/employee-intelligence.service";
import { z } from "zod";

const compareSchema = z.object({
  ids: z.array(z.string().min(1)).min(2).max(5),
});

export const POST = withPermission(Permission.DASHBOARD_VIEW, async (req: NextRequest, session) => {
  const body = await req.json().catch(() => ({}));
  const parsed = compareSchema.safeParse(body);
  if (!parsed.success) {
    throw new AppError("BAD_REQUEST", "Provide 2–5 employee IDs to compare");
  }

  const { snapshots } = await employeeIntelligenceService.loadCatalog(session.userId, session.role);
  const employees = employeeIntelligenceService.compareEmployees(snapshots, parsed.data.ids);

  if (employees.length < 2) {
    throw new AppError("NOT_FOUND", "Could not find enough employees in your scope to compare");
  }

  return apiSuccess({ employees, comparedAt: new Date().toISOString() });
});
