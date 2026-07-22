import type { LearningRealtimePayload } from "@/types/learning-lrs";

export type { LearningRealtimePayload };

type Listener = (event: LearningRealtimePayload) => void;

class LearningEventBus {
  private listeners = new Map<string, Set<Listener>>();

  subscribe(userId: string, listener: Listener): () => void {
    const key = userId;
    if (!this.listeners.has(key)) this.listeners.set(key, new Set());
    this.listeners.get(key)!.add(listener);
    return () => this.listeners.get(key)?.delete(listener);
  }

  subscribeScope(scopeKey: string, listener: Listener): () => void {
    if (!this.listeners.has(scopeKey)) this.listeners.set(scopeKey, new Set());
    this.listeners.get(scopeKey)!.add(listener);
    return () => this.listeners.get(scopeKey)?.delete(listener);
  }

  publish(userId: string, event: LearningRealtimePayload): void {
    this.listeners.get(userId)?.forEach((l) => l(event));
    this.listeners.get("global")?.forEach((l) => l(event));
    if (event.data.departmentId) {
      this.listeners.get(`dept:${event.data.departmentId}`)?.forEach((l) => l(event));
    }
    if (event.data.teamId) {
      this.listeners.get(`team:${event.data.teamId}`)?.forEach((l) => l(event));
    }
  }
}

declare global {
  // eslint-disable-next-line no-var
  var __learningEventBus: LearningEventBus | undefined;
}

export function getLearningEventBus(): LearningEventBus {
  if (!globalThis.__learningEventBus) {
    globalThis.__learningEventBus = new LearningEventBus();
  }
  return globalThis.__learningEventBus;
}
