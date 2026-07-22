import ExcelJS from "exceljs";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import type { SkillMatrixData } from "@/types/skill-matrix";

function cellDisplay(cell: SkillMatrixData["cells"][string][string] | undefined): string {
  if (!cell || cell.status === "na") return "—";
  if (cell.actualLabel) return cell.actualLabel;
  if (cell.actualRank != null) return `L${cell.actualRank}`;
  return "—";
}

function buildRows(data: SkillMatrixData): string[][] {
  const header = ["Name", ...data.columns.map((c) => c.name), "Readiness"];
  const body = data.rows.map((row) => [
    row.name,
    ...data.columns.map((col) => cellDisplay(data.cells[row.id]?.[col.id])),
    row.readinessScore != null ? `${row.readinessScore}%` : "—",
  ]);
  return [header, ...body];
}

export function exportMatrixCsv(data: SkillMatrixData): string {
  const rows = buildRows(data);
  return rows
    .map((row) =>
      row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")
    )
    .join("\n");
}

export async function exportMatrixXlsx(data: SkillMatrixData): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Rugged Monitoring";
  const sheet = workbook.addWorksheet(`${data.view} matrix`);

  const header = ["Name", ...data.columns.map((c) => c.name), "Readiness %"];
  sheet.addRow(header);
  sheet.getRow(1).font = { bold: true };

  for (const row of data.rows) {
    sheet.addRow([
      row.name,
      ...data.columns.map((col) => cellDisplay(data.cells[row.id]?.[col.id])),
      row.readinessScore ?? "",
    ]);
  }

  sheet.columns.forEach((col) => {
    col.width = 16;
  });

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}

export function exportMatrixPdf(data: SkillMatrixData): Buffer {
  const doc = new jsPDF({ orientation: "landscape" });
  doc.setFontSize(14);
  doc.text(`Rugged Monitoring Skill Matrix — ${data.view}`, 14, 16);
  doc.setFontSize(10);
  doc.text(`Scope: ${data.scopeLabel} · Avg readiness: ${data.summary.avgReadiness}%`, 14, 24);

  const head = [["Name", ...data.columns.map((c) => c.name), "Ready"]];
  const body = data.rows.map((row) => [
    row.name,
    ...data.columns.map((col) => cellDisplay(data.cells[row.id]?.[col.id])),
    row.readinessScore != null ? `${row.readinessScore}%` : "—",
  ]);

  autoTable(doc, {
    head,
    body,
    startY: 30,
    styles: { fontSize: 7, cellPadding: 2 },
    headStyles: { fillColor: [67, 56, 202] },
  });

  return Buffer.from(doc.output("arraybuffer"));
}
