import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart3, TrendingUp, TrendingDown, Minus, UserPlus, LogOut, Calendar } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format, parseISO } from "date-fns";
import { vi } from "date-fns/locale";

const currentYear = new Date().getFullYear();
const years = Array.from({ length: 5 }, (_, i) => currentYear - i);
const months = Array.from({ length: 12 }, (_, i) => i + 1);

function useDormitoryMonthlyStats(year: number) {
  return useQuery({
    queryKey: ["dormitory-monthly-stats", year],
    queryFn: async () => {
      // Get all check-in records for the year
      const startDate = `${year}-01-01`;
      const endDate = `${year}-12-31`;

      const { data: checkIns, error: e1 } = await supabase
        .from("dormitory_residents")
        .select("id, check_in_date, trainee_id")
        .gte("check_in_date", startDate)
        .lte("check_in_date", endDate);

      if (e1) throw e1;

      const { data: checkOuts, error: e2 } = await supabase
        .from("dormitory_residents")
        .select("id, check_out_date, trainee_id")
        .not("check_out_date", "is", null)
        .gte("check_out_date", startDate)
        .lte("check_out_date", endDate);

      if (e2) throw e2;

      // Aggregate by month
      const stats = months.map((m) => {
        const monthStr = String(m).padStart(2, "0");
        const inCount = (checkIns || []).filter(
          (r) => r.check_in_date?.startsWith(`${year}-${monthStr}`)
        ).length;
        const outCount = (checkOuts || []).filter(
          (r) => r.check_out_date?.startsWith(`${year}-${monthStr}`)
        ).length;
        return { month: m, checkIn: inCount, checkOut: outCount };
      });

      return stats;
    },
  });
}

