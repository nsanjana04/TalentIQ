import { cn } from "@/lib/utils";

interface DashboardSectionProps {
  children: React.ReactNode;
  className?: string;
  "aria-label"?: string;
}

/** Grid section with min-width guard so charts never blow out the layout. */
export function DashboardSection({ children, className, "aria-label": ariaLabel }: DashboardSectionProps) {
  return (
    <section aria-label={ariaLabel} className={cn("grid min-w-0 gap-4", className)}>
      {children}
    </section>
  );
}
