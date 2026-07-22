"use client";

import type { AiResponseCard } from "@/types/employee-intelligence";
import { CopilotCardRouter } from "./copilot-card-router";

/** @deprecated Use CopilotCardRouter — kept for backward compatibility */
export function AiResponseCardView({
  card,
  onCompareSelect,
  compareSelection = [],
}: {
  card: AiResponseCard;
  onCompareSelect?: (id: string) => void;
  compareSelection?: string[];
}) {
  return (
    <CopilotCardRouter
      card={card}
      onCompareSelect={onCompareSelect}
      compareSelection={compareSelection}
    />
  );
}

export function SourceFooter({
  sources,
  className,
}: {
  sources: AiResponseCard["sources"];
  className?: string;
}) {
  return (
    <div className={className}>
      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        Source tables
      </p>
      <ul className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
        {sources.map((s) => (
          <li key={`${s.table}-${s.field}`}>
            <code className="rounded bg-muted px-1">{s.table}.{s.field}</code>
          </li>
        ))}
      </ul>
    </div>
  );
}
