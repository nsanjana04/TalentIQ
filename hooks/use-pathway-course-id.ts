"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import {
  getPathwayCourseSlugCandidates,
  pickBestPathwayCourse,
} from "@/lib/learning/resolve-pathway-course";
import { useEmployeeLearningDashboard } from "@/hooks/use-learning-lrs";
import { useLearningRoadmap } from "@/hooks/use-learning-roadmap";

export const PATHWAY_COURSE_KEY = ["learning", "pathway-course"] as const;

interface PathwayCourseLookup {
  id: string;
  slug: string;
  title: string;
  moduleCount: number;
}

export function usePathwayCourseLookup(
  topicSlug: string | null | undefined,
  levelNumber?: number
) {
  return useQuery({
    queryKey: [...PATHWAY_COURSE_KEY, topicSlug, levelNumber ?? "all"],
    queryFn: () =>
      apiClient.get<{ course: PathwayCourseLookup | null }>("/api/learning/pathway-course", {
        params: {
          topicSlug: topicSlug ?? undefined,
          level: levelNumber != null ? String(levelNumber) : undefined,
        },
      }),
    enabled: !!topicSlug,
    staleTime: 5 * 60 * 1000,
    select: (data) => data.course,
  });
}

/** Resolves a DB course id for a pathway topic slug or direct course slug. */
export function usePathwayCourseId(
  slugOrTopic: string | null | undefined,
  levelNumber?: number
) {
  const { data: lookup, isLoading: lookupLoading } = usePathwayCourseLookup(
    slugOrTopic,
    levelNumber
  );
  const { data: lrs } = useEmployeeLearningDashboard();
  const { data: roadmap } = useLearningRoadmap();

  const courseId = useMemo(() => {
    if (!slugOrTopic) return null;

    const candidates = getPathwayCourseSlugCandidates(slugOrTopic, levelNumber);
    const activeRecords = (lrs?.activeCourses ?? []).map((c) => ({
      id: c.courseId,
      slug: c.courseSlug,
      moduleCount: c.totalLessons > 0 ? 1 : 0,
    }));
    const roadmapCourses = (roadmap?.skills ?? []).flatMap((skill) =>
      skill.steps
        .map((step) => step.course)
        .filter((c): c is NonNullable<typeof c> => !!c?.id && !!c.slug)
        .map((c) => ({
          id: c.id,
          slug: c.slug,
          moduleCount: c.moduleCount ?? 0,
        }))
    );
    const fromClient = pickBestPathwayCourse(candidates, [...activeRecords, ...roadmapCourses]);

    if (lookup?.id) {
      return lookup.id;
    }

    return fromClient?.id ?? null;
  }, [slugOrTopic, levelNumber, lookup?.id, lrs?.activeCourses, roadmap?.skills]);

  return {
    courseId,
    courseTitle: lookup?.title ?? null,
    moduleCount: lookup?.moduleCount ?? 0,
    isLoading: lookupLoading,
  };
}
