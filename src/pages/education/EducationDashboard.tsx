import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useEducationStats, useTeachers, useClasses } from "@/hooks/useEducation";
import { GraduationCap, Users, BookOpen, Calendar, MoreHorizontal } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, Cell } from "recharts";

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

export default function EducationDashboard() {
  const navigate = useNavigate();
  const { data: stats, isLoading: statsLoading } = useEducationStats();
  const { data: teachers, isLoading: teachersLoading } = useTeachers();
  const { data: classes, isLoading: classesLoading } = useClasses();
  const { data: genderStats, isLoading: genderStatsLoading } = useTraineeGenderStats();

  const activeClasses = classes?.filter(c => c.status === "Đang hoạt động") || [];
  const activeTeachers = teachers?.filter(t => t.status === "Đang làm việc") || [];

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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-primary">Quản lý Đào tạo</h1>
          <p className="text-muted-foreground text-sm">
            Tổng quan giáo viên, lớp học và điểm danh
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link to="/education/teachers">
              <Users className="mr-2 h-4 w-4" />
              Giáo viên
            </Link>
          </Button>
          <Button asChild className="bg-primary">
            <Link to="/education/classes">
              <GraduationCap className="mr-2 h-4 w-4" />
              Lớp học
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
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

        <Card>
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
            <div className="text-3xl font-bold">{activeClasses.length}</div>
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

      {/* Gender Statistics Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Thống kê học viên theo giới tính</CardTitle>
        </CardHeader>
        <CardContent>
          {genderStatsLoading ? (
            <Skeleton className="h-64 w-full" />
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip 
                  formatter={(value, name) => [value, name === "Nam" ? "Nam" : "Nữ"]}
                  contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0" }}
                />
                <Legend />
                <Bar dataKey="Nam" fill="hsl(210, 70%, 50%)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Nữ" fill="hsl(340, 70%, 60%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
          <div className="grid grid-cols-3 gap-4 mt-4 text-center">
            <div className="p-3 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground">Đang học</p>
              <p className="text-xl font-bold">{genderStats?.studying.total || 0}</p>
              <p className="text-xs text-muted-foreground">
                <span className="text-blue-600">♂ {genderStats?.studying.male || 0}</span>
                {" / "}
                <span className="text-pink-600">♀ {genderStats?.studying.female || 0}</span>
              </p>
            </div>
            <div className="p-3 bg-green-50 rounded-lg">
              <p className="text-sm text-muted-foreground">Đậu PV</p>
              <p className="text-xl font-bold text-green-600">{genderStats?.passed.total || 0}</p>
              <p className="text-xs text-muted-foreground">
                <span className="text-blue-600">♂ {genderStats?.passed.male || 0}</span>
                {" / "}
                <span className="text-pink-600">♀ {genderStats?.passed.female || 0}</span>
              </p>
            </div>
            <div className="p-3 bg-orange-50 rounded-lg">
              <p className="text-sm text-muted-foreground">Chưa đậu PV</p>
              <p className="text-xl font-bold text-orange-600">{genderStats?.notPassed.total || 0}</p>
              <p className="text-xs text-muted-foreground">
                <span className="text-blue-600">♂ {genderStats?.notPassed.male || 0}</span>
                {" / "}
                <span className="text-pink-600">♀ {genderStats?.notPassed.female || 0}</span>
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Active Classes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Lớp đang hoạt động</CardTitle>
            <Button size="sm" variant="ghost" asChild>
              <Link to="/education/classes">Xem tất cả</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {classesLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : activeClasses.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">
                Chưa có lớp học nào
              </p>
            ) : (
              <div className="space-y-2">
                {activeClasses.slice(0, 5).map((cls) => (
                  <div
                    key={cls.id}
                    onClick={() => navigate(`/education/attendance/${cls.id}`)}
                    className="flex items-center justify-between p-3 rounded-lg border hover:border-primary hover:bg-muted/50 transition-colors cursor-pointer"
                  >
                    <div>
                      <p className="font-semibold text-foreground">{cls.name}</p>
                      <p className="text-sm text-muted-foreground">
                        Mã lớp: {cls.code} • Cấp độ: {cls.level || "N5"}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <span className="text-lg font-bold text-primary">
                          {cls.current_students || 0}/{cls.max_students || 50}
                        </span>
                        <p className="text-xs text-muted-foreground">học viên</p>
                      </div>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Giáo viên</CardTitle>
            <Button size="sm" variant="ghost" asChild>
              <Link to="/education/teachers">Xem tất cả</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {teachersLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : activeTeachers.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">
                Chưa có giáo viên nào
              </p>
            ) : (
              <div className="space-y-2">
                {activeTeachers.slice(0, 5).map((teacher) => (
                  <div
                    key={teacher.id}
                    className="flex items-center justify-between p-3 rounded-lg border"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10 bg-primary/10 border-2 border-primary/20">
                        <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                          {teacher.full_name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-semibold text-foreground uppercase">{teacher.full_name}</p>
                        <p className="text-sm text-muted-foreground">
                          {teacher.specialty || "Tiếng Nhật"}
                        </p>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
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
