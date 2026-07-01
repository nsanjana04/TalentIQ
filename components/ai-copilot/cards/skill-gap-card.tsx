"use client";

import { TrendingUp } from "lucide-react";
import type { AiResponseCard } from "@/types/employee-intelligence";
import { CopilotCardShell } from "../copilot-card-shell";
import { EmployeeDrilldownCard } from "../employee-drilldown-card";

export function SkillGapCard(props: {
  card: AiResponseCard;
  onCompareSelect?: (id: string) => void;
  compareSelection?: string[];
}) {
  const { card, onCompareSelect, compareSelection = [] } = props;
  return (
    <CopilotCardShell card={card} icon={TrendingUp} accent="border-l-warning">
      {card.employees.map((result, i) => (
        <EmployeeDrilldownCard
          key={result.employee.employeeId}
          employee={result.employee}
          rank={i + 1}
          matchReason={result.matchReason}
          relevanceScore={result.relevanceScore}
          confidence={result.confidence}
          selected={compareSelection.includes(result.employee.employeeId)}
          onCompareSelect={onCompareSelect}
        />
      ))}
    </CopilotCardShell>
  );
}
