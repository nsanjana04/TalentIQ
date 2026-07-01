import { settingsRepository } from "@/repositories/settings.repository";
import type { ZohoPeopleConfigStatus } from "@/types/zoho-people";

export interface ResolvedZohoConfig {
  clientId: string;
  clientSecret: string;
  refreshToken: string;
  accountsUrl: string;
  peopleApiUrl: string;
}

const DEFAULT_ACCOUNTS_URL = "https://accounts.zoho.com";
const DEFAULT_PEOPLE_URL = "https://people.zoho.com";

export async function getZohoPeopleSettings() {
  const rows = await settingsRepository.getByKeys(["integrations.zoho.enabled"]);
  const enabled = rows.find((r) => r.key === "integrations.zoho.enabled")?.value === "true";
  return { enabled };
}

export function resolveZohoConfigFromEnv(): ResolvedZohoConfig | null {
  const clientId = process.env.ZOHO_CLIENT_ID;
  const clientSecret = process.env.ZOHO_CLIENT_SECRET;
  const refreshToken = process.env.ZOHO_REFRESH_TOKEN;

  if (!clientId || !clientSecret || !refreshToken) {
    return null;
  }

  return {
    clientId,
    clientSecret,
    refreshToken,
    accountsUrl: (process.env.ZOHO_ACCOUNTS_URL ?? DEFAULT_ACCOUNTS_URL).replace(/\/$/, ""),
    peopleApiUrl: (process.env.ZOHO_PEOPLE_API_URL ?? DEFAULT_PEOPLE_URL).replace(/\/$/, ""),
  };
}

export async function isZohoPeopleEnabled(): Promise<boolean> {
  const settings = await getZohoPeopleSettings();
  return settings.enabled && resolveZohoConfigFromEnv() !== null;
}

export async function getZohoPeopleConfigStatus(): Promise<ZohoPeopleConfigStatus> {
  const settings = await getZohoPeopleSettings();
  const config = resolveZohoConfigFromEnv();

  return {
    enabled: settings.enabled,
    configured: config !== null,
    accountsUrl: config?.accountsUrl ?? process.env.ZOHO_ACCOUNTS_URL ?? DEFAULT_ACCOUNTS_URL,
    peopleApiUrl: config?.peopleApiUrl ?? process.env.ZOHO_PEOPLE_API_URL ?? DEFAULT_PEOPLE_URL,
  };
}
