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
import { Users, Search, RefreshCw, Download, BarChart3 } from "lucide-react";
import { format, parseISO, addYears } from "date-fns";
import { cn } from "@/lib/utils";
import * as XLSX from "xlsx";
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
  { value: "Đang làm việc", label: "Đang ở Nhật", color: "text-green-600" },
  { value: "Về trước hạn", label: "Về giữa chừng", color: "text-orange-600" },
  { value: "Bỏ trốn", label: "Bỏ trốn", color: "text-red-600" },
  { value: "Hoàn thành hợp đồng", label: "Hoàn thành HĐ", color: "text-blue-600" },
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
          "id,trainee_code,full_name,progression_stage,departure_date,contract_term,contract_end_date,return_date,early_return_date,notes,receiving_company_id"
        )
        .in("progression_stage", [
          "Xuất cảnh",
          "Đang làm việc",
          "Hoàn thành hợp đồng",
          "Bỏ trốn",
          "Về trước hạn",
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

// Generate year options from actual departure data
function getYearOptionsFromData(trainees: any[] | undefined) {
  if (!trainees) return [];
  
  const years = new Set<string>();
  trainees.forEach(t => {
    if (t.departure_date) {
      const year = t.departure_date.substring(0, 4);
      years.add(year);
    }
  });
  
  return Array.from(years).sort((a, b) => b.localeCompare(a)); // Sort descending
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
  const [showChart, setShowChart] = useState(true);

  // Get year options from actual data
  const yearOptions = useMemo(() => getYearOptionsFromData(trainees), [trainees]);

  // Calculate stats
  const stats = useMemo(() => {
    if (!trainees) return { working: 0, earlyReturn: 0, absconded: 0, completed: 0, total: 0 };
    
    let filtered = trainees;
    
    // Filter by year if selected
    if (selectedYear && selectedYear !== "all") {
      filtered = trainees.filter(t => {
        if (!t.departure_date) return false;
        return t.departure_date.startsWith(selectedYear);
      });
    }

    return {
      working: filtered.filter(t => t.progression_stage === "Đang làm việc" || t.progression_stage === "Xuất cảnh").length,
      earlyReturn: filtered.filter(t => t.progression_stage === "Về trước hạn").length,
      absconded: filtered.filter(t => t.progression_stage === "Bỏ trốn").length,
      completed: filtered.filter(t => t.progression_stage === "Hoàn thành hợp đồng").length,
      total: filtered.length,
    };
  }, [trainees, selectedYear]);

  // Filter trainees
  const filteredTrainees = useMemo(() => {
    if (!trainees) return [];

    let result = trainees;

    // Filter by year
    if (selectedYear && selectedYear !== "all") {
      result = result.filter(t => {
        if (!t.departure_date) return false;
        return t.departure_date.startsWith(selectedYear);
      });
    }

    // Filter by status
    if (selectedStatus) {
      if (selectedStatus === "Đang làm việc") {
        // Include both "Đang làm việc" and "Xuất cảnh" for "Đang ở Nhật"
        result = result.filter(t => t.progression_stage === "Đang làm việc" || t.progression_stage === "Xuất cảnh");
      } else {
        result = result.filter(t => t.progression_stage === selectedStatus);
      }
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
  }, [trainees, selectedYear, selectedStatus, searchQuery]);

  // Calculate chart data by year
  const chartData = useMemo(() => {
    if (!trainees) return [];

    const yearStats: Record<string, { year: string; working: number; earlyReturn: number; absconded: number; completed: number }> = {};

    trainees.forEach(t => {
      if (!t.departure_date) return;
      const year = t.departure_date.substring(0, 4);
      
      if (!yearStats[year]) {
        yearStats[year] = { year, working: 0, earlyReturn: 0, absconded: 0, completed: 0 };
      }

      switch (t.progression_stage) {
        case "Đang làm việc":
        case "Xuất cảnh":
          yearStats[year].working++;
          break;
        case "Về trước hạn":
          yearStats[year].earlyReturn++;
          break;
        case "Bỏ trốn":
          yearStats[year].absconded++;
          break;
        case "Hoàn thành hợp đồng":
          yearStats[year].completed++;
          break;
      }
    });

    return Object.values(yearStats).sort((a, b) => a.year.localeCompare(b.year));
  }, [trainees]);

  // Export to Excel
  const handleExportExcel = () => {
    if (!filteredTrainees || filteredTrainees.length === 0) return;

    const exportData = filteredTrainees.map((t, index) => ({
      "STT": index + 1,
      "Mã HV": t.trainee_code,
      "Họ và tên": t.full_name,
      "Công ty": (t.receiving_company as any)?.name_japanese 
        ? `${(t.receiving_company as any).name_japanese} (${(t.receiving_company as any).name})`
        : (t.receiving_company as any)?.name || "",
      "Tình trạng": t.progression_stage,
      "Ngày xuất cảnh": formatDate(t.departure_date),
      "Ngày hết hạn HĐ": t.contract_end_date 
        ? formatDate(t.contract_end_date)
        : calculateContractEndDate(t.departure_date, t.contract_term),
      "Ngày về nước": getReturnDate(t),
      "Ghi chú": t.notes || "",
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "TTS Sau Xuất Cảnh");

    // Auto-size columns
    const colWidths = [
      { wch: 5 },  // STT
      { wch: 12 }, // Mã HV
      { wch: 25 }, // Họ và tên
      { wch: 40 }, // Công ty
      { wch: 18 }, // Tình trạng
      { wch: 15 }, // Ngày xuất cảnh
      { wch: 15 }, // Ngày hết hạn HĐ
      { wch: 15 }, // Ngày về nước
      { wch: 30 }, // Ghi chú
    ];
    ws["!cols"] = colWidths;

    const fileName = `TTS_Sau_Xuat_Canh_${format(new Date(), "yyyyMMdd_HHmmss")}.xlsx`;
    XLSX.writeFile(wb, fileName);
  };

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

  // Get return date based on progression stage
  const getReturnDate = (trainee: any) => {
    if (trainee.progression_stage === "Hoàn thành hợp đồng") {
      return formatDate(trainee.return_date);
    } else if (trainee.progression_stage === "Về trước hạn") {
      return formatDate(trainee.early_return_date);
    }
    return "-";
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
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowChart(!showChart)}
          >
            <BarChart3 className="h-4 w-4 mr-2" />
            {showChart ? "Ẩn biểu đồ" : "Hiện biểu đồ"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportExcel}
            disabled={filteredTrainees.length === 0}
          >
            <Download className="h-4 w-4 mr-2" />
            Xuất Excel
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => refetch()}
            disabled={isRefetching}
          >
            <RefreshCw className={cn("h-4 w-4", isRefetching && "animate-spin")} />
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

        {selectedStatus && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSelectedStatus(null)}
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
                <TableHead className="w-28 text-center">Ngày về nước</TableHead>
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
                    {getReturnDate(trainee)}
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
