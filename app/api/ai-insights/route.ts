import { NextRequest } from "next/server";
import { withPermission, apiSuccess } from "@/lib/api/with-auth";
import { Permission } from "@/lib/rbac/permissions";
import { AppError } from "@/lib/errors/app-error";
import { aiInsightsService } from "@/services/ai-insights.service";
import { auditService } from "@/services/audit.service";
import { z } from "zod";

const querySchema = z.object({
  q: z.string().max(500).optional(),
});

export const GET = withPermission(Permission.DASHBOARD_VIEW, async (_req, session) => {
  const data = await aiInsightsService.generateInsights(session.userId, session.role);
  return apiSuccess(data);
});

export const POST = withPermission(Permission.DASHBOARD_VIEW, async (req: NextRequest, session) => {
  const body = await req.json().catch(() => ({}));
  const parsed = querySchema.safeParse(body);
  if (!parsed.success || !parsed.data.q) {
    throw new AppError("BAD_REQUEST", "Query parameter 'q' is required");
  }

  const result = await aiInsightsService.queryInsights(
    session.userId,
    session.role,
    parsed.data.q
  );

  await auditService.log({
    action: "COPILOT_QUERY",
    entityType: "AiCopilot",
    actorId: session.userId,
    metadata: {
      query: parsed.data.q,
      intent: result.intent,
      resultCount: result.rankedEmployees.length,
      confidence: result.confidence,
      scope: result.scopeLabel,
    },
  });

  return apiSuccess(result);
});
