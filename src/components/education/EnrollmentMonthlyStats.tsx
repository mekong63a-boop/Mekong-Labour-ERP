import { useState } from "react";
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
import { BarChart3, TrendingUp, TrendingDown, Minus, UserPlus, Calendar } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { vi } from "date-fns/locale";

const currentYear = new Date().getFullYear();
const years = Array.from({ length: 5 }, (_, i) => currentYear - i);
const months = Array.from({ length: 12 }, (_, i) => i + 1);

function useEnrollmentMonthlyStats(year: number) {
  return useQuery({
    queryKey: ["enrollment-monthly-stats", year],
    queryFn: async () => {
      const startDate = `${year}-01-01`;
      const endDate = `${year}-12-31`;

      const { data, error } = await supabase
        .from("enrollment_history")
        .select("id, action_date, action_type, trainee_id")
        .eq("action_type", "enroll")
        .gte("action_date", startDate)
        .lte("action_date", endDate);

      if (error) throw error;

      const stats = months.map((m) => {
        const monthStr = String(m).padStart(2, "0");
        const count = (data || []).filter(
          (r) => r.action_date?.startsWith(`${year}-${monthStr}`)
        ).length;
        return { month: m, count };
      });

      return stats;
    },
  });
}

function useEnrollmentMonthlyTrainees(year: number, month: number) {
  return useQuery({
    queryKey: ["enrollment-monthly-trainees", year, month],
    queryFn: async () => {
      const monthStr = String(month).padStart(2, "0");
      const startDate = `${year}-${monthStr}-01`;
      const endDate = `${year}-${monthStr}-31`;

      const { data, error } = await supabase
        .from("enrollment_history")
        .select(`
          id, action_date, action_type, notes,
          trainee:trainees(id, trainee_code, full_name),
          class:classes!enrollment_history_class_id_fkey(id, name, code)
        `)
        .eq("action_type", "enroll")
        .gte("action_date", startDate)
        .lte("action_date", endDate)
        .order("action_date", { ascending: false });

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

export default function EnrollmentMonthlyStats() {
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [detailMonth, setDetailMonth] = useState(0);

  const { data: stats, isLoading } = useEnrollmentMonthlyStats(selectedYear);
  const { data: detailTrainees, isLoading: detailLoading } = useEnrollmentMonthlyTrainees(
    selectedYear, detailMonth
  );

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-primary" />
              Thống kê nhập học theo tháng
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
                    <TableHead className="text-center">Số nhập học</TableHead>
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
                            onClick={() => setDetailMonth(row.month)}
                          >
                            {row.count}
                          </button>
                        </TableCell>
                        <TableCell className="text-center">
                          <PercentBadge current={row.count} previous={prev?.count || 0} />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  <TableRow className="bg-muted/30 font-bold">
                    <TableCell>Tổng</TableCell>
                    <TableCell className="text-center text-primary">
                      {(stats || []).reduce((s, r) => s + r.count, 0)}
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
                <UserPlus className="h-4 w-4 text-green-600" />
                Danh sách nhập học — Tháng {detailMonth}/{selectedYear}
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
                      <TableHead>Lớp</TableHead>
                      <TableHead>Ngày nhập học</TableHead>
                      <TableHead>Ghi chú</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {detailTrainees.map((r: any) => (
                      <TableRow key={r.id}>
                        <TableCell className="font-mono text-xs">{r.trainee?.trainee_code || "—"}</TableCell>
                        <TableCell className="font-medium">{r.trainee?.full_name || "—"}</TableCell>
                        <TableCell>{r.class?.name || "—"}</TableCell>
                        <TableCell className="text-sm">{r.action_date}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{r.notes || "—"}</TableCell>
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
