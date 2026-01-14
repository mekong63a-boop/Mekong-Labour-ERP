import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useEducationStats, useTeachers, useClasses } from "@/hooks/useEducation";
import { GraduationCap, Users, BookOpen, Plus, Calendar } from "lucide-react";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { vi } from "date-fns/locale";

export default function EducationDashboard() {
  const { data: stats, isLoading: statsLoading } = useEducationStats();
  const { data: teachers, isLoading: teachersLoading } = useTeachers();
  const { data: classes, isLoading: classesLoading } = useClasses();

  const activeClasses = classes?.filter(c => c.status === "Đang hoạt động") || [];
  const activeTeachers = teachers?.filter(t => t.status === "Đang làm việc") || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Quản lý Đào tạo</h1>
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
          <Button asChild>
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
              <div className="space-y-3">
                {activeClasses.slice(0, 5).map((cls) => (
                  <Link
                    key={cls.id}
                    to={`/education/classes/${cls.id}`}
                    className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                  >
                    <div>
                      <p className="font-medium">{cls.name}</p>
                      <p className="text-sm text-muted-foreground">
                        Mã lớp: {cls.code} • Cấp độ: {cls.level || "N5"}
                      </p>
                    </div>
                    <div className="text-right text-sm text-muted-foreground">
                      <p>{cls.schedule || "—"}</p>
                      <p>{cls.max_students || 0} học viên tối đa</p>
                    </div>
                  </Link>
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
              <div className="space-y-3">
                {activeTeachers.slice(0, 5).map((teacher) => (
                  <div
                    key={teacher.id}
                    className="flex items-center justify-between p-3 rounded-lg border"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-primary font-medium">
                          {teacher.full_name.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium">{teacher.full_name}</p>
                        <p className="text-sm text-muted-foreground">
                          {teacher.specialty || "Tiếng Nhật"}
                        </p>
                      </div>
                    </div>
                    <div className="text-right text-sm text-muted-foreground">
                      <p>{teacher.phone || "—"}</p>
                    </div>
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