function useDormitoryMonthlyTrainees(year: number, month: number, type: "in" | "out") {
  return useQuery({
    queryKey: ["dormitory-monthly-trainees", year, month, type],
    queryFn: async () => {
      const monthStr = String(month).padStart(2, "0");
      const startDate = `${year}-${monthStr}-01`;
      const endDate = `${year}-${monthStr}-31`;

      const dateCol = type === "in" ? "check_in_date" : "check_out_date";

      let query = supabase
        .from("dormitory_residents")
        .select(`
          id, check_in_date, check_out_date, room_number, bed_number, status, transfer_reason,
          trainee:trainees(id, trainee_code, full_name),
          dormitory:dormitories!dormitory_residents_dormitory_id_fkey(id, name)
        `)
        .gte(dateCol, startDate)
        .lte(dateCol, endDate)
        .order(dateCol, { ascending: false });

      if (type === "out") {
        query = query.not("check_out_date", "is", null);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    enabled: month > 0,
  });
}

function PercentBadge({ current, previous }: { current: number; previous: number }) {
  if (previous === 0 && current === 0) return <Minus className="h-3.5 w-3.5 text-muted-foreground" />;
  if (previous === 0) return <Badge className="bg-green-100 text-green-700 hover:bg-green-100 text-xs">Mới</Badge>;

  const pct = Math.round(((current - previous) / previous) * 100);
  if (pct === 0) return <Minus className="h-3.5 w-3.5 text-muted-foreground" />;

  return pct > 0 ? (
    <Badge className="bg-green-100 text-green-700 hover:bg-green-100 text-xs gap-0.5">
      <TrendingUp className="h-3 w-3" />+{pct}%
    </Badge>
  ) : (
    <Badge className="bg-red-100 text-red-700 hover:bg-red-100 text-xs gap-0.5">
      <TrendingDown className="h-3 w-3" />{pct}%
    </Badge>
  );
}

export default function DormitoryMonthlyStats() {
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [detailMonth, setDetailMonth] = useState(0);
  const [detailType, setDetailType] = useState<"in" | "out">("in");

  const { data: stats, isLoading } = useDormitoryMonthlyStats(selectedYear);
  const { data: detailTrainees, isLoading: detailLoading } = useDormitoryMonthlyTrainees(
    selectedYear, detailMonth, detailType
  );

  const showDetail = (month: number, type: "in" | "out") => {
    setDetailMonth(month);
    setDetailType(type);
  };

  const monthName = (m: number) =>
    format(new Date(2024, m - 1, 1), "MMM", { locale: vi });

  return (
    <div className="space-y-4">
      {/* Monthly stats table */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-primary" />
              Thống kê vào/ra KTX theo tháng
            </CardTitle>
            <Select value={String(selectedYear)} onValueChange={(v) => { setSelectedYear(Number(v)); setDetailMonth(0); }}>
              <SelectTrigger className="w-28">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {years.map((y) => (
                  <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="w-20">Tháng</TableHead>
                    <TableHead className="text-center">Vào KTX</TableHead>
                    <TableHead className="text-center">So tháng trước</TableHead>
                    <TableHead className="text-center">Ra KTX</TableHead>
                    <TableHead className="text-center">So tháng trước</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(stats || []).map((row, idx) => {
                    const prev = idx > 0 ? stats![idx - 1] : null;
                    return (
                      <TableRow key={row.month}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-1.5">
                            <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                            T{row.month}
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <button
                            className="text-primary font-semibold hover:underline cursor-pointer"
                            onClick={() => showDetail(row.month, "in")}
                          >
                            {row.checkIn}
                          </button>
                        </TableCell>
                        <TableCell className="text-center">
                          <PercentBadge current={row.checkIn} previous={prev?.checkIn || 0} />
                        </TableCell>
                        <TableCell className="text-center">
                          <button
                            className="text-destructive font-semibold hover:underline cursor-pointer"
                            onClick={() => showDetail(row.month, "out")}
                          >
                            {row.checkOut}
                          </button>
                        </TableCell>
                        <TableCell className="text-center">
                          <PercentBadge current={row.checkOut} previous={prev?.checkOut || 0} />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {/* Total row */}
                  <TableRow className="bg-muted/30 font-bold">
                    <TableCell>Tổng</TableCell>
                    <TableCell className="text-center text-primary">
                      {(stats || []).reduce((s, r) => s + r.checkIn, 0)}
                    </TableCell>
                    <TableCell />
                    <TableCell className="text-center text-destructive">
                      {(stats || []).reduce((s, r) => s + r.checkOut, 0)}
                    </TableCell>
                    <TableCell />
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detail list */}
      {detailMonth > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                {detailType === "in" ? (
                  <UserPlus className="h-4 w-4 text-green-600" />
                ) : (
                  <LogOut className="h-4 w-4 text-red-600" />
                )}
                {detailType === "in" ? "Danh sách vào KTX" : "Danh sách ra KTX"} — Tháng {detailMonth}/{selectedYear}
              </CardTitle>
              <button
                className="text-sm text-muted-foreground hover:text-foreground"
                onClick={() => setDetailMonth(0)}
              >
                Đóng ✕
              </button>
            </div>
          </CardHeader>
          <CardContent>
            {detailLoading ? (
              <Skeleton className="h-20 w-full" />
            ) : !detailTrainees || detailTrainees.length === 0 ? (
              <p className="text-center text-muted-foreground py-4">Không có dữ liệu</p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Mã HV</TableHead>
                      <TableHead>Họ tên</TableHead>
                      <TableHead>KTX</TableHead>
                      <TableHead>Phòng</TableHead>
                      <TableHead>{detailType === "in" ? "Ngày vào" : "Ngày ra"}</TableHead>
                      <TableHead>Trạng thái</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {detailTrainees.map((r: any) => (
                      <TableRow key={r.id}>
                        <TableCell className="font-mono text-xs">{r.trainee?.trainee_code || "—"}</TableCell>
                        <TableCell className="font-medium">{r.trainee?.full_name || "—"}</TableCell>
                        <TableCell>{r.dormitory?.name || "—"}</TableCell>
                        <TableCell>{r.room_number || "—"}{r.bed_number ? ` / ${r.bed_number}` : ""}</TableCell>
                        <TableCell className="text-sm">
                          {detailType === "in"
                            ? r.check_in_date
                            : r.check_out_date || "—"}
                        </TableCell>
                        <TableCell>
                          <Badge variant={r.status === "Đang ở" ? "default" : "secondary"}>
                            {r.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
