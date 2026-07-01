"use client";

import Link from "next/link";
import {
  Activity,
  ArrowLeft,
  Award,
  BarChart3,
  BookOpen,
  ClipboardCheck,
  Crown,
  Sparkles,
  TrendingUp,
  User,
  Users,
} from "lucide-react";
import { useUrlTab } from "@/hooks/use-url-tab";
import type { Employee360Profile } from "@/types/employee-intelligence";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { DataTable } from "@/components/enterprise/data-table";
import { EmptyState } from "@/components/enterprise/states";
import { RiskBadge } from "@/components/enterprise/status-badges";
import { ExecutiveActions } from "@/components/ai-copilot/executive-actions";
import { SourceFooter } from "@/components/ai-copilot/ai-response-card";
import { ROUTES } from "@/constants/routes";
import { ROLE_LABELS } from "@/constants/roles";
import type { ColumnDef } from "@tanstack/react-table";
import { useMemo } from "react";

type TabId =
  | "overview"
  | "skills"
  | "learning"
  | "assessments"
  | "certificates"
  | "performance"
  | "promotion"
  | "succession"
  | "activity"
  | "ai-insights";

const TABS: { id: TabId; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: "overview", label: "Overview", icon: User },
  { id: "skills", label: "Skills", icon: Sparkles },
  { id: "learning", label: "Learning", icon: BookOpen },
  { id: "assessments", label: "Assessments", icon: ClipboardCheck },
  { id: "certificates", label: "Certificates", icon: Award },
  { id: "performance", label: "Performance", icon: BarChart3 },
  { id: "promotion", label: "Promotion", icon: Crown },
  { id: "succession", label: "Succession", icon: Users },
  { id: "activity", label: "Activity", icon: Activity },
  { id: "ai-insights", label: "AI Insights", icon: TrendingUp },
];

const VALID_TABS = new Set<TabId>(TABS.map((t) => t.id));

interface Employee360ModuleProps {
  profile: Employee360Profile;
}

export function Employee360Module({ profile }: Employee360ModuleProps) {
  const [tab, setTab] = useUrlTab(VALID_TABS, "overview");
  const initials = `${profile.firstName[0] ?? ""}${profile.lastName[0] ?? ""}`.toUpperCase();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={ROUTES.AI_COPILOT}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">Employee 360</h1>
          <p className="text-sm text-muted-foreground">{profile.employeeName}</p>
        </div>
        <Badge variant="outline" className="font-mono">
          {profile.employeeId.slice(0, 8)}
        </Badge>
      </div>

      <div className="enterprise-panel p-6">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-xl font-bold text-primary">
            {initials}
          </div>
          <div className="flex-1 space-y-3">
            <div>
              <h2 className="text-2xl font-bold">{profile.employeeName}</h2>
              <p className="text-muted-foreground">{profile.email}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">{ROLE_LABELS[profile.roleSlug as keyof typeof ROLE_LABELS] ?? profile.role}</Badge>
              {profile.department && <Badge variant="outline">{profile.department}</Badge>}
              {profile.team && <Badge variant="outline">{profile.team}</Badge>}
              <Badge variant={profile.isActive ? "success" : "danger"}>
                {profile.isActive ? "Active" : "Inactive"}
              </Badge>
              <RiskBadge level={profile.riskLevel} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <ScoreTile label="Readiness" value={profile.readinessScore} />
            <ScoreTile label="Risk" value={profile.riskScore} />
            <ScoreTile label="Learning" value={profile.learningProgress} />
            <ScoreTile label="Promotion" value={profile.promotionScore} />
          </div>
        </div>
      </div>

      <ExecutiveActions employeeId={profile.employeeId} employeeName={profile.employeeName} />

      <div className="flex flex-wrap gap-2">
        {TABS.map((t) => (
          <Button
            key={t.id}
            variant={tab === t.id ? "default" : "outline"}
            size="sm"
            className="gap-2"
            onClick={() => setTab(t.id)}
          >
            <t.icon className="h-4 w-4" />
            {t.label}
          </Button>
        ))}
      </div>

      {tab === "overview" && <OverviewTab profile={profile} />}
      {tab === "skills" && <SkillsTab profile={profile} />}
      {tab === "learning" && <LearningTab profile={profile} />}
      {tab === "assessments" && <AssessmentsTab profile={profile} />}
      {tab === "certificates" && <CertificatesTab profile={profile} />}
      {tab === "performance" && <PerformanceTab profile={profile} />}
      {tab === "promotion" && <PromotionTab profile={profile} />}
      {tab === "succession" && <SuccessionTab profile={profile} />}
      {tab === "activity" && <ActivityTab profile={profile} />}
      {tab === "ai-insights" && <AiInsightsTab profile={profile} />}
    </div>
  );
}

