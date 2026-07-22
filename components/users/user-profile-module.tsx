"use client";

import Link from "next/link";
import {
  Activity,
  ArrowLeft,
  Award,
  BarChart3,
  BookOpen,
  ClipboardCheck,
  Pencil,
  Sparkles,
  User,
} from "lucide-react";
import { useState } from "react";
import { useUrlTab } from "@/hooks/use-url-tab";
import type { UserListItem, UserProfile } from "@/types/users";
import { UserAvatar } from "./user-avatar";
import { UserEditDialog } from "./user-edit-dialog";
import { UserScreenOverrides } from "@/components/admin/user-screen-overrides";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { PermissionGate } from "@/components/rbac/permission-gate";
import { RiskBadge } from "@/components/enterprise/status-badges";
import { EmptyState } from "@/components/enterprise/states";
import { DataTable } from "@/components/enterprise/data-table";
import { ROLE_LABELS } from "@/constants/roles";
import { ROUTES } from "@/constants/routes";
import { cn } from "@/lib/utils";
import type { ColumnDef } from "@tanstack/react-table";
import { useMemo } from "react";

type ProfileTab =
  | "overview"
  | "skills"
  | "learning"
  | "assessments"
  | "certificates"
  | "analytics"
  | "activity";

const TABS: { id: ProfileTab; label: string; icon: React.ComponentType<{ className?: string }> }[] =
  [
    { id: "overview", label: "Overview", icon: User },
    { id: "skills", label: "Skills", icon: Sparkles },
    { id: "learning", label: "Learning", icon: BookOpen },
    { id: "assessments", label: "Assessments", icon: ClipboardCheck },
    { id: "certificates", label: "Certificates", icon: Award },
    { id: "analytics", label: "Analytics", icon: BarChart3 },
    { id: "activity", label: "Activity Timeline", icon: Activity },
  ];

const VALID_TABS = new Set<ProfileTab>(TABS.map((t) => t.id));

interface UserProfileModuleProps {
  profile: UserProfile;
}

export function UserProfileModule({ profile }: UserProfileModuleProps) {
  const [tab, setTab] = useUrlTab(VALID_TABS, "overview");
  const [editOpen, setEditOpen] = useState(false);
  const listItem: UserListItem = profile;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={ROUTES.ADMIN_USERS}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">Employee Intelligence Profile</h1>
          <p className="text-sm text-muted-foreground">{profile.fullName}</p>
        </div>
        <PermissionGate elementId="users.edit.button">
          <Button onClick={() => setEditOpen(true)}>
            <Pencil className="mr-2 h-4 w-4" />
            Edit
          </Button>
        </PermissionGate>
      </div>

      <div className="enterprise-panel p-6">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center">
          <UserAvatar initials={profile.initials} colorClass={profile.avatarColor} size="xl" />
          <div className="flex-1 space-y-3">
            <div>
              <h2 className="text-2xl font-bold">{profile.fullName}</h2>
              <p className="text-muted-foreground">{profile.email}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">{ROLE_LABELS[profile.role.slug]}</Badge>
              {profile.department && <Badge variant="outline">{profile.department.name}</Badge>}
              {profile.team && <Badge variant="outline">{profile.team.name}</Badge>}
              <Badge variant={profile.isActive ? "success" : "danger"}>
                {profile.isActive ? "Active" : "Inactive"}
              </Badge>
              <RiskBadge level={profile.analytics.riskLevel} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <ScoreTile label="Skill" value={profile.analytics.skillScore} />
            <ScoreTile label="Learning" value={profile.analytics.learningScore} />
            <ScoreTile label="Assessment" value={profile.analytics.assessmentScore} />
            <ScoreTile label="Readiness" value={profile.analytics.workforceReadinessScore} />
          </div>
        </div>
      </div>

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
      {tab === "analytics" && <AnalyticsTab profile={profile} />}
      {tab === "activity" && <ActivityTab profile={profile} />}

      <UserScreenOverrides userId={profile.id} />

      <UserEditDialog user={listItem} open={editOpen} onOpenChange={setEditOpen} />
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

function OverviewTab({ profile }: { profile: UserProfile }) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <section className="enterprise-panel space-y-3 p-5">
        <h3 className="font-semibold">Organization</h3>
        <dl className="grid gap-2 text-sm">
          <Row label="Role" value={ROLE_LABELS[profile.role.slug]} />
          <Row label="Job title" value={profile.jobRole?.title ?? "—"} />
          <Row label="Department" value={profile.department?.name ?? "—"} />
          <Row label="Team" value={profile.team?.name ?? "—"} />
          <Row label="Experience" value={profile.experienceLevel?.name ?? "—"} />
          <Row label="Manager" value={profile.manager?.fullName ?? "—"} />
          <Row
            label="Last active"
            value={
              profile.lastLoginAt
                ? new Date(profile.lastLoginAt).toLocaleDateString()
                : "Never logged in"
            }
          />
        </dl>
      </section>
      <section className="enterprise-panel space-y-3 p-5">
        <h3 className="font-semibold">Intelligence snapshot</h3>
        <div className="space-y-3">
          <MetricBar label="Skill readiness" value={profile.analytics.skillScore} />
          <MetricBar label="Learning progress" value={profile.analytics.learningScore} />
          <MetricBar label="Assessment performance" value={profile.analytics.assessmentScore} />
          <MetricBar label="Workforce readiness" value={profile.analytics.workforceReadinessScore} />
        </div>
      </section>
    </div>
  );
}

