import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Users, Search, RefreshCw, BarChart3, GraduationCap, Wrench, Briefcase, Plane, Key } from "lucide-react";
import { format, parseISO, addYears } from "date-fns";
import { ExportButtonWithColumns } from '@/components/ui/export-button-with-columns';
import { EXPORT_CONFIGS } from '@/lib/export-configs';
import { cn } from "@/lib/utils";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

// Status categories based on progression_stage
const STATUS_FILTERS = [
  { value: "DangLamViec", label: "Đang ở Nhật", color: "text-green-600" },
  { value: "VeNuocSom", label: "Về giữa chừng", color: "text-orange-600" },
  { value: "BoTron", label: "Bỏ trốn", color: "text-red-600" },
  { value: "HoanThanhHD", label: "Hoàn thành HĐ", color: "text-blue-600" },
];

// Trainee type config with icons
const TRAINEE_TYPES = [
  { value: "Thực tập sinh", label: "Thực tập sinh", icon: GraduationCap },
  { value: "TTS số 3", label: "TTS số 3", icon: GraduationCap },
  { value: "Du học sinh", label: "Du học sinh", icon: Plane },
  { value: "Kỹ năng đặc định", label: "Kỹ năng đặc định", icon: Key },
  { value: "Kỹ sư", label: "Kỹ sư", icon: Briefcase },
];

// Hook to fetch post-departure trainees
function usePostDepartureTrainees() {
  return useQuery({
    queryKey: ["post-departure-trainees"],
    queryFn: async () => {
      // 1) Fetch trainees first (no embedded relations because trainees table has no FK relationships in PostgREST)
      const { data: trainees, error: traineeError } = await supabase
        .from("trainees")
        .select(
          "id,trainee_code,full_name,progression_stage,departure_date,contract_term,contract_end_date,return_date,early_return_date,absconded_date,notes,receiving_company_id,trainee_type"
        )
        .in("progression_stage", [
          "DaXuatCanh",
          "DangLamViec",
          "HoanThanhHD",
          "BoTron",
          "VeNuocSom",
        ])
        .order("departure_date", { ascending: false });

      if (traineeError) throw traineeError;

      const companyIds = Array.from(
        new Set((trainees || []).map((t) => t.receiving_company_id).filter(Boolean))
      ) as string[];

      // 2) Fetch company names (optional)
      let companyMap: Record<string, { name: string; name_japanese: string | null }> = {};
      if (companyIds.length > 0) {
        const { data: companies, error: companyError } = await supabase
          .from("companies")
          .select("id,name,name_japanese")
          .in("id", companyIds);

        if (companyError) throw companyError;

        companyMap = (companies || []).reduce((acc, c) => {
          acc[c.id] = { name: c.name, name_japanese: c.name_japanese };
          return acc;
        }, {} as Record<string, { name: string; name_japanese: string | null }>);
      }

      return (trainees || []).map((t) => ({
        ...t,
        receiving_company: t.receiving_company_id ? companyMap[t.receiving_company_id] || null : null,
      }));
    },
  });
}

// Generate year options from departure_date (năm xuất cảnh)
function getYearOptionsFromData(trainees: any[] | undefined) {
  if (!trainees) return [];
  
  const years = new Set<string>();
  trainees.forEach(t => {
    if (t.departure_date) {
      years.add(t.departure_date.substring(0, 4));
    }
  });
  
  return Array.from(years).sort((a, b) => b.localeCompare(a));
}

