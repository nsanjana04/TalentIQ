"use client";

import Link from "next/link";
import { Award, BookOpen, ChevronRight, Clock, Loader2, TrendingUp } from "lucide-react";
import { ROUTES } from "@/constants/routes";
import { usePathwayLearningStats } from "@/components/learning-roadmap/use-pathway-learning-stats";

const CARD =
  "flex flex-1 flex-col rounded-xl border border-[#E5E7EB] bg-white px-6 py-5 shadow-[0_1px_3px_rgba(0,0,0,0.06)]";

function IconWrap({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-full bg-[#EFF6FF] text-[#2563EB]">
      {children}
    </div>
  );
}

interface FigmaStatsRowProps {
  onNextAction?: (courseSlug: string) => void;
}

export function FigmaStatsRow({ onNextAction }: FigmaStatsRowProps) {
  const stats = usePathwayLearningStats();

  return (
    <div className="space-y-3">
      <div className="flex w-full flex-col gap-4 sm:flex-row">
        <div className={CARD}>
          <IconWrap>
            <TrendingUp className="h-[18px] w-[18px]" />
          </IconWrap>
          <p className="text-[11px] font-semibold uppercase tracking-[0.05em] text-[#6B7280]">
            Pathway progress
          </p>
          <p className="mt-1 flex items-center gap-2 text-[28px] font-bold text-[#111827]">
            {stats.isLoading ? (
              <Loader2 className="h-6 w-6 animate-spin text-[#2563EB]" />
            ) : (
              `${stats.progressPercent}%`
            )}
          </p>
          <p className="mt-1 text-xs text-[#16A34A]">{stats.progressDeltaLabel}</p>
        </div>
        <div className={CARD}>
          <IconWrap>
            <Clock className="h-[18px] w-[18px]" />
          </IconWrap>
          <p className="text-[11px] font-semibold uppercase tracking-[0.05em] text-[#6B7280]">
            Time invested
          </p>
          <p className="mt-1 text-[28px] font-bold text-[#111827]">{stats.timeInvestedLabel}</p>
          <p className="mt-1 text-xs text-[#6B7280]">{stats.timeDeltaLabel}</p>
        </div>
        <div className={CARD}>
          <IconWrap>
            <BookOpen className="h-[18px] w-[18px]" />
          </IconWrap>
          <p className="text-[11px] font-semibold uppercase tracking-[0.05em] text-[#6B7280]">
            In progress
          </p>
          <p className="mt-1 text-[28px] font-bold text-[#111827]">{stats.coursesInProgress}</p>
          <p className="mt-1 text-xs text-[#6B7280]">{stats.inProgressDeltaLabel}</p>
        </div>
        <div className={CARD}>
          <IconWrap>
            <Award className="h-[18px] w-[18px]" />
          </IconWrap>
          <p className="text-[11px] font-semibold uppercase tracking-[0.05em] text-[#6B7280]">
            Certificates
          </p>
          <p className="mt-1 text-[28px] font-bold text-[#111827]">{stats.certificatesEarned}</p>
          <Link
            href={ROUTES.CERTIFICATIONS}
            className="mt-1 inline-flex items-center gap-0.5 text-xs text-[#2563EB] hover:underline"
          >
            View all
            <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>

      {stats.nextAction && (
        <button
          type="button"
          className="inline-flex w-full items-center justify-between rounded-lg border border-[#BFDBFE] bg-[#EFF6FF] px-4 py-3 text-left text-sm text-[#1E40AF] hover:bg-[#DBEAFE] sm:w-auto"
          onClick={() => onNextAction?.(stats.nextAction!.courseSlug)}
        >
          <span>
            <span className="font-semibold">Next: </span>
            {stats.nextAction.label}
          </span>
          <ChevronRight className="ml-2 h-4 w-4 shrink-0" />
        </button>
      )}
    </div>
  );
}
