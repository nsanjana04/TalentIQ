"use client";

import { BookOpen, Clock, Target, TrendingUp, Users, Award, BarChart3 } from "lucide-react";
import { ExecutiveMetricCard } from "@/components/enterprise/executive-metric-card";
import { Progress } from "@/components/ui/progress";
import {
  useEmployeeLearningDashboard,
  useExecutiveLearningDashboard,
  useLearningAnalytics,
  useManagerLearningDashboard,
} from "@/hooks/use-learning-lrs";
import { LoadingState } from "@/components/enterprise/states";

interface LearningTrackingPanelProps {
  variant: "employee" | "manager" | "executive" | "analytics";
}

export function LearningTrackingPanel({ variant }: LearningTrackingPanelProps) {
  const employee = useEmployeeLearningDashboard({ enabled: variant === "employee" });
  const manager = useManagerLearningDashboard({ enabled: variant === "manager" });
  const executive = useExecutiveLearningDashboard({ enabled: variant === "executive" });
  const analytics = useLearningAnalytics({ enabled: variant === "analytics" });

  if (variant === "employee") {
    if (employee.isLoading) return <LoadingState rows={3} />;
    const d = employee.data;
    if (!d) return null;
    return (
      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <ExecutiveMetricCard label="Progress" value={`${d.progressPercent}%`} icon={Target} />
          <ExecutiveMetricCard label="Time invested" value={`${d.timeInvestedMinutes}m`} icon={Clock} />
          <ExecutiveMetricCard label="In progress" value={String(d.coursesInProgress)} icon={BookOpen} />
          <ExecutiveMetricCard label="Certificates" value={String(d.certificatesEarned)} icon={Award} />
        </div>
        {d.currentCourse && (
          <div className="enterprise-panel p-4">
            <p className="text-sm text-muted-foreground">Current course</p>
            <p className="font-medium">{d.currentCourse.courseTitle}</p>
            <Progress value={d.currentCourse.progressPercent} className="mt-2 h-2" />
            <p className="mt-2 text-xs text-muted-foreground">
              Last activity: {d.lastActivityAt ? new Date(d.lastActivityAt).toLocaleDateString() : "—"}
              {d.estimatedCompletionAt &&
                ` · Est. completion: ${new Date(d.estimatedCompletionAt).toLocaleDateString()}`}
            </p>
          </div>
        )}
      </div>
    );
  }

  if (variant === "manager") {
    if (manager.isLoading) return <LoadingState rows={3} />;
    const d = manager.data;
    if (!d) return null;
    return (
      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <ExecutiveMetricCard label="Team progress" value={`${d.teamLearningProgress}%`} icon={Users} />
          <ExecutiveMetricCard label="Gap closure" value={`${d.skillGapClosureRate}%`} icon={Target} />
          <ExecutiveMetricCard label="Compliant" value={`${d.complianceStatus.compliant}/${d.complianceStatus.total}`} icon={Award} />
          <ExecutiveMetricCard label="Completed" value={`${d.trainingCompletion.completed}/${d.trainingCompletion.total}`} icon={BookOpen} />
        </div>
        <div className="space-y-2">
          {d.teamMembers.slice(0, 8).map((m) => (
            <div key={m.userId} className="enterprise-panel flex items-center justify-between p-3 text-sm">
              <span>{m.name}</span>
              <span className="text-muted-foreground">{m.progressPercent}%</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (variant === "executive") {
    if (executive.isLoading) return <LoadingState rows={2} />;
    const d = executive.data;
    if (!d) return null;
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <ExecutiveMetricCard label="Workforce readiness" value={`${d.workforceReadiness}%`} icon={TrendingUp} />
        <ExecutiveMetricCard label="Learning velocity" value={String(d.learningVelocity)} icon={BarChart3} />
        <ExecutiveMetricCard label="Cert compliance" value={`${d.certificationCompliance}%`} icon={Award} />
        <ExecutiveMetricCard label="Career path progress" value={`${d.promotionPipeline}%`} icon={Target} />
        <ExecutiveMetricCard label="Succession pipeline" value={`${d.successionPipeline}%`} icon={Users} />
      </div>
    );
  }

  if (analytics.isLoading) return <LoadingState rows={2} />;
  const a = analytics.data;
  if (!a) return null;
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
      <ExecutiveMetricCard label="Velocity" value={String(a.learningVelocity)} icon={TrendingUp} />
      <ExecutiveMetricCard label="Completion rate" value={`${a.completionRate}%`} icon={Target} />
      <ExecutiveMetricCard label="Dropoff rate" value={`${a.dropoffRate}%`} icon={BarChart3} />
      <ExecutiveMetricCard label="Avg time to complete" value={`${a.averageTimeToCompleteHours}h`} icon={Clock} />
      <ExecutiveMetricCard label="Skill growth" value={`${a.skillGrowthScore}%`} icon={BookOpen} />
    </div>
  );
}
