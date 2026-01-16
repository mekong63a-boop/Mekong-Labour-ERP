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
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  useClass, 
  useTestScores, 
  useAttendance 
} from "@/hooks/useEducation";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Search, History, BookOpen, Calendar } from "lucide-react";
import { format, parseISO } from "date-fns";

// Test categories for filtering
const TEST_CATEGORIES = [
  { value: "all", label: "Tất cả" },
  { value: "Nhập môn", label: "Nhập môn" },
  { value: "Sơ cấp 1", label: "Sơ cấp 1" },
  { value: "Sơ cấp 2", label: "Sơ cấp 2" },
  { value: "N5", label: "N5" },
  { value: "N4", label: "N4" },
  { value: "N3", label: "N3" },
];

// Hook to get detailed students with birthplace
function useClassStudentsDetailed(classId: string) {
  return useQuery({
    queryKey: ["class-students-detailed", classId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("trainees")
        .select("id, trainee_code, full_name, birth_date, birthplace, progression_stage")
        .eq("class_id", classId)
        .order("full_name");
      if (error) throw error;
      return data;
    },
    enabled: !!classId,
  });
}

// Hook to get enrollment history for a trainee with teacher info
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
          class:classes!enrollment_history_class_id_fkey(id, name, code),
          from_class:classes!enrollment_history_from_class_id_fkey(id, name, code),
          to_class:classes!enrollment_history_to_class_id_fkey(id, name, code)
        `)
        .eq("trainee_id", traineeId)
        .order("action_date", { ascending: true });
      if (historyError) throw historyError;

      // Get all unique class IDs to fetch teachers
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

      // Merge teacher info into history
      return historyData?.map(h => ({
        ...h,
        class_teachers: h.class_id ? teacherMap[h.class_id] || [] : [],
        from_class_teachers: h.from_class_id ? teacherMap[h.from_class_id] || [] : [],
        to_class_teachers: h.to_class_id ? teacherMap[h.to_class_id] || [] : [],
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
function getLatestScore(
  testScores: any[] | undefined,
  traineeId: string,
  category: string = "all"
): { score: number; testName: string } | null {
  if (!testScores || testScores.length === 0) return null;
  
  let studentScores = testScores.filter(s => s.trainee_id === traineeId && s.score !== null);
  
  // Filter by category if specified
  if (category && category !== "all") {
    studentScores = studentScores.filter(s => 
      s.test_name && s.test_name.startsWith(category)
    );
  }
  
  if (studentScores.length === 0) return null;
  
  // Extract lesson number from test_name (e.g., "Nhập môn - Bài 5" -> 5)
  const getLessonNumber = (testName: string): number => {
    const match = testName.match(/Bài\s*(\d+)/i);
    return match ? parseInt(match[1], 10) : 0;
  };
  
  // Sort by:
  // 1. created_at descending (most recent first)
  // 2. lesson number descending (higher lesson number = later in sequence)
  studentScores.sort((a, b) => {
    const createdA = new Date(a.created_at).getTime();
    const createdB = new Date(b.created_at).getTime();
    
    // If created_at differs by more than 1 minute, use that
    if (Math.abs(createdA - createdB) > 60000) {
      return createdB - createdA;
    }
    
    // Otherwise, sort by lesson number (higher = more recent)
    const lessonA = getLessonNumber(a.test_name || "");
    const lessonB = getLessonNumber(b.test_name || "");
    return lessonB - lessonA;
  });
  
  const latest = studentScores[0];
  return {
    score: latest.score,
    testName: latest.test_name,
  };
}

// Get grade based on score (0-100 scale: A=90-100, B=70-89, C=60-69, D=40-59, E=0-39)
// Score is always on a 0-100 scale
function getGrade(scoreData: { score: number; testName: string } | null): { label: string; color: string; testName?: string } {
  if (scoreData === null) return { label: "—", color: "bg-muted text-muted-foreground" };
  
  // Score is directly on 0-100 scale, no need to calculate percentage
  const score = scoreData.score;
  
  if (score >= 90) return { label: "A", color: "bg-green-100 text-green-700", testName: scoreData.testName };
  if (score >= 70) return { label: "B", color: "bg-blue-100 text-blue-700", testName: scoreData.testName };
  if (score >= 60) return { label: "C", color: "bg-yellow-100 text-yellow-700", testName: scoreData.testName };
  if (score >= 40) return { label: "D", color: "bg-orange-100 text-orange-700", testName: scoreData.testName };
  return { label: "E", color: "bg-red-100 text-red-700", testName: scoreData.testName };
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
  const { data: students, isLoading: studentsLoading } = useClassStudentsDetailed(classId || "");
  const { data: testScores } = useTestScores(classId || "");
  
  // Get attendance for all time (last 6 months for performance)
  const currentMonth = format(new Date(), "yyyy-MM");
  const { data: attendance } = useAttendance(classId || "", currentMonth);
  
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTrainee, setSelectedTrainee] = useState<any>(null);
  const [isHistoryDialogOpen, setIsHistoryDialogOpen] = useState(false);
  const [gradeCategory, setGradeCategory] = useState("all");
  
  const { data: enrollmentHistory, isLoading: historyLoading } = useEnrollmentHistory(
    selectedTrainee?.id || ""
  );
  const { data: learningDays, isLoading: learningDaysLoading } = useTotalLearningDays(
    selectedTrainee?.id || ""
  );

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
                {classData.name} ({classData.code}) - {students?.length || 0} học viên
              </p>
            )}
          </div>
        </div>
        <div className="flex gap-2">
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
                        className={grade.color} 
                        title={grade.testName || "Chưa có điểm"}
                      >
                        {grade.label}
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
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Enrollment History Dialog */}
      <Dialog open={isHistoryDialogOpen} onOpenChange={setIsHistoryDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Lịch sử nhập học</DialogTitle>
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

          <ScrollArea className="h-[350px]">
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
                
                {enrollmentHistory.map((history, index) => (
                  <div key={history.id} className="relative pb-6">
                    {/* Timeline dot */}
                    <div className={`absolute -left-4 w-3 h-3 rounded-full border-2 border-background ${
                      index === enrollmentHistory.length - 1 ? "bg-primary" : "bg-muted-foreground"
                    }`} />
                    
                    <div className="ml-4 bg-muted/30 rounded-lg p-3">
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
                      
                      {history.notes && (
                        <p className="text-sm mt-2 italic text-muted-foreground">{history.notes}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}