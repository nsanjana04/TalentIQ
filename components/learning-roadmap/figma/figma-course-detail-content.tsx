"use client";

import Link from "next/link";
import {
  Award,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Clock,
  Download,
  ExternalLink,
  FileText,
  GraduationCap,
  Layers,
  Loader2,
  Lock,
  PlayCircle,
  UserPlus,
} from "lucide-react";
import { useState } from "react";
import { ROUTES } from "@/constants/routes";
import { usePermissions } from "@/hooks/use-permissions";
import { Permission } from "@/lib/rbac/permissions";
import type { CourseLevel, CourseLesson, FigmaCourseDetail } from "./figma-course-detail-data";
import { getCourseDetailBySlug } from "./figma-course-detail-data";
import { PathwayCourseModulesSection } from "@/components/learning-roadmap/pathway-course-modules-section";
import { usePathwayCourseId } from "@/hooks/use-pathway-course-id";
import { FigmaRoadmapAssignDialog } from "./figma-roadmap-assign-dialog";
import { toRoadmapCourse } from "./figma-roadmap-data";
import { TechLogo } from "./figma-tech-logos";

function courseLaunchLabel(course: FigmaCourseDetail): string {
  return course.status === "in_progress" ? "Continue Learning" : "Start Course";
}

function levelLaunchLabel(level: CourseLevel): string {
  if (level.status === "active") return "Continue Learning";
  return "Start Course";
}

function ExternalLaunchButton({
  href,
  label,
  className,
}: {
  href: string;
  label: string;
  className?: string;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={
        className ??
        "inline-flex items-center gap-1.5 rounded-lg bg-[#2563EB] px-6 py-2.5 text-sm font-semibold text-white hover:bg-[#1D4ED8]"
      }
    >
      {label}
      <ExternalLink className="h-4 w-4" />
    </a>
  );
}

interface FigmaCourseDetailContentProps {
  slug: string;
}

function LessonRowItem({ lesson, href }: { lesson: CourseLesson; href?: string }) {
  const content = (
    <>
      <div className="flex min-w-0 items-center gap-2">
        <span className="w-10 shrink-0 text-[13px] text-[#6B7280]">{lesson.num}</span>
        <span className="text-sm text-[#374151]">{lesson.title}</span>
      </div>
      <div className="flex shrink-0 items-center gap-3">
        <span className="text-[13px] text-[#9CA3AF]">{lesson.duration}</span>
        {lesson.status === "completed" && (
          <CheckCircle2 className="h-5 w-5 text-[#16A34A]" aria-label="Completed" />
        )}
        {lesson.status === "in_progress" && (
          <Loader2 className="h-5 w-5 animate-spin text-[#2563EB]" aria-label="In progress" />
        )}
        {lesson.status === "locked" && (
          <Lock className="h-5 w-5 text-[#9CA3AF]" aria-label="Locked" />
        )}
      </div>
    </>
  );

  if (href && lesson.status !== "locked") {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-between border-b border-[#F9FAFB] px-4 py-3 transition-colors hover:bg-[#F9FAFB]"
      >
        {content}
      </a>
    );
  }

  return (
    <div className="flex items-center justify-between border-b border-[#F9FAFB] px-4 py-3">
      {content}
    </div>
  );
}

