export const REMEMBER_ME_REFRESH_DAYS = 30;
export const STANDARD_REFRESH_DAYS = 7;

export function getRefreshExpiryDate(rememberMe = false): Date {
  const days = rememberMe ? REMEMBER_ME_REFRESH_DAYS : STANDARD_REFRESH_DAYS;
  const envDays = parseInt(
    process.env.JWT_REFRESH_EXPIRES_IN?.replace("d", "") ?? String(days),
    10
  );
  const effectiveDays = rememberMe ? REMEMBER_ME_REFRESH_DAYS : envDays;

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + effectiveDays);
  return expiresAt;
}

export function getRefreshCookieMaxAge(rememberMe = false): number {
  const days = rememberMe ? REMEMBER_ME_REFRESH_DAYS : STANDARD_REFRESH_DAYS;
  return 60 * 60 * 24 * days;
}
