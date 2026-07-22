import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth/session";
import { handleApiError } from "@/lib/errors/api-error";
import { AppError } from "@/lib/errors/app-error";
import { resolveDashboardScope } from "@/lib/dashboard/scope";
import { getLearningEventBus } from "@/lib/learning/event-bus";
import { Permission } from "@/lib/rbac/permissions";
import { requirePermission } from "@/lib/rbac/guard";
import type { LearningRealtimePayload } from "@/types/learning-lrs";

export async function GET(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) throw new AppError("UNAUTHORIZED", "Authentication required");
    requirePermission(session, Permission.COURSES_VIEW);

    const scope = await resolveDashboardScope(session.userId, session.role);
    const bus = getLearningEventBus();
    const encoder = new TextEncoder();
    let unsubscribe: (() => void) | null = null;

    const stream = new ReadableStream({
      start(controller) {
        const send = (data: unknown) => {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
        };

        send({ type: "connected", userId: session.userId, scope: scope.label });

        const listener = (event: LearningRealtimePayload) => {
          send(event);
        };

        unsubscribe = bus.subscribe(session.userId, listener);
        bus.subscribeScope("global", listener);
        if (scope.userFilter?.departmentId) {
          bus.subscribeScope(`dept:${scope.userFilter.departmentId}`, listener);
        }
        if (scope.userFilter?.teamId) {
          bus.subscribeScope(`team:${scope.userFilter.teamId}`, listener);
        }

        const heartbeat = setInterval(() => {
          controller.enqueue(encoder.encode(": heartbeat\n\n"));
        }, 15000);

        request.signal.addEventListener("abort", () => {
          clearInterval(heartbeat);
          unsubscribe?.();
          controller.close();
        });
      },
      cancel() {
        unsubscribe?.();
      },
    });

    return new NextResponse(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
