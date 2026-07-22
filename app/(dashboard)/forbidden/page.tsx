import { Suspense } from "react";
import { ForbiddenClient } from "./forbidden-client";

function Fallback() {
  return (
    <div className="flex items-center justify-center py-24">
      <p className="text-sm text-muted-foreground">Loading access details…</p>
    </div>
  );
}

export default function ForbiddenPage() {
  return (
    <Suspense fallback={<Fallback />}>
      <ForbiddenClient />
    </Suspense>
  );
}
