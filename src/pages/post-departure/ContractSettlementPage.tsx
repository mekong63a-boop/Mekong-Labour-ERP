// Thanh lý hợp đồng - hiển thị học viên có ngày biến động (BoTron, VeNuocSom, HoanThanhHD)
// Phân loại: Đã thanh lý (có settlement_date) vs Chưa thanh lý (chưa có settlement_date)
import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
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
import { FileCheck, Search, CheckCircle2, Clock } from "lucide-react";
import { format, parseISO } from "date-fns";
import { ExportButtonWithColumns } from "@/components/ui/export-button-with-columns";
import { cn } from "@/lib/utils";
import { PROGRESSION_STAGE_LABELS, getStageLabel, getTypeLabel } from "@/lib/enum-labels";

function useContractSettlementTrainees() {
  return useQuery({
    queryKey: ["contract-settlement-trainees"],
    queryFn: async () => {
      // Lấy tất cả HV có ngày biến động: bỏ trốn, về trước hạn, hoàn thành HĐ, hoặc đã có ngày thanh lý
      const { data: trainees, error } = await supabase
        .from("trainees")
        .select(
          "id,trainee_code,full_name,gender,trainee_type,progression_stage,departure_date,return_date,early_return_date,absconded_date,settlement_date,contract_term,contract_end_date,receiving_company_id,union_id,job_category_id,notes"
        )
        .or("absconded_date.not.is.null,early_return_date.not.is.null,return_date.not.is.null,settlement_date.not.is.null")
        .order("settlement_date", { ascending: false, nullsFirst: false });

      if (error) throw error;

      // Fetch related data
      const companyIds = [...new Set((trainees || []).map(t => t.receiving_company_id).filter(Boolean))] as string[];
      const unionIds = [...new Set((trainees || []).map(t => t.union_id).filter(Boolean))] as string[];
      const jobCatIds = [...new Set((trainees || []).map(t => t.job_category_id).filter(Boolean))] as string[];

      const [companiesRes, unionsRes, jobCatsRes] = await Promise.all([
        companyIds.length > 0
          ? supabase.from("companies").select("id,name,name_japanese").in("id", companyIds)
          : { data: [], error: null },
        unionIds.length > 0
          ? supabase.from("unions").select("id,name").in("id", unionIds)
          : { data: [], error: null },
        jobCatIds.length > 0
          ? supabase.from("job_categories").select("id,name").in("id", jobCatIds)
          : { data: [], error: null },
      ]);

      const companyMap = (companiesRes.data || []).reduce((acc, c) => { acc[c.id] = c; return acc; }, {} as Record<string, any>);
      const unionMap = (unionsRes.data || []).reduce((acc, u) => { acc[u.id] = u; return acc; }, {} as Record<string, any>);
      const jobCatMap = (jobCatsRes.data || []).reduce((acc, j) => { acc[j.id] = j; return acc; }, {} as Record<string, any>);

      return (trainees || []).map(t => ({
        ...t,
        company: t.receiving_company_id ? companyMap[t.receiving_company_id] : null,
        union: t.union_id ? unionMap[t.union_id] : null,
        job_category: t.job_category_id ? jobCatMap[t.job_category_id] : null,
      }));
    },
  });
}

// Xác định lý do kết thúc HĐ
function getEndReason(t: any): { label: string; color: string } {
  if (t.absconded_date) return { label: "Bỏ trốn", color: "bg-red-100 text-red-700" };
  if (t.early_return_date) return { label: "Về trước hạn", color: "bg-orange-100 text-orange-700" };
  if (t.return_date) return { label: "Hoàn thành HĐ", color: "bg-blue-100 text-blue-700" };
  return { label: "—", color: "" };
}

// Xác định ngày kết thúc (ngày biến động cuối)
function getEndDate(t: any): string | null {
  return t.absconded_date || t.early_return_date || t.return_date || null;
}

