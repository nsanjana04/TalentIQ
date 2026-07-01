import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type StatusVariant = "active" | "inactive" | "pending" | "draft" | "published" | "archived";

const STATUS_MAP: Record<StatusVariant, { label: string; variant: "success" | "secondary" | "warning" | "outline" | "default" }> = {
  active: { label: "Active", variant: "success" },
  inactive: { label: "Inactive", variant: "secondary" },
  pending: { label: "Pending", variant: "warning" },
  draft: { label: "Draft", variant: "outline" },
  published: { label: "Published", variant: "success" },
  archived: { label: "Archived", variant: "secondary" },
};

export function StatusBadge({ status, className }: { status: StatusVariant; className?: string }) {
  const config = STATUS_MAP[status] ?? STATUS_MAP.pending;
  return (
    <Badge variant={config.variant} className={cn("capitalize", className)}>
      {config.label}
    </Badge>
  );
}

type RiskLevel = "critical" | "high" | "medium" | "low" | "none";

const RISK_MAP: Record<RiskLevel, { label: string; variant: "danger" | "warning" | "secondary" | "success" | "outline" }> = {
  critical: { label: "Critical", variant: "danger" },
  high: { label: "High Risk", variant: "danger" },
  medium: { label: "Medium Risk", variant: "warning" },
  low: { label: "Low Risk", variant: "secondary" },
  none: { label: "No Risk", variant: "success" },
};

export function RiskBadge({ level, className }: { level: RiskLevel; className?: string }) {
  const config = RISK_MAP[level] ?? RISK_MAP.none;
  return (
    <Badge variant={config.variant} className={className}>
      {config.label}
    </Badge>
  );
}

export function RoleBadge({ role, className }: { role: string; className?: string }) {
  return (
    <Badge variant="outline" className={cn("font-medium", className)}>
      {role}
    </Badge>
  );
}
