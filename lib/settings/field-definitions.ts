import type { SettingField, SettingsCategory } from "@/types/settings";

type FieldDef = Omit<SettingField, "value">;

export const SETTINGS_FIELD_DEFS: Record<SettingsCategory, { title: string; description: string; fields: FieldDef[] }> = {
  general: {
    title: "General",
    description: "Organization identity and regional defaults.",
    fields: [
      { key: "app.name", label: "Application Name", valueType: "STRING", description: "Display name across the platform", inputType: "text" },
      { key: "org.name", label: "Organization Name", valueType: "STRING", description: "Legal or brand name", inputType: "text" },
      { key: "org.timezone", label: "Default Timezone", valueType: "STRING", description: "IANA timezone identifier", inputType: "select", options: [
        { value: "America/New_York", label: "Eastern (US)" },
        { value: "America/Chicago", label: "Central (US)" },
        { value: "America/Los_Angeles", label: "Pacific (US)" },
        { value: "Europe/London", label: "London" },
        { value: "Asia/Kolkata", label: "India" },
        { value: "UTC", label: "UTC" },
      ]},
      { key: "org.locale", label: "Default Locale", valueType: "STRING", description: "Language and region", inputType: "select", options: [
        { value: "en-US", label: "English (US)" },
        { value: "en-GB", label: "English (UK)" },
        { value: "en-IN", label: "English (India)" },
      ]},
      { key: "org.support_email", label: "Support Email", valueType: "STRING", description: "Contact for user support", inputType: "text" },
    ],
  },
  security: {
    title: "Security Policies",
    description: "Authentication and session policies for all users.",
    fields: [
      { key: "auth.session_timeout_minutes", label: "Session Timeout (minutes)", valueType: "NUMBER", description: "Idle session expiry", inputType: "number" },
      { key: "auth.max_sessions_per_user", label: "Max Sessions per User", valueType: "NUMBER", description: "Concurrent active sessions", inputType: "number" },
      { key: "auth.require_email_verification", label: "Require Email Verification", valueType: "BOOLEAN", description: "Block unverified users from features", inputType: "boolean" },
      { key: "auth.password_min_length", label: "Minimum Password Length", valueType: "NUMBER", description: "Password complexity requirement", inputType: "number" },
      { key: "auth.mfa_enabled", label: "MFA Enabled (Org-wide)", valueType: "BOOLEAN", description: "Require multi-factor authentication", inputType: "boolean" },
    ],
  },
  email: {
    title: "Email",
    description: "SMTP and outbound email configuration.",
    fields: [
      { key: "email.enabled", label: "Email Delivery Enabled", valueType: "BOOLEAN", description: "Send transactional emails", inputType: "boolean" },
      { key: "email.from_name", label: "From Name", valueType: "STRING", description: "Sender display name", inputType: "text" },
      { key: "email.from_address", label: "From Address", valueType: "STRING", description: "Sender email address", inputType: "text" },
      { key: "email.smtp_host", label: "SMTP Host", valueType: "STRING", description: "Mail server hostname", inputType: "text" },
      { key: "email.smtp_port", label: "SMTP Port", valueType: "NUMBER", description: "Typically 587 or 465", inputType: "number" },
      { key: "email.smtp_user", label: "SMTP Username", valueType: "STRING", description: "Authentication username", inputType: "text" },
      { key: "email.smtp_password", label: "SMTP Password", valueType: "STRING", description: "Authentication password", inputType: "password", isSecret: true },
    ],
  },
  notifications: {
    title: "Notification Defaults",
    description: "Organization-wide notification channel defaults.",
    fields: [
      { key: "notifications.email_enabled", label: "Email Notifications", valueType: "BOOLEAN", description: "Send email notifications", inputType: "boolean" },
      { key: "notifications.in_app_enabled", label: "In-App Notifications", valueType: "BOOLEAN", description: "Show in-app alerts", inputType: "boolean" },
      { key: "notifications.digest_frequency", label: "Digest Frequency", valueType: "STRING", description: "Email digest schedule", inputType: "select", options: [
        { value: "daily", label: "Daily" },
        { value: "weekly", label: "Weekly" },
        { value: "never", label: "Never" },
      ]},
      { key: "notifications.types.skills", label: "Skill Updates", valueType: "BOOLEAN", description: "Skill assignments and verifications", inputType: "boolean" },
      { key: "notifications.types.courses", label: "Course Updates", valueType: "BOOLEAN", description: "Enrollments and completions", inputType: "boolean" },
      { key: "notifications.types.assessments", label: "Assessment Updates", valueType: "BOOLEAN", description: "Attempts and results", inputType: "boolean" },
      { key: "notifications.types.certificates", label: "Certificate Updates", valueType: "BOOLEAN", description: "Issuance and expiry alerts", inputType: "boolean" },
    ],
  },
  integrations: {
    title: "Integrations",
    description: "Third-party service connections.",
    fields: [
      { key: "integrations.slack.enabled", label: "Slack Integration", valueType: "BOOLEAN", description: "Send alerts to Slack", inputType: "boolean" },
      { key: "integrations.slack.webhook_url", label: "Slack Webhook URL", valueType: "STRING", description: "Incoming webhook URL", inputType: "password", isSecret: true },
      { key: "integrations.jira.enabled", label: "Jira Integration", valueType: "BOOLEAN", description: "Sync learning tasks to Jira", inputType: "boolean" },
      { key: "integrations.jira.base_url", label: "Jira Base URL", valueType: "STRING", description: "e.g. https://company.atlassian.net", inputType: "text" },
      { key: "integrations.sso.enabled", label: "SSO Enabled", valueType: "BOOLEAN", description: "Single sign-on authentication", inputType: "boolean" },
      { key: "integrations.sso.provider", label: "SSO Provider", valueType: "STRING", description: "Identity provider", inputType: "select", options: [
        { value: "none", label: "None" },
        { value: "okta", label: "Okta" },
        { value: "azure_ad", label: "Azure AD" },
        { value: "google", label: "Google Workspace" },
      ]},
      { key: "integrations.sso.auto_provision", label: "Auto-provision SSO Users", valueType: "BOOLEAN", description: "Create employee accounts automatically on first SSO sign-in", inputType: "boolean" },
      { key: "integrations.zoho.enabled", label: "Zoho People Integration", valueType: "BOOLEAN", description: "Fetch employee list from Zoho People for course assignments", inputType: "boolean" },
    ],
  },
  appearance: {
    title: "Appearance",
    description: "Branding and visual defaults.",
    fields: [
      { key: "appearance.theme_default", label: "Default Theme", valueType: "STRING", description: "Default color scheme", inputType: "select", options: [
        { value: "light", label: "Light" },
        { value: "dark", label: "Dark" },
        { value: "system", label: "System" },
      ]},
      { key: "appearance.primary_color", label: "Primary Color", valueType: "STRING", description: "Brand accent color (hex)", inputType: "color" },
      { key: "appearance.logo_url", label: "Logo URL", valueType: "STRING", description: "Organization logo image URL", inputType: "text" },
      { key: "appearance.sidebar_collapsed", label: "Collapse Sidebar by Default", valueType: "BOOLEAN", description: "Start with collapsed navigation", inputType: "boolean" },
    ],
  },
  system: {
    title: "System",
    description: "Platform behavior and feature flags.",
    fields: [
      { key: "system.maintenance_mode", label: "Maintenance Mode", valueType: "BOOLEAN", description: "Restrict access to admins only", inputType: "boolean" },
      { key: "features.ai_recommendations", label: "AI Recommendations", valueType: "BOOLEAN", description: "Show AI-powered insights on dashboard", inputType: "boolean" },
      { key: "learning.default_passing_score", label: "Default Passing Score (%)", valueType: "NUMBER", description: "Assessment pass threshold", inputType: "number" },
      { key: "system.data_retention_days", label: "Data Retention (days)", valueType: "NUMBER", description: "Soft-deleted record retention", inputType: "number" },
    ],
  },
  audit: {
    title: "Audit Tracking",
    description: "Audit log retention and capture rules.",
    fields: [
      { key: "audit.retention_days", label: "Retention Period (days)", valueType: "NUMBER", description: "How long to keep audit logs", inputType: "number" },
      { key: "audit.log_permission_denied", label: "Log Permission Denied", valueType: "BOOLEAN", description: "Record failed permission checks", inputType: "boolean" },
      { key: "audit.log_settings_changes", label: "Log Settings Changes", valueType: "BOOLEAN", description: "Record all settings modifications", inputType: "boolean" },
      { key: "audit.log_auth_events", label: "Log Auth Events", valueType: "BOOLEAN", description: "Record login/logout/password changes", inputType: "boolean" },
    ],
  },
};

export const ALL_SETTING_KEYS = Object.values(SETTINGS_FIELD_DEFS).flatMap((c) =>
  c.fields.map((f) => f.key)
);