export default function ContractSettlementPage() {
  const { data: trainees, isLoading, isError, error } = useContractSettlementTrainees();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedYear, setSelectedYear] = useState<string>("all");
  const [settlementFilter, setSettlementFilter] = useState<string>("all"); // all | settled | unsettled

  // Year options dựa trên ngày kết thúc (biến động)
  const yearOptions = useMemo(() => {
    if (!trainees) return [];
    const years = new Set<string>();
    trainees.forEach(t => {
      const endDate = getEndDate(t);
      if (endDate) years.add(endDate.substring(0, 4));
      if (t.settlement_date) years.add(t.settlement_date.substring(0, 4));
    });
    return Array.from(years).sort((a, b) => b.localeCompare(a));
  }, [trainees]);

  const filtered = useMemo(() => {
    if (!trainees) return [];
    let result = trainees;

    // Filter by year (theo ngày kết thúc hoặc ngày thanh lý)
    if (selectedYear !== "all") {
      result = result.filter(t => {
        const endDate = getEndDate(t);
        return endDate?.startsWith(selectedYear) || t.settlement_date?.startsWith(selectedYear);
      });
    }

    // Filter by settlement status
    if (settlementFilter === "settled") {
      result = result.filter(t => !!t.settlement_date);
    } else if (settlementFilter === "unsettled") {
      result = result.filter(t => !t.settlement_date);
    }

    // Search
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(t =>
        t.full_name?.toLowerCase().includes(q) ||
        t.trainee_code?.toLowerCase().includes(q)
      );
    }

    return result;
  }, [trainees, selectedYear, settlementFilter, searchQuery]);

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "—";
    try { return format(parseISO(dateStr), "dd/MM/yyyy"); } catch { return "—"; }
  };

  // Stats
  const stats = useMemo(() => {
    if (!trainees) return { total: 0, settled: 0, unsettled: 0, filteredTotal: 0 };
    
    // Tổng số trong danh sách (sau lọc năm, trước lọc trạng thái thanh lý)
    let yearFiltered = trainees;
    if (selectedYear !== "all") {
      yearFiltered = yearFiltered.filter(t => {
        const endDate = getEndDate(t);
        return endDate?.startsWith(selectedYear) || t.settlement_date?.startsWith(selectedYear);
      });
    }

    const total = yearFiltered.length;
    const settled = yearFiltered.filter(t => !!t.settlement_date).length;
    const unsettled = yearFiltered.filter(t => !t.settlement_date).length;
    return { total, settled, unsettled, filteredTotal: filtered.length };
  }, [trainees, selectedYear, filtered]);

  const exportColumns = [
    { key: "trainee_code", label: "Mã HV" },
    { key: "full_name", label: "Họ và tên" },
    { key: "gender", label: "Giới tính" },
    { key: "trainee_type", label: "Đối tượng" },
    { key: "end_reason", label: "Lý do" },
    { key: "company_name", label: "Công ty" },
    { key: "union_name", label: "Nghiệp đoàn" },
    { key: "job_category_name", label: "Ngành nghề" },
    { key: "departure_date", label: "Ngày xuất cảnh" },
    { key: "end_date", label: "Ngày kết thúc" },
    { key: "settlement_date", label: "Ngày thanh lý" },
    { key: "settlement_status", label: "Trạng thái TL" },
    { key: "contract_term", label: "Thời hạn HĐ" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <FileCheck className="h-6 w-6 text-primary" />
          <h1 className="text-xl font-bold text-primary">Thanh lý hợp đồng</h1>
        </div>
      </div>

      {/* Stats Cards - clickable to filter */}
      <div className="grid grid-cols-3 gap-4">
        <button
          onClick={() => setSettlementFilter("all")}
          className={cn(
            "p-4 rounded-lg border text-left transition-all",
            settlementFilter === "all" ? "bg-blue-50 border-blue-300 ring-2 ring-blue-200" : "hover:bg-muted/50"
          )}
        >
          <p className="text-sm font-medium text-blue-600">Tổng cộng</p>
          <p className="text-3xl font-bold text-foreground mt-1">{stats.total}</p>
        </button>
        <button
          onClick={() => setSettlementFilter("settled")}
          className={cn(
            "p-4 rounded-lg border text-left transition-all",
            settlementFilter === "settled" ? "bg-emerald-50 border-emerald-300 ring-2 ring-emerald-200" : "hover:bg-muted/50"
          )}
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            <p className="text-sm font-medium text-emerald-600">Đã thanh lý</p>
          </div>
          <p className="text-3xl font-bold text-foreground mt-1">{stats.settled}</p>
        </button>
        <button
          onClick={() => setSettlementFilter("unsettled")}
          className={cn(
            "p-4 rounded-lg border text-left transition-all",
            settlementFilter === "unsettled" ? "bg-amber-50 border-amber-300 ring-2 ring-amber-200" : "hover:bg-muted/50"
          )}
        >
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-amber-600" />
            <p className="text-sm font-medium text-amber-600">Chưa thanh lý</p>
          </div>
          <p className="text-3xl font-bold text-foreground mt-1">{stats.unsettled}</p>
        </button>
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
              {yearOptions.map(y => (
                <SelectItem key={y} value={y}>{y}</SelectItem>
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
          Lỗi: {(error as any)?.message || "Unknown"}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground border rounded-lg">
          Không có dữ liệu thanh lý hợp đồng
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="w-10 text-center">#</TableHead>
                <TableHead className="w-24">Mã HV</TableHead>
                <TableHead>Họ và tên</TableHead>
                <TableHead className="w-16 text-center">GT</TableHead>
                <TableHead>Đối tượng</TableHead>
                <TableHead>Lý do</TableHead>
                <TableHead>Công ty</TableHead>
                <TableHead>Nghiệp đoàn</TableHead>
                <TableHead className="w-28 text-center">Ngày XC</TableHead>
                <TableHead className="w-28 text-center">Ngày kết thúc</TableHead>
                <TableHead className="w-28 text-center">Ngày thanh lý</TableHead>
                <TableHead className="w-28 text-center">Trạng thái</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((t, idx) => {
                const endReason = getEndReason(t);
                const endDate = getEndDate(t);
                const isSettled = !!t.settlement_date;

                return (
                  <TableRow key={t.id} className="hover:bg-muted/30">
                    <TableCell className="text-center text-muted-foreground text-xs">{idx + 1}</TableCell>
                    <TableCell className="font-mono text-sm">{t.trainee_code}</TableCell>
                    <TableCell className="font-medium uppercase">{t.full_name}</TableCell>
                    <TableCell className="text-center text-sm">{t.gender || "—"}</TableCell>
                    <TableCell className="text-sm">
                      {t.trainee_type ? (
                        <Badge variant="outline" className="text-xs">{t.trainee_type}</Badge>
                      ) : "—"}
                    </TableCell>
                    <TableCell className="text-sm">
                      {endReason.label !== "—" ? (
                        <Badge className={cn("text-xs", endReason.color)}>{endReason.label}</Badge>
                      ) : "—"}
                    </TableCell>
                    <TableCell className="text-sm">
                      {t.company?.name_japanese || t.company?.name || "—"}
                    </TableCell>
                    <TableCell className="text-sm">{t.union?.name || "—"}</TableCell>
                    <TableCell className="text-center text-sm">{formatDate(t.departure_date)}</TableCell>
                    <TableCell className="text-center text-sm">{formatDate(endDate)}</TableCell>
                    <TableCell className={cn(
                      "text-center text-sm font-medium",
                      isSettled ? "text-emerald-600" : "text-muted-foreground"
                    )}>
                      {isSettled ? formatDate(t.settlement_date) : "—"}
                    </TableCell>
                    <TableCell className="text-center">
                      {isSettled ? (
                        <Badge className="bg-emerald-100 text-emerald-700 text-xs">Đã thanh lý</Badge>
                      ) : (
                        <Badge className="bg-amber-100 text-amber-700 text-xs">Chưa thanh lý</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      <div className="text-sm text-muted-foreground">
        Hiển thị {filtered.length} / {stats.total} học viên
      </div>
    </div>
  );
}
