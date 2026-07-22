"use client";

import Link from "next/link";
import { ChevronRight, Building2, Users, User } from "lucide-react";
import type { DrillDownNode } from "@/types/employee-intelligence";
import { cn } from "@/lib/utils";

const ICONS = {
  organization: Building2,
  department: Users,
  team: Users,
  employee: User,
} as const;

interface DrillDownPanelProps {
  node: DrillDownNode;
  className?: string;
}

function DrillNode({ node, depth = 0 }: { node: DrillDownNode; depth?: number }) {
  const Icon = ICONS[node.type];
  const content = (
    <div
      className={cn(
        "flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm transition-colors",
        node.href && "hover:bg-muted/60",
        depth === 0 && "font-semibold"
      )}
      style={{ paddingLeft: `${depth * 12 + 8}px` }}
    >
      <Icon className="h-3.5 w-3.5 shrink-0 text-primary" />
      <span className="truncate">{node.label}</span>
      {node.count != null && (
        <span className="ml-auto text-xs tabular-nums text-muted-foreground">{node.count}</span>
      )}
      {node.href && <ChevronRight className="h-3 w-3 text-muted-foreground" />}
    </div>
  );

  return (
    <div>
      {node.href ? (
        <Link href={node.href}>{content}</Link>
      ) : (
        content
      )}
      {node.children?.map((child) => (
        <DrillNode key={`${child.type}-${child.id}`} node={child} depth={depth + 1} />
      ))}
    </div>
  );
}

export function DrillDownPanel({ node, className }: DrillDownPanelProps) {
  return (
    <div className={cn("enterprise-panel p-4", className)}>
      <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Drill-down hierarchy
      </p>
      <p className="mb-2 text-xs text-muted-foreground">
        Organization → Department → Team → Employee
      </p>
      <DrillNode node={node} />
    </div>
  );
}