function AssessmentRow({
  title,
  subtitle,
  score,
  locked,
  onOpen,
  hint,
}: {
  title: string;
  subtitle: string;
  score?: string;
  locked?: boolean;
  onOpen?: () => void;
  hint?: string;
}) {
  const content = (
    <>
      <div className="flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#EFF6FF]">
          <FileText className="h-4 w-4 text-[#2563EB]" />
        </div>
        <div>
          <p className="text-sm font-medium text-[#111827]">{title}</p>
          <p className="text-xs text-[#6B7280]">{subtitle}</p>
          {hint && <p className="mt-1 text-xs text-[#2563EB]">{hint}</p>}
        </div>
      </div>
      {locked ? (
        <Lock className="h-5 w-5 text-[#9CA3AF]" />
      ) : onOpen ? (
        <span className="text-xs font-semibold text-[#2563EB]">Open</span>
      ) : (
        <span className="text-sm font-semibold text-[#16A34A]">{score}</span>
      )}
    </>
  );

  if (onOpen && !locked) {
    return (
      <button
        type="button"
        onClick={onOpen}
        className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-[#F9FAFB]"
      >
        {content}
      </button>
    );
  }

  return <div className="flex items-center justify-between px-4 py-3">{content}</div>;
}

function scrollToPathwayModules() {
  document.getElementById("pathway-modules")?.scrollIntoView({ behavior: "smooth", block: "start" });
}

function LevelBadge({ level }: { level: CourseLevel }) {
  if (level.status === "active") {
    return (
      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#2563EB] text-xs font-semibold text-white">
        {level.number}
      </span>
    );
  }
  if (level.status === "available") {
    return (
      <span className="flex h-6 w-6 items-center justify-center rounded-full border border-[#D1D5DB] bg-white text-xs font-semibold text-[#374151]">
        {level.number}
      </span>
    );
  }
  return (
    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#F3F4F6]">
      <Lock className="h-3 w-3 text-[#9CA3AF]" />
    </span>
  );
}

function OverviewTab({ course }: { course: FigmaCourseDetail }) {
  return (
    <div className="rounded-xl border border-[#E5E7EB] bg-white p-6">
      <h2 className="text-base font-semibold text-[#111827]">About this course</h2>
      <p className="mt-3 text-sm leading-relaxed text-[#374151]">{course.overview}</p>
      <h3 className="mt-6 text-sm font-semibold text-[#111827]">What you will learn</h3>
      <ul className="mt-3 space-y-2">
        {course.learningObjectives.map((objective) => (
          <li key={objective} className="flex items-start gap-2 text-sm text-[#374151]">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#16A34A]" />
            {objective}
          </li>
        ))}
      </ul>
    </div>
  );
}

function LevelsTab({
  course,
  canAssign,
  onAssignLevel,
}: {
  course: FigmaCourseDetail;
  canAssign?: boolean;
  onAssignLevel?: (levelNumber: number) => void;
}) {
  return (
    <div className="space-y-3">
      {course.levels.map((level) => (
        <div
          key={level.number}
          className="rounded-xl border border-[#E5E7EB] bg-white p-5"
        >
          <div className="flex items-start gap-3">
            <LevelBadge level={level} />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-[15px] font-semibold text-[#111827]">
                  Level {level.number}: {level.title}
                </h3>
                <div className="flex items-center gap-3">
                  {level.status === "active" && level.progress !== undefined && (
                    <span className="text-[13px] font-medium text-[#2563EB]">{level.progress}% complete</span>
                  )}
                  {level.status === "locked" && (
                    <span className="inline-flex items-center gap-1 text-xs text-[#9CA3AF]">
                      <Lock className="h-3 w-3" /> Locked
                    </span>
                  )}
                  {level.status === "available" && (
                    <span className="text-xs font-medium text-[#6B7280]">Available</span>
                  )}
                  {canAssign && onAssignLevel && (
                    <button
                      type="button"
                      onClick={() => onAssignLevel(level.number)}
                      className="inline-flex items-center gap-1 text-xs font-medium text-[#2563EB] hover:underline"
                    >
                      <UserPlus className="h-3.5 w-3.5" />
                      Assign course
                    </button>
                  )}
                  {level.externalUrl && level.status !== "locked" && (
                    <ExternalLaunchButton
                      href={level.externalUrl}
                      label={levelLaunchLabel(level)}
                      className="inline-flex items-center gap-1 rounded-lg border border-[#2563EB] bg-white px-3 py-1.5 text-xs font-semibold text-[#2563EB] hover:bg-[#EFF6FF]"
                    />
                  )}
                </div>
              </div>
              <p className="mt-2 text-sm leading-relaxed text-[#6B7280]">{level.summary}</p>
              <div className="mt-3 flex flex-wrap gap-4 text-xs text-[#6B7280]">
                <span className="flex items-center gap-1">
                  <FileText className="h-3.5 w-3.5" />
                  {level.lessonCount} lessons
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  {level.duration}
                </span>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function LearningContentTab({ course }: { course: FigmaCourseDetail }) {
  const activeLevel =
    course.levels.find((level) => level.status === "active") ?? course.levels[0];
  const pathwayLevel = activeLevel?.number ?? 1;
  const { moduleCount } = usePathwayCourseId(course.slug, pathwayLevel);
  const hasLiveModules = moduleCount > 0;
  const [levelOpen, setLevelOpen] = useState<Record<number, boolean>>(() => {
    const initial: Record<number, boolean> = {};
    course.levels.forEach((level) => {
      if (level.status === "active") initial[level.number] = true;
    });
    return initial;
  });

  return (
    <div className="space-y-6">
      <PathwayCourseModulesSection
        topicSlug={course.slug}
        levelNumber={pathwayLevel}
        variant="figma"
      />

    <div className="overflow-hidden rounded-xl border border-[#E5E7EB] bg-white">
      {course.levels.map((level, index) => {
        const isExpanded = levelOpen[level.number] ?? level.status === "active";
        const hasLessons = Boolean(level.lessons?.length);
        const showLessons =
          hasLessons &&
          (level.showContentWhenLocked || (isExpanded && level.lessons));

        return (
          <div
            key={level.number}
            className={index < course.levels.length - 1 ? "border-b border-[#E5E7EB]" : ""}
          >
            {hasLessons && level.status !== "locked" ? (
              <button
                type="button"
                className="flex w-full items-center justify-between px-4 py-4"
                onClick={() => setLevelOpen((o) => ({ ...o, [level.number]: !o[level.number] }))}
              >
                <div className="flex items-center gap-3">
                  <LevelBadge level={level} />
                  <span className="text-[15px] font-semibold text-[#111827]">
                    Level {level.number}: {level.title}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-[13px] text-[#6B7280]">
                  {level.progress !== undefined && `${level.progress}%`}
                  {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </div>
              </button>
            ) : level.showContentWhenLocked ? (
              <div className="flex w-full items-center justify-between px-4 py-4">
                <div className="flex items-center gap-3">
                  <LevelBadge level={level} />
                  <span className="text-[15px] font-semibold text-[#111827]">
                    Level {level.number}: {level.title}
                  </span>
                </div>
                <ChevronDown className="h-4 w-4 text-[#6B7280]" />
              </div>
            ) : (
              <button
                type="button"
                className="flex w-full items-center justify-between px-4 py-4"
                onClick={() => setLevelOpen((o) => ({ ...o, [level.number]: !o[level.number] }))}
              >
                <div className="flex items-center gap-3">
                  <LevelBadge level={level} />
                  <span className="text-[15px] font-semibold text-[#111827]">
                    Level {level.number}: {level.title}
                  </span>
                </div>
                <ChevronDown className="h-4 w-4 text-[#6B7280]" />
              </button>
            )}

            {showLessons && (
              <div className="border-t border-[#F3F4F6]">
                {level.lessons!.map((lesson) => (
                  <LessonRowItem
                    key={lesson.num}
                    lesson={lesson}
                    href={level.externalUrl}
                  />
                ))}
                {level.assessment && (
                  <AssessmentRow
                    title={level.assessment.title}
                    subtitle={`${level.assessment.questions} Questions`}
                    score={level.assessment.score}
                    locked={level.assessment.locked}
                    onOpen={
                      hasLiveModules && !level.assessment.locked
                        ? scrollToPathwayModules
                        : undefined
                    }
                    hint={
                      hasLiveModules && !level.assessment.locked
                        ? "Use module assessments above — complete each module in order."
                        : undefined
                    }
                  />
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
    </div>
  );
}

function ResourceIcon({ type }: { type: string }) {
  switch (type) {
    case "Video":
      return <PlayCircle className="h-4 w-4 text-[#2563EB]" />;
    case "Link":
      return <ExternalLink className="h-4 w-4 text-[#2563EB]" />;
    case "PDF":
    case "Cheatsheet":
      return <Download className="h-4 w-4 text-[#2563EB]" />;
    default:
      return <FileText className="h-4 w-4 text-[#2563EB]" />;
  }
}

function resourceHref(course: FigmaCourseDetail, title: string): string | undefined {
  if (title === "Open on Udemy") return course.externalUrl;
  if (title === "Class Central — Udemy Free Courses") {
    return "https://www.classcentral.com/report/udemy-free-courses/";
  }
  if (title === "Udemy Free Courses Catalog") {
    return "https://www.udemy.com/courses/free/";
  }
  return undefined;
}

function ResourcesTab({ course }: { course: FigmaCourseDetail }) {
  return (
    <div className="divide-y divide-[#E5E7EB] overflow-hidden rounded-xl border border-[#E5E7EB] bg-white">
      {course.resources.map((resource) => {
        const href = resourceHref(course, resource.title);
        const content = (
          <>
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#EFF6FF]">
              <ResourceIcon type={resource.type} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-medium text-[#111827]">{resource.title}</p>
                <span className="rounded-md bg-[#F3F4F6] px-2 py-0.5 text-[11px] font-medium text-[#6B7280]">
                  {resource.type}
                </span>
              </div>
              <p className="mt-1 text-sm text-[#6B7280]">{resource.description}</p>
            </div>
            {href && <ExternalLink className="h-4 w-4 shrink-0 text-[#2563EB]" />}
          </>
        );

        return href ? (
          <a
            key={resource.title}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-start gap-4 px-5 py-4 transition-colors hover:bg-[#F9FAFB]"
          >
            {content}
          </a>
        ) : (
          <div key={resource.title} className="flex items-start gap-4 px-5 py-4">
            {content}
          </div>
        );
      })}
    </div>
  );
}

export function FigmaCourseDetailContent({ slug }: FigmaCourseDetailContentProps) {
  const course = getCourseDetailBySlug(slug);
  const [tab, setTab] = useState<"overview" | "levels" | "content" | "resources">("content");
  const [assignOpen, setAssignOpen] = useState(false);
  const [assignLevelNumber, setAssignLevelNumber] = useState<number | undefined>();
  const { canAny } = usePermissions();
  const canAssign = canAny([
    Permission.LEARNING_ASSIGNMENTS_CREATE,
    Permission.LEARNING_COURSES_MANAGE,
    Permission.COURSES_MANAGE,
  ]);

  const roadmapCourse = course
    ? toRoadmapCourse({
        slug: course.slug,
        title: course.title,
        description: course.description,
        logo: course.logo,
        status: course.status,
        progress: course.progress,
      })
    : null;

  const openEmployeeAssign = (levelNumber?: number) => {
    setAssignLevelNumber(levelNumber);
    setAssignOpen(true);
  };

  if (!course) {
    return (
      <div className="rounded-xl border border-[#E5E7EB] bg-white p-8 text-center">
        <p className="text-sm text-[#6B7280]">Course not found.</p>
        <Link href={ROUTES.LEARNING} className="mt-3 inline-block text-sm font-medium text-[#2563EB] hover:underline">
          Back to Learning Pathways
        </Link>
      </div>
    );
  }

  const tabs = [
    { id: "overview" as const, label: "Overview" },
    { id: "levels" as const, label: "Levels" },
    { id: "content" as const, label: "Learning Content" },
    { id: "resources" as const, label: "Resources" },
  ];

  return (
    <div className="space-y-6">
      <nav className="flex flex-wrap items-center gap-1 pb-4 text-[13px]">
        <Link href={ROUTES.LEARNING} className="text-[#6B7280] hover:text-[#374151]">
          Learning Pathways
        </Link>
        <ChevronRight className="h-3.5 w-3.5 text-[#9CA3AF]" />
        <Link href={ROUTES.LEARNING} className="text-[#6B7280] hover:text-[#374151]">
          {course.roadmapName}
        </Link>
        <ChevronRight className="h-3.5 w-3.5 text-[#9CA3AF]" />
        <span className="font-medium text-[#111827]">{course.title}</span>
      </nav>

      <div className="rounded-xl border border-[#E5E7EB] bg-white p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex min-w-0 gap-4">
            <TechLogo type={course.logo} size={48} />
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-[22px] font-bold text-[#111827]">{course.title}</h1>
                {course.status === "in_progress" && (
                  <span className="rounded-full bg-[#DCFCE7] px-2.5 py-0.5 text-[11px] font-semibold text-[#16A34A]">
                    In Progress
                  </span>
                )}
              </div>
              <p className="mt-1 text-sm text-[#6B7280]">{course.description}</p>
            </div>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-2">
            {canAssign && (
              <button
                type="button"
                onClick={() => openEmployeeAssign()}
                className="inline-flex items-center gap-1.5 rounded-lg border border-[#2563EB] bg-white px-5 py-2.5 text-sm font-semibold text-[#2563EB] hover:bg-[#EFF6FF]"
              >
                <UserPlus className="h-4 w-4" />
                Assign course
              </button>
            )}
            {course.externalUrl ? (
              <ExternalLaunchButton
                href={course.externalUrl}
                label={courseLaunchLabel(course)}
              />
            ) : (
              <button
                type="button"
                disabled
                className="cursor-not-allowed rounded-lg bg-[#93C5FD] px-6 py-2.5 text-sm font-semibold text-white"
              >
                {courseLaunchLabel(course)}
              </button>
            )}
            <p className="text-xs text-[#6B7280]">Your Progress</p>
            <div className="flex items-center gap-2">
              <div className="h-1.5 w-[120px] overflow-hidden rounded-full bg-[#E5E7EB]">
                <div
                  className="h-full rounded-full bg-[#2563EB]"
                  style={{ width: `${course.progress}%` }}
                />
              </div>
              <span className="text-[13px] font-semibold text-[#111827]">{course.progress}%</span>
            </div>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-4 border-t border-[#F3F4F6] pt-4">
          {[
            { icon: Layers, label: `${course.levels.length} Level${course.levels.length === 1 ? "" : "s"}` },
            { icon: GraduationCap, label: course.difficulty },
            { icon: Clock, label: course.estimatedHours },
            {
              icon: Award,
              label: course.provider
                ? `Free on ${course.provider}`
                : course.certificate
                  ? "Certificate"
                  : "No Certificate",
            },
          ].map((item, i) => (
            <div key={item.label} className="flex items-center gap-4">
              {i > 0 && <span className="hidden h-4 w-px bg-[#E5E7EB] sm:block" />}
              <div className="flex items-center gap-2">
                <item.icon className="h-4 w-4 text-[#2563EB]" />
                <span className="text-[13px] text-[#374151]">{item.label}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="border-b border-[#E5E7EB]">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={cnTab(tab === t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "overview" && <OverviewTab course={course} />}
      {tab === "levels" && (
        <LevelsTab
          course={course}
          canAssign={canAssign}
          onAssignLevel={openEmployeeAssign}
        />
      )}
      {tab === "content" && <LearningContentTab course={course} />}
      {tab === "resources" && <ResourcesTab course={course} />}

      <div className="rounded-xl border border-[#E5E7EB] bg-white px-6 py-5">
        <div className="flex flex-wrap divide-x-0 md:divide-x md:divide-[#E5E7EB]">
          {[
            { icon: FileText, label: "Total Modules", value: String(course.totalModules) },
            { icon: Lock, label: "Total Assessments", value: String(course.totalAssessments) },
            { icon: Clock, label: "Estimated Time", value: course.estimatedHours },
            { icon: Award, label: "Certificate", value: course.certificate ? "Yes" : "No" },
          ].map((stat) => (
            <div key={stat.label} className="flex flex-1 items-start gap-3 px-0 py-2 md:px-6 md:py-0">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#F3F4F6]">
                <stat.icon className="h-[18px] w-[18px] text-[#6B7280]" />
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase text-[#6B7280]">{stat.label}</p>
                <p className="mt-1 text-xl font-bold text-[#111827]">{stat.value}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <FigmaRoadmapAssignDialog
        course={roadmapCourse}
        open={assignOpen}
        onOpenChange={(open) => {
          setAssignOpen(open);
          if (!open) setAssignLevelNumber(undefined);
        }}
        mode="employee"
        initialLevelNumber={assignLevelNumber}
      />
    </div>
  );
}

function cnTab(active: boolean) {
  return [
    "mr-6 border-b-2 bg-transparent py-3 text-sm",
    active
      ? "border-[#2563EB] font-semibold text-[#2563EB]"
      : "border-transparent font-normal text-[#6B7280] hover:text-[#374151]",
  ].join(" ");
}
