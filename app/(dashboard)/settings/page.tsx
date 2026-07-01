import { PageShell } from "@/components/enterprise/page-shell";
import { SettingsHubModule } from "@/components/settings/settings-hub-module";

const VALID_TABS = new Set([
  "general",
  "security",
  "email",
  "notifications",
  "integrations",
  "appearance",
  "system",
  "rbac",
  "permissions",
  "audit",
]);

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const params = await searchParams;
  const initialTab =
    params.tab && VALID_TABS.has(params.tab) ? params.tab : undefined;

  return (
    <PageShell>
      <div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">System Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Platform configuration, security, integrations, RBAC, and audit tracking.
        </p>
      </div>
      <SettingsHubModule initialTab={initialTab} />
    </PageShell>
  );
}
