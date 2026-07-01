export type SettingsCategory =
  | "general"
  | "security"
  | "email"
  | "notifications"
  | "integrations"
  | "appearance"
  | "system"
  | "audit";

export interface SettingField {
  key: string;
  value: string;
  valueType: "STRING" | "NUMBER" | "BOOLEAN" | "JSON";
  description: string | null;
  label: string;
  inputType: "text" | "number" | "boolean" | "select" | "password" | "color" | "textarea";
  options?: { value: string; label: string }[];
  isSecret?: boolean;
}

export interface SettingsCategoryData {
  category: SettingsCategory;
  title: string;
  description: string;
  fields: SettingField[];
}

export interface SettingsOverview {
  categories: SettingsCategoryData[];
  lastUpdated: string | null;
}

export interface NotificationPreference {
  emailEnabled: boolean;
  inAppEnabled: boolean;
  digestFrequency: "daily" | "weekly" | "never";
  skills: boolean;
  courses: boolean;
  assessments: boolean;
  certificates: boolean;
}

export interface NotificationItem {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  actionUrl: string | null;
  createdAt: string;
}

export interface AuditLogItem {
  id: string;
  action: string;
  entityType: string;
  entityId: string | null;
  actorName: string | null;
  actorEmail: string | null;
  metadata: Record<string, unknown> | null;
  ipAddress: string | null;
  createdAt: string;
}

export interface AuditLogsResponse {
  items: AuditLogItem[];
  total: number;
  limit: number;
  offset: number;
}

export interface RoleSummary {
  id: string;
  name: string;
  slug: string;
  isSystem: boolean;
  permissionCount: number;
  userCount: number;
}
