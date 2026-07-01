import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth/session";
import { handleApiError } from "@/lib/errors/api-error";
import { AppError } from "@/lib/errors/app-error";
import { Permission } from "@/lib/rbac/permissions";
import { requireAnyPermission } from "@/lib/rbac/guard";
import {
  exportCopilotCsv,
  exportCopilotPdf,
  exportCopilotXlsx,
} from "@/lib/exports/copilot-export";
import { employeeIntelligenceService } from "@/services/employee-intelligence.service";
import type { CopilotExportFormat } from "@/types/employee-intelligence";
import { z } from "zod";

const exportSchema = z.object({
  q: z.string().min(1).max(500),
  format: z.enum(["csv", "xlsx", "pdf"]),
});

export async function GET(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) throw new AppError("UNAUTHORIZED", "Authentication required");

    requireAnyPermission(session, [Permission.DASHBOARD_VIEW, Permission.REPORTS_VIEW]);

    const params = Object.fromEntries(request.nextUrl.searchParams.entries());
    const query = exportSchema.parse(params);
    const data = await employeeIntelligenceService.queryCopilot(
      session.userId,
      session.role,
      query.q
    );

    const format = query.format as CopilotExportFormat;
    const stamp = new Date().toISOString().slice(0, 10);

    if (format === "csv") {
      const csv = exportCopilotCsv(data);
      return new NextResponse(csv, {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="copilot-${stamp}.csv"`,
        },
      });
    }

    if (format === "xlsx") {
      const buffer = await exportCopilotXlsx(data);
      return new NextResponse(new Uint8Array(buffer), {
        headers: {
          "Content-Type":
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "Content-Disposition": `attachment; filename="copilot-${stamp}.xlsx"`,
        },
      });
    }

    const pdf = exportCopilotPdf(data);
    return new NextResponse(new Uint8Array(pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="copilot-${stamp}.pdf"`,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
