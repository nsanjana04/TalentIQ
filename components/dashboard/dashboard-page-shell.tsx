import { cn } from "@/lib/utils";

interface DashboardPageShellProps {
  children: React.ReactNode;
  className?: string;
}

/** Consistent max-width, padding, and overflow containment for all dashboard variants. */
export function DashboardPageShell({ children, className }: DashboardPageShellProps) {
  return (
    <div className="command-gradient min-h-full w-full min-w-0">
      <div
        className={cn(
          "mx-auto w-full min-w-0 max-w-[1600px] space-y-6 p-4 sm:p-5 lg:p-6",
          className
        )}
      >
        {children}
      </div>
    </div>
  );
}
