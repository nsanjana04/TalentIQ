"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserPlus } from "lucide-react";
import { ROUTES } from "@/constants/routes";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const NAV = [
  { href: ROUTES.ADMIN_LEARNING, label: "Dashboard", exact: true },
  { href: ROUTES.ADMIN_LEARNING_COURSES, label: "Courses" },
  { href: ROUTES.ADMIN_LEARNING_ASSIGNMENTS, label: "Assignments" },
  { href: ROUTES.ADMIN_LEARNING_PROGRESS, label: "Learning Progress" },
  { href: ROUTES.ADMIN_LEARNING_DEPARTMENT_PROGRESS, label: "Department Progress" },
  { href: ROUTES.ADMIN_LEARNING_OVERDUE, label: "Overdue Assignments" },
  { href: ROUTES.ADMIN_LEARNING_CERTIFICATES, label: "Certificates" },
  { href: ROUTES.ADMIN_LEARNING_REPORTS, label: "Reports" },
] as const;

export function LearningAdminNav() {
  const pathname = usePathname();

  return (
    <div className="space-y-3 border-b pb-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-muted-foreground">
          Assign using <strong>Course + Level + Audience + Due Date</strong>
        </p>
        <Button asChild size="sm" className="gap-1.5">
          <Link href={ROUTES.ADMIN_LEARNING_ASSIGNMENTS_NEW}>
            <UserPlus className="h-4 w-4" />
            Assign course level
          </Link>
        </Button>
      </div>
      <nav className="flex flex-wrap gap-2">
      {NAV.map((item) => {
        const active = "exact" in item && item.exact
          ? pathname === item.href
          : pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
              active
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:text-foreground"
            )}
          >
            {item.label}
          </Link>
        );
      })}
      </nav>
    </div>
  );
}
