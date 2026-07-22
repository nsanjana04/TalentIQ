import { cn } from "@/lib/utils";

interface PageShellProps {
  children: React.ReactNode;
  className?: string;
}

export function PageShell({ children, className }: PageShellProps) {
  return (
    <div className={cn("command-gradient min-h-full space-y-6 p-4 md:p-6", className)}>
      {children}
    </div>
  );
}
