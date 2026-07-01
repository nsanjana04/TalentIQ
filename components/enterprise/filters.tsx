"use client";

import { Search, LayoutGrid, List } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function SearchInput({
  value,
  onChange,
  placeholder = "Search…",
  className,
}: SearchInputProps) {
  return (
    <div className={cn("relative", className)}>
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-9 pl-9"
        aria-label={placeholder}
      />
    </div>
  );
}

interface FilterBarProps {
  children: React.ReactNode;
  className?: string;
}

export function FilterBar({ children, className }: FilterBarProps) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-2 rounded-2xl border border-border/60 bg-card p-3",
        className
      )}
    >
      {children}
    </div>
  );
}

export type ViewMode = "card" | "table";

interface ViewToggleProps {
  value: ViewMode;
  onChange: (mode: ViewMode) => void;
  className?: string;
}

export function ViewToggle({ value, onChange, className }: ViewToggleProps) {
  return (
    <div className={cn("inline-flex rounded-lg border border-border p-0.5", className)}>
      <Button
        type="button"
        variant={value === "card" ? "default" : "ghost"}
        size="sm"
        className="h-8 px-2.5"
        onClick={() => onChange("card")}
        aria-label="Card view"
        aria-pressed={value === "card"}
      >
        <LayoutGrid className="h-4 w-4" />
      </Button>
      <Button
        type="button"
        variant={value === "table" ? "default" : "ghost"}
        size="sm"
        className="h-8 px-2.5"
        onClick={() => onChange("table")}
        aria-label="Table view"
        aria-pressed={value === "table"}
      >
        <List className="h-4 w-4" />
      </Button>
    </div>
  );
}
