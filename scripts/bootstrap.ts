import { bootstrapService } from "../services/bootstrap.service";
import { syncRbacToDatabase, syncAdminRolePermissions } from "../lib/rbac/sync-permissions";

async function main() {
  console.log("TalentIQ bootstrap — checking database health…\n");

  console.log("Syncing RBAC permissions (idempotent)…");
  const rbac = await syncRbacToDatabase();
  await syncAdminRolePermissions();
  console.log(`  ✓ Permissions synced: ${rbac.permissions} keys, ${rbac.rolePermissions} role mappings\n`);

  console.log("Validating navigation ↔ route RBAC alignment…");
  const { execSync } = await import("child_process");
  execSync("npx tsx scripts/validate-navigation-rbac.ts", { stdio: "inherit", cwd: process.cwd() });
  console.log("");

  console.log("Syncing screen registry (idempotent)…");
  const { seedScreens } = await import("../scripts/seed-screens");
  await seedScreens();
  console.log("");

  console.log("Repairing screen access (ensure RoleScreenAccess rows)…");
  const { repairScreenAccess } = await import("../scripts/repair-screen-access");
  await repairScreenAccess();
  console.log("");

  console.log("Validating screen registry…");
  execSync("npm run screens:validate", { stdio: "inherit", cwd: process.cwd() });
  console.log("");

  const health = await bootstrapService.checkHealth();

  for (const check of health.checks) {
    const status = check.ok ? "✓" : "✗";
    console.log(`  ${status} ${check.label}: ${check.count}`);
  }

  const needsEnterprise = health.checks.some(
    (c) => (c.key === "succession" || c.key === "promotion") && c.count === 0
  );

  if (!health.needsBootstrap && !needsEnterprise) {
    console.log("\n✅ Database has required starter data. No action needed.");
    return;
  }

  console.log(
    health.needsBootstrap
      ? "\n⚠ Missing required data. Running seed…\n"
      : "\n⚠ Optional enterprise data missing. Injecting succession & promotion records…\n"
  );
  const result = await bootstrapService.runBootstrap();
  console.log(`\n${result.seeded ? "✅" : "ℹ"} ${result.message}`);
}

main().catch((err) => {
  console.error("Bootstrap failed:", err);
  process.exit(1);
});
