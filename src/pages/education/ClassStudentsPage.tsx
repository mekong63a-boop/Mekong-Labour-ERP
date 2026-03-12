import { useState, useMemo } from "react";
import { Link, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  useClass, 
  useTestScores, 
  useAttendance,
  useClasses 
} from "@/hooks/useEducation";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Search, History, BookOpen, Calendar, Trash2, ArrowRightLeft } from "lucide-react";
import { format, parseISO } from "date-fns";
import { useUserRole } from "@/hooks/useUserRole";
import { useToast } from "@/hooks/use-toast";
import { ExportButtonWithColumns } from "@/components/ui/export-button-with-columns";
import { EXPORT_CONFIGS } from "@/lib/export-configs";

// Test categories for filtering
const TEST_CATEGORIES = [
  { value: "Nhập môn", label: "Nhập môn" },
  { value: "Sơ cấp 1", label: "Sơ cấp 1" },
  { value: "Sơ cấp 2", label: "Sơ cấp 2" },
  { value: "N5", label: "N5" },
  { value: "N4", label: "N4" },
  { value: "N3", label: "N3" },
  { value: "Nghe", label: "Nghe" },
  { value: "Nghe sơ cấp 1", label: "Nghe SC1" },
  { value: "Nghe sơ cấp 2", label: "Nghe SC2" },
];

// BUSINESS RULE: Chỉ học viên có simple_status = "Đang học" mới hiển thị trong danh sách lớp

// Hook to get detailed students with birthplace
// SYSTEM RULE: Chỉ hiển thị học viên có simple_status = "Đang học"
function useClassStudentsDetailed(classId: string) {
  return useQuery({
    queryKey: ["class-students-detailed", classId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("trainees")
        .select("id, trainee_code, full_name, birth_date, birthplace, simple_status, progression_stage")
        .eq("class_id", classId)
        .eq("simple_status", "DangHoc") // Chỉ lấy học viên đang học
        .order("full_name");
      if (error) throw error;
      return data || [];
    },
    enabled: !!classId,
  });
}

