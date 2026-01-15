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
import { 
  useClass, 
  useTestScores, 
  useAttendance 
} from "@/hooks/useEducation";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Search, History, BookOpen, Calendar } from "lucide-react";
import { format, parseISO } from "date-fns";

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

// Hook to get enrollment history for a trainee
function useEnrollmentHistory(traineeId: string) {
  return useQuery({
    queryKey: ["enrollment-history", traineeId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("enrollment_history")
        .select(`
          id,
          action_type,
          action_date,
          notes,
          class:classes!enrollment_history_class_id_fkey(name),
          from_class:classes!enrollment_history_from_class_id_fkey(name),
          to_class:classes!enrollment_history_to_class_id_fkey(name)
        `)
        .eq("trainee_id", traineeId)
        .order("action_date", { ascending: false });
      if (error) throw error;
      return data;
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

// Calculate average test score for a student
function calculateAverageScore(
  testScores: any[] | undefined,
  traineeId: string
): number | null {
  if (!testScores || testScores.length === 0) return null;
  
  const studentScores = testScores.filter(s => 
    s.trainee_id === traineeId && s.score !== null
  );
  if (studentScores.length === 0) return null;
  
  const total = studentScores.reduce((sum, s) => sum + (s.score || 0), 0);
  return Math.round((total / studentScores.length) * 10) / 10;
}

// Get grade based on average score
function getGrade(avgScore: number | null): { label: string; color: string } {
  if (avgScore === null) return { label: "—", color: "bg-muted text-muted-foreground" };
  if (avgScore >= 9) return { label: "Xuất sắc", color: "bg-green-100 text-green-700" };
  if (avgScore >= 8) return { label: "Giỏi", color: "bg-blue-100 text-blue-700" };
  if (avgScore >= 6.5) return { label: "Khá", color: "bg-yellow-100 text-yellow-700" };
  if (avgScore >= 5) return { label: "TB", color: "bg-orange-100 text-orange-700" };
  return { label: "Yếu", color: "bg-red-100 text-red-700" };
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
  
  const { data: enrollmentHistory, isLoading: historyLoading } = useEnrollmentHistory(
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

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Tìm theo tên hoặc mã học viên..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
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
                const avgScore = calculateAverageScore(testScores, student.id);
                const attendanceRate = calculateAttendanceRate(attendance, student.id);
                const grade = getGrade(avgScore);
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
                      <Badge className={grade.color}>
                        {avgScore !== null ? `${avgScore} - ${grade.label}` : grade.label}
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
          <ScrollArea className="h-[400px]">
            {historyLoading ? (
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
                      index === 0 ? "bg-primary" : "bg-muted-foreground"
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
                      
                      {history.from_class && history.to_class && (
                        <p className="text-sm text-muted-foreground">
                          {(history.from_class as any)?.name} → {(history.to_class as any)?.name}
                        </p>
                      )}
                      
                      {history.class && (
                        <p className="text-sm text-muted-foreground">
                          Lớp: {(history.class as any)?.name}
                        </p>
                      )}
                      
                      {history.notes && (
                        <p className="text-sm mt-1">{history.notes}</p>
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