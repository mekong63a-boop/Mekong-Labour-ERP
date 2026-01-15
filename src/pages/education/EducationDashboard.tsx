import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useEducationStats } from "@/hooks/useEducation";
import { GraduationCap, Users, BookOpen, Calendar, AlertCircle, Clock } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { format, parseISO } from "date-fns";
import { vi } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

// Hook to get trainee gender stats for education
function useTraineeGenderStats() {
  return useQuery({
    queryKey: ["trainee-gender-stats"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("trainees")
        .select("id, gender, class_id, progression_stage");
      
      if (error) throw error;
      
      // Currently studying (has class_id)
      const studying = data?.filter(t => t.class_id) || [];
      const studyingMale = studying.filter(t => t.gender === "Nam").length;
      const studyingFemale = studying.filter(t => t.gender === "Nữ").length;
      
      // Passed interview
      const passed = data?.filter(t => 
        t.progression_stage && t.progression_stage !== "Chưa đậu"
      ) || [];
      const passedMale = passed.filter(t => t.gender === "Nam").length;
      const passedFemale = passed.filter(t => t.gender === "Nữ").length;
      
      // Not passed interview
      const notPassed = data?.filter(t => 
        !t.progression_stage || t.progression_stage === "Chưa đậu"
      ) || [];
      const notPassedMale = notPassed.filter(t => t.gender === "Nam").length;
      const notPassedFemale = notPassed.filter(t => t.gender === "Nữ").length;
      
      return {
        studying: { male: studyingMale, female: studyingFemale, total: studying.length },
        passed: { male: passedMale, female: passedFemale, total: passed.length },
        notPassed: { male: notPassedMale, female: notPassedFemale, total: notPassed.length },
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
  const { data: genderStats, isLoading: genderStatsLoading } = useTraineeGenderStats();
  const { data: absentLate, isLoading: absentLateLoading } = useAbsentLateAttendance(selectedDate);

  const chartData = [
    {
      name: "Đang học",
      Nam: genderStats?.studying.male || 0,
      Nữ: genderStats?.studying.female || 0,
    },
    {
      name: "Đậu PV",
      Nam: genderStats?.passed.male || 0,
      Nữ: genderStats?.passed.female || 0,
    },
    {
      name: "Chưa đậu PV",
      Nam: genderStats?.notPassed.male || 0,
      Nữ: genderStats?.notPassed.female || 0,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header - Removed top navigation buttons */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-primary">Quản lý Đào tạo</h1>
          <p className="text-muted-foreground text-sm">
            Tổng quan giáo viên, lớp học và điểm danh
          </p>
        </div>
      </div>

      {/* Stats Cards - Clickable to navigate */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Lớp học hôm nay
            </CardTitle>
            <Calendar className="h-5 w-5 text-secondary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats?.activeClasses || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {format(new Date(), "EEEE, dd/MM", { locale: vi })}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Điểm danh
            </CardTitle>
            <BookOpen className="h-5 w-5 text-green-600" />
          </CardHeader>
          <CardContent>
            <Button variant="outline" size="sm" className="w-full" asChild>
              <Link to="/education/attendance">
                Xem điểm danh
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Gender Statistics Chart - Compact */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Thống kê học viên theo giới tính</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            {/* Compact Chart */}
            <div className="flex-1">
              {genderStatsLoading ? (
                <Skeleton className="h-32 w-full" />
              ) : (
                <ResponsiveContainer width="100%" height={140}>
                  <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} width={30} />
                    <Tooltip 
                      formatter={(value, name) => [value, name === "Nam" ? "Nam" : "Nữ"]}
                      contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 12 }}
                    />
                    <Bar dataKey="Nam" fill="hsl(210, 70%, 50%)" radius={[2, 2, 0, 0]} />
                    <Bar dataKey="Nữ" fill="hsl(340, 70%, 60%)" radius={[2, 2, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
            {/* Compact Stats */}
            <div className="flex flex-col gap-2 min-w-[180px]">
              <div className="p-2 bg-muted/50 rounded-lg flex justify-between items-center">
                <span className="text-xs text-muted-foreground">Đang học</span>
                <span className="font-bold text-sm">
                  {genderStats?.studying.total || 0}
                  <span className="text-xs font-normal text-muted-foreground ml-1">
                    (<span className="text-blue-600">♂{genderStats?.studying.male || 0}</span>/<span className="text-pink-600">♀{genderStats?.studying.female || 0}</span>)
                  </span>
                </span>
              </div>
              <div className="p-2 bg-green-50 rounded-lg flex justify-between items-center">
                <span className="text-xs text-muted-foreground">Đậu PV</span>
                <span className="font-bold text-sm text-green-600">
                  {genderStats?.passed.total || 0}
                  <span className="text-xs font-normal text-muted-foreground ml-1">
                    (<span className="text-blue-600">♂{genderStats?.passed.male || 0}</span>/<span className="text-pink-600">♀{genderStats?.passed.female || 0}</span>)
                  </span>
                </span>
              </div>
              <div className="p-2 bg-orange-50 rounded-lg flex justify-between items-center">
                <span className="text-xs text-muted-foreground">Chưa đậu</span>
                <span className="font-bold text-sm text-orange-600">
                  {genderStats?.notPassed.total || 0}
                  <span className="text-xs font-normal text-muted-foreground ml-1">
                    (<span className="text-blue-600">♂{genderStats?.notPassed.male || 0}</span>/<span className="text-pink-600">♀{genderStats?.notPassed.female || 0}</span>)
                  </span>
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Absent/Late List with Date Filter */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-orange-500" />
            Danh sách vắng / trễ
          </CardTitle>
          <div className="flex items-center gap-2">
            <Input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-40"
            />
          </div>
        </CardHeader>
        <CardContent>
          {absentLateLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : !absentLate || absentLate.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <BookOpen className="h-10 w-10 mx-auto mb-2 opacity-50" />
              <p>Không có học viên vắng hoặc đi trễ trong ngày {format(parseISO(selectedDate), "dd/MM/yyyy")}</p>
            </div>
          ) : (
            <div className="space-y-2">
              {absentLate.map((record: any) => (
                <div
                  key={record.id}
                  className="flex items-center justify-between p-3 rounded-lg border bg-muted/30"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                      {record.status === "late" ? (
                        <Clock className="h-5 w-5 text-yellow-600" />
                      ) : (
                        <AlertCircle className="h-5 w-5 text-red-500" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-sm">{record.trainees?.full_name || "—"}</p>
                      <p className="text-xs text-muted-foreground">
                        {record.trainees?.trainee_code} • {record.classes?.name || "—"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge
                      variant="outline"
                      className={
                        record.status === "late"
                          ? "bg-yellow-50 text-yellow-700 border-yellow-200"
                          : record.status === "excused"
                          ? "bg-blue-50 text-blue-700 border-blue-200"
                          : "bg-red-50 text-red-700 border-red-200"
                      }
                    >
                      {record.status === "late" ? "Đi trễ" : 
                       record.status === "excused" ? "Vắng có phép" : "Vắng không phép"}
                    </Badge>
                    {record.notes && (
                      <span className="text-xs text-muted-foreground max-w-[150px] truncate" title={record.notes}>
                        {record.notes}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