// Hook to get enrollment history for a trainee with teacher info, test scores and attendance
function useEnrollmentHistory(traineeId: string) {
  return useQuery({
    queryKey: ["enrollment-history", traineeId],
    queryFn: async () => {
      // First get enrollment history
      const { data: historyData, error: historyError } = await supabase
        .from("enrollment_history")
        .select(`
          id,
          action_type,
          action_date,
          notes,
          class_id,
          from_class_id,
          to_class_id,
          class:classes!enrollment_history_class_id_fkey(id, name),
          from_class:classes!enrollment_history_from_class_id_fkey(id, name),
          to_class:classes!enrollment_history_to_class_id_fkey(id, name)
        `)
        .eq("trainee_id", traineeId)
        .order("action_date", { ascending: true });
      if (historyError) throw historyError;

      // Get all unique class IDs to fetch teachers, test scores and attendance
      const classIds = new Set<string>();
      historyData?.forEach(h => {
        if (h.class_id) classIds.add(h.class_id);
        if (h.from_class_id) classIds.add(h.from_class_id);
        if (h.to_class_id) classIds.add(h.to_class_id);
      });

      // Fetch teachers for all classes
      const teacherMap: Record<string, string[]> = {};
      if (classIds.size > 0) {
        const { data: teacherData } = await supabase
          .from("class_teachers")
          .select(`
            class_id,
            teacher:teachers(full_name)
          `)
          .in("class_id", Array.from(classIds));
        
        teacherData?.forEach(t => {
          if (!teacherMap[t.class_id]) {
            teacherMap[t.class_id] = [];
          }
          if ((t.teacher as any)?.full_name) {
            teacherMap[t.class_id].push((t.teacher as any).full_name);
          }
        });
      }

      // Fetch test scores for this trainee grouped by class
      const { data: testScoresData } = await supabase
        .from("test_scores")
        .select("id, test_name, test_date, score, max_score, evaluation, class_id")
        .eq("trainee_id", traineeId)
        .order("test_date", { ascending: false });
      
      const testScoresByClass: Record<string, any[]> = {};
      testScoresData?.forEach(score => {
        if (!testScoresByClass[score.class_id]) {
          testScoresByClass[score.class_id] = [];
        }
        testScoresByClass[score.class_id].push(score);
      });

      // Fetch attendance for this trainee grouped by class (only late/absent)
      const { data: attendanceData } = await supabase
        .from("attendance")
        .select("id, date, status, notes, class_id")
        .eq("trainee_id", traineeId)
        .not("status", "eq", "present")
        .order("date", { ascending: false });
      
      const attendanceByClass: Record<string, any[]> = {};
      const attendanceStatsByClass: Record<string, { total: number; present: number; late: number; absent: number }> = {};
      attendanceData?.forEach(att => {
        if (!attendanceByClass[att.class_id]) {
          attendanceByClass[att.class_id] = [];
        }
        attendanceByClass[att.class_id].push(att);
      });
      
      // Also get attendance stats (count all including present)
      const { data: allAttendanceData } = await supabase
        .from("attendance")
        .select("class_id, status")
        .eq("trainee_id", traineeId);
      
      allAttendanceData?.forEach(att => {
        if (!attendanceStatsByClass[att.class_id]) {
          attendanceStatsByClass[att.class_id] = { total: 0, present: 0, late: 0, absent: 0 };
        }
        attendanceStatsByClass[att.class_id].total++;
        if (att.status === "present") attendanceStatsByClass[att.class_id].present++;
        else if (att.status === "late") attendanceStatsByClass[att.class_id].late++;
        else attendanceStatsByClass[att.class_id].absent++;
      });

      // Merge teacher info, test scores and attendance into history
      return historyData?.map(h => ({
        ...h,
        class_teachers: h.class_id ? teacherMap[h.class_id] || [] : [],
        from_class_teachers: h.from_class_id ? teacherMap[h.from_class_id] || [] : [],
        to_class_teachers: h.to_class_id ? teacherMap[h.to_class_id] || [] : [],
        // Add test scores and attendance for from_class (when transferring)
        from_class_test_scores: h.from_class_id ? testScoresByClass[h.from_class_id] || [] : [],
        from_class_attendance: h.from_class_id ? attendanceByClass[h.from_class_id] || [] : [],
        from_class_attendance_stats: h.from_class_id ? attendanceStatsByClass[h.from_class_id] : null,
        // Add for to_class (destination class when transferring)
        to_class_test_scores: h.to_class_id ? testScoresByClass[h.to_class_id] || [] : [],
        to_class_attendance: h.to_class_id ? attendanceByClass[h.to_class_id] || [] : [],
        to_class_attendance_stats: h.to_class_id ? attendanceStatsByClass[h.to_class_id] : null,
        // Add for class_id (when entering/leaving)
        class_test_scores: h.class_id ? testScoresByClass[h.class_id] || [] : [],
        class_attendance: h.class_id ? attendanceByClass[h.class_id] || [] : [],
        class_attendance_stats: h.class_id ? attendanceStatsByClass[h.class_id] : null,
      }));
    },
    enabled: !!traineeId,
  });
}

// Hook to get total learning days from attendance
function useTotalLearningDays(traineeId: string) {
  return useQuery({
    queryKey: ["total-learning-days", traineeId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("attendance")
        .select("date, status")
        .eq("trainee_id", traineeId)
        .order("date", { ascending: true });
      if (error) throw error;
      
      if (!data || data.length === 0) {
        return { totalDays: 0, presentDays: 0, firstDate: null, lastDate: null };
      }

      const presentDays = data.filter(a => 
        a.status === "present" || a.status === "late"
      ).length;

      const dates = data.map(a => a.date).sort();
      
      return {
        totalDays: data.length,
        presentDays,
        firstDate: dates[0],
        lastDate: dates[dates.length - 1],
      };
    },
    enabled: !!traineeId,
  });
}

