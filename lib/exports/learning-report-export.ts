import ExcelJS from "exceljs";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import type { LearningReportFormat } from "@/types/learning-lrs";

type ProgressRow = {
  user: { firstName: string; lastName: string; department?: { name: string } | null };
  course: { title: string };
  progressPercent: number;
  completedLessons: number;
  totalLessons: number;
  timeSpentMinutes: number;
  status: string;
  lastActivityAt: Date | null;
};

function buildRows(data: ProgressRow[]): string[][] {
  const header = [
    "Employee",
    "Department",
    "Course",
    "Progress %",
    "Lessons",
    "Time (min)",
    "Status",
    "Last Activity",
  ];
  const body = data.map((r) => [
    `${r.user.firstName} ${r.user.lastName}`,
    r.user.department?.name ?? "—",
    r.course.title,
    `${r.progressPercent}%`,
    `${r.completedLessons}/${r.totalLessons}`,
    String(r.timeSpentMinutes),
    r.status,
    r.lastActivityAt ? r.lastActivityAt.toISOString().slice(0, 10) : "—",
  ]);
  return [header, ...body];
}

export function exportLearningCsv(data: ProgressRow[]): string {
  return buildRows(data)
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
    .join("\n");
}

export async function exportLearningXlsx(data: ProgressRow[], scopeLabel: string): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Rugged Monitoring";
  const sheet = workbook.addWorksheet("Learning Progress");
  sheet.addRow(["Rugged Monitoring Learning Report", scopeLabel]);
  sheet.addRow([]);

  const rows = buildRows(data);
  for (const row of rows) sheet.addRow(row);
  sheet.getRow(3).font = { bold: true };
  sheet.columns.forEach((col) => {
    col.width = 18;
  });

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}

export function exportLearningPdf(data: ProgressRow[], scopeLabel: string): Buffer {
  const doc = new jsPDF({ orientation: "landscape" });
  doc.setFontSize(14);
  doc.text("Rugged Monitoring Learning Report", 14, 16);
  doc.setFontSize(10);
  doc.text(`Scope: ${scopeLabel} · ${data.length} records`, 14, 24);

  const rows = buildRows(data).slice(1);
  autoTable(doc, {
    head: [buildRows(data)[0]],
    body: rows,
    startY: 30,
    styles: { fontSize: 7, cellPadding: 2 },
    headStyles: { fillColor: [67, 56, 202] },
  });

  return Buffer.from(doc.output("arraybuffer"));
}

export async function exportLearningReport(
  data: ProgressRow[],
  format: LearningReportFormat,
  scopeLabel: string
): Promise<{ buffer: Buffer; contentType: string; filename: string }> {
  const date = new Date().toISOString().slice(0, 10);
  switch (format) {
    case "csv": {
      const csv = exportLearningCsv(data);
      return {
        buffer: Buffer.from(csv, "utf-8"),
        contentType: "text/csv",
        filename: `learning-report-${date}.csv`,
      };
    }
    case "xlsx": {
      const buffer = await exportLearningXlsx(data, scopeLabel);
      return {
        buffer,
        contentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        filename: `learning-report-${date}.xlsx`,
      };
    }
    case "pdf": {
      const buffer = exportLearningPdf(data, scopeLabel);
      return {
        buffer,
        contentType: "application/pdf",
        filename: `learning-report-${date}.pdf`,
      };
    }
  }
}
