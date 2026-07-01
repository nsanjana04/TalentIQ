/** Rugged Monitoring — enterprise design tokens */
export const BRAND = {
  name: "Rugged Monitoring",
  tagline: "Monitoring Simplified",
  product: "Workforce Intelligence Platform",
  primary: "#0B3B75",
  secondary: "#154C9E",
  accent: "#2F80ED",
  navy: "#0B3B75",
  sidebarNavy: "#071E34",
  background: "#F8FAFC",
  card: "#FFFFFF",
  border: "#E2E8F0",
  textPrimary: "#0F172A",
  textSecondary: "#64748B",
  success: "#27AE60",
  warning: "#F2994A",
  danger: "#EB5757",
  info: "#2F80ED",
} as const;

export const LAYOUT = {
  sidebarWidth: 280,
  topbarHeight: 72,
  pagePaddingDesktop: 24,
  pagePaddingMobile: 16,
  cardRadius: 16,
} as const;

export const CHART_COLORS = {
  primary: "var(--chart-1)",
  success: "var(--chart-2)",
  warning: "var(--chart-3)",
  accent: "var(--chart-4)",
  danger: "var(--chart-5)",
  muted: "var(--muted-foreground)",
} as const;

export const tooltipStyle = {
  borderRadius: "10px",
  border: "1px solid var(--border)",
  backgroundColor: "var(--card)",
  color: "var(--foreground)",
  boxShadow: "0 8px 24px rgba(7, 30, 52, 0.12)",
  fontSize: "12px",
  padding: "8px 12px",
} as const;

/** Skill proficiency heatmap: 0 = not assessed, 1–5 = gap → expert */
export function heatmapLevel(value: number | null | undefined, max = 100): 0 | 1 | 2 | 3 | 4 | 5 {
  if (value == null || value === 0) return 0;
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  if (pct < 40) return 1;
  if (pct < 60) return 2;
  if (pct < 75) return 3;
  if (pct < 90) return 4;
  return 5;
}

export const HEATMAP_LABELS: Record<0 | 1 | 2 | 3 | 4 | 5, string> = {
  0: "Not assessed",
  1: "Gap",
  2: "Beginner",
  3: "Intermediate",
  4: "Advanced",
  5: "Expert",
};
