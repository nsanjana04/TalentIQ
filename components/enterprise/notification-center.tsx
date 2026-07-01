"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { Bell, CheckCheck, AlertTriangle, Info, Award } from "lucide-react";
import { useState } from "react";
import type { NotificationItem } from "@/hooks/use-notifications";
import { useMarkAllNotificationsRead, useMarkNotificationRead } from "@/hooks/use-notifications";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface NotificationCenterProps {
  notifications?: NotificationItem[];
  unreadCount?: number;
  dotOnly?: boolean;
}

const TYPE_ICONS: Record<string, typeof Bell> = {
  INFO: Info,
  WARNING: AlertTriangle,
  SUCCESS: CheckCheck,
  ACTION_REQUIRED: AlertTriangle,
  SYSTEM: Bell,
};

export function NotificationCenter({ notifications = [], unreadCount = 0, dotOnly = false }: NotificationCenterProps) {
  const [open, setOpen] = useState(false);
  const markRead = useMarkNotificationRead();
  const markAll = useMarkAllNotificationsRead();

  const unread = unreadCount || notifications.filter((n) => !n.isRead).length;

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="icon"
        className="relative"
        onClick={() => setOpen(!open)}
        aria-label={`Notifications${unread ? `, ${unread} unread` : ""}`}
        aria-expanded={open}
      >
        <Bell className="h-4 w-4" />
        {(unread > 0 || dotOnly) && (
          <span
            className={cn(
              "absolute right-1.5 top-1.5 rounded-full bg-[#EF4444]",
              dotOnly ? "h-2 w-2" : "flex h-4 w-4 items-center justify-center text-[10px] font-bold text-destructive-foreground"
            )}
          >
            {!dotOnly && (unread > 9 ? "9+" : unread)}
          </span>
        )}
      </Button>

      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} aria-hidden />
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.98 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 z-40 mt-2 w-80 overflow-hidden rounded-xl border border-border bg-card shadow-xl sm:w-96"
              role="region"
              aria-label="Notification center"
            >
              <div className="flex items-center justify-between border-b border-border/50 px-4 py-3">
                <h3 className="text-sm font-semibold">Notifications</h3>
                {unread > 0 && (
                  <button
                    type="button"
                    onClick={() => markAll.mutate()}
                    className="text-xs font-medium text-primary hover:underline"
                  >
                    Mark all read
                  </button>
                )}
              </div>
              <div className="max-h-80 overflow-y-auto">
                {notifications.length === 0 ? (
                  <p className="px-4 py-8 text-center text-sm text-muted-foreground">
                    No notifications yet
                  </p>
                ) : (
                  notifications.map((item) => {
                    const Icon = TYPE_ICONS[item.type] ?? Award;
                    const inner = (
                      <>
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted">
                          <Icon className="h-4 w-4 text-primary" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium">{item.title}</p>
                          <p className="line-clamp-2 text-xs text-muted-foreground">{item.message}</p>
                          <p className="mt-1 text-[10px] text-muted-foreground">
                            {formatRelative(item.createdAt)}
                          </p>
                        </div>
                        {!item.isRead && (
                          <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-primary" />
                        )}
                      </>
                    );

                    const className = cn(
                      "flex w-full gap-3 border-b border-border/30 px-4 py-3 text-left transition-colors hover:bg-muted/30",
                      !item.isRead && "bg-primary/5"
                    );

                    if (item.actionUrl) {
                      return (
                        <Link
                          key={item.id}
                          href={item.actionUrl}
                          className={className}
                          onClick={() => {
                            if (!item.isRead) markRead.mutate(item.id);
                            setOpen(false);
                          }}
                        >
                          {inner}
                        </Link>
                      );
                    }

                    return (
                      <button
                        key={item.id}
                        type="button"
                        className={className}
                        onClick={() => {
                          if (!item.isRead) markRead.mutate(item.id);
                        }}
                      >
                        {inner}
                      </button>
                    );
                  })
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

function formatRelative(timestamp: string): string {
  const diff = Date.now() - new Date(timestamp).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}
