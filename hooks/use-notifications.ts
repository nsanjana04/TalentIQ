"use client";

import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";

export interface NotificationItem {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  actionUrl: string | null;
  createdAt: string;
}

interface NotificationsInbox {
  items: NotificationItem[];
  unreadCount: number;
}

export const NOTIFICATIONS_KEY = ["notifications", "inbox"] as const;

export function useNotifications() {
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: NOTIFICATIONS_KEY,
    queryFn: async () => {
      const data = await apiClient.get<{ items: NotificationItem[]; unread: number }>(
        "/api/notifications"
      );
      return { items: data.items, unreadCount: data.unread };
    },
    staleTime: 30_000,
    refetchInterval: 60_000,
  });

  useEffect(() => {
    const source = new EventSource("/api/notifications/stream", { withCredentials: true });
    source.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data) as { type?: string };
        if (payload.type === "notification") {
          qc.invalidateQueries({ queryKey: NOTIFICATIONS_KEY });
        }
      } catch {
        // ignore malformed events
      }
    };
    return () => source.close();
  }, [qc]);

  return query;
}

export function useMarkNotificationRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.post(`/api/notifications/${id}/read`, {}),
    onSuccess: () => qc.invalidateQueries({ queryKey: NOTIFICATIONS_KEY }),
  });
}

export function useMarkAllNotificationsRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => apiClient.post("/api/notifications/read-all", {}),
    onSuccess: () => qc.invalidateQueries({ queryKey: NOTIFICATIONS_KEY }),
  });
}
