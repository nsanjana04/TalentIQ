"use client";

import {
  Sparkles,
  BookOpen,
  ClipboardCheck,
  Award,
  RefreshCw,
  Shield,
} from "lucide-react";
import { PageHeader } from "@/components/enterprise/page-header";
import { ExecutiveMetricCard } from "@/components/enterprise/executive-metric-card";
import {
  SkillReadinessChart,
  LearningProgressChart,
  AssessmentsChart,
  CertificatesChart,
} from "@/components/dashboard/dashboard-charts";
import { AiRecommendations } from "@/components/dashboard/ai-recommendations";
import { AnalyticsPanel } from "@/components/enterprise/analytics-panel";
import { StatCard } from "@/components/dashboard/stat-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ROUTES } from "@/constants/routes";
import { Permission } from "@/lib/rbac/permissions";
import { usePermissions } from "@/hooks/use-permissions";
import type { AuthUser } from "@/types/auth";
import type { DashboardOverview } from "@/types/dashboard";

interface DashboardViewProps {
  user: AuthUser;
  data: DashboardOverview;
  isFetching: boolean;
  onRefresh: () => void;
}

export function PersonalDashboard({ user, data, isFetching, onRefresh }: DashboardViewProps) {
  return (
    <div className="command-gradient min-h-full space-y-6 p-4 lg:p-6">
      <PageHeader
        title={`${getGreeting()}, ${user.firstName}`}
        description="Your learning, skills, assessments, and certifications."
        badge={<Badge variant="outline">{data.scopeLabel}</Badge>}
        actions={
          <Button variant="outline" size="sm" onClick={onRefresh} disabled={isFetching}>
            <RefreshCw className={`mr-2 h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        }
      />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Learning Progress"
          value={`${data.learningProgress.avgProgress}%`}
          subtitle={`${data.learningProgress.inProgress} in progress`}
          icon={BookOpen}
        />
        <StatCard
          title="Courses Completed"
          value={data.learningProgress.completed}
          subtitle={`${data.learningProgress.enrolled} enrolled`}
          icon={BookOpen}
        />
        <StatCard
          title="Assessment Pass Rate"
          value={`${data.assessments.passRate}%`}
          subtitle={`${data.assessments.totalAttempts} attempts`}
          icon={ClipboardCheck}
        />
        <StatCard
          title="Active Certificates"
          value={data.certificates.active}
          subtitle={`${data.certificates.expiringSoon} expiring soon`}
          icon={Award}
        />
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <LearningProgressChart data={data.learningProgress} />
        <AssessmentsChart data={data.assessments} />
        <CertificatesChart data={data.certificates} />
        {data.skillReadiness.totalSkills > 0 ? (
          <SkillReadinessChart data={data.skillReadiness} />
        ) : (
          <AnalyticsPanel title="My Skills" description="Skill profile">
            <p className="text-sm text-muted-foreground">
              Skill tracking will appear when skills are assigned to your role.
            </p>
          </AnalyticsPanel>
        )}
      </section>

      <AiRecommendations recommendations={data.aiRecommendations} />
    </div>
  );
}

export function ManagerDashboard({ user, data, isFetching, onRefresh }: DashboardViewProps) {
  const { canAny } = usePermissions();
  const showTeamAnalytics = canAny([
    Permission.ANALYTICS_VIEW,
    Permission.ANALYTICS_VIEW,
    Permission.ANALYTICS_VIEW,
  ]);

  return (
    <div className="command-gradient min-h-full space-y-6 p-4 lg:p-6">
      <PageHeader
        title={`${getGreeting()}, ${user.firstName}`}
        description={`${user.role === "MANAGER" ? "Department" : "Team"} command center — scoped workforce intelligence.`}
        badge={<Badge variant="outline">{data.scopeLabel}</Badge>}
        actions={
          <Button variant="outline" size="sm" onClick={onRefresh} disabled={isFetching}>
            <RefreshCw className={`mr-2 h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        }
      />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <ExecutiveMetricCard
          label="Team Skill Readiness"
          value={`${data.skillReadiness.overall}%`}
          subtitle={`${data.skillReadiness.verifiedCount} verified`}
          icon={Sparkles}
          href={ROUTES.DASHBOARD}
        />
        <ExecutiveMetricCard
          label="Learning Velocity"
          value={data.learningProgress.completed}
          subtitle={`${data.learningProgress.avgProgress}% avg progress`}
          icon={BookOpen}
          href={ROUTES.LEARNING}
        />
        <ExecutiveMetricCard
          label="Assessment Pass Rate"
          value={`${data.assessments.passRate}%`}
          subtitle={`${data.assessments.totalAttempts} attempts`}
          icon={ClipboardCheck}
          href={ROUTES.ASSESSMENTS}
        />
        <ExecutiveMetricCard
          label="Active Certificates"
          value={data.certificates.active}
          subtitle={`${data.certificates.expiringSoon} expiring soon`}
          icon={Award}
          href={ROUTES.CERTIFICATIONS}
        />
      </section>

      {showTeamAnalytics && (
        <section className="grid gap-4 lg:grid-cols-2">
          <SkillReadinessChart data={data.skillReadiness} />
          <LearningProgressChart data={data.learningProgress} />
        </section>
      )}

      <AiRecommendations recommendations={data.aiRecommendations} />
    </div>
  );
}

export function HrDashboard({ user, data, isFetching, onRefresh }: DashboardViewProps) {
  const complianceRate =
    data.certificates.total > 0
      ? Math.round((data.certificates.active / data.certificates.total) * 100)
      : 0;

  return (
    <div className="command-gradient min-h-full space-y-6 p-4 lg:p-6">
      <PageHeader
        title={`${getGreeting()}, ${user.firstName}`}
        description="Workforce programs, compliance, and people analytics."
        live
        badge={<Badge variant="outline">{data.scopeLabel}</Badge>}
        actions={
          <Button variant="outline" size="sm" onClick={onRefresh} disabled={isFetching}>
            <RefreshCw className={`mr-2 h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        }
      />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <ExecutiveMetricCard
          label="Workforce Headcount"
          value={data.totalEmployees.value}
          subtitle={`${data.activeEmployees.value} active`}
          icon={Shield}
          href={ROUTES.ADMIN_USERS}
        />
        <ExecutiveMetricCard
          label="Compliance Rate"
          value={`${complianceRate}%`}
          subtitle={`${data.certificates.expiringSoon} expiring`}
          icon={Shield}
          href={ROUTES.CERTIFICATIONS}
        />
        <ExecutiveMetricCard
          label="Certification Coverage"
          value={`${complianceRate}%`}
          subtitle={`${data.certificates.active} active`}
          icon={Award}
          href={ROUTES.CERTIFICATIONS}
        />
        <ExecutiveMetricCard
          label="Learning Programs"
          value={data.learningProgress.enrolled}
          subtitle={`${data.learningProgress.completed} completed`}
          icon={BookOpen}
          href={ROUTES.LEARNING}
        />
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <CertificatesChart data={data.certificates} />
        <LearningProgressChart data={data.learningProgress} />
        <AssessmentsChart data={data.assessments} />
      </section>

      <AiRecommendations recommendations={data.aiRecommendations} />
    </div>
  );
}

export function ExecutiveDashboard({
  user,
  data,
  isFetching,
  onRefresh,
  readOnly = false,
}: DashboardViewProps & { readOnly?: boolean }) {
  const complianceRate =
    data.certificates.total > 0
      ? Math.round((data.certificates.active / data.certificates.total) * 100)
      : 0;
  const workforceHealthScore = Math.round(
    (data.skillReadiness.overall +
      data.learningProgress.avgProgress +
      data.assessments.passRate +
      complianceRate) /
      4
  );
  const learningVelocity = data.learningProgress.completed;

  return (
    <div className="command-gradient min-h-full space-y-6 p-4 lg:p-6">
      <PageHeader
        title={`${getGreeting()}, ${user.firstName}`}
        description={
          readOnly
            ? "Executive read-only command center — organization intelligence."
            : "Executive command center — real-time workforce intelligence, readiness, and compliance signals."
        }
        live
        badge={<Badge variant="outline">{data.scopeLabel}</Badge>}
        actions={
          <Button variant="outline" size="sm" onClick={onRefresh} disabled={isFetching}>
            <RefreshCw className={`mr-2 h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        }
      />

      <section aria-label="Executive KPIs">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <ExecutiveMetricCard
            label="Workforce Health Score"
            value={workforceHealthScore}
            subtitle="Composite index"
            icon={Shield}
            href={ROUTES.DASHBOARD}
            sparkline={data.skillReadiness.trend.map((t) => t.readiness)}
          />
          <ExecutiveMetricCard
            label="Skill Readiness"
            value={`${data.skillReadiness.overall}%`}
            subtitle={`${data.skillReadiness.verifiedCount} verified`}
            icon={Sparkles}
            href={ROUTES.DASHBOARD}
          />
          <ExecutiveMetricCard
            label="Compliance Rate"
            value={`${complianceRate}%`}
            subtitle={`${data.certificates.expiringSoon} expiring soon`}
            icon={Shield}
            href={ROUTES.CERTIFICATIONS}
          />
          <ExecutiveMetricCard
            label="Learning Velocity"
            value={learningVelocity}
            subtitle={`${data.learningProgress.avgProgress}% avg progress`}
            icon={BookOpen}
            href={ROUTES.LEARNING}
          />
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <SkillReadinessChart data={data.skillReadiness} />
        <LearningProgressChart data={data.learningProgress} />
        <AssessmentsChart data={data.assessments} />
        <CertificatesChart data={data.certificates} />
      </section>

      <AiRecommendations recommendations={data.aiRecommendations} />
    </div>
  );
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export function resolveDashboardVariant(role: AuthUser["role"]) {
  switch (role) {
    case "EMPLOYEE":
      return "personal" as const;
    case "ADMIN":
      return "executive" as const;
    case "MANAGER":
      return "manager" as const;
    default:
      return "personal" as const;
  }
}
