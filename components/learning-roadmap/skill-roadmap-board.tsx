"use client";

import { useEffect, useMemo, useState } from "react";
import type { SkillRoadmap } from "@/types/learning-roadmap";
import { LayoutGrid, List, Search } from "lucide-react";
import { SkillCompactRow } from "./skill-compact-row";
import { LevelCompactTile } from "./level-compact-tile";
import { SkillPathCard } from "./skill-path-card";
import { LevelStepDots } from "./level-step-dots";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

type ViewMode = "compact" | "expanded";

interface SkillRoadmapBoardProps {
  skills: SkillRoadmap[];
  onStartCourse?: (courseId: string) => void;
  onCompleteExternal?: (courseId: string) => void;
  onProgressRefresh?: () => void;
  starting?: boolean;
  completing?: boolean;
}

function defaultSelectedId(skills: SkillRoadmap[]) {
  const active = skills.find((s) => s.steps.some((st) => st.status === "in_progress"));
  return active?.skillId ?? skills[0]?.skillId ?? "";
}

export function SkillRoadmapBoard({
  skills,
  onStartCourse,
  onCompleteExternal,
  onProgressRefresh,
  starting,
  completing,
}: SkillRoadmapBoardProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("compact");
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState(() => defaultSelectedId(skills));

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return skills;
    return skills.filter(
      (s) =>
        s.skillName.toLowerCase().includes(q) ||
        s.categoryName.toLowerCase().includes(q) ||
        s.steps.some((st) => st.title.toLowerCase().includes(q))
    );
  }, [skills, search]);

  useEffect(() => {
    if (!filtered.some((s) => s.skillId === selectedId)) {
      setSelectedId(defaultSelectedId(filtered));
    }
  }, [filtered, selectedId]);

  const selected = filtered.find((s) => s.skillId === selectedId) ?? filtered[0];

  if (viewMode === "expanded") {
    return (
      <div className="space-y-4">
        <BoardToolbar
          search={search}
          onSearchChange={setSearch}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          skillCount={filtered.length}
        />
        <div className="space-y-6">
          {filtered.map((skill) => (
            <SkillPathCard
              key={skill.skillId}
              skill={skill}
              onStartCourse={onStartCourse}
              onCompleteExternal={onCompleteExternal}
              onProgressRefresh={onProgressRefresh}
              starting={starting}
              completing={completing}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <BoardToolbar
        search={search}
        onSearchChange={setSearch}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        skillCount={filtered.length}
      />

      <div className="overflow-hidden rounded-xl border border-border/60 bg-card shadow-sm">
        <div className="grid lg:grid-cols-[minmax(260px,300px)_1fr]">
          {/* Skill list — dense, scrollable */}
          <div className="border-b lg:border-b-0 lg:border-r">
            <div className="border-b bg-muted/30 px-3 py-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Skill paths ({filtered.length})
              </p>
            </div>
            <div className="max-h-[28rem] space-y-1 overflow-y-auto p-2 lg:max-h-[32rem]">
              {filtered.length === 0 ? (
                <p className="px-2 py-6 text-center text-sm text-muted-foreground">
                  No skills match your search.
                </p>
              ) : (
                filtered.map((skill) => (
                  <SkillCompactRow
                    key={skill.skillId}
                    skill={skill}
                    selected={skill.skillId === selectedId}
                    onSelect={() => setSelectedId(skill.skillId)}
                  />
                ))
              )}
            </div>
          </div>

          {/* Selected skill — horizontal level strip */}
          <div className="min-w-0">
            {selected ? (
              <>
                <div className="border-b bg-gradient-to-r from-primary/[0.04] to-transparent px-4 py-3">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <h3 className="text-base font-bold">{selected.skillName}</h3>
                      <p className="text-xs text-muted-foreground">
                        {selected.categoryName}
                        {selected.currentLevel &&
                          ` · Current ${selected.currentLevel.code}`}
                        {selected.targetLevel &&
                          ` · Target ${selected.targetLevel.code}`}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <LevelStepDots steps={selected.steps} size="md" showLabels />
                      <div className="text-right">
                        <p className="text-lg font-bold text-primary">
                          {selected.overallProgress}%
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          {selected.completedSteps}/{selected.totalSteps} levels
                        </p>
                      </div>
                    </div>
                  </div>
                  <Progress value={selected.overallProgress} className="mt-2 h-1" />
                </div>

                <div className="flex gap-3 overflow-x-auto p-4 pb-5">
                  {selected.steps.map((step) => (
                    <LevelCompactTile
                      key={step.id}
                      step={step}
                      onStartCourse={onStartCourse}
                      onCompleteExternal={onCompleteExternal}
                      onProgressRefresh={onProgressRefresh}
                      starting={starting}
                      completing={completing}
                    />
                  ))}
                </div>
              </>
            ) : (
              <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
                Select a skill path to view levels
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function BoardToolbar({
  search,
  onSearchChange,
  viewMode,
  onViewModeChange,
  skillCount,
}: {
  search: string;
  onSearchChange: (v: string) => void;
  viewMode: ViewMode;
  onViewModeChange: (v: ViewMode) => void;
  skillCount: number;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="relative min-w-[12rem] flex-1 sm:max-w-xs">
        <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search skills or courses…"
          className="h-8 pl-8 text-sm"
        />
      </div>
      <p className="text-xs text-muted-foreground">{skillCount} paths</p>
      <div className="ml-auto flex rounded-lg border p-0.5">
        <Button
          type="button"
          size="sm"
          variant={viewMode === "compact" ? "secondary" : "ghost"}
          className="h-7 gap-1 px-2 text-xs"
          onClick={() => onViewModeChange("compact")}
        >
          <LayoutGrid className="h-3.5 w-3.5" />
          Compact
        </Button>
        <Button
          type="button"
          size="sm"
          variant={viewMode === "expanded" ? "secondary" : "ghost"}
          className="h-7 gap-1 px-2 text-xs"
          onClick={() => onViewModeChange("expanded")}
        >
          <List className="h-3.5 w-3.5" />
          Expanded
        </Button>
      </div>
    </div>
  );
}
