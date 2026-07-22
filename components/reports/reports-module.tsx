"use client";

import { useState } from "react";
import { FileSpreadsheet, FileText, Loader2, Presentation } from "lucide-react";
import { exportSkillMatrix } from "@/hooks/use-skill-matrix";
import type { ExportFormat, MatrixView } from "@/types/skill-matrix";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select } from "@/components/ui/select";

const VIEWS: { id: MatrixView; label: string }[] = [
  { id: "employee", label: "Employee" },
  { id: "department", label: "Department" },
  { id: "team", label: "Team" },
  { id: "role", label: "Role" },
  { id: "heatmap", label: "Heatmap" },
];

export function ReportsModule() {
  const [view, setView] = useState<MatrixView>("employee");
  const [exporting, setExporting] = useState<ExportFormat | "pptx" | "exec-xlsx" | null>(null);

  async function handleExport(format: ExportFormat) {
    setExporting(format);
    try {
      await exportSkillMatrix({ view, format });
    } finally {
      setExporting(null);
    }
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Skill Matrix Export</CardTitle>
          <CardDescription>
            Download workforce skill readiness and gap data for reporting and compliance.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="report-view">
              Matrix view
            </label>
            <Select
              id="report-view"
              value={view}
              onChange={(e) => setView(e.target.value as MatrixView)}
            >
              {VIEWS.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.label}
                </option>
              ))}
            </Select>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={exporting !== null}
              onClick={() => handleExport("xlsx")}
            >
              {exporting === "xlsx" ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <FileSpreadsheet className="mr-2 h-4 w-4" />
              )}
              Excel (.xlsx)
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={exporting !== null}
              onClick={() => handleExport("csv")}
            >
              {exporting === "csv" ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <FileText className="mr-2 h-4 w-4" />
              )}
              CSV
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Executive Board Pack</CardTitle>
          <CardDescription>
            Auto-generated executive briefing from live war room, promotion, and succession data.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            disabled={exporting !== null}
            onClick={async () => {
              setExporting("pptx");
              try {
                window.open("/api/reports/executive/export?format=pptx", "_blank");
              } finally {
                setExporting(null);
              }
            }}
          >
            <Presentation className="mr-2 h-4 w-4" />
            PowerPoint (.pptx)
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={exporting !== null}
            onClick={async () => {
              setExporting("exec-xlsx");
              try {
                window.open("/api/reports/executive/export?format=xlsx", "_blank");
              } finally {
                setExporting(null);
              }
            }}
          >
            <FileSpreadsheet className="mr-2 h-4 w-4" />
            Executive Excel
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