// Calculate attendance rate for a student
function calculateAttendanceRate(
  attendance: any[] | undefined,
  traineeId: string
): number | null {
  if (!attendance || attendance.length === 0) return null;
  
  const studentAttendance = attendance.filter(a => a.trainee_id === traineeId);
  if (studentAttendance.length === 0) return null;
  
  const present = studentAttendance.filter(a => 
    a.status === "present" || a.status === "late"
  ).length;
  
  return Math.round((present / studentAttendance.length) * 100);
}

// Get the most recent test score for a student, filtered by category
// Format test_name: "Môn học - Bài X" (e.g., "Nhập môn - Bài 1", "Nghe sơ cấp 1 - Bài 5")
function getLatestScore(
  testScores: any[] | undefined,
  traineeId: string,
  category: string
): { score: number; testName: string; lessonNumber: number } | null {
  if (!testScores || testScores.length === 0) return null;
  
  let studentScores = testScores.filter(s => s.trainee_id === traineeId && s.score !== null);
  
  // Filter by exact category match: "Category - Bài X"
  // This prevents "Nghe" from matching "Nghe sơ cấp 1" or "Nghe sơ cấp 2"
  if (category) {
    studentScores = studentScores.filter(s => {
      if (!s.test_name) return false;
      // Must match exactly: "Category - Bài X"
      return s.test_name.startsWith(`${category} - `);
    });
  }
  
  if (studentScores.length === 0) return null;
  
  // Extract lesson number from test_name (e.g., "Nhập môn - Bài 5" -> 5)
  const getLessonNumber = (testName: string): number => {
    const match = testName.match(/Bài\s*(\d+)/i);
    return match ? parseInt(match[1], 10) : 0;
  };
  
  // Sort by lesson number descending (higher lesson = more recent progress)
  // Then by created_at for same lesson
  studentScores.sort((a, b) => {
    const lessonA = getLessonNumber(a.test_name || "");
    const lessonB = getLessonNumber(b.test_name || "");
    
    // Primary sort: higher lesson number = more recent
    if (lessonB !== lessonA) {
      return lessonB - lessonA;
    }
    
    // Secondary sort: more recent created_at
    const createdA = new Date(a.created_at).getTime();
    const createdB = new Date(b.created_at).getTime();
    return createdB - createdA;
  });
  
  const latest = studentScores[0];
  return {
    score: latest.score,
    testName: latest.test_name,
    lessonNumber: getLessonNumber(latest.test_name || ""),
  };
}

// Get grade based on score (0-100 scale: A=90-100, B=70-89, C=60-69, D=40-59, E=0-39)
// Score is always on a 0-100 scale
function getGrade(scoreData: { score: number; testName: string; lessonNumber: number } | null): { 
  label: string; 
  color: string; 
  testName?: string;
  lessonNumber?: number;
  score?: number;
} {
  if (scoreData === null) return { label: "—", color: "bg-muted text-muted-foreground" };
  
  // Score is directly on 0-100 scale, no need to calculate percentage
  const score = scoreData.score;
  
  if (score >= 90) return { label: "A", color: "bg-green-100 text-green-700", testName: scoreData.testName, lessonNumber: scoreData.lessonNumber, score };
  if (score >= 70) return { label: "B", color: "bg-blue-100 text-blue-700", testName: scoreData.testName, lessonNumber: scoreData.lessonNumber, score };
  if (score >= 60) return { label: "C", color: "bg-yellow-100 text-yellow-700", testName: scoreData.testName, lessonNumber: scoreData.lessonNumber, score };
  if (score >= 40) return { label: "D", color: "bg-orange-100 text-orange-700", testName: scoreData.testName, lessonNumber: scoreData.lessonNumber, score };
  return { label: "E", color: "bg-red-100 text-red-700", testName: scoreData.testName, lessonNumber: scoreData.lessonNumber, score };
}

// Get attendance badge
function getAttendanceBadge(rate: number | null): { label: string; color: string } {
  if (rate === null) return { label: "—", color: "bg-muted text-muted-foreground" };
  if (rate >= 95) return { label: `${rate}%`, color: "bg-green-100 text-green-700" };
  if (rate >= 80) return { label: `${rate}%`, color: "bg-yellow-100 text-yellow-700" };
  return { label: `${rate}%`, color: "bg-red-100 text-red-700" };
}

