"use client";

import Link from "next/link";
import {
  Award,
  BookOpen,
  Calendar,
  GraduationCap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/constants/routes";

interface ExecutiveActionsProps {
  employeeId: string;
  employeeName: string;
  className?: string;
}

const ACTIONS = [
  {
    id: "training",
    label: "Assign Training",
    icon: GraduationCap,
    href: (id: string) => `${ROUTES.LEARNING}?assignTo=${id}`,
  },
  {
    id: "review",
    label: "Schedule Review",
    icon: Calendar,
    href: (id: string) => `${ROUTES.ASSESSMENTS}?reviewFor=${id}`,
  },
  {
    id: "cert",
    label: "Renew Certification",
    icon: Award,
    href: (id: string) => `${ROUTES.CERTIFICATIONS}?renew=${id}`,
  },
] as const;

export function ExecutiveActions({ employeeId, employeeName, className }: ExecutiveActionsProps) {
  return (
    <div className={className}>
      <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Executive actions · {employeeName}
      </p>
      <div className="flex flex-wrap gap-2">
        {ACTIONS.map(({ id, label, icon: Icon, href }) => (
          <Button key={id} variant="outline" size="sm" asChild>
            <Link href={href(employeeId)}>
              <Icon className="mr-1.5 h-3.5 w-3.5" />
              {label}
            </Link>
          </Button>
        ))}
        <Button variant="ghost" size="sm" asChild>
          <Link href={`${ROUTES.LEARNING}?employee=${employeeId}`}>
            <BookOpen className="mr-1.5 h-3.5 w-3.5" />
            Learning path
          </Link>
        </Button>
      </div>
    </div>
  );
}
