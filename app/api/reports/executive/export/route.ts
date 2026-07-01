import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth/session";
import { handleApiError } from "@/lib/errors/api-error";
import { AppError } from "@/lib/errors/app-error";
import { Permission } from "@/lib/rbac/permissions";
import { requirePermission } from "@/lib/rbac/guard";
import { warRoomService } from "@/services/war-room.service";
import {
  buildExecutivePptxBuffer,
  buildExecutiveXlsxBuffer,
} from "@/lib/exports/executive-pptx-export";

export async function GET(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) throw new AppError("UNAUTHORIZED", "Authentication required");
    requirePermission(session, Permission.REPORTS_VIEW);

    const format = request.nextUrl.searchParams.get("format") ?? "pptx";
    const briefing = await warRoomService.getBriefing(session.userId, session.role);

    const generatedAt = new Date().toISOString();
    const slides = [
      {
        title: "Top Workforce Risks",
        bullets: briefing.topRisks.map((r) => `${r.label}: ${r.count} (${r.severity})`),
      },
      {
        title: "Compliance",
        bullets: [
          `Certs expiring: ${briefing.complianceRisks.expiringSoon}`,
          `Non-compliant employees: ${briefing.complianceRisks.nonCompliant}`,
          `Leadership health: ${briefing.leadershipHealth}%`,
        ],
      },
      {
        title: "Learning Progress",
        bullets: [
          `In progress: ${briefing.learningRisks.inProgress}`,
          `Dropped or stalled: ${briefing.learningRisks.overdue}`,
          `Average progress: ${briefing.learningRisks.avgProgress}%`,
        ],
      },
      {
        title: "Attrition Risk",
        bullets: [
          `High risk: ${briefing.attritionRisks.highRisk}`,
          `Critical risk: ${briefing.attritionRisks.critical}`,
        ],
      },
    ];

    if (format === "xlsx") {
      const rows = [
        ["Metric", "Value"],
        ["Scope", briefing.scopeLabel],
        ["Leadership Health", `${briefing.leadershipHealth}%`],
        ["Learning In Progress", String(briefing.learningRisks.inProgress)],
        ["High Attrition Risk", String(briefing.attritionRisks.highRisk)],
        ["Certs Expiring", String(briefing.complianceRisks.expiringSoon)],
      ];
      const buffer = await buildExecutiveXlsxBuffer(rows);
      return new NextResponse(new Uint8Array(buffer), {
        headers: {
          "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "Content-Disposition": `attachment; filename="executive-report-${generatedAt.slice(0, 10)}.xlsx"`,
        },
      });
    }

    const buffer = await buildExecutivePptxBuffer({
      title: "Executive Workforce Briefing",
      scopeLabel: briefing.scopeLabel,
      generatedAt,
      slides,
    });

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        "Content-Disposition": `attachment; filename="executive-briefing-${generatedAt.slice(0, 10)}.pptx"`,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
