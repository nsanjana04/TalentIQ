export type MatrixView = "employee" | "department" | "team" | "role" | "heatmap";

export type CellStatus = "met" | "partial" | "missing" | "exceeds" | "na";

export interface MatrixCell {
  actualRank: number | null;
  requiredRank: number | null;
  actualLabel: string | null;
  requiredLabel: string | null;
  gap: number;
  score: number;
  status: CellStatus;
  verified: boolean;
}

export interface MatrixRow {
  id: string;
  name: string;
  subtitle?: string;
  readinessScore?: number;
}

export interface MatrixColumn {
  id: string;
  name: string;
  category?: string;
}

export interface SkillMatrixData {
  view: MatrixView;
  scopeLabel: string;
  rows: MatrixRow[];
  columns: MatrixColumn[];
  cells: Record<string, Record<string, MatrixCell>>;
  summary: {
    totalRows: number;
    totalColumns: number;
    avgReadiness: number;
    gapsCount: number;
  };
}

export interface GapItem {
  id: string;
  entityType: MatrixView;
  entityId: string;
  entityName: string;
  skillId: string;
  skillName: string;
  requiredLevel: string;
  actualLevel: string | null;
  gapPoints: number;
  severity: "critical" | "moderate" | "minor";
}

export interface GapAnalysis {
  items: GapItem[];
  bySeverity: { critical: number; moderate: number; minor: number };
  topGaps: { skillName: string; count: number }[];
}

export interface ReadinessItem {
  id: string;
  name: string;
  type: MatrixView;
  score: number;
  skillsMet: number;
  skillsRequired: number;
  employees?: number;
}

export interface ReadinessScores {
  overall: number;
  items: ReadinessItem[];
  distribution: { label: string; count: number; fill: string }[];
}

export interface MatrixFilters {
  departments: { id: string; name: string }[];
  teams: { id: string; name: string; departmentId: string }[];
  jobRoles: { id: string; title: string }[];
  categories: { id: string; name: string }[];
  skills: { id: string; name: string; categoryId: string }[];
}

export type ExportFormat = "csv" | "xlsx" | "pdf";
