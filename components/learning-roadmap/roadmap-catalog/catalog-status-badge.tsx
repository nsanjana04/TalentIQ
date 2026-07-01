import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { CatalogStatus } from "./catalog-utils";
import { getCatalogStatusLabel } from "./catalog-utils";

const STYLES: Record<CatalogStatus, string> = {
  not_started: "bg-muted text-muted-foreground",
  in_progress: "bg-primary/10 text-primary",
  completed: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
  locked: "bg-muted text-muted-foreground",
};

export function CatalogStatusBadge({
  status,
  className,
}: {
  status: CatalogStatus;
  className?: string;
}) {
  return (
    <Badge className={cn("text-[10px] font-medium", STYLES[status], className)}>
      {getCatalogStatusLabel(status)}
    </Badge>
  );
}
