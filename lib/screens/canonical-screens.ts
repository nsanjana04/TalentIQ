import { SCREEN_DEFINITIONS } from "@/lib/screens/screen-definitions";

/** Active product screens — used to filter admin matrices and APIs. */
export const CANONICAL_SCREEN_KEYS = SCREEN_DEFINITIONS.map((screen) => screen.key);

export function isCanonicalScreenKey(key: string): boolean {
  return (CANONICAL_SCREEN_KEYS as readonly string[]).includes(key);
}

export const canonicalActiveScreenWhere = {
  isActive: true,
  key: { in: [...CANONICAL_SCREEN_KEYS] as string[] },
} as const;
