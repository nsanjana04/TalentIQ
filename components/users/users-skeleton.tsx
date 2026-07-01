import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";

interface UsersSkeletonProps {
  view: "card" | "table";
  count?: number;
}

export function UsersSkeleton({ view, count = 6 }: UsersSkeletonProps) {
  if (view === "table") {
    return (
      <div className="overflow-hidden rounded-xl ring-1 ring-border/60">
        <div className="space-y-0">
          <Skeleton className="h-10 w-full rounded-none" />
          {Array.from({ length: count }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full rounded-none" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i} className="border-0 ring-1 ring-border/60">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <Skeleton className="h-12 w-12 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-40" />
              </div>
            </div>
            <Skeleton className="mt-4 h-16 w-full" />
            <Skeleton className="mt-4 h-8 w-full" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