function ScoreTile({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl bg-muted/40 p-3 text-center">
      <p className="text-xl font-bold tabular-nums">{value}%</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

function OverviewTab({ profile }: { profile: Employee360Profile }) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <section className="enterprise-panel space-y-3 p-5">
        <h3 className="font-semibold">Employee details</h3>
        <dl className="grid gap-2 text-sm">
          <Row label="Employee ID" value={profile.employeeId} />
          <Row label="Role" value={profile.role} />
          <Row label="Job title" value={profile.jobTitle ?? "—"} />
          <Row label="Department" value={profile.department ?? "—"} />
          <Row label="Team" value={profile.team ?? "—"} />
          <Row label="Manager" value={profile.manager ?? "—"} />
          <Row label="Experience" value={profile.experienceLevel ?? "—"} />
        </dl>
      </section>
      <section className="enterprise-panel space-y-3 p-5">
        <h3 className="font-semibold">Intelligence snapshot</h3>
        <MetricBar label="Readiness score" value={profile.readinessScore} />
        <MetricBar label="Learning progress" value={profile.learningProgress} />
        <MetricBar label="Assessment pass rate" value={profile.assessmentPassRate} />
        <MetricBar label="Promotion score" value={profile.promotionScore} />
        <MetricBar label="Risk score" value={profile.riskScore} />
      </section>
      <section className="enterprise-panel space-y-3 p-5 lg:col-span-2">
        <h3 className="font-semibold">AI recommendations</h3>
        <ul className="space-y-2 text-sm text-muted-foreground">
          {profile.recommendations.map((r) => (
            <li key={r}>• {r}</li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function SkillsTab({ profile }: { profile: Employee360Profile }) {
  if (!profile.skillScores.length) {
    return <EmptyState title="No skills recorded" description="Skills appear after assessments or verification." />;
  }
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {profile.skillScores.map((s) => (
        <div key={s.skillId} className="enterprise-panel p-4">
          <div className="flex items-center justify-between">
            <p className="font-medium">{s.skillName}</p>
            <Badge variant={s.verified ? "success" : "outline"}>{s.level}</Badge>
          </div>
          <p className="mt-1 text-2xl font-bold tabular-nums">{s.score}%</p>
          <Progress value={s.score} className="mt-2 h-2" />
        </div>
      ))}
    </div>
  );
}

function LearningTab({ profile }: { profile: Employee360Profile }) {
  const lp = profile.learningProfile;

  if (!profile.enrollments.length && !lp?.courses.length) {
    return <EmptyState title="No enrollments" description="Assign courses to track learning progress." />;
  }

  const courses = lp?.courses.length ? lp.courses : profile.enrollments.map((e) => ({
    id: e.id,
    courseId: e.id,
    courseTitle: e.courseTitle,
    progressPercent: e.progress,
    completedLessons: 0,
    totalLessons: 0,
    timeSpentMinutes: 0,
    lastActivityAt: null,
    estimatedCompletionAt: null,
    status: e.status as import("@prisma/client").EnrollmentStatus,
    startedAt: null,
    completedAt: null,
  }));

  return (
    <div className="space-y-6">
      {lp && (
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="enterprise-panel p-4">
            <p className="text-sm text-muted-foreground">Time spent</p>
            <p className="mt-1 text-2xl font-bold tabular-nums">{lp.timeSpentMinutes}m</p>
          </div>
          <div className="enterprise-panel p-4">
            <p className="text-sm text-muted-foreground">Skill growth</p>
            <p className="mt-1 text-2xl font-bold tabular-nums">{lp.skillGrowthScore}%</p>
          </div>
          <div className="enterprise-panel p-4">
            <p className="text-sm text-muted-foreground">Certificates</p>
            <p className="mt-1 text-2xl font-bold tabular-nums">{lp.certificates.length}</p>
          </div>
        </div>
      )}

      <div className="space-y-3">
        <h3 className="text-sm font-medium">Courses</h3>
        {courses.map((e) => (
          <div key={e.id} className="enterprise-panel p-4">
            <div className="flex justify-between text-sm">
              <span className="font-medium">{e.courseTitle}</span>
              <span className="text-muted-foreground">
                {e.progressPercent}%
                {e.totalLessons > 0 ? ` · ${e.completedLessons}/${e.totalLessons} lessons` : ""}
                {" · "}{e.status}
              </span>
            </div>
            <Progress value={e.progressPercent} className="mt-2 h-2" />
          </div>
        ))}
      </div>

      {lp?.assessments.length ? (
        <div className="space-y-3">
          <h3 className="text-sm font-medium">Assessments</h3>
          {lp.assessments.map((a) => (
            <div key={a.assessmentId} className="enterprise-panel flex justify-between p-4 text-sm">
              <span>{a.title}</span>
              <span className="text-muted-foreground">
                {a.progressPercent}% · {a.status}
                {a.bestScore != null ? ` · ${a.bestScore}` : ""}
              </span>
            </div>
          ))}
        </div>
      ) : null}

      {lp?.externalRecords.length ? (
        <div className="space-y-3">
          <h3 className="text-sm font-medium">External learning</h3>
          {lp.externalRecords.map((r) => (
            <div key={r.id} className="enterprise-panel flex justify-between p-4 text-sm">
              <span>{r.title}</span>
              <span className="text-muted-foreground">{r.provider.replace(/_/g, " ")} · {r.progressPercent}%</span>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function AssessmentsTab({ profile }: { profile: Employee360Profile }) {
  const columns = useMemo<ColumnDef<Employee360Profile["assessments"][number], unknown>[]>(
    () => [
      { accessorKey: "title", header: "Assessment" },
      {
        id: "score",
        header: "Score",
        cell: ({ row }) =>
          row.original.score != null
            ? `${row.original.score}${row.original.maxScore ? ` / ${row.original.maxScore}` : ""}`
            : "—",
      },
      {
        id: "result",
        header: "Result",
        cell: ({ row }) => (
          <Badge variant={row.original.passed ? "success" : row.original.passed === false ? "danger" : "secondary"}>
            {row.original.passed ? "Passed" : row.original.passed === false ? "Failed" : row.original.status}
          </Badge>
        ),
      },
      {
        id: "submitted",
        header: "Submitted",
        cell: ({ row }) =>
          row.original.submittedAt
            ? new Date(row.original.submittedAt).toLocaleDateString()
            : "—",
      },
    ],
    []
  );

  return (
    <DataTable
      columns={columns}
      data={profile.assessments}
      searchKey="title"
      searchPlaceholder="Search assessments…"
      emptyMessage="No assessment attempts recorded."
    />
  );
}

function CertificatesTab({ profile }: { profile: Employee360Profile }) {
  if (!profile.certifications.length) {
    return <EmptyState title="No certificates" description="Certificates appear after completion and issuance." />;
  }
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {profile.certifications.map((c) => (
        <div key={c.id} className="enterprise-panel p-4">
          <p className="font-medium">{c.templateName}</p>
          <p className="text-xs text-muted-foreground">{c.certificateNumber}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <Badge variant={c.status === "ACTIVE" ? "success" : "danger"}>{c.status}</Badge>
            {c.daysUntilExpiry != null && c.daysUntilExpiry <= 30 && (
              <Badge variant="warning">Expires in {c.daysUntilExpiry}d</Badge>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function PerformanceTab({ profile }: { profile: Employee360Profile }) {
  const metrics = [
    { label: "Performance score", value: profile.performanceScore },
    { label: "Assessment pass rate", value: profile.assessmentPassRate },
    { label: "Learning progress", value: profile.learningProgress },
    { label: "Readiness score", value: profile.readinessScore },
  ];
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {metrics.map((m) => (
        <div key={m.label} className="enterprise-panel p-4">
          <p className="text-sm text-muted-foreground">{m.label}</p>
          <p className="mt-1 text-3xl font-bold tabular-nums">{m.value}%</p>
          <Progress value={m.value} className="mt-3 h-2" />
        </div>
      ))}
    </div>
  );
}

function PromotionTab({ profile }: { profile: Employee360Profile }) {
  return (
    <div className="enterprise-panel space-y-4 p-5">
      <div className="flex flex-wrap items-center gap-3">
        <Badge
          variant={
            profile.promotionStatus === "ready"
              ? "success"
              : profile.promotionStatus === "not_ready"
                ? "danger"
                : "warning"
          }
        >
          {profile.promotionStatus.replace("_", " ")}
        </Badge>
        <span className="text-sm text-muted-foreground">
          Promotion score {profile.promotionScore}% based on mandatory role skills
        </span>
      </div>
      <MetricBar label="Promotion readiness" value={profile.promotionScore} />
      <ul className="space-y-2 text-sm text-muted-foreground">
        {profile.recommendations
          .filter((r) => r.toLowerCase().includes("promotion") || r.toLowerCase().includes("review"))
          .map((r) => (
            <li key={r}>• {r}</li>
          ))}
      </ul>
    </div>
  );
}

function SuccessionTab({ profile }: { profile: Employee360Profile }) {
  return (
    <div className="enterprise-panel space-y-4 p-5">
      <p className="text-sm text-muted-foreground">
        Succession bench strength derived from promotion score and readiness index.
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        <ScoreTile label="Succession score" value={profile.successionScore} />
        <ScoreTile label="Readiness" value={profile.readinessScore} />
      </div>
      <MetricBar label="Succession readiness" value={profile.successionScore} />
    </div>
  );
}

function ActivityTab({ profile }: { profile: Employee360Profile }) {
  if (!profile.activityTimeline.length) {
    return <EmptyState title="No activity" description="Audit events will appear here." />;
  }
  return (
    <div className="space-y-3">
      {profile.activityTimeline.map((item) => (
        <div key={item.id} className="enterprise-panel flex justify-between gap-4 p-4">
          <div>
            <p className="font-medium">{item.description}</p>
            <p className="text-xs text-muted-foreground">{item.action}</p>
          </div>
          <time className="shrink-0 text-xs text-muted-foreground">
            {new Date(item.createdAt).toLocaleString()}
          </time>
        </div>
      ))}
    </div>
  );
}

function AiInsightsTab({ profile }: { profile: Employee360Profile }) {
  return (
    <div className="space-y-4">
      <div className="enterprise-panel p-5">
        <div className="mb-2 flex items-center gap-2">
          <Badge variant="outline">{profile.aiInsights.confidence}% confidence</Badge>
        </div>
        <p className="text-sm">{profile.aiInsights.summary}</p>
        <SourceFooter sources={profile.aiInsights.sources} className="mt-4" />
      </div>
      <section className="enterprise-panel p-5">
        <h3 className="mb-3 font-semibold">Recommendations</h3>
        <ul className="space-y-2 text-sm text-muted-foreground">
          {profile.aiInsights.recommendations.map((r) => (
            <li key={r}>• {r}</li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 border-b border-border/40 pb-2 last:border-0">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-medium">{value}</dd>
    </div>
  );
}

function MetricBar({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="mb-1 flex justify-between text-sm">
        <span>{label}</span>
        <span className="tabular-nums text-muted-foreground">{value}%</span>
      </div>
      <Progress value={value} className="h-2" />
    </div>
  );
}
