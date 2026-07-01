import type { Permission } from "./permissions";

/** Pure permission checks — safe for Edge runtime (no DB) */
export function can(permissions: Permission[], required: Permission): boolean {
  return permissions.includes(required);
}

export function canAny(permissions: Permission[], required: Permission[]): boolean {
  return required.some((p) => permissions.includes(p));
}

export function canAll(permissions: Permission[], required: Permission[]): boolean {
  return required.every((p) => permissions.includes(p));
}
