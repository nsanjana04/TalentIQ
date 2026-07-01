import type { SettingValueType } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { ALL_SETTING_KEYS, SETTINGS_FIELD_DEFS } from "@/lib/settings/field-definitions";
import type { SettingsCategory, SettingsCategoryData, SettingsOverview } from "@/types/settings";

const DEFAULTS: Record<string, string> = {
  "app.name": "TalentIQ",
  "org.name": "TalentIQ Corporation",
  "org.timezone": "America/New_York",
  "org.locale": "en-US",
  "org.support_email": "support@talentiq.com",
  "auth.session_timeout_minutes": "15",
  "auth.max_sessions_per_user": "5",
  "auth.require_email_verification": "true",
  "auth.password_min_length": "8",
  "auth.mfa_enabled": "false",
  "email.enabled": "true",
  "email.from_name": "TalentIQ",
  "email.from_address": "noreply@talentiq.com",
  "email.smtp_host": "",
  "email.smtp_port": "587",
  "email.smtp_user": "",
  "email.smtp_password": "",
  "notifications.email_enabled": "true",
  "notifications.in_app_enabled": "true",
  "notifications.digest_frequency": "weekly",
  "notifications.types.skills": "true",
  "notifications.types.courses": "true",
  "notifications.types.assessments": "true",
  "notifications.types.certificates": "true",
  "integrations.slack.enabled": "false",
  "integrations.slack.webhook_url": "",
  "integrations.jira.enabled": "false",
  "integrations.jira.base_url": "",
  "integrations.sso.enabled": "false",
  "integrations.sso.provider": "none",
  "integrations.sso.auto_provision": "false",
  "integrations.zoho.enabled": "false",
  "appearance.theme_default": "system",
  "appearance.primary_color": "#4f46e5",
  "appearance.logo_url": "",
  "appearance.sidebar_collapsed": "false",
  "system.maintenance_mode": "false",
  "features.ai_recommendations": "true",
  "learning.default_passing_score": "70",
  "system.data_retention_days": "365",
  "audit.retention_days": "90",
  "audit.log_permission_denied": "true",
  "audit.log_settings_changes": "true",
  "audit.log_auth_events": "true",
};

function maskSecret(value: string, isSecret?: boolean) {
  if (!isSecret || !value) return value;
  return "••••••••";
}

export const settingsRepository = {
  async getByKeys(keys: string[]) {
    const rows = await prisma.systemSetting.findMany({
      where: { key: { in: keys }, deletedAt: null },
    });
    const map = new Map(rows.map((r) => [r.key, r]));
    return keys.map((key) => {
      const row = map.get(key);
      return {
        key,
        value: row?.value ?? DEFAULTS[key] ?? "",
        valueType: (row?.valueType ?? "STRING") as SettingValueType,
        description: row?.description ?? null,
        updatedAt: row?.updatedAt ?? null,
      };
    });
  },

  async getCategory(category: SettingsCategory, maskSecrets = true): Promise<SettingsCategoryData> {
    const def = SETTINGS_FIELD_DEFS[category];
    const keys = def.fields.map((f) => f.key);
    const values = await this.getByKeys(keys);
    const valueMap = new Map(values.map((v) => [v.key, v]));

    return {
      category,
      title: def.title,
      description: def.description,
      fields: def.fields.map((field) => {
        const stored = valueMap.get(field.key);
        const raw = stored?.value ?? DEFAULTS[field.key] ?? "";
        return {
          ...field,
          value: maskSecrets ? maskSecret(raw, field.isSecret) : raw,
          description: field.description ?? stored?.description ?? null,
        };
      }),
    };
  },

  async getOverview(maskSecrets = true): Promise<SettingsOverview> {
    const categories = await Promise.all(
      (Object.keys(SETTINGS_FIELD_DEFS) as SettingsCategory[]).map((c) =>
        this.getCategory(c, maskSecrets)
      )
    );

    const rows = await prisma.systemSetting.findMany({
      where: { deletedAt: null },
      orderBy: { updatedAt: "desc" },
      take: 1,
      select: { updatedAt: true },
    });

    return {
      categories,
      lastUpdated: rows[0]?.updatedAt.toISOString() ?? null,
    };
  },

  async updateSettings(
    updates: Record<string, string | number | boolean>,
    actorId: string
  ): Promise<{ updated: string[] }> {
    const updated: string[] = [];

    for (const [key, rawValue] of Object.entries(updates)) {
      if (!ALL_SETTING_KEYS.includes(key)) continue;
      if (rawValue === "••••••••") continue;

      const fieldDef = Object.values(SETTINGS_FIELD_DEFS)
        .flatMap((c) => c.fields)
        .find((f) => f.key === key);

      const value = String(rawValue);
      const valueType = (fieldDef?.valueType ?? "STRING") as SettingValueType;

      await prisma.systemSetting.upsert({
        where: { key },
        update: { value, valueType, updatedAt: new Date() },
        create: {
          key,
          value,
          valueType,
          description: fieldDef?.description ?? null,
          isPublic: key.startsWith("app.") || key.startsWith("org.name"),
        },
      });
      updated.push(key);
    }

    return { updated };
  },

  async getUserNotificationPrefs(userId: string) {
    const key = `user.${userId}.notification_prefs`;
    const row = await prisma.systemSetting.findUnique({ where: { key } });
    if (!row) {
      return {
        emailEnabled: true,
        inAppEnabled: true,
        digestFrequency: "weekly" as const,
        skills: true,
        courses: true,
        assessments: true,
        certificates: true,
      };
    }
    try {
      return JSON.parse(row.value);
    } catch {
      return {
        emailEnabled: true,
        inAppEnabled: true,
        digestFrequency: "weekly" as const,
        skills: true,
        courses: true,
        assessments: true,
        certificates: true,
      };
    }
  },

  async updateUserNotificationPrefs(
    userId: string,
    prefs: Record<string, unknown>
  ) {
    const key = `user.${userId}.notification_prefs`;
    const existing = await this.getUserNotificationPrefs(userId);
    const merged = { ...existing, ...prefs };

    await prisma.systemSetting.upsert({
      where: { key },
      update: { value: JSON.stringify(merged), valueType: "JSON" },
      create: { key, value: JSON.stringify(merged), valueType: "JSON", isPublic: false },
    });

    return merged;
  },
};
