/** Tabs shown on Workforce Analytics (/analytics) in the trimmed product. */
export const ANALYTICS_TABS = [
  "executive",
  "organization",
  "department",
  "team",
  "employee",
  "learning",
  "compliance",
] as const;

export type AnalyticsTab = (typeof ANALYTICS_TABS)[number];

export function isAnalyticsTab(value: string): value is AnalyticsTab {
  return (ANALYTICS_TABS as readonly string[]).includes(value);
}