function SkillsTab({ profile }: { profile: UserProfile }) {
  if (!profile.skills.length) {
    return <EmptyState title="No skills recorded" description="Skills will appear after assessments or manager verification." />;
  }
  return (
    <div className="flex flex-wrap gap-2">
      {profile.skills.map((s) => (
        <Badge key={s.id} variant={s.verified ? "success" : "outline"} className="px-3 py-1.5">
          {s.name} · {s.level}
        </Badge>
      ))}
    </div>
  );
}

function LearningTab({ profile }: { profile: UserProfile }) {
  if (!profile.enrollments.length) {
    return (
      <EmptyState
        title="No learning enrollments"
        description="Assign learning pathways or courses to begin tracking progress."
      />
    );
  }
  return (
    <div className="space-y-3">
      {profile.enrollments.map((e) => (
        <div key={e.id} className="enterprise-panel p-4">
          <div className="flex justify-between text-sm">
            <span className="font-medium">{e.courseTitle}</span>
            <span className="text-muted-foreground">{e.progress}% · {e.status}</span>
          </div>
          <Progress value={e.progress} className="mt-2 h-2" />
        </div>
      ))}
    </div>
  );
}

function AssessmentsTab({ profile }: { profile: UserProfile }) {
  const columns = useMemo<ColumnDef<UserProfile["assessments"][number], unknown>[]>(
    () => [
      { accessorKey: "assessmentTitle", header: "Assessment" },
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
      searchKey="assessmentTitle"
      searchPlaceholder="Search assessments…"
      emptyMessage="No assessment attempts recorded."
    />
  );
}

function CertificatesTab({ profile }: { profile: UserProfile }) {
  if (!profile.certificates.length) {
    return <EmptyState title="No certificates" description="Certificates appear after course and assessment completion." />;
  }
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {profile.certificates.map((c) => (
        <div key={c.id} className="enterprise-panel p-4">
          <p className="font-medium">{c.certificateNumber}</p>
          <p className="text-xs text-muted-foreground">
            Issued {new Date(c.issuedAt).toLocaleDateString()}
            {c.expiresAt ? ` · Expires ${new Date(c.expiresAt).toLocaleDateString()}` : ""}
          </p>
        </div>
      ))}
    </div>
  );
}

function AnalyticsTab({ profile }: { profile: UserProfile }) {
  const metrics = [
    { label: "Skill score", value: profile.analytics.skillScore },
    { label: "Learning score", value: profile.analytics.learningScore },
    { label: "Assessment score", value: profile.analytics.assessmentScore },
    { label: "Certificate score", value: profile.analytics.certificateScore },
    { label: "Workforce readiness", value: profile.analytics.workforceReadinessScore },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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

function ActivityTab({ profile }: { profile: UserProfile }) {
  if (!profile.activityTimeline.length) {
    return <EmptyState title="No activity yet" description="Audit events involving this employee will appear here." />;
  }

  return (
    <div className="space-y-3">
      {profile.activityTimeline.map((item) => (
        <div key={item.id} className="enterprise-panel flex items-start justify-between gap-4 p-4">
          <div>
            <p className="font-medium">{item.description}</p>
            <p className="text-xs text-muted-foreground">
              {item.actorName ? `By ${item.actorName}` : "System event"}
            </p>
          </div>
          <time className="shrink-0 text-xs text-muted-foreground">
            {new Date(item.createdAt).toLocaleString()}
          </time>
        </div>
      ))}
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