export default function ClassStudentsPage() {
  const { classId } = useParams<{ classId: string }>();
  const { data: classData, isLoading: classLoading } = useClass(classId || "");
  const { data: allClasses } = useClasses();
  const { data: students, isLoading: studentsLoading, refetch: refetchStudents } = useClassStudentsDetailed(classId || "");
  const { data: testScores } = useTestScores(classId || "");
  const { isAdmin } = useUserRole();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Get attendance for all time (last 6 months for performance)
  const currentMonth = format(new Date(), "yyyy-MM");
  const { data: attendance } = useAttendance(classId || "", currentMonth);
  
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTrainee, setSelectedTrainee] = useState<any>(null);
  const [isHistoryDialogOpen, setIsHistoryDialogOpen] = useState(false);
  const [gradeCategory, setGradeCategory] = useState("Nhập môn");
  const [traineeToRemove, setTraineeToRemove] = useState<any>(null);
  const [isRemoving, setIsRemoving] = useState(false);
  
  // Transfer class state
  const [isTransferDialogOpen, setIsTransferDialogOpen] = useState(false);
  const [traineeToTransfer, setTraineeToTransfer] = useState<any>(null);
  const [targetClassId, setTargetClassId] = useState("");
  const [transferNotes, setTransferNotes] = useState("");
  const [isTransferring, setIsTransferring] = useState(false);
  
  const { data: enrollmentHistory, isLoading: historyLoading } = useEnrollmentHistory(
    selectedTrainee?.id || ""
  );
  const { data: learningDays, isLoading: learningDaysLoading } = useTotalLearningDays(
    selectedTrainee?.id || ""
  );
  
  // Get available classes for transfer (exclude current class)
  const availableClassesForTransfer = useMemo(() => {
    if (!allClasses || !classId) return [];
    return allClasses.filter(c => c.id !== classId && c.status === "Đang hoạt động");
  }, [allClasses, classId]);

  // Handle remove trainee from class (admin only)
  const handleRemoveFromClass = async () => {
    if (!traineeToRemove || !isAdmin) return;
    
    setIsRemoving(true);
    try {
      // Update trainee to remove from class
      const { error: updateError } = await supabase
        .from("trainees")
        .update({ class_id: null })
        .eq("id", traineeToRemove.id);
      
      if (updateError) throw updateError;
      
      // Log enrollment history
      const { error: historyError } = await supabase
        .from("enrollment_history")
        .insert({
          trainee_id: traineeToRemove.id,
          action_type: "Rời lớp",
          class_id: classId,
          notes: "Học viên bị xóa khỏi lớp bởi Admin"
        });
      
      if (historyError) console.error("Error logging history:", historyError);
      
      toast({
        title: "Đã xóa học viên khỏi lớp",
        description: `${traineeToRemove.full_name} đã được xóa khỏi lớp học.`,
      });
      
      // Refresh data
      refetchStudents();
      queryClient.invalidateQueries({ queryKey: ["class-students"] });
      queryClient.invalidateQueries({ queryKey: ["available-trainees"] });
      
    } catch (error: any) {
      toast({
        title: "Lỗi khi xóa học viên",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsRemoving(false);
      setTraineeToRemove(null);
    }
  };

  // Handle transfer trainee to another class
  const handleTransferClass = async () => {
    if (!traineeToTransfer || !targetClassId || !classId) return;
    
    setIsTransferring(true);
    try {
      const targetClass = availableClassesForTransfer.find(c => c.id === targetClassId);
      
      // 1. Update trainee to new class
      const { error: updateError } = await supabase
        .from("trainees")
        .update({ class_id: targetClassId })
        .eq("id", traineeToTransfer.id);
      
      if (updateError) throw updateError;
      
      // 2. Log enrollment history with full info (class name, teacher names)
      const { error: historyError } = await supabase
        .from("enrollment_history")
        .insert({
          trainee_id: traineeToTransfer.id,
          action_type: "Chuyển lớp",
          from_class_id: classId,
          to_class_id: targetClassId,
          notes: transferNotes || `Chuyển từ ${classData?.name} sang ${targetClass?.name}`
        });
      
      if (historyError) console.error("Error logging history:", historyError);
      
      toast({
        title: "Chuyển lớp thành công",
        description: `${traineeToTransfer.full_name} đã được chuyển sang lớp ${targetClass?.name}.`,
      });
      
      // Refresh data
      refetchStudents();
      queryClient.invalidateQueries({ queryKey: ["class-students"] });
      queryClient.invalidateQueries({ queryKey: ["classes"] });
      queryClient.invalidateQueries({ queryKey: ["enrollment-history"] });
      
    } catch (error: any) {
      toast({
        title: "Lỗi khi chuyển lớp",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsTransferring(false);
      setIsTransferDialogOpen(false);
      setTraineeToTransfer(null);
      setTargetClassId("");
      setTransferNotes("");
    }
  };

  const openTransferDialog = (trainee: any) => {
    setTraineeToTransfer(trainee);
    setTargetClassId("");
    setTransferNotes("");
    setIsTransferDialogOpen(true);
  };

  const filteredStudents = useMemo(() => {
    if (!students) return [];
    if (!searchQuery) return students;
    
    const query = searchQuery.toLowerCase();
    return students.filter(s => 
      s.full_name.toLowerCase().includes(query) ||
      s.trainee_code.toLowerCase().includes(query)
    );
  }, [students, searchQuery]);

  const isLoading = classLoading || studentsLoading;

  const openHistoryDialog = (trainee: any) => {
    setSelectedTrainee(trainee);
    setIsHistoryDialogOpen(true);
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "—";
    try {
      return format(parseISO(dateStr), "dd/MM/yyyy");
    } catch {
      return "—";
    }
  };

  const getProgressionBadge = (stage: string | null) => {
    const colorMap: Record<string, string> = {
      "Chưa đậu": "bg-gray-100 text-gray-600",
      "Đậu phỏng vấn": "bg-green-100 text-green-700",
      "Nộp hồ sơ": "bg-blue-100 text-blue-700",
      "OTIT": "bg-yellow-100 text-yellow-700",
      "Nyukan": "bg-purple-100 text-purple-700",
      "COE": "bg-orange-100 text-orange-700",
      "Visa": "bg-pink-100 text-pink-700",
      "Xuất cảnh": "bg-indigo-100 text-indigo-700",
    };
    return colorMap[stage || ""] || "bg-muted text-muted-foreground";
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/education/classes">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-xl font-bold text-primary">Danh sách học viên</h1>
            {classData && (
              <p className="text-sm text-muted-foreground">
                {classData.name} - {students?.length || 0} học viên
              </p>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <ExportButtonWithColumns
            menuKey="education"
            tableName="trainees"
            allColumns={EXPORT_CONFIGS.class_students.columns}
            fileName={`${EXPORT_CONFIGS.class_students.fileName}-${classData?.code || 'class'}`}
            selectQuery="trainee_code, full_name, birth_date, birthplace, simple_status, progression_stage"
            filters={{ class_id: classId || '' }}
            title={`Xuất danh sách học viên - ${classData?.name || ''}`}
          />
          <Button variant="outline" asChild>
            <Link to={`/education/classes/${classId}/attendance`}>
              <Calendar className="mr-2 h-4 w-4" />
              Điểm danh
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to={`/education/classes/${classId}/test-scores`}>
              <BookOpen className="mr-2 h-4 w-4" />
              Điểm kiểm tra
            </Link>
          </Button>
        </div>
      </div>

      {/* Search and Category Tabs */}
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <div className="relative max-w-md flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Tìm theo tên hoặc mã học viên..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        
        {/* Category Tabs for Sức học */}
        <Tabs value={gradeCategory} onValueChange={setGradeCategory} className="w-auto">
          <TabsList className="h-8">
            {TEST_CATEGORIES.map((cat) => (
              <TabsTrigger 
                key={cat.value} 
                value={cat.value}
                className="text-xs px-2 py-1 h-6"
              >
                {cat.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      {/* Students Table */}
      {isLoading ? (
        <div className="space-y-2">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      ) : !filteredStudents || filteredStudents.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground border rounded-lg">
          {searchQuery ? "Không tìm thấy học viên phù hợp" : "Lớp chưa có học viên nào"}
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="w-20">Mã HV</TableHead>
                <TableHead>Họ và tên</TableHead>
                <TableHead className="w-28">Ngày sinh</TableHead>
                <TableHead>Quê quán</TableHead>
                <TableHead className="w-28">Tình trạng</TableHead>
                <TableHead className="w-24 text-center">Sức học</TableHead>
                <TableHead className="w-24 text-center">Chuyên cần</TableHead>
                <TableHead className="w-20 text-center">Lịch sử</TableHead>
                <TableHead className="w-24 text-center">Chuyển lớp</TableHead>
                {isAdmin && <TableHead className="w-16 text-center">Xóa</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredStudents.map((student) => {
                const latestScore = getLatestScore(testScores, student.id, gradeCategory);
                const attendanceRate = calculateAttendanceRate(attendance, student.id);
                const grade = getGrade(latestScore);
                const attendanceBadge = getAttendanceBadge(attendanceRate);

                return (
                  <TableRow key={student.id} className="hover:bg-muted/30">
                    <TableCell className="font-mono text-sm">{student.trainee_code}</TableCell>
                    <TableCell className="font-medium">{student.full_name}</TableCell>
                    <TableCell className="text-sm">{formatDate(student.birth_date)}</TableCell>
                    <TableCell className="text-sm">{student.birthplace || "—"}</TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={getProgressionBadge(student.progression_stage)}
                      >
                        {student.progression_stage || "Chưa đậu"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge 
                        className={`${grade.color} cursor-help`} 
                        title={grade.testName ? `${grade.testName} - Điểm: ${grade.score}` : "Chưa có điểm"}
                      >
                        {grade.lessonNumber ? `${grade.label}${grade.lessonNumber}` : grade.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge className={attendanceBadge.color}>
                        {attendanceBadge.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openHistoryDialog(student)}
                        title="Xem lịch sử nhập học"
                      >
                        <History className="h-4 w-4" />
                      </Button>
                    </TableCell>
                    <TableCell className="text-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openTransferDialog(student)}
                        title="Chuyển lớp"
                        className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                      >
                        <ArrowRightLeft className="h-4 w-4" />
                      </Button>
                    </TableCell>
                    {isAdmin && (
                      <TableCell className="text-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setTraineeToRemove(student)}
                          title="Xóa học viên khỏi lớp"
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    )}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Enrollment History Dialog */}
      <Dialog open={isHistoryDialogOpen} onOpenChange={setIsHistoryDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[85vh]">
          <DialogHeader>
            <DialogTitle>Lịch sử học tập chi tiết</DialogTitle>
            <DialogDescription>
              {selectedTrainee?.trainee_code} - {selectedTrainee?.full_name}
            </DialogDescription>
          </DialogHeader>
          
          {/* Summary Stats */}
          {!learningDaysLoading && learningDays && learningDays.firstDate && (
            <div className="bg-muted/50 rounded-lg p-4 space-y-2">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Ngày bắt đầu học:</span>
                  <span className="ml-2 font-medium">{formatDate(learningDays.firstDate)}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Ngày gần nhất:</span>
                  <span className="ml-2 font-medium">{formatDate(learningDays.lastDate)}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Tổng buổi điểm danh:</span>
                  <span className="ml-2 font-medium text-primary">{learningDays.totalDays} buổi</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Số buổi có mặt:</span>
                  <span className="ml-2 font-medium text-green-600">{learningDays.presentDays} buổi</span>
                </div>
              </div>
            </div>
          )}

          <ScrollArea className="h-[500px]">
            {historyLoading || learningDaysLoading ? (
              <div className="space-y-2 p-4">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : !enrollmentHistory || enrollmentHistory.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                Chưa có lịch sử nhập học
              </div>
            ) : (
              <div className="relative pl-6 space-y-0">
                {/* Timeline line */}
                <div className="absolute left-2 top-3 bottom-3 w-0.5 bg-border" />
                
                {enrollmentHistory.map((history, index) => {
                  // For transfers: show to_class (current/destination class) data
                  // For other actions (nhập học, etc.): show class data
                  const classTestScores = history.to_class_id 
                    ? history.to_class_test_scores 
                    : history.class_test_scores;
                  const classAttendance = history.to_class_id 
                    ? history.to_class_attendance 
                    : history.class_attendance;
                  const classAttendanceStats = history.to_class_id 
                    ? history.to_class_attendance_stats 
                    : history.class_attendance_stats;
                  
                  return (
                    <div key={history.id} className="relative pb-6">
                      {/* Timeline dot */}
                      <div className={`absolute -left-4 w-3 h-3 rounded-full border-2 border-background ${
                        index === enrollmentHistory.length - 1 ? "bg-primary" : "bg-muted-foreground"
                      }`} />
                      
                      <div className="ml-4 bg-muted/30 rounded-lg p-3 space-y-3">
                        <div className="flex items-center justify-between mb-1">
                          <Badge variant="outline" className="font-medium">
                            {history.action_type}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {formatDate(history.action_date)}
                          </span>
                        </div>
                        
                        {/* Transfer between classes */}
                        {history.from_class && history.to_class && (
                          <div className="text-sm space-y-1">
                            <p className="text-muted-foreground">
                              <span className="font-medium">{(history.from_class as any)?.name}</span>
                              {history.from_class_teachers && history.from_class_teachers.length > 0 && (
                                <span className="text-xs"> (GV: {history.from_class_teachers.join(", ")})</span>
                              )}
                            </p>
                            <p className="text-primary">→</p>
                            <p className="text-muted-foreground">
                              <span className="font-medium">{(history.to_class as any)?.name}</span>
                              {history.to_class_teachers && history.to_class_teachers.length > 0 && (
                                <span className="text-xs"> (GV: {history.to_class_teachers.join(", ")})</span>
                              )}
                            </p>
                          </div>
                        )}
                        
                        {/* Single class entry */}
                        {history.class && !history.from_class && (
                          <p className="text-sm text-muted-foreground">
                            Lớp: <span className="font-medium">{(history.class as any)?.name}</span>
                            {history.class_teachers && history.class_teachers.length > 0 && (
                              <span className="text-xs ml-1">(GV: {history.class_teachers.join(", ")})</span>
                            )}
                          </p>
                        )}

                        {/* Attendance Stats for this class */}
                        {classAttendanceStats && classAttendanceStats.total > 0 && (
                          <div className="bg-background/50 rounded p-2 text-xs">
                            <div className="flex items-center gap-2 mb-1">
                              <Calendar className="h-3 w-3 text-muted-foreground" />
                              <span className="font-medium">Điểm danh:</span>
                              <span className="text-green-600">{classAttendanceStats.present + classAttendanceStats.late} có mặt</span>
                              {classAttendanceStats.late > 0 && (
                                <span className="text-yellow-600">({classAttendanceStats.late} trễ)</span>
                              )}
                              {classAttendanceStats.absent > 0 && (
                                <span className="text-red-600">{classAttendanceStats.absent} vắng</span>
                              )}
                              <span className="text-muted-foreground">/ {classAttendanceStats.total} buổi</span>
                            </div>
                            
                            {/* Show late/absent details */}
                            {classAttendance && classAttendance.length > 0 && (
                              <div className="mt-2 space-y-1 pl-5">
                                {classAttendance.slice(0, 5).map((att: any) => (
                                  <div key={att.id} className="flex items-center gap-2 text-xs">
                                    <span>{formatDate(att.date)}</span>
                                    <Badge 
                                      variant="outline" 
                                      className={
                                        att.status === "late" ? "bg-yellow-50 text-yellow-700 border-yellow-200" 
                                        : att.status === "excused" ? "bg-blue-50 text-blue-700 border-blue-200"
                                        : att.status === "unexcused" ? "bg-red-50 text-red-700 border-red-200"
                                        : "bg-red-50 text-red-700 border-red-200"
                                      }
                                    >
                                      {att.status === "late" ? "Đi trễ" : att.status === "excused" ? "Nghỉ có phép" : att.status === "unexcused" ? "Nghỉ không phép" : "Vắng"}
                                    </Badge>
                                    {att.notes && <span className="text-muted-foreground italic">{att.notes}</span>}
                                  </div>
                                ))}
                                {classAttendance.length > 5 && (
                                  <span className="text-muted-foreground italic">
                                    và {classAttendance.length - 5} buổi khác...
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        )}

                        {/* Test Scores for this class */}
                        {classTestScores && classTestScores.length > 0 && (
                          <div className="bg-background/50 rounded p-2 text-xs">
                            <div className="flex items-center gap-2 mb-2">
                              <BookOpen className="h-3 w-3 text-muted-foreground" />
                              <span className="font-medium">Điểm kiểm tra & Đánh giá:</span>
                            </div>
                            <div className="space-y-1 pl-5">
                              {classTestScores.slice(0, 8).map((score: any) => (
                                <div key={score.id} className="flex items-center justify-between gap-2 text-xs border-b border-border/50 pb-1">
                                  <div className="flex items-center gap-2">
                                    <span className="text-muted-foreground">{formatDate(score.test_date)}</span>
                                    <span className="font-medium">{score.test_name}</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Badge variant="outline" className="text-xs">
                                      {score.score !== null ? `${score.score}/${score.max_score}` : "—"}
                                    </Badge>
                                    {score.evaluation && (
                                      <span className="text-primary font-medium">{score.evaluation}</span>
                                    )}
                                  </div>
                                </div>
                              ))}
                              {classTestScores.length > 8 && (
                                <span className="text-muted-foreground italic">
                                  và {classTestScores.length - 8} bài khác...
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                        
                        {history.notes && (
                          <p className="text-sm italic text-muted-foreground border-t pt-2">{history.notes}</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Remove Trainee Confirmation Dialog */}
      <AlertDialog open={!!traineeToRemove} onOpenChange={() => setTraineeToRemove(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xóa học viên khỏi lớp</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn xóa học viên <strong>{traineeToRemove?.full_name}</strong> ({traineeToRemove?.trainee_code}) khỏi lớp học này?
              <br /><br />
              Hành động này sẽ được ghi vào lịch sử nhập học của học viên.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isRemoving}>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemoveFromClass}
              disabled={isRemoving}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isRemoving ? "Đang xóa..." : "Xác nhận xóa"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Transfer Class Dialog */}
      <Dialog open={isTransferDialogOpen} onOpenChange={setIsTransferDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Chuyển lớp học viên</DialogTitle>
            <DialogDescription>
              {traineeToTransfer?.trainee_code} - {traineeToTransfer?.full_name}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="bg-muted/50 rounded-lg p-3 text-sm">
              <p className="text-muted-foreground">Lớp hiện tại:</p>
              <p className="font-medium">{classData?.name}</p>
            </div>
            
            <div className="space-y-2">
              <Label>Chuyển sang lớp *</Label>
              <Select value={targetClassId} onValueChange={setTargetClassId}>
                <SelectTrigger>
                  <SelectValue placeholder="Chọn lớp đích" />
                </SelectTrigger>
                <SelectContent>
                  {availableClassesForTransfer.map((cls) => (
                    <SelectItem key={cls.id} value={cls.id}>
                      {cls.name} ({cls.current_students}/{cls.max_students || 50} học viên)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {availableClassesForTransfer.length === 0 && (
                <p className="text-sm text-muted-foreground">Không có lớp nào khả dụng để chuyển</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label>Ghi chú (tùy chọn)</Label>
              <Textarea
                placeholder="Lý do chuyển lớp..."
                value={transferNotes}
                onChange={(e) => setTransferNotes(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsTransferDialogOpen(false)}
              disabled={isTransferring}
            >
              Hủy
            </Button>
            <Button 
              onClick={handleTransferClass}
              disabled={isTransferring || !targetClassId}
            >
              {isTransferring ? "Đang chuyển..." : "Xác nhận chuyển"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}