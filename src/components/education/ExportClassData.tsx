import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { useClassStudents, useClassTeachers, useAttendance, useTestScores } from "@/hooks/useEducation";
import { useToast } from "@/hooks/use-toast";
import * as XLSX from "xlsx";
import { format } from "date-fns";

interface ExportClassDataProps {
  classId: string;
  className: string;
  onComplete?: () => void;
}

export function ExportClassData({ classId, className, onComplete }: ExportClassDataProps) {
  const { toast } = useToast();
  const { data: students } = useClassStudents(classId);
  const { data: teachers } = useClassTeachers(classId);
  const { data: attendance } = useAttendance(classId, format(new Date(), "yyyy-MM"));
  const { data: testScores } = useTestScores(classId);

  const handleExport = () => {
    try {
      const workbook = XLSX.utils.book_new();

      // Sheet 1: Danh sách học viên
      const studentData = students?.map((s, index) => ({
        STT: index + 1,
        "Mã HV": s.trainee_code,
        "Họ và tên": s.full_name,
      })) || [];

      if (studentData.length > 0) {
        const wsStudents = XLSX.utils.json_to_sheet(studentData);
        XLSX.utils.book_append_sheet(workbook, wsStudents, "Danh sách học viên");
      }

      // Sheet 2: Giáo viên phụ trách
      const teacherData = teachers?.map((ct, index) => {
        const teacher = ct.teacher as any;
        return {
          STT: index + 1,
          "Mã GV": teacher?.code || "",
          "Họ và tên": teacher?.full_name || "",
          "Chuyên môn": teacher?.specialty || "",
          "Vai trò": ct.role || "Giáo viên chính",
        };
      }) || [];

      if (teacherData.length > 0) {
        const wsTeachers = XLSX.utils.json_to_sheet(teacherData);
        XLSX.utils.book_append_sheet(workbook, wsTeachers, "Giáo viên");
      }

      // Sheet 3: Điểm danh (tháng hiện tại)
      const attendanceData = attendance?.map((a, index) => {
        const trainee = students?.find(s => s.id === a.trainee_id);
        return {
          STT: index + 1,
          "Mã HV": trainee?.trainee_code || "",
          "Họ và tên": trainee?.full_name || "",
          "Ngày": format(new Date(a.date), "dd/MM/yyyy"),
          "Trạng thái": a.status,
          "Ghi chú": a.notes || "",
        };
      }) || [];

      if (attendanceData.length > 0) {
        const wsAttendance = XLSX.utils.json_to_sheet(attendanceData);
        XLSX.utils.book_append_sheet(workbook, wsAttendance, "Điểm danh");
      }

      // Sheet 4: Điểm kiểm tra
      const testData = testScores?.map((ts, index) => {
        const trainee = ts.trainee as any;
        return {
          STT: index + 1,
          "Mã HV": trainee?.trainee_code || "",
          "Họ và tên": trainee?.full_name || "",
          "Bài kiểm tra": ts.test_name,
          "Ngày": format(new Date(ts.test_date), "dd/MM/yyyy"),
          "Điểm": ts.score ?? "",
          "Điểm tối đa": ts.max_score,
          "Ghi chú": ts.notes || "",
        };
      }) || [];

      if (testData.length > 0) {
        const wsTests = XLSX.utils.json_to_sheet(testData);
        XLSX.utils.book_append_sheet(workbook, wsTests, "Điểm kiểm tra");
      }

      // If no data at all
      if (studentData.length === 0 && teacherData.length === 0 && attendanceData.length === 0 && testData.length === 0) {
        const wsEmpty = XLSX.utils.json_to_sheet([{ "Thông báo": "Không có dữ liệu" }]);
        XLSX.utils.book_append_sheet(workbook, wsEmpty, "Thông báo");
      }

      // Export
      const fileName = `${className.replace(/[^a-zA-Z0-9]/g, "_")}_${format(new Date(), "yyyyMMdd_HHmmss")}.xlsx`;
      XLSX.writeFile(workbook, fileName);

      toast({ title: "Xuất dữ liệu thành công" });
      onComplete?.();
    } catch (error) {
      console.error("Export error:", error);
      toast({ title: "Lỗi khi xuất dữ liệu", variant: "destructive" });
    }
  };

  return (
    <Button onClick={handleExport} variant="outline" className="gap-2">
      <Download className="h-4 w-4" />
      Xuất Excel
    </Button>
  );
}

