// Thanh lý hợp đồng - hiển thị học viên đã hoàn thành hợp đồng và về nước
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
import { FileCheck, Search } from "lucide-react";
import { format, parseISO } from "date-fns";
import { ExportButtonWithColumns } from "@/components/ui/export-button-with-columns";

function useContractSettlementTrainees() {
  return useQuery({
    queryKey: ["contract-settlement-trainees"],
    queryFn: async () => {
      const { data: trainees, error } = await supabase
        .from("trainees")
        .select(
          "id,trainee_code,full_name,gender,trainee_type,departure_date,return_date,settlement_date,contract_term,contract_end_date,receiving_company_id,union_id,job_category_id,notes"
        )
        .not("settlement_date", "is", null)
        .order("settlement_date", { ascending: false });

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

export default function ContractSettlementPage() {
  const { data: trainees, isLoading, isError, error } = useContractSettlementTrainees();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedYear, setSelectedYear] = useState<string>("all");

  const yearOptions = useMemo(() => {
    if (!trainees) return [];
    const years = new Set<string>();
    trainees.forEach(t => {
      if (t.return_date) years.add(t.return_date.substring(0, 4));
    });
    return Array.from(years).sort((a, b) => b.localeCompare(a));
  }, [trainees]);

  const filtered = useMemo(() => {
    if (!trainees) return [];
    let result = trainees;

    if (selectedYear !== "all") {
      result = result.filter(t => t.return_date?.startsWith(selectedYear));
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(t =>
        t.full_name?.toLowerCase().includes(q) ||
        t.trainee_code?.toLowerCase().includes(q)
      );
    }

    return result;
  }, [trainees, selectedYear, searchQuery]);

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "—";
    try { return format(parseISO(dateStr), "dd/MM/yyyy"); } catch { return "—"; }
  };

  // Stats
  const stats = useMemo(() => {
    const total = filtered.length;
    const male = filtered.filter(t => t.gender === "Nam").length;
    const female = filtered.filter(t => t.gender === "Nữ").length;
    return { total, male, female };
  }, [filtered]);

  const exportColumns = [
    { key: "trainee_code", label: "Mã HV" },
    { key: "full_name", label: "Họ và tên" },
    { key: "gender", label: "Giới tính" },
    { key: "trainee_type", label: "Đối tượng" },
    { key: "company_name", label: "Công ty" },
    { key: "union_name", label: "Nghiệp đoàn" },
    { key: "job_category_name", label: "Ngành nghề" },
    { key: "departure_date", label: "Ngày xuất cảnh" },
    { key: "return_date", label: "Ngày về nước" },
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

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="p-4 rounded-lg border bg-blue-50 border-blue-200">
          <p className="text-sm font-medium text-blue-600">Tổng thanh lý</p>
          <p className="text-3xl font-bold text-foreground mt-1">{stats.total}</p>
        </div>
        <div className="p-4 rounded-lg border">
          <p className="text-sm font-medium text-muted-foreground">Nam</p>
          <p className="text-3xl font-bold text-foreground mt-1">{stats.male}</p>
        </div>
        <div className="p-4 rounded-lg border">
          <p className="text-sm font-medium text-muted-foreground">Nữ</p>
          <p className="text-3xl font-bold text-foreground mt-1">{stats.female}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Năm về nước:</span>
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
                <TableHead>Công ty</TableHead>
                <TableHead>Nghiệp đoàn</TableHead>
                <TableHead>Ngành nghề</TableHead>
                <TableHead className="w-28 text-center">Ngày XC</TableHead>
                <TableHead className="w-28 text-center">Ngày về nước</TableHead>
                <TableHead className="w-20 text-center">HĐ (năm)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((t, idx) => (
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
                    {t.company?.name_japanese
                      ? `${t.company.name_japanese}`
                      : t.company?.name || "—"}
                  </TableCell>
                  <TableCell className="text-sm">{t.union?.name || "—"}</TableCell>
                  <TableCell className="text-sm">{t.job_category?.name || "—"}</TableCell>
                  <TableCell className="text-center text-sm">{formatDate(t.departure_date)}</TableCell>
                  <TableCell className="text-center text-sm font-medium text-blue-600">{formatDate(t.return_date)}</TableCell>
                  <TableCell className="text-center text-sm">{t.contract_term || 3}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <div className="text-sm text-muted-foreground">
        Hiển thị {filtered.length} / {trainees?.length || 0} học viên đã thanh lý hợp đồng
      </div>
    </div>
  );
}
