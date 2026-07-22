"use client";

import Link from "next/link";
import { Award, BookOpen, ExternalLink, Sparkles, User, X } from "lucide-react";
import { ROUTES } from "@/constants/routes";
import { useUserProfile } from "@/hooks/use-users";
import { UserAvatar } from "./user-avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { ROLE_LABELS } from "@/constants/roles";
interface UserProfileSheetProps {
  userId: string | null;
  onClose: () => void;
  onEdit: (userId: string) => void;
}

export function UserProfileSheet({ userId, onClose, onEdit }: UserProfileSheetProps) {
  const { data: profile, isLoading, isError } = useUserProfile(userId);

  if (!userId) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-50 flex h-full w-full max-w-md flex-col bg-card shadow-2xl ring-1 ring-border/60 sm:max-w-lg">
        <div className="flex items-center justify-between border-b px-6 py-4">
          <h2 className="text-lg font-semibold">User Profile</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {isLoading && <ProfileSkeleton />}
          {isError && (
            <p className="text-sm text-destructive">Failed to load profile.</p>
          )}
          {profile && (
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <UserAvatar
                  initials={profile.initials}
                  colorClass={profile.avatarColor}
                  size="xl"
                />
                <div>
                  <h3 className="text-xl font-bold">{profile.fullName}</h3>
                  <p className="text-sm text-muted-foreground">{profile.email}</p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    <Badge variant="secondary">{ROLE_LABELS[profile.role.slug]}</Badge>
                    <Badge variant={profile.isActive ? "success" : "danger"}>
                      {profile.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 text-center">
                <StatBox icon={Sparkles} label="Skills" value={profile.skillCount} />
                <StatBox icon={Award} label="Certificates" value={profile.certificateCount} />
                <StatBox icon={BookOpen} label="Progress" value={`${profile.learningProgress}%`} />
              </div>

              <Section title="Details" icon={User}>
                <InfoRow label="Department" value={profile.department?.name ?? "—"} />
                <InfoRow label="Team" value={profile.team?.name ?? "—"} />
                <InfoRow label="Job Role" value={profile.jobRole?.title ?? "—"} />
                <InfoRow
                  label="Experience"
                  value={profile.experienceLevel?.name ?? "—"}
                />
                <InfoRow
                  label="Manager"
                  value={profile.manager?.fullName ?? "—"}
                />
                <InfoRow
                  label="Last login"
                  value={
                    profile.lastLoginAt
                      ? new Date(profile.lastLoginAt).toLocaleDateString()
                      : "Never"
                  }
                />
              </Section>

              {profile.skills.length > 0 && (
                <Section title="Skills" icon={Sparkles}>
                  <div className="space-y-2">
                    {profile.skills.map((skill) => (
                      <div
                        key={skill.id}
                        className="flex items-center justify-between rounded-lg bg-muted/40 px-3 py-2"
                      >
                        <div>
                          <p className="text-sm font-medium">{skill.name}</p>
                          <p className="text-xs text-muted-foreground">{skill.level}</p>
                        </div>
                        {skill.verified && (
                          <Badge variant="success" className="text-[10px]">
                            Verified
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                </Section>
              )}

              {profile.certificates.length > 0 && (
                <Section title="Certificates" icon={Award}>
                  <div className="space-y-2">
                    {profile.certificates.map((cert) => (
                      <div
                        key={cert.id}
                        className="rounded-lg bg-muted/40 px-3 py-2"
                      >
                        <p className="text-sm font-medium">{cert.certificateNumber}</p>
                        <p className="text-xs text-muted-foreground">
                          Issued {new Date(cert.issuedAt).toLocaleDateString()}
                        </p>
                      </div>
                    ))}
                  </div>
                </Section>
              )}

              {profile.enrollments.length > 0 && (
                <Section title="Learning" icon={BookOpen}>
                  <div className="space-y-3">
                    {profile.enrollments.map((enrollment) => (
                      <div key={enrollment.id} className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span className="truncate font-medium">
                            {enrollment.courseTitle}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {enrollment.progress}%
                          </span>
                        </div>
                        <Progress value={enrollment.progress} className="h-1.5" />
                      </div>
                    ))}
                  </div>
                </Section>
              )}
            </div>
          )}
        </div>

        {profile && (
          <div className="space-y-2 border-t p-4">
            <Button className="w-full" variant="outline" asChild>
              <Link href={`${ROUTES.ADMIN_USERS}/${profile.id}`}>
                <ExternalLink className="mr-2 h-4 w-4" />
                Full profile
              </Link>
            </Button>
            <Button className="w-full" onClick={() => onEdit(profile.id)}>
              Edit User
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

function Section({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-3 flex items-center gap-2">
        <Icon className="h-4 w-4 text-primary" />
        <h4 className="text-sm font-semibold">{title}</h4>
      </div>
      {children}
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between border-b border-border/50 py-2 text-sm last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

function StatBox({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-xl bg-muted/40 p-3">
      <Icon className="mx-auto h-4 w-4 text-muted-foreground" />
      <p className="mt-1 text-lg font-bold">{value}</p>
      <p className="text-[10px] text-muted-foreground">{label}</p>
    </div>
  );
}

function ProfileSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Skeleton className="h-16 w-16 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-56" />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-20 rounded-xl" />
        ))}
      </div>
      <Skeleton className="h-40 w-full rounded-xl" />
    </div>
  );
}
