// ReportsPage - Tra cứu hồ sơ và xuất báo cáo
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Download, FileSpreadsheet, Loader2, UserSearch } from "lucide-react";
import { ReportPresetSelector } from "./components/ReportPresetSelector";
import { ReportColumnSelector } from "./components/ReportColumnSelector";
import { ReportFilterPanel } from "./components/ReportFilterPanel";
import { TraineeSearchBox } from "./components/TraineeSearchBox";
import { TraineeProfileView } from "./components/TraineeProfileView";
import { useExportReport } from "./hooks/useExportReport";
import { useTraineeProfile } from "./hooks/useTraineeProfile";
import { REPORT_PRESETS, ReportFilters, ReportPreset } from "./types";
import { useUserRole } from "@/hooks/useUserRole";

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState("lookup");
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);
  const [selectedColumns, setSelectedColumns] = useState<string[]>([]);
  const [filters, setFilters] = useState<ReportFilters>({});
  const [reportName, setReportName] = useState("bao_cao_hoc_vien");

  const { isAdmin, isSeniorStaff } = useUserRole();
  const { exportToExcel, isExporting } = useExportReport();
  const { profile, isLoading: isSearching, searchTrainee, clearProfile } = useTraineeProfile();

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
      <header>
        <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
          <FileSpreadsheet className="h-6 w-6" />
          Báo cáo & Tra cứu
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Tra cứu hồ sơ học viên hoặc xuất báo cáo Excel tùy chỉnh
        </p>
      </header>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="lookup" className="gap-2">
            <UserSearch className="h-4 w-4" />
            Tra cứu học viên
          </TabsTrigger>
          <TabsTrigger value="export" className="gap-2">
            <Download className="h-4 w-4" />
            Xuất báo cáo
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Trainee Lookup */}
        <TabsContent value="lookup" className="space-y-4 mt-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <UserSearch className="h-5 w-5" />
                Tra cứu hồ sơ học viên
              </CardTitle>
            </CardHeader>
            <CardContent>
              <TraineeSearchBox onSearch={searchTrainee} isLoading={isSearching} />
            </CardContent>
          </Card>

          {/* Profile Result */}
          {profile && (
            <TraineeProfileView profile={profile} onClose={clearProfile} />
          )}

          {!profile && !isSearching && (
            <Card className="border-dashed">
              <CardContent className="py-12 text-center text-muted-foreground">
                <UserSearch className="h-12 w-12 mx-auto mb-4 opacity-30" />
                <p>Nhập mã học viên để xem hồ sơ chi tiết</p>
                <p className="text-sm mt-1">Ví dụ: 009080, 008123...</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Tab 2: Export Report */}
        <TabsContent value="export" className="space-y-4 mt-4">
          <div className="flex justify-end">
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
          </div>

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
        </TabsContent>
      </Tabs>
    </div>
  );
}
