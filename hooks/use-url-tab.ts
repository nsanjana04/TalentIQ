"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

/**
 * Syncs a tab state with the `?tab=` URL query param (replace, no scroll).
 */
export function useUrlTab<T extends string>(
  validTabs: Set<T>,
  defaultTab: T,
  aliases?: Partial<Record<string, T>>
) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const resolveTab = useCallback(
    (raw: string | null): T => {
      if (!raw) return defaultTab;
      if (validTabs.has(raw as T)) return raw as T;
      const alias = aliases?.[raw];
      if (alias && validTabs.has(alias)) return alias;
      return defaultTab;
    },
    [aliases, defaultTab, validTabs]
  );

  const tabParam = searchParams.get("tab");
  const [tab, setTabState] = useState<T>(() => resolveTab(tabParam));

  useEffect(() => {
    setTabState(resolveTab(tabParam));
  }, [tabParam, resolveTab]);

  const setTab = useCallback(
    (next: T) => {
      setTabState(next);
      const params = new URLSearchParams(searchParams.toString());
      params.set("tab", next);
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [pathname, router, searchParams]
  );

  return [tab, setTab] as const;
}
