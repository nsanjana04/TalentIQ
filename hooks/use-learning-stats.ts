"use client";

import { useMemo } from "react";
import {
  aggregateTopicProgress,
  DEMO_EMPLOYEE_LEARNING_STATS,
  formatLearningMinutes,
} from "@/constants/demo-learning-stats";
import { useEmployeeLearningDashboard } from "@/hooks/use-learning-lrs";
import {
  FIGMA_ROADMAP_COURSES,
  type FigmaRoadmapCourse,
} from "@/components/learning-roadmap/figma/figma-roadmap-data";

export function useLearningStats() {
  const { data, isLoading } = useEmployeeLearningDashboard();

  return useMemo(() => {
    const fallback = DEMO_EMPLOYEE_LEARNING_STATS;
    if (!data) {
      return {
        isLoading,
        progressPercent: fallback.progressPercent,
        progressDeltaPercent: fallback.progressDeltaPercent,
        timeInvestedMinutes: fallback.timeInvestedMinutes,
        timeDeltaMinutes: fallback.timeDeltaMinutes,
        coursesInProgress: fallback.coursesInProgress,
        coursesInProgressDelta: fallback.coursesInProgressDelta,
        certificatesEarned: fallback.certificatesEarned,
        coursesCompleted: fallback.coursesCompleted,
        timeInvestedLabel: formatLearningMinutes(fallback.timeInvestedMinutes),
        timeDeltaLabel: `+${fallback.timeDeltaMinutes}m this week`,
        progressDeltaLabel: `↑ ${fallback.progressDeltaPercent}% vs last month`,
        inProgressDeltaLabel: `+${fallback.coursesInProgressDelta} new`,
      };
    }

    const avgProgress =
      data.activeCourses.length > 0
        ? Math.round(
            data.activeCourses.reduce((s, c) => s + c.progressPercent, 0) /
              data.activeCourses.length
          )
        : data.progressPercent;

    return {
      isLoading,
      progressPercent: avgProgress,
      progressDeltaPercent: fallback.progressDeltaPercent,
      timeInvestedMinutes: data.timeInvestedMinutes,
      timeDeltaMinutes: fallback.timeDeltaMinutes,
      coursesInProgress: data.coursesInProgress,
      coursesInProgressDelta: fallback.coursesInProgressDelta,
      certificatesEarned: data.certificatesEarned,
      coursesCompleted: data.coursesCompleted,
      timeInvestedLabel: formatLearningMinutes(data.timeInvestedMinutes),
      timeDeltaLabel: `+${fallback.timeDeltaMinutes}m this week`,
      progressDeltaLabel: `↑ ${fallback.progressDeltaPercent}% vs last month`,
      inProgressDeltaLabel: `+${fallback.coursesInProgressDelta} new`,
    };
  }, [data, isLoading]);
}

export function useFigmaRoadmapCourses(): {
  courses: FigmaRoadmapCourse[];
  isLoading: boolean;
} {
  const { data, isLoading } = useEmployeeLearningDashboard();

  const courses = useMemo(() => {
    const progressBySlug = new Map(
      (data?.activeCourses ?? []).map((c) => [
        c.courseSlug,
        { progressPercent: c.progressPercent, status: c.status },
      ])
    );

    return FIGMA_ROADMAP_COURSES.map((course) => {
      const aggregated = aggregateTopicProgress(course.slug, progressBySlug);
      return {
        ...course,
        progress: aggregated.progress,
        status: aggregated.status,
      };
    });
  }, [data]);

  return { courses, isLoading };
}
