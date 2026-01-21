import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import { getColumnLabel, ReportFilters } from "../types";

interface UseExportReportOptions {
  selectedColumns: string[];
  filters: ReportFilters;
  reportName: string;
}

export function useExportReport() {
  const [isExporting, setIsExporting] = useState(false);

  const exportToExcel = async ({ selectedColumns, filters, reportName }: UseExportReportOptions) => {
    if (selectedColumns.length === 0) {
      toast.error("Vui lòng chọn ít nhất một cột để xuất báo cáo");
      return;
    }

    setIsExporting(true);
    
    try {
      // Call RPC to get data
      const { data, error } = await supabase.rpc("export_trainees_report", {
        selected_columns: selectedColumns,
        filters: filters as Record<string, string>,
      });

      if (error) {
        console.error("Export error:", error);
        if (error.message.includes("PII") || error.message.includes("nhạy cảm")) {
          toast.error("Không có quyền xem thông tin nhạy cảm. Vui lòng bỏ chọn các cột PII.");
        } else if (error.message.includes("quyền")) {
          toast.error(error.message);
        } else {
          toast.error("Lỗi khi xuất báo cáo: " + error.message);
        }
        return;
      }

      if (!data || (Array.isArray(data) && data.length === 0)) {
        toast.warning("Không có dữ liệu phù hợp với bộ lọc đã chọn");
        return;
      }

      // Transform data for Excel - replace column keys with labels
      const excelData = (data as Record<string, unknown>[]).map((row) => {
        const transformedRow: Record<string, unknown> = {};
        selectedColumns.forEach((colKey) => {
          const label = getColumnLabel(colKey);
          transformedRow[label] = row[colKey] ?? "";
        });
        return transformedRow;
      });

      // Create workbook
      const ws = XLSX.utils.json_to_sheet(excelData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Báo cáo");

      // Style header row
      const range = XLSX.utils.decode_range(ws["!ref"] || "A1");
      for (let col = range.s.c; col <= range.e.c; col++) {
        const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col });
        if (ws[cellAddress]) {
          ws[cellAddress].s = {
            font: { bold: true },
            fill: { fgColor: { rgb: "E0E0E0" } },
          };
        }
      }

      // Set column widths
      const colWidths = selectedColumns.map((colKey) => ({
        wch: Math.max(getColumnLabel(colKey).length + 2, 15),
      }));
      ws["!cols"] = colWidths;

      // Freeze first row
      ws["!freeze"] = { xSplit: 0, ySplit: 1 };

      // Generate filename
      const timestamp = new Date().toISOString().split("T")[0];
      const filename = `${reportName}_${timestamp}.xlsx`;

      // Download file
      XLSX.writeFile(wb, filename);

      toast.success(`Đã xuất ${(data as unknown[]).length} bản ghi ra file ${filename}`);
    } catch (err) {
      console.error("Export error:", err);
      toast.error("Lỗi không xác định khi xuất báo cáo");
    } finally {
      setIsExporting(false);
    }
  };

  return { exportToExcel, isExporting };
}
