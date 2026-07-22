import { CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

const STEPS = [
  { id: "study", label: "Study" },
  { id: "levels", label: "Levels" },
  { id: "assessment", label: "Assessment" },
  { id: "cert", label: "Certificate" },
] as const;

interface PathwayProgressStepperProps {
  levelsComplete: number;
  levelsTotal: number;
  assessmentPassed: boolean;
  certificateComplete: boolean;
}

export function PathwayProgressStepper({
  levelsComplete,
  levelsTotal,
  assessmentPassed,
  certificateComplete,
}: PathwayProgressStepperProps) {
  const activeIndex = certificateComplete
    ? 3
    : assessmentPassed
      ? 2
      : levelsComplete >= levelsTotal
        ? 1
        : levelsComplete > 0
          ? 1
          : 0;

  return (
    <div className="flex items-center justify-between gap-1">
      {STEPS.map((step, index) => {
        const done =
          index < activeIndex ||
          (index === 0 && levelsComplete > 0) ||
          (index === 1 && levelsComplete >= levelsTotal) ||
          (index === 2 && assessmentPassed) ||
          (index === 3 && certificateComplete);
        const current = index === activeIndex && !certificateComplete;

        return (
          <div key={step.id} className="flex flex-1 flex-col items-center gap-1">
            <div
              className={cn(
                "flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold",
                done
                  ? "bg-emerald-100 text-emerald-700"
                  : current
                    ? "bg-[#2563EB] text-white"
                    : "bg-[#E5E7EB] text-[#6B7280]"
              )}
            >
              {done ? <CheckCircle2 className="h-4 w-4" /> : index + 1}
            </div>
            <span
              className={cn(
                "text-[10px] font-medium",
                current ? "text-[#2563EB]" : "text-[#6B7280]"
              )}
            >
              {step.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}
