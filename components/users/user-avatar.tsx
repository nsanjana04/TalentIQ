import { cn } from "@/lib/utils";

interface UserAvatarProps {
  initials: string;
  colorClass: string;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

const SIZE_CLASSES = {
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-12 w-12 text-base",
  xl: "h-16 w-16 text-xl",
};

export function UserAvatar({
  initials,
  colorClass,
  size = "md",
  className,
}: UserAvatarProps) {
  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br font-semibold text-white shadow-sm",
        colorClass,
        SIZE_CLASSES[size],
        className
      )}
    >
      {initials}
    </div>
  );
}
