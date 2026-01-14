import { useState, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useClass, useClassStudents, useAttendance, useUpsertAttendance } from "@/hooks/useEducation";
import { ArrowLeft, ChevronLeft, ChevronRight, Check, X, Clock, AlertCircle } from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, addMonths, subMonths } from "date-fns";
import { vi } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const ATTENDANCE_STATUS = [
  { value: "present", label: "Có mặt", icon: Check, color: "bg-green-500" },
  { value: "excused", label: "Vắng có phép", icon: Clock, color: "bg-yellow-500" },
  { value: "unexcused", label: "Vắng không phép", icon: X, color: "bg-red-500" },
  { value: "late", label: "Đi trễ", icon: AlertCircle, color: "bg-orange-500" },
];

export default function AttendanceCalendar() {
  const { id: classId } = useParams<{ id: string }>();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const monthStr = format(currentMonth, "yyyy-MM");
  
  const { data: classInfo, isLoading: classLoading } = useClass(classId || "");
  const { data: students, isLoading: studentsLoading } = useClassStudents(classId || "");
  const { data: attendance, isLoading: attendanceLoading } = useAttendance(classId || "", monthStr);
  const upsertAttendance = useUpsertAttendance();
  const { toast } = useToast();

  const daysInMonth = useMemo(() => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    return eachDayOfInterval({ start, end });
  }, [currentMonth]);

  const weekdays = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];

  const getAttendanceForDay = (traineeId: string, date: Date) => {
    const dateStr = format(date, "yyyy-MM-dd");
    return attendance?.find(
      (a) => a.trainee_id === traineeId && a.date === dateStr
    );
  };

  const handleAttendanceClick = async (traineeId: string, date: Date, currentStatus: string | null) => {
    const statuses = ["present", "excused", "unexcused", "late"];
    const currentIndex = currentStatus ? statuses.indexOf(currentStatus) : -1;
    const nextStatus = statuses[(currentIndex + 1) % statuses.length];
    
    try {
      await upsertAttendance.mutateAsync({
        trainee_id: traineeId,
        class_id: classId!,
        date: format(date, "yyyy-MM-dd"),
        status: nextStatus,
      });
    } catch (error) {
      toast({ title: "Lỗi khi cập nhật điểm danh", variant: "destructive" });
    }
  };

  const getStatusIcon = (status: string | null) => {
    const statusConfig = ATTENDANCE_STATUS.find((s) => s.value === status);
    if (!statusConfig) return null;
    const Icon = statusConfig.icon;
    return <Icon className="h-3 w-3" />;
  };

  const getStatusColor = (status: string | null) => {
    const statusConfig = ATTENDANCE_STATUS.find((s) => s.value === status);
    return statusConfig?.color || "bg-muted";
  };

  const isLoading = classLoading || studentsLoading || attendanceLoading;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/education/classes">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Điểm danh</h1>
            <p className="text-muted-foreground text-sm">
              {classInfo?.name || "Đang tải..."} • {classInfo?.code}
            </p>
          </div>
        </div>
      </div>

      {/* Month Navigation */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-4">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="min-w-40 text-center">
                {format(currentMonth, "MMMM yyyy", { locale: vi })}
              </span>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </CardTitle>
            <div className="flex gap-2">
              {ATTENDANCE_STATUS.map((status) => (
                <div key={status.value} className="flex items-center gap-1 text-xs">
                  <div className={cn("h-3 w-3 rounded", status.color)} />
                  <span>{status.label}</span>
                </div>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : !students || students.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              Chưa có học viên nào trong lớp
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2 sticky left-0 bg-background min-w-40">
                      Học viên
                    </th>
                    {daysInMonth.map((day) => {
                      const dayOfWeek = getDay(day);
                      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
                      return (
                        <th
                          key={day.toISOString()}
                          className={cn(
                            "text-center p-1 min-w-8",
                            isWeekend && "bg-muted/50"
                          )}
                        >
                          <div className="text-[10px] text-muted-foreground">
                            {weekdays[dayOfWeek]}
                          </div>
                          <div className="font-medium">{format(day, "d")}</div>
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody>
                  {students.map((student) => (
                    <tr key={student.id} className="border-b hover:bg-muted/30">
                      <td className="p-2 sticky left-0 bg-background">
                        <div>
                          <p className="font-medium">{student.full_name}</p>
                          <p className="text-xs text-muted-foreground">
                            {student.trainee_code}
                          </p>
                        </div>
                      </td>
                      {daysInMonth.map((day) => {
                        const record = getAttendanceForDay(student.id, day);
                        const dayOfWeek = getDay(day);
                        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
                        
                        return (
                          <td
                            key={day.toISOString()}
                            className={cn(
                              "text-center p-1",
                              isWeekend && "bg-muted/50"
                            )}
                          >
                            <button
                              onClick={() => handleAttendanceClick(student.id, day, record?.status || null)}
                              className={cn(
                                "h-6 w-6 rounded flex items-center justify-center text-white transition-colors",
                                record?.status ? getStatusColor(record.status) : "bg-muted hover:bg-muted-foreground/20"
                              )}
                              disabled={upsertAttendance.isPending}
                            >
                              {getStatusIcon(record?.status || null)}
                            </button>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
