import type { DashboardScope } from "@/lib/dashboard/scope";
import type { IntelUserRecord } from "@/repositories/employee-intelligence.repository";
import type { InsightSeverity } from "@/types/ai-insights";
import type {
  AiResponseCardType,
  CopilotIntent,
  DataSourceCounts,
  DrillDownNode,
  EmployeeIntelSnapshot,
  RankedEmployeeResult,
} from "@/types/employee-intelligence";

export interface QueryEntities {
  department?: string;
  departmentId?: string;
  team?: string;
  teamId?: string;
  certification?: string;
  course?: string;
  skill?: string;
  roleTitle?: string;
  managerRole?: string;
  limit?: number;
  sortAscending?: boolean;
  compareDepartments?: [string, string];
  inactiveDays?: number;
}

export interface CopilotQueryContext {
  query: string;
  intent: CopilotIntent;
  entities: QueryEntities;
  scope: DashboardScope;
  users: IntelUserRecord[];
  snapshots: EmployeeIntelSnapshot[];
  filteredSnapshots: EmployeeIntelSnapshot[];
  userMap: Map<string, IntelUserRecord>;
  maxSkillRank: number;
  generatedAt: string;
  dataSources: DataSourceCounts;
}

export interface ServiceQueryResult {
  headline: string;
  narrative: string;
  ranked: RankedEmployeeResult[];
  cardType: AiResponseCardType;
  cardTitle: string;
  cardSummary: string;
  severity: InsightSeverity;
  drillDownEmployees?: EmployeeIntelSnapshot[];
}

export interface CopilotEngineResult {
  query: string;
  scopeLabel: string;
  intent: CopilotIntent;
  headline: string;
  narrative: string;
  cards: import("@/types/employee-intelligence").AiResponseCard[];
  rankedEmployees: RankedEmployeeResult[];
  drillDown: DrillDownNode;
  generatedAt: string;
  dataSources: DataSourceCounts;
  confidence: number;
}
