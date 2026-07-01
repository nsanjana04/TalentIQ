"use client";

import { Suspense, use } from "react";
import Link from "next/link";
import { useUserProfile } from "@/hooks/use-users";
import { UserProfileModule } from "@/components/users/user-profile-module";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { PageShell } from "@/components/enterprise/page-shell";
import { PageLoadingState } from "@/components/enterprise/states";
import { ROUTES } from "@/constants/routes";

function UserProfileContent({ userId }: { userId: string }) {
  const { data: profile, isLoading, isError } = useUserProfile(userId);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-40 w-full rounded-xl" />
      </div>
    );
  }

  if (isError || !profile) {
    return (
      <div className="py-12 text-center">
        <p className="text-lg font-semibold">User not found</p>
        <Button asChild className="mt-4" variant="outline">
          <Link href={ROUTES.ADMIN_PEOPLE}>Back to people</Link>
        </Button>
      </div>
    );
  }

  return <UserProfileModule profile={profile} />;
}

export default function UserProfilePage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const { userId } = use(params);

  return (
    <PageShell>
      <Suspense fallback={<PageLoadingState />}>
        <UserProfileContent userId={userId} />
      </Suspense>
    </PageShell>
  );
}
