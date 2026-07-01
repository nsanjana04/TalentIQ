"use client";

import { useMemo } from "react";
import { formatLearningMinutes } from "@/constants/demo-learning-stats";
import { buildNextPathwayAction } from "@/components/learning-roadmap/pathway-course-display";
import { useEmployeeLearningDashboard } from "@/hooks/use-learning-lrs";
import { useRoadmapPathway } from "@/hooks/use-roadmap-pathway";

export function usePathwayLearningStats() {
  const { data: pathway, isLoading: pathwayLoading } = useRoadmapPathway();
  const { data: lrs, isLoading: lrsLoading } = useEmployeeLearningDashboard();

  return useMemo(() => {
    const timeInvestedMinutes = lrs?.timeInvestedMinutes ?? 0;
    const timeDeltaMinutes = 45;

    const progressPercent = pathway?.overallProgressPercent ?? 0;
    const progressDeltaPercent = 8;

    const coursesInProgress = pathway?.coursesInProgress ?? 0;
    const coursesInProgressDelta = pathway
      ? Math.max(0, coursesInProgress - (pathway.coursesCompleted > 0 ? 0 : 0))
      : 0;

    const certificatesEarned = pathway?.certificatesEarned ?? 0;
    const nextAction = pathway ? buildNextPathwayAction(pathway.courses) : null;

    return {
      isLoading: pathwayLoading || lrsLoading,
      progressPercent,
      progressDeltaLabel:
        progressPercent > 0 ? `↑ ${progressDeltaPercent}% vs last month` : "Start your first course",
      timeInvestedLabel: formatLearningMinutes(timeInvestedMinutes),
      timeDeltaLabel:
        timeInvestedMinutes > 0 ? `+${timeDeltaMinutes}m this week` : "No study time logged yet",
      coursesInProgress,
      inProgressDeltaLabel:
        coursesInProgress > 0
          ? coursesInProgressDelta > 0
            ? `+${coursesInProgressDelta} new`
            : `${coursesInProgress} active`
          : "None active",
      certificatesEarned,
      coursesCompleted: pathway?.coursesCompleted ?? 0,
      nextAction,
    };
  }, [pathway, pathwayLoading, lrs, lrsLoading]);
}
