import ExcelJS from "exceljs";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import type { CopilotQueryResponse } from "@/types/employee-intelligence";

function buildRows(data: CopilotQueryResponse): string[][] {
  const header = [
    "Rank",
    "Employee Name",
    "Employee ID",
    "Role",
    "Department",
    "Manager",
    "Readiness %",
    "Performance %",
    "Skills Verified",
    "Certificates",
    "Learning %",
    "Promotion Target",
    "Relevance",
    "Confidence",
    "Match Reason",
  ];
  const body = data.rankedEmployees.map((r, i) => [
    String(i + 1),
    r.employee.employeeName,
    r.employee.employeeId,
    r.employee.role,
    r.employee.department ?? "—",
    r.employee.manager ?? "—",
    String(r.employee.readinessScore),
    String(r.employee.performanceScore),
    String(r.employee.skillsVerified),
    String(r.employee.activeCertCount),
    String(r.employee.learningCompletion),
    r.employee.promotionTarget,
    String(r.relevanceScore),
    String(r.confidence),
    r.matchReason,
  ]);
  return [header, ...body];
}

export function exportCopilotCsv(data: CopilotQueryResponse): string {
  const meta = [
    `"Query","${data.query.replace(/"/g, '""')}"`,
    `"Scope","${data.scopeLabel.replace(/"/g, '""')}"`,
    `"Generated","${data.generatedAt}"`,
    "",
  ];
  const rows = buildRows(data);
  const csvRows = rows.map((row) =>
    row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")
  );
  return [...meta, ...csvRows].join("\n");
}

export async function exportCopilotXlsx(data: CopilotQueryResponse): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Rugged Monitoring";
  const sheet = workbook.addWorksheet("Copilot Results");

  sheet.addRow(["Query", data.query]);
  sheet.addRow(["Scope", data.scopeLabel]);
  sheet.addRow(["Generated", data.generatedAt]);
  sheet.addRow([]);

  const [header, ...body] = buildRows(data);
  sheet.addRow(header);
  sheet.getRow(5).font = { bold: true };
  for (const row of body) sheet.addRow(row);

  sheet.columns.forEach((col) => {
    col.width = 18;
  });

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}

export function exportCopilotPdf(data: CopilotQueryResponse): Buffer {
  const doc = new jsPDF({ orientation: "landscape" });
  doc.setFontSize(14);
  doc.text("Rugged Monitoring Workforce Copilot Export", 14, 16);
  doc.setFontSize(10);
  doc.text(`Query: ${data.query}`, 14, 24);
  doc.text(`Scope: ${data.scopeLabel} · Generated: ${data.generatedAt}`, 14, 30);
  doc.text(data.headline, 14, 38);

  const [header, ...body] = buildRows(data);
  autoTable(doc, {
    head: [header],
    body: body.slice(0, 25),
    startY: 44,
    styles: { fontSize: 7, cellPadding: 2 },
    headStyles: { fillColor: [67, 56, 202] },
  });

  return Buffer.from(doc.output("arraybuffer"));
}
