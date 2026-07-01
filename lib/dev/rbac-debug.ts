/** RBAC debug UI/logging — off by default; never enabled in production. */
export function isRbacDebugEnabled(): boolean {
  if (process.env.NODE_ENV === "production") return false;
  return process.env.NEXT_PUBLIC_SHOW_RBAC_DEBUG === "true";
}
