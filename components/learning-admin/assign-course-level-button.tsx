import Link from "next/link";
import { UserPlus } from "lucide-react";
import { Button, type ButtonProps } from "@/components/ui/button";
import { ROUTES } from "@/constants/routes";

type AssignCourseLevelButtonProps = {
  courseId?: string;
  courseLevelId?: string;
  label?: string;
  size?: ButtonProps["size"];
  variant?: ButtonProps["variant"];
  className?: string;
};

export function assignCourseLevelHref(courseId?: string, courseLevelId?: string) {
  const params = new URLSearchParams();
  if (courseId) params.set("courseId", courseId);
  if (courseLevelId) params.set("courseLevelId", courseLevelId);
  const query = params.toString();
  return query
    ? `${ROUTES.ADMIN_LEARNING_ASSIGNMENTS_NEW}?${query}`
    : ROUTES.ADMIN_LEARNING_ASSIGNMENTS_NEW;
}

export function AssignCourseLevelButton({
  courseId,
  courseLevelId,
  label = "Assign course level",
  size = "sm",
  variant = "default",
  className,
}: AssignCourseLevelButtonProps) {
  return (
    <Button asChild size={size} variant={variant} className={className}>
      <Link href={assignCourseLevelHref(courseId, courseLevelId)} className="gap-1.5">
        <UserPlus className="h-4 w-4" />
        {label}
      </Link>
    </Button>
  );
}

export function AssignCourseLevelLink({
  courseId,
  courseLevelId,
  children = "Assign",
  className,
}: {
  courseId?: string;
  courseLevelId?: string;
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <Link href={assignCourseLevelHref(courseId, courseLevelId)} className={className}>
      {children}
    </Link>
  );
}
