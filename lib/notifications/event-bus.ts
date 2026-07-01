export interface NotificationRealtimePayload {
  type: "notification";
  data: {
    id: string;
    title: string;
    message: string;
    notificationType: string;
    actionUrl: string | null;
    createdAt: string;
  };
}

type Listener = (event: NotificationRealtimePayload) => void;

class NotificationEventBus {
  private listeners = new Map<string, Set<Listener>>();

  subscribe(userId: string, listener: Listener): () => void {
    if (!this.listeners.has(userId)) this.listeners.set(userId, new Set());
    this.listeners.get(userId)!.add(listener);
    return () => this.listeners.get(userId)?.delete(listener);
  }

  publish(userId: string, event: NotificationRealtimePayload): void {
    this.listeners.get(userId)?.forEach((l) => l(event));
  }
}

declare global {
  // eslint-disable-next-line no-var
  var __notificationEventBus: NotificationEventBus | undefined;
}

export function getNotificationEventBus(): NotificationEventBus {
  if (!globalThis.__notificationEventBus) {
    globalThis.__notificationEventBus = new NotificationEventBus();
  }
  return globalThis.__notificationEventBus;
}
