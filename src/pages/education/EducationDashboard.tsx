import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useEducationStats } from "@/hooks/useEducation";
import { GraduationCap, Users, AlertCircle, Clock, BookOpen, UserCheck, UserX } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { format, parseISO } from "date-fns";
import { vi } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// =============================================================================
// SYSTEM RULE: Hook query từ database view education_interview_stats
// Logic tính toán đã nằm ở Supabase, frontend chỉ hiển thị
// =============================================================================
function useInterviewStats() {
  return useQuery({
    queryKey: ["education-interview-stats"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("education_interview_stats")
        .select("*")
        .limit(1)
        .single();

      if (error) throw error;
      
      return {
        passed: { 
          male: data?.passed_male || 0, 
          female: data?.passed_female || 0, 
          total: data?.passed_total || 0 
        },
        notPassed: { 
          male: data?.not_passed_male || 0, 
          female: data?.not_passed_female || 0, 
          total: data?.not_passed_total || 0 
        },
      };
    },
  });
}

// Hook to get absent/late attendance for a specific date
function useAbsentLateAttendance(date: string) {
  return useQuery({
    queryKey: ["absent-late-attendance", date],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("attendance")
        .select(`
          id,
          status,
          notes,
          date,
          trainee_id,
          trainees (
            id,
            trainee_code,
            full_name
          ),
          classes (
            id,
            name,
            code
          )
        `)
        .eq("date", date)
        .in("status", ["late", "excused", "unexcused"]);
      
      if (error) throw error;
      return data || [];
    },
  });
}

export default function EducationDashboard() {
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const { data: stats, isLoading: statsLoading } = useEducationStats();
  const { data: interviewStats, isLoading: interviewStatsLoading } = useInterviewStats();
  const { data: absentLate, isLoading: absentLateLoading } = useAbsentLateAttendance(selectedDate);

  // Interview stats table data - UI formatting only
  const interviewTableData = useMemo(() => {
    if (!interviewStats) return [];
    return [
      {
        label: "Chưa đậu PV",
        male: interviewStats.notPassed.male,
        female: interviewStats.notPassed.female,
        total: interviewStats.notPassed.total,
        icon: UserX,
        color: "text-orange-600",
      },
      {
        label: "Đã đậu PV",
        male: interviewStats.passed.male,
        female: interviewStats.passed.female,
        total: interviewStats.passed.total,
        icon: UserCheck,
        color: "text-green-600",
      },
    ];
  }, [interviewStats]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-primary">Quản lý Đào tạo</h1>
          <p className="text-muted-foreground text-sm">
            Tổng quan giáo viên, lớp học và thống kê học viên
          </p>
        </div>
      </div>

      {/* Stats Cards - Only Teachers and Classes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card 
          className="cursor-pointer hover:border-primary transition-colors"
          onClick={() => navigate("/education/teachers")}
        >
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Tổng số giáo viên
            </CardTitle>
            <Users className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-3xl font-bold">{stats?.totalTeachers || 0}</div>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              Đang làm việc: {stats?.activeTeachers || 0}
            </p>
          </CardContent>
        </Card>

        <Card 
          className="cursor-pointer hover:border-primary transition-colors"
          onClick={() => navigate("/education/classes")}
        >
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Tổng số lớp học
            </CardTitle>
            <GraduationCap className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-3xl font-bold">{stats?.totalClasses || 0}</div>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              Đang hoạt động: {stats?.activeClasses || 0}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Two Column Layout: Interview Stats (Left) + Absent/Late (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Left: Interview Status Statistics Table */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <UserCheck className="h-4 w-4 text-primary" />
              Thống kê số liệu học viên đang học
            </CardTitle>
          </CardHeader>
          <CardContent>
            {interviewStatsLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="w-32">Trạng thái</TableHead>
                    <TableHead className="text-center text-blue-600">Nam</TableHead>
                    <TableHead className="text-center text-pink-600">Nữ</TableHead>
                    <TableHead className="text-center font-bold">Tổng</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {interviewTableData.map((row) => (
                    <TableRow key={row.label}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <row.icon className={`h-4 w-4 ${row.color}`} />
                          {row.label}
                        </div>
                      </TableCell>
                      <TableCell className="text-center text-blue-600 font-medium">{row.male}</TableCell>
                      <TableCell className="text-center text-pink-600 font-medium">{row.female}</TableCell>
                      <TableCell className="text-center font-bold">{row.total}</TableCell>
                    </TableRow>
                  ))}
                  {/* Total row - data từ view, chỉ cộng để hiển thị */}
                  <TableRow className="bg-muted/30 font-bold">
                    <TableCell>Tổng cộng</TableCell>
                    <TableCell className="text-center text-blue-600">
                      {(interviewStats?.passed.male || 0) + (interviewStats?.notPassed.male || 0)}
                    </TableCell>
                    <TableCell className="text-center text-pink-600">
                      {(interviewStats?.passed.female || 0) + (interviewStats?.notPassed.female || 0)}
                    </TableCell>
                    <TableCell className="text-center">
                      {(interviewStats?.passed.total || 0) + (interviewStats?.notPassed.total || 0)}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Right: Absent/Late List */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-orange-500" />
              Danh sách vắng / trễ
            </CardTitle>
            <Input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-36"
            />
          </CardHeader>
          <CardContent>
            {absentLateLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : !absentLate || absentLate.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <BookOpen className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Không có học viên vắng hoặc đi trễ trong ngày {format(parseISO(selectedDate), "dd/MM/yyyy")}</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {absentLate.map((record: any) => (
                  <div
                    key={record.id}
                    className="p-2 rounded-lg border bg-muted/30"
                  >
                    <div className="flex items-center gap-2 flex-wrap">
                      <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                        {record.status === "late" ? (
                          <Clock className="h-3.5 w-3.5 text-yellow-600" />
                        ) : (
                          <AlertCircle className="h-3.5 w-3.5 text-red-500" />
                        )}
                      </div>
                      <span className="font-medium text-sm">{record.trainees?.full_name || "—"}</span>
                      <Badge
                        variant="outline"
                        className={
                          record.status === "late"
                            ? "bg-yellow-50 text-yellow-700 border-yellow-200 text-xs"
                            : record.status === "excused"
                            ? "bg-blue-50 text-blue-700 border-blue-200 text-xs"
                            : "bg-red-50 text-red-700 border-red-200 text-xs"
                        }
                      >
                        {record.status === "late" ? "Trễ" : 
                         record.status === "excused" ? "Có phép" : "Không phép"}
                      </Badge>
                      {record.notes && (
                        <span className="text-sm text-muted-foreground italic">
                          - {record.notes}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground ml-9 mt-0.5">
                      {record.trainees?.trainee_code} • {record.classes?.name || "—"}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