export function exportClassData(classId: string, className: string, students: any[], teachers: any[], attendance: any[], testScores: any[]) {
  const workbook = XLSX.utils.book_new();

  // Sheet 1: Danh sách học viên
  const studentData = students?.map((s, index) => ({
    STT: index + 1,
    "Mã HV": s.trainee_code,
    "Họ và tên": s.full_name,
  })) || [];

  if (studentData.length > 0) {
    const wsStudents = XLSX.utils.json_to_sheet(studentData);
    XLSX.utils.book_append_sheet(workbook, wsStudents, "Danh sách học viên");
  }

  // Sheet 2: Giáo viên phụ trách
  const teacherData = teachers?.map((ct, index) => {
    const teacher = ct.teacher as any;
    return {
      STT: index + 1,
      "Mã GV": teacher?.code || "",
      "Họ và tên": teacher?.full_name || "",
      "Chuyên môn": teacher?.specialty || "",
      "Vai trò": ct.role || "Giáo viên chính",
    };
  }) || [];

  if (teacherData.length > 0) {
    const wsTeachers = XLSX.utils.json_to_sheet(teacherData);
    XLSX.utils.book_append_sheet(workbook, wsTeachers, "Giáo viên");
  }

  // Sheet 3: Điểm danh
  const attendanceData = attendance?.map((a, index) => {
    const trainee = students?.find(s => s.id === a.trainee_id);
    return {
      STT: index + 1,
      "Mã HV": trainee?.trainee_code || "",
      "Họ và tên": trainee?.full_name || "",
      "Ngày": format(new Date(a.date), "dd/MM/yyyy"),
      "Trạng thái": a.status,
      "Ghi chú": a.notes || "",
    };
  }) || [];

  if (attendanceData.length > 0) {
    const wsAttendance = XLSX.utils.json_to_sheet(attendanceData);
    XLSX.utils.book_append_sheet(workbook, wsAttendance, "Điểm danh");
  }

  // Sheet 4: Điểm kiểm tra
  const testData = testScores?.map((ts, index) => {
    const trainee = ts.trainee as any;
    return {
      STT: index + 1,
      "Mã HV": trainee?.trainee_code || "",
      "Họ và tên": trainee?.full_name || "",
      "Bài kiểm tra": ts.test_name,
      "Ngày": format(new Date(ts.test_date), "dd/MM/yyyy"),
      "Điểm": ts.score ?? "",
      "Điểm tối đa": ts.max_score,
      "Ghi chú": ts.notes || "",
    };
  }) || [];

  if (testData.length > 0) {
    const wsTests = XLSX.utils.json_to_sheet(testData);
    XLSX.utils.book_append_sheet(workbook, wsTests, "Điểm kiểm tra");
  }

  // If no data at all, add empty sheet
  if (studentData.length === 0 && teacherData.length === 0 && attendanceData.length === 0 && testData.length === 0) {
    const wsEmpty = XLSX.utils.json_to_sheet([{ "Thông báo": "Không có dữ liệu" }]);
    XLSX.utils.book_append_sheet(workbook, wsEmpty, "Thông báo");
  }

  // Export
  const fileName = `${className.replace(/[^a-zA-Z0-9]/g, "_")}_${format(new Date(), "yyyyMMdd_HHmmss")}.xlsx`;
  XLSX.writeFile(workbook, fileName);
}