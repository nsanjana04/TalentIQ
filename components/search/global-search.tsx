"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Award,
  BookOpen,
  Building2,
  ClipboardCheck,
  FileText,
  Loader2,
  Search,
  Sparkles,
  Users,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { apiClient } from "@/lib/api-client";
import type { GlobalSearchResponse, SearchResultCategory } from "@/types/search";
import { cn } from "@/lib/utils";

const CATEGORY_ICONS: Record<SearchResultCategory, typeof Users> = {
  employees: Users,
  departments: Building2,
  courses: BookOpen,
  certifications: Award,
  skills: Sparkles,
  assessments: ClipboardCheck,
  reports: FileText,
};

interface GlobalSearchProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function GlobalSearch({ open, onOpenChange }: GlobalSearchProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<GlobalSearchResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const search = useCallback(async (q: string, signal: AbortSignal) => {
    if (q.length < 2) {
      setResults(null);
      setSearchError(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setSearchError(null);
    try {
      const data = await apiClient.get<GlobalSearchResponse>(
        `/api/search?q=${encodeURIComponent(q)}`,
        { signal }
      );
      if (!signal.aborted) {
        setResults(data);
      }
    } catch (error) {
      if (signal.aborted) return;
      if (error instanceof DOMException && error.name === "AbortError") return;
      setResults({ query: q, total: 0, groups: [] });
      setSearchError("Search failed. Please try again.");
    } finally {
      if (!signal.aborted) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    const timer = window.setTimeout(() => {
      void search(query, controller.signal);
    }, 200);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [query, search]);

  useEffect(() => {
    if (!open) {
      setQuery("");
      setResults(null);
      setSearchError(null);
      return;
    }
    const timer = window.setTimeout(() => inputRef.current?.focus(), 0);
    return () => window.clearTimeout(timer);
  }, [open]);

  function navigate(href: string) {
    onOpenChange(false);
    router.push(href);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-xl">
        <DialogHeader className="border-b border-border px-4 py-3">
          <DialogTitle className="sr-only">Global search</DialogTitle>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              ref={inputRef}
              placeholder="Search employees, courses, learning pathways, skills…"
              className="h-10 border-0 pl-9 shadow-none focus-visible:ring-0"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label="Global search"
            />
            <kbd className="absolute right-3 top-1/2 hidden -translate-y-1/2 rounded border border-border bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground sm:inline">
              ESC
            </kbd>
          </div>
        </DialogHeader>

        <div className="max-h-[min(60vh,420px)] overflow-y-auto p-2">
          {loading && (
            <div className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Searching live records…
            </div>
          )}

          {searchError && (
            <p className="py-4 text-center text-sm text-destructive">{searchError}</p>
          )}

          {!loading && !searchError && query.length >= 2 && results?.total === 0 && (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No results for &ldquo;{query}&rdquo; in your scope.
            </p>
          )}

          {!loading &&
            results?.groups.map((group) => {
              const Icon = CATEGORY_ICONS[group.category];
              return (
                <div key={`${group.category}-${group.label}`} className="mb-3">
                  <p className="px-2 py-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {group.label}
                  </p>
                  <ul role="listbox">
                    {group.items.map((item) => (
                      <li key={item.id}>
                        <button
                          type="button"
                          role="option"
                          className={cn(
                            "flex w-full items-start gap-3 rounded-lg px-3 py-2.5 text-left",
                            "hover:bg-accent focus-visible:bg-accent focus-visible:outline-none"
                          )}
                          onClick={() => navigate(item.href)}
                        >
                          <Icon className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium">{item.title}</p>
                            {(item.subtitle || item.meta) && (
                              <p className="truncate text-xs text-muted-foreground">
                                {[item.subtitle, item.meta].filter(Boolean).join(" · ")}
                              </p>
                            )}
                          </div>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}

          {query.length < 2 && !loading && (
            <p className="py-6 text-center text-xs text-muted-foreground">
              Type at least 2 characters · Search employees, learning pathways, courses, skills,
              certifications, assessments
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function useGlobalSearchShortcut(onOpen: () => void) {
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        onOpen();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onOpen]);
}
