"use client";

import { FileDown, FileSpreadsheet, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { copilotExportUrl } from "@/hooks/use-ai-insights";

interface CopilotExportButtonsProps {
  query: string;
  className?: string;
}

export function CopilotExportButtons({ query, className }: CopilotExportButtonsProps) {
  if (!query.trim()) return null;

  return (
    <div className={className}>
      <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Export results
      </p>
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" asChild>
          <a href={copilotExportUrl(query, "csv")} download>
            <FileText className="mr-1.5 h-3.5 w-3.5" />
            CSV
          </a>
        </Button>
        <Button variant="outline" size="sm" asChild>
          <a href={copilotExportUrl(query, "xlsx")} download>
            <FileSpreadsheet className="mr-1.5 h-3.5 w-3.5" />
            Excel
          </a>
        </Button>
        <Button variant="outline" size="sm" asChild>
          <a href={copilotExportUrl(query, "pdf")} download>
            <FileDown className="mr-1.5 h-3.5 w-3.5" />
            PDF
          </a>
        </Button>
      </div>
    </div>
  );
}
