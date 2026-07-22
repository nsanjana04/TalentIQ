"use client";

import { Suspense, use } from "react";
import Link from "next/link";
import { useEmployee360 } from "@/hooks/use-ai-insights";
import { Employee360Module } from "@/components/employees/employee-360-module";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { PageShell } from "@/components/enterprise/page-shell";
import { PageLoadingState } from "@/components/enterprise/states";
import { ROUTES } from "@/constants/routes";

function Employee360Content({ employeeId }: { employeeId: string }) {
  const { data: profile, isLoading, isError } = useEmployee360(employeeId);

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
        <p className="text-lg font-semibold">Employee not found</p>
        <Button asChild className="mt-4" variant="outline">
          <Link href={"/dashboard"}>Back to Copilot</Link>
        </Button>
      </div>
    );
  }

  return <Employee360Module profile={profile} />;
}

export default function Employee360Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  return (
    <PageShell>
      <Suspense fallback={<PageLoadingState />}>
        <Employee360Content employeeId={id} />
      </Suspense>
    </PageShell>
  );
}
