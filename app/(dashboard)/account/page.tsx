import { PageShell } from "@/components/enterprise/page-shell";
import { AccountModule } from "@/components/settings/account-module";

const VALID_TABS = new Set(["profile", "security", "notifications", "devices"]);

export default async function AccountPage({
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
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Account</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Profile, password, sessions, and notification preferences.
        </p>
      </div>
      <AccountModule initialTab={initialTab} />
    </PageShell>
  );
}
