import { useState, useMemo } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
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
import { ArrowLeft, ChevronLeft, ChevronRight, Check, X, Clock, Save, RefreshCw, RotateCcw, AlertCircle } from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, addMonths, subMonths, isAfter, startOfDay, isSameDay } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { useUserRole } from "@/hooks/useUserRole";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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

// Attendance Cell Component with controlled popover and role-based editing
function AttendanceCell({ 
  day, 
  studentId, 
  getAttendanceForDay, 
  handleStatusChange,
  handleNotesChange,
  canEdit,
}: {
  day: Date;
  studentId: string;
  getAttendanceForDay: (traineeId: string, date: Date) => { status: string; notes?: string | null } | undefined;
  handleStatusChange: (traineeId: string, date: Date, status: string) => void;
  handleNotesChange: (traineeId: string, date: Date, notes: string) => void;
  canEdit: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [noteInput, setNoteInput] = useState("");
  const record = getAttendanceForDay(studentId, day);
  const dayOfWeek = getDay(day);
  const isWeekend = dayOfWeek === 0;
  const currentStatus = record?.status || "-";
  const currentNotes = record?.notes || "";

  const handleSelect = (status: string) => {
    handleStatusChange(studentId, day, status);
    // Keep open if status needs notes
    if (status !== "present" && status !== "-") {
      // Don't close - allow user to add notes
    } else {
      setOpen(false);
    }
  };

  const handleReset = () => {
    handleStatusChange(studentId, day, "-");
    handleNotesChange(studentId, day, "");
    setNoteInput("");
    setOpen(false);
  };

  const handleSaveNotes = () => {
    handleNotesChange(studentId, day, noteInput);
    setOpen(false);
  };

  // Sync noteInput with currentNotes when opening
  const handleOpenChange = (isOpen: boolean) => {
    if (isOpen) {
      setNoteInput(currentNotes);
    }
    setOpen(isOpen);
  };

  // If cannot edit, just show status without popover
  if (!canEdit) {
    return (
      <td
        className={cn(
          "text-center p-0.5 border-r",
          isWeekend && "bg-red-50/50"
        )}
      >
        <div
          className={cn(
            "w-full h-8 rounded flex items-center justify-center text-xs border",
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
        </div>
        {currentNotes && (
          <div className="text-[8px] text-muted-foreground truncate px-0.5 max-w-[50px]" title={currentNotes}>
            {currentNotes}
          </div>
        )}
      </td>
    );
  }

  return (
    <td
      className={cn(
        "text-center p-0.5 border-r",
        isWeekend && "bg-red-50/50"
      )}
    >
      <Popover open={open} onOpenChange={handleOpenChange}>
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
        <PopoverContent className="w-56 p-2" align="start">
          <div className="space-y-2">
            {/* Status buttons */}
            <div className="flex gap-1">
              {ATTENDANCE_STATUS.filter(s => s.value !== "-").map((status) => (
                <button
                  key={status.value}
                  onClick={() => handleSelect(status.value)}
                  className={cn(
                    "flex-1 h-10 rounded-md border-2 flex items-center justify-center transition-all hover:scale-105",
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
            
            {/* Notes input for late/absent */}
            {(currentStatus === "late" || currentStatus === "excused" || currentStatus === "unexcused") && (
              <div className="space-y-1">
                <Input
                  placeholder={currentStatus === "late" ? "Lý do đi trễ..." : "Lý do vắng..."}
                  value={noteInput}
                  onChange={(e) => setNoteInput(e.target.value)}
                  className="h-8 text-xs"
                />
                <Button 
                  size="sm" 
                  className="w-full h-7 text-xs"
                  onClick={handleSaveNotes}
                >
                  Lưu ghi chú
                </Button>
              </div>
            )}
            
            {/* Reset button */}
            {currentStatus !== "-" && (
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full h-7 text-xs text-muted-foreground"
                onClick={handleReset}
              >
                <RotateCcw className="h-3 w-3 mr-1" />
                Xóa điểm danh
              </Button>
            )}
          </div>
        </PopoverContent>
      </Popover>
      {currentNotes && (
        <div className="text-[8px] text-muted-foreground truncate px-0.5 max-w-[50px]" title={currentNotes}>
          {currentNotes}
        </div>
      )}
    </td>
  );
}

// Absent/Late List Component
function AbsentLateList({ 
  students, 
  attendance, 
  daysInMonth 
}: { 
  students: Array<{ id: string; trainee_code: string; full_name: string }>;
  attendance: Array<{ trainee_id: string; date: string; status: string; notes: string | null }>;
  daysInMonth: Date[];
}) {
  const absentLateRecords = useMemo(() => {
    const records: Array<{
      trainee: typeof students[0];
      date: string;
      status: string;
      notes: string | null;
    }> = [];

    attendance.forEach(record => {
      if (record.status === "late" || record.status === "excused" || record.status === "unexcused") {
        const trainee = students.find(s => s.id === record.trainee_id);
        if (trainee) {
          records.push({
            trainee,
            date: record.date,
            status: record.status,
            notes: record.notes,
          });
        }
      }
    });

    // Sort by date descending
    return records.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [attendance, students]);

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "late": return "Đi trễ";
      case "excused": return "Vắng có phép";
      case "unexcused": return "Vắng không phép";
      default: return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "late": return "bg-orange-100 text-orange-700 border-orange-300";
      case "excused": return "bg-blue-100 text-blue-700 border-blue-300";
      case "unexcused": return "bg-red-100 text-red-700 border-red-300";
      default: return "bg-muted";
    }
  };

  if (absentLateRecords.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground border rounded-lg bg-green-50">
        <Check className="h-12 w-12 mx-auto text-green-500 mb-2" />
        <p className="font-medium text-green-700">Tuyệt vời! Không có học viên vắng hoặc đi trễ trong tháng này.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Late Records */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Clock className="h-5 w-5 text-orange-500" />
            Đi trễ ({absentLateRecords.filter(r => r.status === "late").length})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 max-h-[400px] overflow-y-auto">
          {absentLateRecords.filter(r => r.status === "late").length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">Không có</p>
          ) : (
            absentLateRecords.filter(r => r.status === "late").map((record, idx) => (
              <div key={idx} className="p-2 bg-orange-50 rounded-lg border border-orange-200">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium text-sm">{record.trainee.full_name}</p>
                    <p className="text-xs text-muted-foreground">{record.trainee.trainee_code}</p>
                  </div>
                  <span className="text-xs bg-orange-200 px-2 py-0.5 rounded">
                    {format(new Date(record.date), "dd/MM")}
                  </span>
                </div>
                {record.notes && (
                  <p className="text-xs mt-1 text-orange-700 italic">Lý do: {record.notes}</p>
                )}
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Absent Records */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <X className="h-5 w-5 text-red-500" />
            Vắng ({absentLateRecords.filter(r => r.status === "excused" || r.status === "unexcused").length})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 max-h-[400px] overflow-y-auto">
          {absentLateRecords.filter(r => r.status === "excused" || r.status === "unexcused").length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">Không có</p>
          ) : (
            absentLateRecords.filter(r => r.status === "excused" || r.status === "unexcused").map((record, idx) => (
              <div 
                key={idx} 
                className={cn(
                  "p-2 rounded-lg border",
                  record.status === "excused" ? "bg-blue-50 border-blue-200" : "bg-red-50 border-red-200"
                )}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium text-sm">{record.trainee.full_name}</p>
                    <p className="text-xs text-muted-foreground">{record.trainee.trainee_code}</p>
                  </div>
                  <div className="flex gap-1 items-center">
                    <span className={cn(
                      "text-xs px-2 py-0.5 rounded",
                      record.status === "excused" ? "bg-blue-200" : "bg-red-200"
                    )}>
                      {record.status === "excused" ? "CP" : "KP"}
                    </span>
                    <span className="text-xs bg-muted px-2 py-0.5 rounded">
                      {format(new Date(record.date), "dd/MM")}
                    </span>
                  </div>
                </div>
                {record.notes && (
                  <p className={cn(
                    "text-xs mt-1 italic",
                    record.status === "excused" ? "text-blue-700" : "text-red-700"
                  )}>
                    Lý do: {record.notes}
                  </p>
                )}
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function AttendanceCalendar() {
  const { id: classId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [activeTab, setActiveTab] = useState<"daily" | "summary" | "absent-late">("daily");
  const [pendingChanges, setPendingChanges] = useState<Map<string, { status: string; notes: string }>>(new Map());
  const monthStr = format(currentMonth, "yyyy-MM");
  
  const { isAdmin, isTeacher } = useUserRole();
  const today = startOfDay(new Date());
  
  const { data: classInfo, isLoading: classLoading } = useClass(classId || "");
  const { data: classes } = useClasses();
  const { data: students, isLoading: studentsLoading } = useClassStudents(classId || "");
  const { data: attendance, isLoading: attendanceLoading, refetch } = useAttendance(classId || "", monthStr);
  const upsertAttendance = useUpsertAttendance();
  const { toast } = useToast();

  // Check if can edit a specific day (admin can edit any day, teacher only today)
  const canEditDay = (day: Date) => {
    if (isAdmin) return true;
    if (isTeacher) return isSameDay(day, today);
    return true; // staff/manager can edit any day
  };

  // Only show days up to today (not future days)
  const daysInMonth = useMemo(() => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    const today = startOfDay(new Date());
    const allDays = eachDayOfInterval({ start, end });
    
    // Filter to only show days up to today
    return allDays.filter(day => !isAfter(startOfDay(day), today));
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

  // Get list of absent/late records for the current month
  const getAbsentLateList = useMemo(() => {
    if (!attendance || !students) return [];
    
    const absentLateRecords: Array<{
      trainee: typeof students[0];
      date: string;
      status: string;
      notes: string | null;
    }> = [];

    attendance.forEach(record => {
      if (record.status === "late" || record.status === "excused" || record.status === "unexcused") {
        const trainee = students.find(s => s.id === record.trainee_id);
        if (trainee) {
          absentLateRecords.push({
            trainee,
            date: record.date,
            status: record.status,
            notes: record.notes,
          });
        }
      }
    });

    // Sort by date descending
    return absentLateRecords.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [attendance, students]);

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
      <div className="flex gap-2 flex-wrap">
        <Button
          variant={activeTab === "daily" ? "default" : "outline"}
          onClick={() => setActiveTab("daily")}
          className={activeTab === "daily" ? "bg-primary text-primary-foreground" : ""}
          size="sm"
        >
          Điểm danh theo ngày
        </Button>
        <Button
          variant={activeTab === "summary" ? "default" : "outline"}
          onClick={() => setActiveTab("summary")}
          size="sm"
        >
          Thống kê tổng hợp
        </Button>
        <Button
          variant={activeTab === "absent-late" ? "default" : "outline"}
          onClick={() => setActiveTab("absent-late")}
          size="sm"
          className={activeTab === "absent-late" ? "bg-orange-500 text-white hover:bg-orange-600" : ""}
        >
          <AlertCircle className="h-4 w-4 mr-1" />
          Vắng/Trễ
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
      ) : activeTab === "absent-late" ? (
        // Absent/Late list view
        <AbsentLateList 
          students={students} 
          attendance={attendance || []} 
          daysInMonth={daysInMonth}
        />
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
                          handleNotesChange={handleNotesChange}
                          canEdit={canEditDay(day)}
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
