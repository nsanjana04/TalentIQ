"use client";

import type { SkillRoadmap } from "@/types/learning-roadmap";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { LevelNode } from "./level-node";
import { cn } from "@/lib/utils";

interface SkillPathCardProps {
  skill: SkillRoadmap;
  expanded?: boolean;
  onStartCourse?: (courseId: string) => void;
  onContinueCourse?: (courseId: string) => void;
  onCompleteExternal?: (courseId: string) => void;
  onProgressRefresh?: () => void;
  starting?: boolean;
  completing?: boolean;
}

export function SkillPathCard({
  skill,
  expanded = true,
  onStartCourse,
  onContinueCourse,
  onCompleteExternal,
  onProgressRefresh: _onProgressRefresh,
  starting,
  completing,
}: SkillPathCardProps) {
  return (
    <Card className="overflow-hidden border-primary/10 bg-card/80 backdrop-blur-sm">
      <CardHeader className="border-b bg-gradient-to-r from-primary/5 to-transparent pb-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              {skill.categoryName}
            </p>
            <CardTitle className="mt-1 text-xl">{skill.skillName}</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              {skill.currentLevel
                ? `Current: ${skill.currentLevel.code} — ${skill.currentLevel.name}`
                : "Not yet assessed"}
              {skill.targetLevel && skill.completedSteps < skill.totalSteps && (
                <span> → Target: {skill.targetLevel.code}</span>
              )}
            </p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-primary">{skill.overallProgress}%</p>
            <p className="text-xs text-muted-foreground">
              {skill.completedSteps}/{skill.totalSteps} levels
            </p>
          </div>
        </div>
        <Progress value={skill.overallProgress} className="mt-3 h-1.5" />
      </CardHeader>

      {expanded && (
        <CardContent className="pt-6">
          <div className="flex gap-2 overflow-x-auto pb-2 sm:hidden">
            {skill.steps.map((step) => (
              <div
                key={step.id}
                className={cn(
                  "flex min-w-[4.5rem] flex-col items-center rounded-lg border px-2 py-2 text-center",
                  step.status === "completed" && "border-emerald-400/40 bg-emerald-500/5",
                  step.status === "in_progress" && "border-amber-400/40 bg-amber-500/5",
                  step.status === "available" && "border-primary/30 bg-primary/5",
                  step.status === "locked" && "opacity-50"
                )}
              >
                <span className="font-mono text-sm font-bold">{step.levelCode}</span>
                <span className="mt-1 text-[10px] capitalize">{step.status.replace("_", " ")}</span>
              </div>
            ))}
          </div>

          <div className="hidden sm:block">
            {skill.steps.map((step, i) => (
              <LevelNode
                key={step.id}
                step={step}
                isLast={i === skill.steps.length - 1}
                onStartCourse={onStartCourse}
                onContinueCourse={onContinueCourse}
                onCompleteExternal={onCompleteExternal}
                starting={starting}
                completing={completing}
              />
            ))}
          </div>
        </CardContent>
      )}
    </Card>
  );
}
