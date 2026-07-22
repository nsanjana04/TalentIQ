"use client";

import { useEffect, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";

function useCsrfBootstrap() {
  useEffect(() => {
    const hasCsrf = document.cookie.includes("talentiq_csrf=");
    if (hasCsrf) return;
    fetch("/api/csrf", { credentials: "include" }).catch(() => undefined);
  }, []);
}

export function QueryProvider({ children }: { children: React.ReactNode }) {
  useCsrfBootstrap();
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 2 * 60 * 1000,
            gcTime: 10 * 60 * 1000,
            retry: 1,
            refetchOnWindowFocus: false,
          },
          mutations: {
            retry: 0,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {process.env.NODE_ENV === "development" && (
        <ReactQueryDevtools initialIsOpen={false} />
      )}
    </QueryClientProvider>
  );
}
