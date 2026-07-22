"use client";

import type { DataSourceCounts } from "@/types/employee-intelligence";

interface DataSourceFooterProps {
  dataSources: DataSourceCounts;
  confidence: number;
  generatedAt: string;
  className?: string;
}

export function DataSourceFooter({
  dataSources,
  confidence,
  generatedAt,
  className,
}: DataSourceFooterProps) {
  const formatted = new Date(generatedAt).toLocaleString(undefined, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className={className}>
      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        Based on
      </p>
      <ul className="mt-1 grid gap-1 text-sm sm:grid-cols-2">
        <li>{dataSources.employees} Employees</li>
        <li>{dataSources.performanceReviews} Performance Reviews</li>
        <li>{dataSources.certifications} Certifications</li>
        <li>{dataSources.skillRecords} Skill Records</li>
        {dataSources.enrollments > 0 && <li>{dataSources.enrollments} Enrollments</li>}
      </ul>
      <div className="mt-3 flex flex-wrap gap-4 text-sm">
        <p>
          <span className="text-muted-foreground">Confidence: </span>
          <strong className="tabular-nums text-primary">{confidence}%</strong>
        </p>
        <p>
          <span className="text-muted-foreground">Generated: </span>
          <strong>{formatted}</strong>
        </p>
      </div>
    </div>
  );
}
