"use client";

import type { AiResponseCard, AiResponseCardType } from "@/types/employee-intelligence";
import { SuccessionRiskCard } from "./cards/succession-risk-card";
import { SkillGapCard } from "./cards/skill-gap-card";
import { ComplianceRiskCard } from "./cards/compliance-risk-card";
import { CertificationCard } from "./cards/certification-card";
import { Employee360Card } from "./cards/employee-360-card";

interface CopilotCardRouterProps {
  card: AiResponseCard;
  onCompareSelect?: (id: string) => void;
  compareSelection?: string[];
}

const CARD_MAP: Record<AiResponseCardType, React.ComponentType<CopilotCardRouterProps>> = {
  promotion_ready: SkillGapCard,
  succession_planning: SuccessionRiskCard,
  skill_gap_analysis: SkillGapCard,
  compliance_risk: ComplianceRiskCard,
  certification_risk: CertificationCard,
  learning_progress: Employee360Card,
  workforce_health: Employee360Card,
  employee_search: Employee360Card,
  department_analysis: Employee360Card,
  attrition_risk: ComplianceRiskCard,
};

export function CopilotCardRouter(props: CopilotCardRouterProps) {
  const Component = CARD_MAP[props.card.cardType] ?? Employee360Card;
  return <Component {...props} />;
}