export default function PostDeparturePage() {
  const {
    data: trainees,
    isLoading,
    isError,
    error,
    refetch,
    isRefetching,
  } = usePostDepartureTrainees();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedYear, setSelectedYear] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [selectedTraineeType, setSelectedTraineeType] = useState<string | null>(null);
  const [showChart, setShowChart] = useState(true);
  const [exportTraineeType, setExportTraineeType] = useState<string>("all");

  // Get year options from actual data
  const yearOptions = useMemo(() => getYearOptionsFromData(trainees), [trainees]);

  // Type stats và KPI stats được tính trực tiếp từ trainees list (SSOT)

  // Calculate type stats từ danh sách trainees đã lọc theo năm
  // SSOT: dùng cùng nguồn dữ liệu với bảng danh sách để đảm bảo số liệu khớp
  const typeStats = useMemo(() => {
    const result: Record<string, number> = {
      "Thực tập sinh": 0,
      "TTS số 3": 0,
      "Du học sinh": 0,
      "Kỹ năng đặc định": 0,
      "Kỹ sư": 0,
    };

    if (!trainees) return result;

    const filtered = selectedYear && selectedYear !== "all"
      ? trainees.filter(t => t.departure_date?.startsWith(selectedYear))
      : trainees;

    filtered.forEach((t: any) => {
      const type = t.trainee_type;
      if (type && type in result) {
        result[type] += 1;
      }
    });

    return result;
  }, [selectedYear, trainees]);

  // SYSTEM RULE: Chart data từ database view post_departure_stats_by_year
  // Logic tính toán đã ở Supabase, frontend chỉ hiển thị
  const { data: chartDataFromDb } = useQuery({
    queryKey: ["post-departure-chart-data"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("post_departure_stats_by_year")
        .select("*");
      
      if (error) throw error;
      return (data || []).map(row => ({
        year: row.year,
        working: row.working,
        earlyReturn: row.early_return,
        absconded: row.absconded,
        completed: row.completed,
      }));
    },
  });

  const chartData = chartDataFromDb || [];

  // SYSTEM RULE: Stats từ database view, UI filtering là hợp lệ
  // Khi selectedYear = "all" → dùng post_departure_summary view
  // Khi selectedYear != "all" → lọc từ post_departure_stats_by_year view
  // summaryStats không còn dùng — stats tính trực tiếp từ trainees

  // Helper: lấy trạng thái LỊCH SỬ của HV tại thời điểm cuối năm được chọn
  // Nếu sự kiện xảy ra SAU năm đó → HV vẫn "Đang làm việc" tại thời điểm năm đó
  // Nếu không chọn năm (all) → dùng trạng thái hiện tại
  const getDisplayStatusForYear = (trainee: any, year: string | null) => {
    const stage = trainee.progression_stage;
    
    // Không lọc năm → trạng thái hiện tại
    if (!year || year === "all") {
      if (stage === "DangLamViec" || stage === "DaXuatCanh") return "DangLamViec";
      if (stage === "VeNuocSom") return "VeNuocSom";
      if (stage === "BoTron") return "BoTron";
      if (stage === "HoanThanhHD") return "HoanThanhHD";
      return stage;
    }

    const yearNum = parseInt(year);
    const yearEnd = `${yearNum}-12-31`;

    const eventInOrBefore = (dateStr: string | null) => {
      if (!dateStr) return false;
      return dateStr <= yearEnd;
    };

    // Ưu tiên: Bỏ trốn > Về trước hạn > Hoàn thành HĐ > Đang làm việc
    if (stage === "BoTron" && eventInOrBefore(trainee.absconded_date)) return "BoTron";
    if (stage === "VeNuocSom" && eventInOrBefore(trainee.early_return_date)) return "VeNuocSom";
    if (stage === "HoanThanhHD" && eventInOrBefore(trainee.return_date)) return "HoanThanhHD";
    
    // Sự kiện chưa xảy ra tại năm đó → vẫn đang làm việc
    if (["BoTron", "VeNuocSom", "HoanThanhHD"].includes(stage)) return "DangLamViec";
    if (stage === "DangLamViec" || stage === "DaXuatCanh") return "DangLamViec";
    return stage;
  };

  // Helper: kiểm tra HV có liên quan đến năm được chọn không
  // Liên quan = xuất cảnh trong năm ĐÓ, HOẶC có sự kiện (bỏ trốn/về sớm/hoàn thành) trong năm đó
  const isTraineeRelevantToYear = (trainee: any, year: string | null) => {
    if (!year || year === "all") return true;
    if (trainee.departure_date?.startsWith(year)) return true;
    if (trainee.absconded_date?.startsWith(year)) return true;
    if (trainee.early_return_date?.startsWith(year)) return true;
    if (trainee.return_date?.startsWith(year)) return true;
    return false;
  };

  // Backward compat wrapper - used by table display
  const getDisplayStatus = (trainee: any) => {
    return getDisplayStatusForYear(trainee, selectedYear === "all" ? null : selectedYear);
  };

  // KPI stats: tính từ danh sách trainees liên quan đến năm được chọn
  // Trạng thái tính theo thời điểm năm được chọn (lịch sử)
  const stats = useMemo(() => {
    if (!trainees) return { working: 0, earlyReturn: 0, absconded: 0, completed: 0, total: 0 };

    const yearFilter = selectedYear && selectedYear !== "all" ? selectedYear : null;
    const filtered = yearFilter
      ? trainees.filter(t => isTraineeRelevantToYear(t, yearFilter))
      : trainees;

    let working = 0, earlyReturn = 0, absconded = 0, completed = 0;
    filtered.forEach(t => {
      const status = getDisplayStatusForYear(t, yearFilter);
      if (status === "DangLamViec") working++;
      else if (status === "VeNuocSom") earlyReturn++;
      else if (status === "BoTron") absconded++;
      else if (status === "HoanThanhHD") completed++;
    });

    return {
      working,
      earlyReturn,
      absconded,
      completed,
      total: filtered.length,
    };
  }, [selectedYear, trainees]);

  // Filter trainees (UI filtering)
  const filteredTrainees = useMemo(() => {
    if (!trainees) return [];

    let result = trainees;

    // Filter by year (bao gồm HV xuất cảnh + HV có sự kiện trong năm)
    if (selectedYear && selectedYear !== "all") {
      result = result.filter(t => isTraineeRelevantToYear(t, selectedYear));
    }

    // Filter by status (dùng trạng thái hiện tại)
    if (selectedStatus) {
      if (selectedStatus === "Đang làm việc") {
        result = result.filter(t => {
          const s = getDisplayStatus(t);
          return s === "Đang làm việc";
        });
      } else {
        result = result.filter(t => getDisplayStatus(t) === selectedStatus);
      }
    }

    // Filter by trainee type
    if (selectedTraineeType) {
      result = result.filter(t => (t as any).trainee_type === selectedTraineeType);
    }

    // Filter by search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(t =>
        t.full_name?.toLowerCase().includes(query) ||
        t.trainee_code?.toLowerCase().includes(query)
      );
    }

    return result;
  }, [trainees, selectedYear, selectedStatus, selectedTraineeType, searchQuery]);


  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "-";
    try {
      return format(parseISO(dateStr), "dd/MM/yyyy");
    } catch {
      return "-";
    }
  };

  const calculateContractEndDate = (departureDate: string | null, contractTerm: number | null) => {
    if (!departureDate) return "-";
    const term = contractTerm || 3; // Default 3 years
    try {
      const endDate = addYears(parseISO(departureDate), term);
      return format(endDate, "dd/MM/yyyy");
    } catch {
      return "-";
    }
  };

  // Get return date info based on progression stage
  const getReturnDateInfo = (trainee: any): { date: string; label: string; colorClass: string } => {
    switch (trainee.progression_stage) {
      case "Bỏ trốn":
        return { date: formatDate(trainee.absconded_date), label: "Ngày bỏ trốn", colorClass: "text-red-600 font-medium" };
      case "Về trước hạn":
        return { date: formatDate(trainee.early_return_date), label: "Ngày về", colorClass: "text-orange-600" };
      case "Hoàn thành hợp đồng":
        return { date: formatDate(trainee.return_date), label: "Ngày về nước", colorClass: "text-blue-600" };
      default:
        return { date: "-", label: "", colorClass: "" };
    }
  };

  const getStatusBadge = (stage: string | null) => {
    const colorMap: Record<string, string> = {
      "Xuất cảnh": "bg-indigo-100 text-indigo-700",
      "Đang làm việc": "bg-green-100 text-green-700",
      "Hoàn thành hợp đồng": "bg-blue-100 text-blue-700",
      "Bỏ trốn": "bg-red-100 text-red-700",
      "Về trước hạn": "bg-orange-100 text-orange-700",
    };
    return colorMap[stage || ""] || "bg-muted text-muted-foreground";
  };

  const handleStatusClick = (status: string | null) => {
    if (selectedStatus === status) {
      setSelectedStatus(null); // Toggle off if already selected
    } else {
      setSelectedStatus(status);
      setSelectedTraineeType(null); // Clear trainee type filter when selecting status
    }
  };

  const handleTraineeTypeClick = (type: string | null) => {
    if (selectedTraineeType === type) {
      setSelectedTraineeType(null); // Toggle off if already selected
    } else {
      setSelectedTraineeType(type);
      setSelectedStatus(null); // Clear status filter when selecting type
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Users className="h-6 w-6 text-primary" />
          <h1 className="text-xl font-bold text-primary">TTS đang ở Nhật</h1>
        </div>
        <div className="flex items-center gap-2">
          <Select value={exportTraineeType} onValueChange={setExportTraineeType}>
            <SelectTrigger className="w-[180px] h-9">
              <SelectValue placeholder="Chọn đối tượng xuất" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả đối tượng</SelectItem>
              <SelectItem value="Thực tập sinh">Thực tập sinh</SelectItem>
              <SelectItem value="TTS số 3">TTS số 3</SelectItem>
              <SelectItem value="Du học sinh">Du học sinh</SelectItem>
              <SelectItem value="Kỹ năng đặc định">Kỹ năng đặc định</SelectItem>
              <SelectItem value="Kỹ sư">Kỹ sư</SelectItem>
            </SelectContent>
          </Select>
          <ExportButtonWithColumns
            menuKey="post-departure"
            tableName="trainees"
            allColumns={EXPORT_CONFIGS.post_departure.columns}
            fileName={`${EXPORT_CONFIGS.post_departure.fileName}${exportTraineeType !== 'all' ? `-${exportTraineeType.replace(/\s+/g, '-').toLowerCase()}` : ''}`}
            filters={{ 
              progression_stage: ['Xuất cảnh', 'Đang làm việc', 'Hoàn thành hợp đồng', 'Bỏ trốn', 'Về trước hạn'],
              ...(exportTraineeType !== 'all' && { trainee_type: exportTraineeType })
            }}
            title={`Xuất danh sách ${exportTraineeType !== 'all' ? exportTraineeType : 'sau xuất cảnh'}`}
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowChart(!showChart)}
          >
            <BarChart3 className="h-4 w-4 mr-2" />
            {showChart ? "Ẩn biểu đồ" : "Hiện biểu đồ"}
          </Button>
        </div>
      </div>

      {/* Chart */}
      {showChart && chartData.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium">
              Thống kê TTS theo năm xuất cảnh và tình trạng
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="year" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: "hsl(var(--background))", 
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px"
                    }}
                  />
                  <Legend />
                  <Bar dataKey="working" name="Đang ở Nhật" fill="#22c55e" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="completed" name="Hoàn thành HĐ" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="earlyReturn" name="Về giữa chừng" fill="#f97316" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="absconded" name="Bỏ trốn" fill="#ef4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
        {/* Đang ở Nhật */}
        <button
          onClick={() => handleStatusClick("Đang làm việc")}
          className={cn(
            "p-4 rounded-lg border-2 text-left transition-all hover:shadow-md",
            selectedStatus === "Đang làm việc"
              ? "border-green-500 bg-green-50"
              : "border-border hover:border-green-300"
          )}
        >
          <p className="text-sm font-medium text-green-600">Đang ở Nhật</p>
          <p className="text-3xl font-bold text-foreground mt-1">{stats.working}</p>
        </button>

        {/* Về giữa chừng */}
        <button
          onClick={() => handleStatusClick("Về trước hạn")}
          className={cn(
            "p-4 rounded-lg border text-left transition-all hover:shadow-md",
            selectedStatus === "Về trước hạn"
              ? "border-orange-500 bg-orange-50"
              : "border-border hover:border-orange-300"
          )}
        >
          <p className="text-sm font-medium text-orange-600">Về giữa chừng</p>
          <p className="text-3xl font-bold text-foreground mt-1">{stats.earlyReturn}</p>
        </button>

        {/* Bỏ trốn */}
        <button
          onClick={() => handleStatusClick("Bỏ trốn")}
          className={cn(
            "p-4 rounded-lg border text-left transition-all hover:shadow-md",
            selectedStatus === "Bỏ trốn"
              ? "border-red-500 bg-red-50"
              : "border-border hover:border-red-300"
          )}
        >
          <p className="text-sm font-medium text-red-600">Bỏ trốn</p>
          <p className="text-3xl font-bold text-foreground mt-1">{stats.absconded}</p>
        </button>

        {/* Hoàn thành HĐ */}
        <button
          onClick={() => handleStatusClick("Hoàn thành hợp đồng")}
          className={cn(
            "p-4 rounded-lg border text-left transition-all hover:shadow-md",
            selectedStatus === "Hoàn thành hợp đồng"
              ? "border-blue-500 bg-blue-50"
              : "border-border hover:border-blue-300"
          )}
        >
          <p className="text-sm font-medium text-blue-600">Hoàn thành HĐ</p>
          <p className="text-3xl font-bold text-foreground mt-1">{stats.completed}</p>
        </button>

        {/* Tổng xuất cảnh */}
        <div
          className="p-4 rounded-lg border text-left bg-muted/30"
        >
          <p className="text-sm font-medium text-primary">Tổng xuất cảnh</p>
          <p className="text-3xl font-bold text-primary mt-1">{stats.total}</p>
        </div>
      </div>

      {/* KPI Cards by Trainee Type */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
        {TRAINEE_TYPES.map((type) => {
          const IconComponent = type.icon;
          const isSelected = selectedTraineeType === type.value;
          return (
            <button
              key={type.value}
              onClick={() => handleTraineeTypeClick(type.value)}
              className={cn(
                "p-4 rounded-lg border text-left transition-all hover:shadow-md",
                isSelected
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/50"
              )}
            >
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-primary">{type.label}</p>
                <IconComponent className="h-4 w-4 text-primary/60" />
              </div>
              <p className="text-3xl font-bold text-primary mt-1">
                {typeStats[type.value] || 0}
              </p>
            </button>
          );
        })}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Năm:</span>
          <Select value={selectedYear} onValueChange={setSelectedYear}>
            <SelectTrigger className="w-28">
              <SelectValue placeholder="Tất cả" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả</SelectItem>
              {yearOptions.map((year) => (
                <SelectItem key={year} value={year}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Tìm theo tên hoặc mã..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {(selectedStatus || selectedTraineeType) && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSelectedStatus(null);
              setSelectedTraineeType(null);
            }}
          >
            Bỏ lọc
          </Button>
        )}
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="space-y-2">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      ) : isError ? (
        <div className="text-center py-12 text-destructive border rounded-lg">
          Không tải được dữ liệu: {(error as any)?.message || "Unknown error"}
        </div>
      ) : filteredTrainees.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground border rounded-lg">
          Không có dữ liệu
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="w-24">Mã HV</TableHead>
                <TableHead>Họ và tên</TableHead>
                <TableHead>Công ty</TableHead>
                <TableHead className="w-28 text-center">Tình trạng</TableHead>
                <TableHead className="w-32 text-center">Ngày xuất cảnh</TableHead>
                <TableHead className="w-32 text-center">Ngày hết hạn HĐ</TableHead>
                <TableHead className="w-32 text-center">Ngày tương ứng</TableHead>
                <TableHead>Ghi chú</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTrainees.map((trainee) => (
                <TableRow key={trainee.id} className="hover:bg-muted/30">
                  <TableCell className="font-mono text-sm">{trainee.trainee_code}</TableCell>
                  <TableCell className="font-medium uppercase">{trainee.full_name}</TableCell>
                  <TableCell className="text-sm">
                    {(trainee.receiving_company as any)?.name_japanese 
                      ? `${(trainee.receiving_company as any).name_japanese} (${(trainee.receiving_company as any).name})`
                      : (trainee.receiving_company as any)?.name || "-"}
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge className={getStatusBadge(trainee.progression_stage)}>
                      {trainee.progression_stage || "-"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center text-sm">
                    {formatDate(trainee.departure_date)}
                  </TableCell>
                  <TableCell className="text-center text-sm">
                    {trainee.contract_end_date 
                      ? formatDate(trainee.contract_end_date)
                      : calculateContractEndDate(trainee.departure_date, trainee.contract_term)}
                  </TableCell>
                  <TableCell className="text-center text-sm">
                    {(() => {
                      const info = getReturnDateInfo(trainee);
                      if (info.date === "-") return "-";
                      return (
                        <div className="flex flex-col items-center gap-0.5">
                          <span className={info.colorClass}>{info.date}</span>
                          <span className="text-[10px] text-muted-foreground">{info.label}</span>
                        </div>
                      );
                    })()}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {trainee.notes || "-"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Summary */}
      <div className="text-sm text-muted-foreground">
        Hiển thị {filteredTrainees.length} / {trainees?.length || 0} học viên
      </div>
    </div>
  );
}
