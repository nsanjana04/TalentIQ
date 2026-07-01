/**
 * SQL injection protection guidelines for TalentIQ.
 *
 * - All queries use Prisma ORM parameterized queries by default.
 * - Raw queries MUST use tagged template literals: prisma.$queryRaw`SELECT 1`
 * - Never interpolate user input into $queryRawUnsafe or $executeRawUnsafe strings.
 */

export function assertSafeSqlIdentifier(value: string): string {
  if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(value)) {
    throw new Error(`Invalid SQL identifier: ${value}`);
  }
  return value;
}
