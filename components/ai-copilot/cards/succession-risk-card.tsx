"use client";

import { Users } from "lucide-react";
import type { AiResponseCard } from "@/types/employee-intelligence";
import { CopilotCardShell } from "../copilot-card-shell";
import { EmployeeDrilldownCard } from "../employee-drilldown-card";

export function SuccessionRiskCard(props: {
  card: AiResponseCard;
  onCompareSelect?: (id: string) => void;
  compareSelection?: string[];
}) {
  const { card, onCompareSelect, compareSelection = [] } = props;
  return (
    <CopilotCardShell card={card} icon={Users} accent="border-l-primary">
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
