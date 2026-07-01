"use client";

import { motion } from "framer-motion";
import { Award, Briefcase, ChevronRight, TrendingUp, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

export type ReadinessLevel = "ready" | "developing" | "not-ready";

interface EmployeeCardProps {
  name: string;
  role?: string;
  department?: string;
  readiness: ReadinessLevel;
  skillScore?: number;
  learningProgress?: number;
  certifications?: number;
  promotionScore?: number;
  onClick?: () => void;
  className?: string;
  delay?: number;
}

const readinessConfig: Record<
  ReadinessLevel,
  { label: string; variant: "success" | "warning" | "danger"; progress: number }
> = {
  ready: { label: "Promotion Ready", variant: "success", progress: 90 },
  developing: { label: "Developing", variant: "warning", progress: 55 },
  "not-ready": { label: "Not Ready", variant: "danger", progress: 25 },
};

export function EmployeeCard({
  name,
  role,
  department,
  readiness,
  skillScore,
  learningProgress,
  certifications,
  promotionScore,
  onClick,
  className,
  delay = 0,
}: EmployeeCardProps) {
  const config = readinessConfig[readiness];
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const Comp = onClick ? "button" : "div";

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, delay }}
    >
      <Comp
        type={onClick ? "button" : undefined}
        onClick={onClick}
        className={cn(
          "enterprise-panel group w-full p-4 text-left transition-all hover:border-primary/30 hover:shadow-md",
          onClick && "cursor-pointer",
          className
        )}
      >
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-sm font-bold text-primary">
            {initials || <User className="h-5 w-5" />}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="truncate font-semibold text-foreground">{name}</p>
                {role && (
                  <p className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Briefcase className="h-3 w-3" />
                    {role}
                  </p>
                )}
              </div>
              <Badge variant={config.variant}>{config.label}</Badge>
            </div>
            {department && (
              <p className="mt-1 text-xs text-muted-foreground">{department}</p>
            )}
          </div>
        </div>

        <div className="mt-4 space-y-3">
          {(skillScore != null || learningProgress != null) && (
            <div className="grid grid-cols-2 gap-3 text-xs">
              {skillScore != null && (
                <div>
                  <span className="text-muted-foreground">Skills</span>
                  <p className="font-semibold tabular-nums">{skillScore}%</p>
                </div>
              )}
              {learningProgress != null && (
                <div>
                  <span className="text-muted-foreground">Learning</span>
                  <p className="font-semibold tabular-nums">{learningProgress}%</p>
                </div>
              )}
            </div>
          )}
          <div>
            <div className="mb-1 flex justify-between text-xs">
              <span className="text-muted-foreground">Readiness index</span>
              <span className="font-medium tabular-nums">
                {promotionScore ?? config.progress}%
              </span>
            </div>
            <Progress value={promotionScore ?? config.progress} className="h-1.5" />
          </div>
          {certifications != null && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Award className="h-3.5 w-3.5 text-warning" />
              {certifications} active certifications
            </div>
          )}
        </div>

        {onClick && (
          <div className="mt-3 flex items-center gap-1 text-xs font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100">
            <TrendingUp className="h-3 w-3" />
            View profile
            <ChevronRight className="h-3 w-3" />
          </div>
        )}
      </Comp>
    </motion.div>
  );
}
