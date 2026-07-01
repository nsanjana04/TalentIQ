"use client";

import { useMemo } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/enterprise/data-table";

export function AdminTable({
  headers,
  rows,
  emptyMessage = "No records yet",
  pageSize = 10,
}: {
  headers: string[];
  rows: React.ReactNode[][];
  emptyMessage?: string;
  pageSize?: number;
}) {
  type RowData = { id: string; cells: React.ReactNode[] };

  const data: RowData[] = useMemo(
    () => rows.map((cells, index) => ({ id: String(index), cells })),
    [rows]
  );

  const columns: ColumnDef<RowData, unknown>[] = useMemo(
    () =>
      headers.map((header, columnIndex) => ({
        id: `col-${columnIndex}`,
        header: header || "Actions",
        enableSorting: false,
        cell: ({ row }) => row.original.cells[columnIndex] ?? null,
      })),
    [headers]
  );

  return (
    <DataTable
      columns={columns}
      data={data}
      emptyMessage={emptyMessage}
      pageSize={pageSize}
    />
  );
}
