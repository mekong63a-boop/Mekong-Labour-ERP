import { useState, useMemo } from "react";
import { Link, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useClass, useClassStudents, useTestScores, useBulkUpsertTestScores } from "@/hooks/useEducation";
import { ArrowLeft, Save, RefreshCw, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

// Generate lesson columns (Bài 1 to Bài 18)
const LESSONS = Array.from({ length: 18 }, (_, i) => `Bài ${i + 1}`);

// Get grade based on score (0-100 scale)
function getScoreGrade(score: number | null): { label: string; color: string } {
  if (score === null) return { label: "", color: "" };
  if (score >= 90) return { label: "A", color: "text-green-600 font-bold" };
  if (score >= 70) return { label: "B", color: "text-blue-600 font-bold" };
  if (score >= 60) return { label: "C", color: "text-yellow-600 font-bold" };
  if (score >= 40) return { label: "D", color: "text-orange-600 font-bold" };
  return { label: "E", color: "text-red-600 font-bold" };
}

export default function TestScoresPage() {
  const { classId } = useParams<{ classId: string }>();
  const { toast } = useToast();
  const { data: classData, isLoading: classLoading } = useClass(classId || "");
  const { data: students, isLoading: studentsLoading } = useClassStudents(classId || "");
  const { data: allScores, isLoading: scoresLoading, refetch } = useTestScores(classId || "");
  const bulkUpsert = useBulkUpsertTestScores();
  
  const [selectedSubject, setSelectedSubject] = useState<string>("Nhập môn");
  const [localScores, setLocalScores] = useState<Record<string, Record<string, number | null>>>({});
  const [hasChanges, setHasChanges] = useState(false);

  const subjects = ["Nhập môn", "Sơ cấp 1", "Sơ cấp 2", "N5", "N4", "N3", "Nghe"];

  // Organize scores by trainee and lesson
  const scoreMatrix = useMemo(() => {
    const matrix: Record<string, Record<string, number | null>> = {};
    
    if (allScores) {
      allScores.forEach((score: any) => {
        const testName = score.test_name;
        // Parse test name to extract subject and lesson
        // Format expected: "Nhập môn - Bài 1" or just "Bài 1"
        const lessonMatch = testName.match(/Bài (\d+)/);
        if (lessonMatch) {
          const lesson = `Bài ${lessonMatch[1]}`;
          const subject = testName.includes(" - ") 
            ? testName.split(" - ")[0] 
            : selectedSubject;
          
          if (subject === selectedSubject) {
            if (!matrix[score.trainee_id]) {
              matrix[score.trainee_id] = {};
            }
            matrix[score.trainee_id][lesson] = score.score;
          }
        }
      });
    }
    
    return matrix;
  }, [allScores, selectedSubject]);

  // Merge with local changes
  const displayScores = useMemo(() => {
    const merged: Record<string, Record<string, number | null>> = {};
    
    students?.forEach(student => {
      merged[student.id] = {};
      LESSONS.forEach(lesson => {
        const localValue = localScores[student.id]?.[lesson];
        const dbValue = scoreMatrix[student.id]?.[lesson];
        merged[student.id][lesson] = localValue !== undefined ? localValue : (dbValue ?? null);
      });
    });
    
    return merged;
  }, [students, scoreMatrix, localScores]);

  const handleScoreChange = (traineeId: string, lesson: string, value: string) => {
    const numValue = value === "" ? null : parseFloat(value);
    setLocalScores(prev => ({
      ...prev,
      [traineeId]: {
        ...prev[traineeId],
        [lesson]: numValue
      }
    }));
    setHasChanges(true);
  };

  // Calculate average for a trainee
  const calculateAverage = (traineeId: string) => {
    const scores = displayScores[traineeId];
    if (!scores) return null;
    
    const validScores = LESSONS
      .map(lesson => scores[lesson])
      .filter((s): s is number => s !== null && s !== undefined);
    
    if (validScores.length === 0) return null;
    return (validScores.reduce((sum, s) => sum + s, 0) / validScores.length).toFixed(1);
  };

  const handleSave = async () => {
    if (!classId || !students) return;
    
    const scoresToSave: any[] = [];
    const today = format(new Date(), "yyyy-MM-dd");
    
    Object.entries(localScores).forEach(([traineeId, lessons]) => {
      Object.entries(lessons).forEach(([lesson, score]) => {
        if (score !== undefined) {
          scoresToSave.push({
            class_id: classId,
            trainee_id: traineeId,
            test_name: `${selectedSubject} - ${lesson}`,
            test_date: today,
            max_score: 100,
            score: score,
          });
        }
      });
    });

    if (scoresToSave.length === 0) {
      toast({ title: "Không có thay đổi để lưu" });
      return;
    }

    try {
      await bulkUpsert.mutateAsync(scoresToSave);
      toast({ title: "Lưu điểm thành công" });
      setLocalScores({});
      setHasChanges(false);
      refetch();
    } catch (error) {
      toast({ title: "Lỗi khi lưu điểm", variant: "destructive" });
    }
  };

  const isLoading = classLoading || studentsLoading || scoresLoading;

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
            <h1 className="text-xl font-bold text-primary">Điểm kiểm tra bài học</h1>
            {classData && (
              <p className="text-sm text-muted-foreground">
                {classData.name} ({classData.code})
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => refetch()}
            title="Làm mới"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={!hasChanges || bulkUpsert.isPending}
            className="bg-primary"
          >
            <Save className="mr-2 h-4 w-4" />
            Lưu điểm
          </Button>
        </div>
      </div>

      {/* Subject filter and stats */}
      <div className="flex items-center gap-4">
        <Select value={selectedSubject} onValueChange={setSelectedSubject}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {subjects.map(subject => (
              <SelectItem key={subject} value={subject}>{subject}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Badge variant="outline" className="flex items-center gap-1">
          <Users className="h-3 w-3" />
          {students?.length || 0} học viên
        </Badge>
      </div>

      {/* Scores Grid */}
      {isLoading ? (
        <div className="space-y-2">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      ) : !students || students.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground border rounded-lg">
          Lớp chưa có học viên
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <ScrollArea className="w-full">
            <div className="min-w-max">
              {/* Header Row */}
              <div className="flex bg-muted/50 border-b sticky top-0">
                <div className="w-20 p-2 text-xs font-medium text-muted-foreground border-r flex-shrink-0">
                  Mã HV
                </div>
                <div className="w-36 p-2 text-xs font-medium text-muted-foreground border-r flex-shrink-0">
                  Họ tên
                </div>
                {LESSONS.map(lesson => (
                  <div 
                    key={lesson} 
                    className="w-14 p-2 text-xs font-medium text-center text-primary border-r flex-shrink-0"
                  >
                    {lesson}
                  </div>
                ))}
                <div className="w-12 p-2 text-xs font-medium text-center text-muted-foreground flex-shrink-0">
                  TB
                </div>
              </div>

              {/* Data Rows */}
              {students.map((student) => (
                <div key={student.id} className="flex border-b hover:bg-muted/20">
                  <div className="w-20 p-2 text-xs font-mono text-muted-foreground border-r flex-shrink-0">
                    {student.trainee_code}
                  </div>
                  <div className="w-36 p-2 text-sm font-medium truncate border-r flex-shrink-0" title={student.full_name}>
                    {student.full_name.toUpperCase()}
                  </div>
                  {LESSONS.map(lesson => {
                    const score = displayScores[student.id]?.[lesson];
                    const hasLocalChange = localScores[student.id]?.[lesson] !== undefined;
                    
                    return (
                      <div key={lesson} className="w-14 p-1 border-r flex-shrink-0 relative group">
                        <Input
                          type="number"
                          min={0}
                          max={100}
                          step={1}
                          value={score ?? ""}
                          onChange={(e) => handleScoreChange(student.id, lesson, e.target.value)}
                          className={`h-7 text-center text-sm p-1 ${
                            hasLocalChange 
                              ? "border-yellow-400 bg-yellow-50" 
                              : "border-yellow-200 bg-yellow-50/50"
                          }`}
                        />
                        {score !== null && (
                          <span className={`absolute -top-1 -right-1 text-[10px] ${getScoreGrade(score).color}`}>
                            {getScoreGrade(score).label}
                          </span>
                        )}
                      </div>
                    );
                  })}
                  <div className="w-12 p-2 text-sm text-center font-medium flex-shrink-0">
                    {calculateAverage(student.id) || "-"}
                  </div>
                </div>
              ))}
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </div>
      )}
    </div>
  );
}
