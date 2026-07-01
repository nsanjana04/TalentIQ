import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth/session";
import { handleApiError } from "@/lib/errors/api-error";
import { AppError } from "@/lib/errors/app-error";
import { getNotificationEventBus } from "@/lib/notifications/event-bus";
import { Permission } from "@/lib/rbac/permissions";
import { requirePermission } from "@/lib/rbac/guard";

export async function GET(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) throw new AppError("UNAUTHORIZED", "Authentication required");
    requirePermission(session, Permission.DASHBOARD_VIEW);

    const bus = getNotificationEventBus();
    const encoder = new TextEncoder();
    let unsubscribe: (() => void) | null = null;

    const stream = new ReadableStream({
      start(controller) {
        const send = (data: unknown) => {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
        };

        send({ type: "connected", userId: session.userId });

        unsubscribe = bus.subscribe(session.userId, (event) => send(event));

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
