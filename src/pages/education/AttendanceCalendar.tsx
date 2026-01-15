import { useState, useMemo } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useClass, useClassStudents, useAttendance, useUpsertAttendance, useClasses } from "@/hooks/useEducation";
import { ArrowLeft, ChevronLeft, ChevronRight, Check, X, Clock, Save, RefreshCw } from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, addMonths, subMonths } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const ATTENDANCE_STATUS = [
  { value: "-", label: "-", display: "-", color: "" },
  { value: "present", label: "Có mặt", display: "✓", color: "text-green-600" },
  { value: "excused", label: "Vắng có phép", display: "P", color: "text-blue-500" },
  { value: "unexcused", label: "Vắng không phép", display: "✗", color: "text-red-600" },
  { value: "late", label: "Đi trễ", display: "⏱", color: "text-orange-500" },
];

const DAY_NAMES_SHORT = ["CN", "Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7"];

const MONTHS = [
  "Tháng 1", "Tháng 2", "Tháng 3", "Tháng 4", "Tháng 5", "Tháng 6",
  "Tháng 7", "Tháng 8", "Tháng 9", "Tháng 10", "Tháng 11", "Tháng 12"
];

// Attendance Cell Component with controlled popover
function AttendanceCell({ 
  day, 
  studentId, 
  getAttendanceForDay, 
  handleStatusChange 
}: {
  day: Date;
  studentId: string;
  getAttendanceForDay: (traineeId: string, date: Date) => { status: string; notes?: string } | undefined;
  handleStatusChange: (traineeId: string, date: Date, status: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const record = getAttendanceForDay(studentId, day);
  const dayOfWeek = getDay(day);
  const isWeekend = dayOfWeek === 0;
  const currentStatus = record?.status || "-";

  const handleSelect = (status: string) => {
    handleStatusChange(studentId, day, status);
    setOpen(false);
  };

  return (
    <td
      className={cn(
        "text-center p-0.5 border-r",
        isWeekend && "bg-red-50/50"
      )}
    >
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            className={cn(
              "w-full h-8 rounded flex items-center justify-center text-xs border hover:bg-muted/50 transition-colors",
              currentStatus === "present" && "text-green-600 bg-green-50",
              currentStatus === "excused" && "text-blue-500 bg-blue-50",
              currentStatus === "unexcused" && "text-red-600 bg-red-50",
              currentStatus === "late" && "text-orange-500 bg-orange-50"
            )}
          >
            {currentStatus === "present" && <Check className="h-4 w-4" />}
            {currentStatus === "excused" && <span className="font-bold text-sm">P</span>}
            {currentStatus === "unexcused" && <X className="h-4 w-4" />}
            {currentStatus === "late" && <Clock className="h-4 w-4" />}
            {currentStatus === "-" && <span className="text-muted-foreground">-</span>}
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-1" align="start">
          <div className="flex gap-1">
            {ATTENDANCE_STATUS.filter(s => s.value !== "-").map((status) => (
              <button
                key={status.value}
                onClick={() => handleSelect(status.value)}
                className={cn(
                  "w-10 h-10 rounded-md border-2 flex items-center justify-center transition-all hover:scale-110",
                  status.value === "present" && "bg-green-100 border-green-500 hover:bg-green-200",
                  status.value === "late" && "bg-orange-100 border-orange-500 hover:bg-orange-200",
                  status.value === "excused" && "bg-blue-100 border-blue-500 hover:bg-blue-200",
                  status.value === "unexcused" && "bg-red-100 border-red-500 hover:bg-red-200",
                  currentStatus === status.value && "ring-2 ring-offset-1 ring-primary"
                )}
                title={status.label}
              >
                {status.value === "present" && <Check className="h-5 w-5 text-green-600" />}
                {status.value === "late" && <Clock className="h-5 w-5 text-orange-600" />}
                {status.value === "excused" && <span className="font-bold text-blue-600">P</span>}
                {status.value === "unexcused" && <X className="h-5 w-5 text-red-600" />}
              </button>
            ))}
          </div>
        </PopoverContent>
      </Popover>
    </td>
  );
}

export default function AttendanceCalendar() {
  const { id: classId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [activeTab, setActiveTab] = useState<"daily" | "summary">("daily");
  const [pendingChanges, setPendingChanges] = useState<Map<string, { status: string; notes: string }>>(new Map());
  const monthStr = format(currentMonth, "yyyy-MM");
  
  const { data: classInfo, isLoading: classLoading } = useClass(classId || "");
  const { data: classes } = useClasses();
  const { data: students, isLoading: studentsLoading } = useClassStudents(classId || "");
  const { data: attendance, isLoading: attendanceLoading, refetch } = useAttendance(classId || "", monthStr);
  const upsertAttendance = useUpsertAttendance();
  const { toast } = useToast();

  const daysInMonth = useMemo(() => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    return eachDayOfInterval({ start, end });
  }, [currentMonth]);

  const getAttendanceForDay = (traineeId: string, date: Date) => {
    const dateStr = format(date, "yyyy-MM-dd");
    const key = `${traineeId}_${dateStr}`;
    
    // Check pending changes first
    if (pendingChanges.has(key)) {
      return pendingChanges.get(key);
    }
    
    return attendance?.find(
      (a) => a.trainee_id === traineeId && a.date === dateStr
    );
  };

  const handleStatusChange = (traineeId: string, date: Date, newStatus: string) => {
    const dateStr = format(date, "yyyy-MM-dd");
    const key = `${traineeId}_${dateStr}`;
    const existing = pendingChanges.get(key) || { status: "-", notes: "" };
    
    setPendingChanges(new Map(pendingChanges.set(key, {
      ...existing,
      status: newStatus
    })));
  };

  const handleNotesChange = (traineeId: string, date: Date, notes: string) => {
    const dateStr = format(date, "yyyy-MM-dd");
    const key = `${traineeId}_${dateStr}`;
    const existing = pendingChanges.get(key) || { status: "-", notes: "" };
    
    setPendingChanges(new Map(pendingChanges.set(key, {
      ...existing,
      notes
    })));
  };

  const handleSaveAll = async () => {
    try {
      const promises: Promise<any>[] = [];
      
      pendingChanges.forEach((value, key) => {
        // Key format: "uuid_yyyy-MM-dd" - use underscore to separate trainee_id and date
        const lastUnderscoreIndex = key.lastIndexOf('_');
        const traineeId = key.substring(0, lastUnderscoreIndex);
        const dateStr = key.substring(lastUnderscoreIndex + 1);
        
        if (value.status && value.status !== "-") {
          promises.push(
            upsertAttendance.mutateAsync({
              trainee_id: traineeId,
              class_id: classId!,
              date: dateStr,
              status: value.status,
              notes: value.notes || null,
            })
          );
        }
      });
      
      await Promise.all(promises);
      setPendingChanges(new Map());
      refetch();
      toast({ title: "Đã lưu điểm danh thành công" });
    } catch (error) {
      console.error("Save attendance error:", error);
      toast({ title: "Lỗi khi lưu điểm danh", variant: "destructive" });
    }
  };

  const getTraineeStats = (traineeId: string) => {
    const traineeAttendance = attendance?.filter(a => a.trainee_id === traineeId) || [];
    const presentCount = traineeAttendance.filter(a => a.status === "present").length;
    const lateCount = traineeAttendance.filter(a => a.status === "late").length;
    const excusedCount = traineeAttendance.filter(a => a.status === "excused").length;
    const unexcusedCount = traineeAttendance.filter(a => a.status === "unexcused").length;
    
    // Calculate attendance rate (present + late count as attending)
    const totalDays = presentCount + lateCount + excusedCount + unexcusedCount;
    const attendanceRate = totalDays > 0 
      ? Math.round(((presentCount + lateCount) / totalDays) * 100) 
      : 0;
    
    return { presentCount, lateCount, excusedCount, unexcusedCount, attendanceRate, totalDays };
  };

  const isLoading = classLoading || studentsLoading || attendanceLoading;

  // If no classId, show class selection
  if (!classId) {
    const activeClasses = classes?.filter(c => c.status === "Đang hoạt động") || [];
    
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/education">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-primary">Điểm danh</h1>
            <p className="text-muted-foreground text-sm">Chọn lớp học để điểm danh</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {activeClasses.map((cls) => (
            <div
              key={cls.id}
              onClick={() => navigate(`/education/attendance/${cls.id}`)}
              className="p-4 border rounded-lg hover:border-primary hover:bg-muted/50 cursor-pointer transition-colors"
            >
              <h3 className="font-semibold text-lg">{cls.name}</h3>
              <p className="text-sm text-muted-foreground">
                Mã lớp: {cls.code} • Cấp độ: {cls.level || "N5"}
              </p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/education/attendance">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-primary">Điểm danh</h1>
            <p className="text-primary/80 text-sm">
              {classInfo?.name} ({classInfo?.code})
            </p>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={() => refetch()}>
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        <Button
          variant={activeTab === "daily" ? "default" : "outline"}
          onClick={() => setActiveTab("daily")}
          className={activeTab === "daily" ? "bg-primary text-primary-foreground" : ""}
        >
          Điểm danh theo ngày
        </Button>
        <Button
          variant={activeTab === "summary" ? "default" : "outline"}
          onClick={() => setActiveTab("summary")}
        >
          Thống kê tổng hợp
        </Button>
      </div>

      {/* Month Navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          
          <Select
            value={currentMonth.getMonth().toString()}
            onValueChange={(v) => {
              const newDate = new Date(currentMonth);
              newDate.setMonth(parseInt(v));
              setCurrentMonth(newDate);
            }}
          >
            <SelectTrigger className="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MONTHS.map((month, i) => (
                <SelectItem key={i} value={i.toString()}>{month}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select
            value={currentMonth.getFullYear().toString()}
            onValueChange={(v) => {
              const newDate = new Date(currentMonth);
              newDate.setFullYear(parseInt(v));
              setCurrentMonth(newDate);
            }}
          >
            <SelectTrigger className="w-[100px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[2024, 2025, 2026, 2027].map((year) => (
                <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Button
            variant="outline"
            size="icon"
            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <Button 
          onClick={handleSaveAll} 
          disabled={pendingChanges.size === 0 || upsertAttendance.isPending}
          className="bg-primary text-primary-foreground"
        >
          <Save className="h-4 w-4 mr-2" />
          Lưu điểm danh
        </Button>
      </div>

      {/* Attendance Table */}
      {isLoading ? (
        <div className="space-y-2">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      ) : !students || students.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground border rounded-lg">
          Chưa có học viên nào trong lớp
        </div>
      ) : activeTab === "daily" ? (
        // Daily attendance view with calendar
        <div className="border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/30">
                <tr className="border-b">
                  <th className="text-left p-2 sticky left-0 bg-muted/30 min-w-[60px] border-r">
                    Mã HV
                  </th>
                  <th className="text-left p-2 sticky left-[60px] bg-muted/30 min-w-[140px] border-r">
                    Họ tên
                  </th>
                  {daysInMonth.map((day) => {
                    const dayOfWeek = getDay(day);
                    const isWeekend = dayOfWeek === 0;
                    return (
                      <th
                        key={day.toISOString()}
                        className={cn(
                          "text-center p-1 min-w-[60px] border-r",
                          isWeekend && "bg-red-50 text-red-600"
                        )}
                      >
                        <div className="text-[10px] font-normal">
                          {format(day, "dd")}
                        </div>
                        <div className="text-[10px] text-muted-foreground">
                          {DAY_NAMES_SHORT[dayOfWeek]}
                        </div>
                      </th>
                    );
                  })}
                  <th className="text-center p-2 min-w-[60px] border-r bg-orange-50">
                    Trễ
                  </th>
                  <th className="text-center p-2 min-w-[60px] border-r bg-blue-50">
                    VCP
                  </th>
                  <th className="text-center p-2 min-w-[60px] bg-red-50">
                    VKP
                  </th>
                </tr>
              </thead>
              <tbody>
                {students.map((student) => {
                  const stats = getTraineeStats(student.id);
                  
                  return (
                    <tr key={student.id} className="border-b hover:bg-muted/20">
                      <td className="p-2 sticky left-0 bg-background border-r text-xs text-primary font-medium">
                        {student.trainee_code}
                      </td>
                      <td className="p-2 sticky left-[60px] bg-background border-r">
                        <span className="font-medium text-primary text-sm">
                          {student.full_name}
                        </span>
                      </td>
                      {daysInMonth.map((day) => (
                        <AttendanceCell
                          key={day.toISOString()}
                          day={day}
                          studentId={student.id}
                          getAttendanceForDay={getAttendanceForDay}
                          handleStatusChange={handleStatusChange}
                        />
                      ))}
                      <td className="text-center p-2 border-r bg-orange-50/50">
                        {stats.lateCount > 0 ? (
                          <span className="text-orange-600 font-medium">{stats.lateCount}</span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </td>
                      <td className="text-center p-2 border-r bg-blue-50/50">
                        {stats.excusedCount > 0 ? (
                          <span className="text-blue-600 font-medium">{stats.excusedCount}</span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </td>
                      <td className="text-center p-2 bg-red-50/50">
                        {stats.unexcusedCount > 0 ? (
                          <span className="text-red-600 font-medium">{stats.unexcusedCount}</span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        // Summary statistics view - no calendar, just stats table
        <div className="border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/30">
                <tr className="border-b">
                  <th className="text-left p-3 min-w-[80px] border-r">STT</th>
                  <th className="text-left p-3 min-w-[100px] border-r">Mã HV</th>
                  <th className="text-left p-3 min-w-[180px] border-r">Họ tên</th>
                  <th className="text-center p-3 min-w-[100px] border-r bg-green-50">
                    <div className="flex flex-col items-center">
                      <Check className="h-4 w-4 text-green-600 mb-1" />
                      <span>Có mặt</span>
                    </div>
                  </th>
                  <th className="text-center p-3 min-w-[100px] border-r bg-orange-50">
                    <div className="flex flex-col items-center">
                      <Clock className="h-4 w-4 text-orange-600 mb-1" />
                      <span>Đi trễ</span>
                    </div>
                  </th>
                  <th className="text-center p-3 min-w-[100px] border-r bg-blue-50">
                    <div className="flex flex-col items-center">
                      <span className="text-blue-600 font-bold mb-1">P</span>
                      <span>Vắng CP</span>
                    </div>
                  </th>
                  <th className="text-center p-3 min-w-[100px] border-r bg-red-50">
                    <div className="flex flex-col items-center">
                      <X className="h-4 w-4 text-red-600 mb-1" />
                      <span>Vắng KP</span>
                    </div>
                  </th>
                  <th className="text-center p-3 min-w-[120px] bg-primary/10">
                    <div className="flex flex-col items-center">
                      <span className="text-primary font-bold mb-1">%</span>
                      <span>Tỷ lệ CC</span>
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {students.map((student, index) => {
                  const stats = getTraineeStats(student.id);
                  
                  return (
                    <tr key={student.id} className="border-b hover:bg-muted/20">
                      <td className="p-3 border-r text-center font-medium">
                        {index + 1}
                      </td>
                      <td className="p-3 border-r text-primary font-medium">
                        {student.trainee_code}
                      </td>
                      <td className="p-3 border-r">
                        <span className="font-medium text-primary">
                          {student.full_name}
                        </span>
                      </td>
                      <td className="text-center p-3 border-r bg-green-50/50">
                        <span className="text-green-600 font-bold text-lg">{stats.presentCount}</span>
                      </td>
                      <td className="text-center p-3 border-r bg-orange-50/50">
                        <span className="text-orange-600 font-bold text-lg">{stats.lateCount}</span>
                      </td>
                      <td className="text-center p-3 border-r bg-blue-50/50">
                        <span className="text-blue-600 font-bold text-lg">{stats.excusedCount}</span>
                      </td>
                      <td className="text-center p-3 border-r bg-red-50/50">
                        <span className="text-red-600 font-bold text-lg">{stats.unexcusedCount}</span>
                      </td>
                      <td className="text-center p-3 bg-primary/10">
                        <span className={cn(
                          "font-bold text-xl",
                          stats.attendanceRate >= 80 ? "text-green-600" : 
                          stats.attendanceRate >= 60 ? "text-orange-600" : "text-red-600"
                        )}>
                          {stats.attendanceRate}%
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
