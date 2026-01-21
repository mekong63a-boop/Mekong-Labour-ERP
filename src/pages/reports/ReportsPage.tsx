import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Download, FileSpreadsheet, Loader2 } from "lucide-react";
import { ReportPresetSelector } from "./components/ReportPresetSelector";
import { ReportColumnSelector } from "./components/ReportColumnSelector";
import { ReportFilterPanel } from "./components/ReportFilterPanel";
import { useExportReport } from "./hooks/useExportReport";
import { REPORT_PRESETS, ReportFilters, ReportPreset } from "./types";
import { useUserRole } from "@/hooks/useUserRole";

export default function ReportsPage() {
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);
  const [selectedColumns, setSelectedColumns] = useState<string[]>([]);
  const [filters, setFilters] = useState<ReportFilters>({});
  const [reportName, setReportName] = useState("bao_cao_hoc_vien");

  const { isAdmin, isSeniorStaff } = useUserRole();
  const { exportToExcel, isExporting } = useExportReport();

  // Check if user can view PII based on admin/senior staff
  const canViewPII = isAdmin || isSeniorStaff;

  const handleSelectPreset = (preset: ReportPreset) => {
    setSelectedPreset(preset.key);
    setSelectedColumns(preset.defaultColumns);
    setFilters(preset.defaultFilters);
    setReportName(preset.label.toLowerCase().replace(/\s+/g, "_").replace(/[^\w]/g, ""));
  };

  const handleExport = () => {
    exportToExcel({
      selectedColumns,
      filters,
      reportName,
    });
  };

  // Set default preset on mount
  useEffect(() => {
    if (!selectedPreset && REPORT_PRESETS.length > 0) {
      handleSelectPreset(REPORT_PRESETS[0]);
    }
  }, []);

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
            <FileSpreadsheet className="h-6 w-6" />
            Báo cáo
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Tạo báo cáo tùy chỉnh và xuất Excel theo nhu cầu
          </p>
        </div>
        <Button
          size="lg"
          onClick={handleExport}
          disabled={isExporting || selectedColumns.length === 0}
          className="gap-2"
        >
          {isExporting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Đang xuất...
            </>
          ) : (
            <>
              <Download className="h-4 w-4" />
              Xuất Excel
            </>
          )}
        </Button>
      </header>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Tạo báo cáo mới</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Step 1: Select report preset */}
          <ReportPresetSelector
            selectedPreset={selectedPreset}
            onSelectPreset={handleSelectPreset}
          />

          <Separator />

          {/* Step 2: Select columns */}
          <ReportColumnSelector
            selectedColumns={selectedColumns}
            onColumnsChange={setSelectedColumns}
            canViewPII={canViewPII}
          />

          <Separator />

          {/* Step 3: Apply filters */}
          <ReportFilterPanel
            filters={filters}
            onFiltersChange={setFilters}
          />
        </CardContent>
      </Card>

      {/* Summary */}
      <Card>
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">{selectedColumns.length}</span> cột đã chọn
              {Object.values(filters).filter(Boolean).length > 0 && (
                <span className="ml-4">
                  <span className="font-medium text-foreground">
                    {Object.values(filters).filter(Boolean).length}
                  </span> bộ lọc đang áp dụng
                </span>
              )}
            </div>
            <Button
              onClick={handleExport}
              disabled={isExporting || selectedColumns.length === 0}
              className="gap-2"
            >
              {isExporting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Đang xuất...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4" />
                  Xuất Excel ({selectedColumns.length} cột)
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
