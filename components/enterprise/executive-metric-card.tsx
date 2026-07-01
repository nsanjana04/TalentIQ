"use client";

import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { MetricTile, type MetricStatus } from "./metric-tile";
import { usePermissions } from "@/hooks/use-permissions";

interface ExecutiveMetricCardProps {
  label: string;
  value: string | number;
  subtitle?: string;
  change?: number;
  changeLabel?: string;
  icon: LucideIcon;
  status?: MetricStatus;
  sparkline?: number[];
  href?: string;
  statusLabel?: string;
  delay?: number;
}

export function ExecutiveMetricCard({
  href,
  statusLabel,
  subtitle,
  ...props
}: ExecutiveMetricCardProps) {
  const { canAccessScreen } = usePermissions();
  const routeAllowed = href ? canAccessScreen(href) : false;
  const linkHref = routeAllowed ? href : undefined;

  const card = (
    <MetricTile
      {...props}
      subtitle={statusLabel ? `${statusLabel}${subtitle ? ` · ${subtitle}` : ""}` : subtitle}
      className={linkHref ? "cursor-pointer" : undefined}
    />
  );

  if (linkHref) {
    return (
      <Link href={linkHref} className="block transition-transform hover:scale-[1.01]">
        {card}
      </Link>
    );
  }

  return card;
}
