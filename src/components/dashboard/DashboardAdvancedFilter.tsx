import { useState, useMemo, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format, parse, isValid } from "date-fns";
import { CalendarIcon, Search, Download, Loader2 } from "lucide-react";
import * as XLSX from "xlsx";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { formatVietnameseDate } from "@/lib/vietnamese-utils";
import { useNavigate } from "react-router-dom";

// =============================================================================
// SINGLE SOURCE: Event types map to specific date fields in trainees table
// RULE: "Đăng ký mới" dùng registration_date (khớp với view dashboard_monthly_combined)
// RULE: Không có bất kỳ mục nào liên quan đến visa
// =============================================================================
const EVENT_TYPES = [
  { value: "registered", label: "Đăng ký mới", dateField: "registration_date", color: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300", noDateRequired: false },
  { value: "studying", label: "Đang học", dateField: "entry_date", color: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900 dark:text-cyan-300", noDateRequired: true },
  { value: "entry", label: "Nhập học", dateField: "entry_date", color: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300", noDateRequired: false },
  { value: "interview_pass", label: "Đậu phỏng vấn", dateField: "interview_pass_date", color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300", noDateRequired: false },
  { value: "document_submit", label: "Nộp hồ sơ", dateField: "document_submission_date", color: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300", noDateRequired: false },
  { value: "coe", label: "Cấp COE", dateField: "coe_date", color: "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300", noDateRequired: false },
  { value: "departure", label: "Xuất cảnh", dateField: "departure_date", color: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300", noDateRequired: false },
  { value: "return", label: "Hoàn thành hợp đồng", dateField: "return_date", color: "bg-teal-100 text-teal-700 dark:bg-teal-900 dark:text-teal-300", noDateRequired: false },
  { value: "early_return", label: "Về trước hạn", dateField: "early_return_date", color: "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300", noDateRequired: false },
  { value: "absconded", label: "Bỏ trốn", dateField: "absconded_date", color: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300", noDateRequired: false },
] as const;

type EventTypeValue = typeof EVENT_TYPES[number]["value"];

interface TraineeResult {
  id: string;
  trainee_code: string;
  full_name: string;
  gender: string | null;
  birth_date: string | null;
  birthplace: string | null;
  trainee_type: string | null;
  progression_stage: string | null;
  source: string | null;
  permanent_address_new: string | null;
  // Date fields
  created_at: string | null;
  registration_date: string | null;
  entry_date: string | null;
  interview_pass_date: string | null;
  document_submission_date: string | null;
  coe_date: string | null;
  departure_date: string | null;
  return_date: string | null;
  early_return_date: string | null;
  absconded_date: string | null;
  // For studying filter
  class_id: string | null;
  // Joined relations
  companies: { name: string | null; name_japanese: string | null } | null;
  unions: { name: string | null; name_japanese: string | null } | null;
  job_categories: { name: string | null; name_japanese: string | null } | null;
}

export default function DashboardAdvancedFilter() {
  const navigate = useNavigate();
  const [fromDate, setFromDate] = useState<Date | undefined>();
  const [toDate, setToDate] = useState<Date | undefined>();
  const [fromInput, setFromInput] = useState("");
  const [toInput, setToInput] = useState("");
  const [eventType, setEventType] = useState<EventTypeValue | "">("");
  const [searchTriggered, setSearchTriggered] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Parse manual date input with auto-format dd/MM/yyyy (tự thêm dấu /)
  const handleDateInput = (value: string, setter: (d: Date | undefined) => void, inputSetter: (v: string) => void) => {
    setSearchTriggered(false);
    
    // Remove non-digit and non-slash chars
    const clean = value.replace(/[^\d/]/g, "");
    
    // Auto-insert slashes: after 2 digits (day) and after 5 chars (day + / + month)
    let formatted = "";
    const digits = clean.replace(/\//g, "");
    for (let i = 0; i < digits.length && i < 8; i++) {
      if (i === 2 || i === 4) formatted += "/";
      formatted += digits[i];
    }
    
    inputSetter(formatted);
    
    // Parse when complete (dd/MM/yyyy = 10 chars)
    if (formatted.length === 10) {
      const parsed = parse(formatted, "dd/MM/yyyy", new Date());
      if (isValid(parsed)) {
        setter(parsed);
      }
    }
  };

  const handleCalendarSelect = (d: Date | undefined, setter: (d: Date | undefined) => void, inputSetter: (v: string) => void) => {
    setter(d);
    inputSetter(d ? format(d, "dd/MM/yyyy") : "");
    setSearchTriggered(false);
  };

  const selectedEvent = EVENT_TYPES.find((e) => e.value === eventType);

  // Build query key based on search params
  const isNoDateEvent = selectedEvent?.noDateRequired;
  const queryKey = useMemo(() => {
    if (!searchTriggered || !eventType) return null;
    if (isNoDateEvent) return ["dashboard-advanced-filter", eventType, "no-date"];
    if (!fromDate || !toDate) return null;
    return [
      "dashboard-advanced-filter",
      eventType,
      format(fromDate, "yyyy-MM-dd"),
      format(toDate, "yyyy-MM-dd"),
    ];
  }, [searchTriggered, eventType, fromDate, toDate, isNoDateEvent]);

  const { data: results = [], isLoading } = useQuery({
    queryKey: queryKey || ["dashboard-advanced-filter-idle"],
    queryFn: async () => {
      if (!selectedEvent) return [];

      const selectFields = "id, trainee_code, full_name, gender, birth_date, birthplace, trainee_type, progression_stage, source, permanent_address_new, class_id, created_at, registration_date, entry_date, interview_pass_date, document_submission_date, coe_date, departure_date, return_date, early_return_date, absconded_date, companies:receiving_company_id(name, name_japanese), unions:union_id(name, name_japanese), job_categories:job_category_id(name, name_japanese)";

      // Special case: "Đang học" - get currently studying trainees
      if (eventType === "studying") {
        const terminalStages = ['Xuất cảnh', 'Đang làm việc', 'Hoàn thành hợp đồng', 'Bỏ trốn', 'Về trước hạn'];
        const { data, error } = await supabase
          .from("trainees")
          .select(selectFields)
          .not("class_id", "is", null)
          .is("departure_date", null)
          .not("progression_stage", "in", `(${terminalStages.join(",")})`)
          .order("full_name", { ascending: true })
          .limit(5000);
        if (error) throw error;
        return (data as TraineeResult[]) || [];
      }

      // Normal date-range filter
      if (!fromDate || !toDate) return [];
      const dateField = selectedEvent.dateField;
      const from = format(fromDate, "yyyy-MM-dd");
      const to = format(toDate, "yyyy-MM-dd");

      const { data, error } = await supabase
        .from("trainees")
        .select(selectFields)
        .gte(dateField, from)
        .lte(dateField, to + "T23:59:59")
        .order(dateField, { ascending: true })
        .limit(5000);

      if (error) throw error;
      return (data as TraineeResult[]) || [];
    },
    enabled: !!queryKey,
  });

  const handleSearch = useCallback(() => {
    if (!eventType) {
      toast.error("Vui lòng chọn loại sự kiện");
      return;
    }
    if (!selectedEvent?.noDateRequired && (!fromDate || !toDate)) {
      toast.error("Vui lòng chọn khoảng thời gian");
      return;
    }
    if (!selectedEvent?.noDateRequired && fromDate && toDate && fromDate > toDate) {
      toast.error("Ngày bắt đầu phải trước ngày kết thúc");
      return;
    }
    setSearchTriggered(true);
  }, [eventType, fromDate, toDate, selectedEvent]);

  const handleExport = useCallback(() => {
    if (!results.length || !selectedEvent) return;
    setIsExporting(true);

    try {
      // Business rule: "Chưa đậu" không hiển thị công ty/nghiệp đoàn/ngành nghề/ngày đậu
      const isPassed = (stage: string | null) => stage && stage !== "Chưa đậu";

      const exportData = results.map((t, idx) => ({
        STT: idx + 1,
        "Mã HV": t.trainee_code,
        "Họ và tên": t.full_name,
        "Giới tính": t.gender || "",
        "Ngày sinh": t.birth_date ? formatVietnameseDate(t.birth_date) : "",
        "Quê quán": t.birthplace || "",
        "Đối tượng": t.trainee_type || "",
        "Giai đoạn": t.progression_stage || "",
        "Nhập học": t.entry_date ? formatVietnameseDate(t.entry_date) : "",
        "Công ty (JP)": isPassed(t.progression_stage) ? (t.companies?.name || "") : "",
        "Nghiệp đoàn (JP)": isPassed(t.progression_stage) ? (t.unions?.name || "") : "",
        "Ngành nghề (JP)": isPassed(t.progression_stage) ? (t.job_categories?.name_japanese || "") : "",
        "Ngày đậu": isPassed(t.progression_stage) && t.interview_pass_date ? formatVietnameseDate(t.interview_pass_date) : "",
        "Nguồn": t.source || "",
        "Ngày đăng ký": t.registration_date ? formatVietnameseDate(t.registration_date) : "",
        "Địa chỉ mới (sau sáp nhập)": t.permanent_address_new || "",
      }));

      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Danh sách");

      // Auto column width
      const maxWidths = Object.keys(exportData[0] || {}).map((key) => {
        const maxLen = Math.max(
          key.length,
          ...exportData.map((row) => String((row as Record<string, unknown>)[key] || "").length)
        );
        return { wch: Math.min(maxLen + 2, 40) };
      });
      ws["!cols"] = maxWidths;

      const fromStr = fromDate ? format(fromDate, "ddMMyyyy") : "";
      const toStr = toDate ? format(toDate, "ddMMyyyy") : "";
      XLSX.writeFile(wb, `${selectedEvent.label}_${fromStr}_${toStr}.xlsx`);
      toast.success(`Đã xuất ${results.length} bản ghi`);
    } catch {
      toast.error("Lỗi xuất file Excel");
    } finally {
      setIsExporting(false);
    }
  }, [results, selectedEvent, fromDate, toDate]);


  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <Search className="h-4 w-4" />
          Tra cứu nâng cao
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filters Row */}
        <div className="flex flex-wrap items-end gap-3">
          {/* Event Type */}
          <div className="space-y-1.5 min-w-[180px]">
            <label className="text-xs font-medium text-muted-foreground">Loại sự kiện</label>
            <Select
              value={eventType}
              onValueChange={(v) => {
                setEventType(v as EventTypeValue);
                setSearchTriggered(false);
              }}
            >
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Chọn sự kiện..." />
              </SelectTrigger>
              <SelectContent>
                {EVENT_TYPES.map((e) => (
                  <SelectItem key={e.value} value={e.value}>
                    {e.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* From Date - manual input + calendar */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Từ ngày</label>
            <div className="flex items-center gap-1">
              <Input
                placeholder="dd/MM/yyyy"
                value={fromInput}
                onChange={(e) => handleDateInput(e.target.value, setFromDate, setFromInput)}
                className="h-9 w-[120px] text-sm"
                maxLength={10}
              />
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="icon" className="h-9 w-9 shrink-0">
                    <CalendarIcon className="h-3.5 w-3.5" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={fromDate}
                    onSelect={(d) => handleCalendarSelect(d, setFromDate, setFromInput)}
                    initialFocus
                    className="p-3 pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* To Date - manual input + calendar */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Đến ngày</label>
            <div className="flex items-center gap-1">
              <Input
                placeholder="dd/MM/yyyy"
                value={toInput}
                onChange={(e) => handleDateInput(e.target.value, setToDate, setToInput)}
                className="h-9 w-[120px] text-sm"
                maxLength={10}
              />
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="icon" className="h-9 w-9 shrink-0">
                    <CalendarIcon className="h-3.5 w-3.5" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={toDate}
                    onSelect={(d) => handleCalendarSelect(d, setToDate, setToInput)}
                    initialFocus
                    className="p-3 pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Search Button */}
          <Button onClick={handleSearch} className="h-9" size="sm">
            <Search className="mr-1.5 h-3.5 w-3.5" />
            Tìm kiếm
          </Button>

          {/* Export Button */}
          {results.length > 0 && (
            <Button
              onClick={handleExport}
              variant="outline"
              className="h-9"
              size="sm"
              disabled={isExporting}
            >
              {isExporting ? (
                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
              ) : (
                <Download className="mr-1.5 h-3.5 w-3.5" />
              )}
              Tải Excel ({results.length})
            </Button>
          )}
        </div>

        {/* Results */}
        {searchTriggered && (
          <>
            {/* Summary Badge */}
            {!isLoading && selectedEvent && (
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className={selectedEvent.color}>
                  {selectedEvent.label}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  {fromDate && toDate
                    ? `${format(fromDate, "dd/MM/yyyy")} → ${format(toDate, "dd/MM/yyyy")}`
                    : ""}
                </span>
                <span className="text-sm font-semibold">
                  {results.length} học viên
                </span>
              </div>
            )}

            {/* Table */}
            {isLoading ? (
              <div className="space-y-2">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            ) : results.length > 0 ? (
              <div className="border rounded-lg overflow-hidden max-h-[400px] overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="w-12 text-center">STT</TableHead>
                      <TableHead className="w-20">Mã HV</TableHead>
                      <TableHead className="min-w-[140px]">Họ và tên</TableHead>
                      <TableHead className="w-14">GT</TableHead>
                      <TableHead className="w-24">Ngày sinh</TableHead>
                      <TableHead className="min-w-[80px]">Quê quán</TableHead>
                      <TableHead className="w-20">Đối tượng</TableHead>
                      <TableHead className="w-24">Giai đoạn</TableHead>
                      <TableHead className="w-24">Nhập học</TableHead>
                      <TableHead className="min-w-[100px]">Công ty (JP)</TableHead>
                      <TableHead className="min-w-[100px]">Nghiệp đoàn (JP)</TableHead>
                      <TableHead className="min-w-[100px]">Ngành nghề (JP)</TableHead>
                      <TableHead className="w-24">Ngày đậu</TableHead>
                      <TableHead className="w-20">Nguồn</TableHead>
                      <TableHead className="w-24">Ngày ĐK</TableHead>
                      <TableHead className="min-w-[140px]">Địa chỉ mới (sáp nhập)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {results.map((t, idx) => {
                      const passed = t.progression_stage && t.progression_stage !== "Chưa đậu";
                      return (
                        <TableRow
                          key={t.id}
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => navigate(`/trainees/${t.id}`)}
                        >
                          <TableCell className="text-center text-xs text-muted-foreground">
                            {idx + 1}
                          </TableCell>
                          <TableCell className="font-mono text-xs">
                            {t.trainee_code}
                          </TableCell>
                          <TableCell className="font-medium text-sm">
                            {t.full_name}
                          </TableCell>
                          <TableCell className="text-xs">{t.gender || "—"}</TableCell>
                          <TableCell className="text-xs">
                            {t.birth_date ? formatVietnameseDate(t.birth_date) : "—"}
                          </TableCell>
                          <TableCell className="text-xs">{t.birthplace || "—"}</TableCell>
                          <TableCell className="text-xs">{t.trainee_type || "—"}</TableCell>
                          <TableCell className="text-xs">{t.progression_stage || "—"}</TableCell>
                          <TableCell className="text-xs">
                            {t.entry_date ? formatVietnameseDate(t.entry_date) : "—"}
                          </TableCell>
                          <TableCell className="text-xs">{passed ? (t.companies?.name || "—") : "—"}</TableCell>
                          <TableCell className="text-xs">{passed ? (t.unions?.name || "—") : "—"}</TableCell>
                          <TableCell className="text-xs">{passed ? (t.job_categories?.name_japanese || "—") : "—"}</TableCell>
                          <TableCell className="text-xs">
                            {passed && t.interview_pass_date ? formatVietnameseDate(t.interview_pass_date) : "—"}
                          </TableCell>
                          <TableCell className="text-xs">{t.source || "—"}</TableCell>
                          <TableCell className="text-xs">
                            {t.registration_date ? formatVietnameseDate(t.registration_date) : "—"}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-6 text-sm text-muted-foreground">
                Không tìm thấy học viên nào trong khoảng thời gian đã chọn
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
