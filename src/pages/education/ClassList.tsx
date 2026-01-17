import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
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
  DialogTrigger,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  useClasses, 
  useCreateClass, 
  useUpdateClass, 
  useDeleteClass,
  useTeachers,
  useClassStudents,
  useAvailableTrainees,
  useAssignTraineesToClass,
  useRemoveTraineeFromClass,
  useClassTeachers,
  useAssignTeacherToClass,
  useRemoveTeacherFromClass,
  useAttendance,
  useTestScores,
  Class,
} from "@/hooks/useEducation";
import { TestScoresDialog } from "@/components/education/TestScoresDialog";
import { ReviewsDialog } from "@/components/education/ReviewsDialog";
import { exportClassData } from "@/components/education/ExportClassData";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { 
  Plus, 
  Search, 
  ArrowLeft, 
  Users, 
  Calendar, 
  MoreHorizontal,
  ClipboardCheck,
  MessageSquare,
  Download,
  UserPlus,
  GraduationCap,
  Pencil,
  CheckCircle,
  Trash2,
  X,
  Eye,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

const LEVELS = ["N5", "N4", "N3", "N2", "N1"];
const TARGET_AUDIENCES = ["Thực tập sinh", "Kỹ năng đặc định", "Kỹ sư", "Du học sinh", "Khác"];

export default function ClassList() {
  const navigate = useNavigate();
  const { data: classes, isLoading } = useClasses();
  const { data: teachers } = useTeachers();
  const createClass = useCreateClass();
  const updateClass = useUpdateClass();
  const deleteClass = useDeleteClass();
  const assignTrainees = useAssignTraineesToClass();
  const removeTrainee = useRemoveTraineeFromClass();
  const assignTeacher = useAssignTeacherToClass();
  const removeTeacher = useRemoveTeacherFromClass();
  const { toast } = useToast();
  
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isAssignTraineeDialogOpen, setIsAssignTraineeDialogOpen] = useState(false);
  const [isAssignTeacherDialogOpen, setIsAssignTeacherDialogOpen] = useState(false);
  const [isTestScoresDialogOpen, setIsTestScoresDialogOpen] = useState(false);
  const [isReviewsDialogOpen, setIsReviewsDialogOpen] = useState(false);
  const [selectedClass, setSelectedClass] = useState<Class | null>(null);
  const [selectedTraineeIds, setSelectedTraineeIds] = useState<string[]>([]);
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>("");
  
  const [formData, setFormData] = useState({
    name: "",
    level: "N5",
    target_audience: "Thực tập sinh",
    max_students: 30,
    schedule: "",
    start_date: "",
    expected_end_date: "",
  });

  // Fetch available trainees and class students when dialog opens
  const { data: availableTrainees } = useAvailableTrainees();
  const { data: classStudents } = useClassStudents(selectedClass?.id || "");
  const { data: classTeachers } = useClassTeachers(selectedClass?.id || "");
  const { data: attendance } = useAttendance(selectedClass?.id || "", format(new Date(), "yyyy-MM"));
  const { data: testScores } = useTestScores(selectedClass?.id || "");

  const filteredClasses = classes?.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.code.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  // Generate class code automatically
  const generateClassCode = () => {
    const now = new Date();
    const year = now.getFullYear().toString().slice(-2);
    const month = (now.getMonth() + 1).toString().padStart(2, "0");
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, "0");
    return `LOP${year}${month}${random}`;
  };

  const handleCreate = async () => {
    if (!formData.name) {
      toast({ title: "Vui lòng nhập tên lớp", variant: "destructive" });
      return;
    }

    try {
      await createClass.mutateAsync({
        ...formData,
        code: generateClassCode(),
        start_date: formData.start_date || null,
        expected_end_date: formData.expected_end_date || null,
      });
      toast({ title: "Thêm lớp học thành công" });
      setIsCreateDialogOpen(false);
      resetForm();
    } catch (error) {
      toast({ title: "Lỗi khi thêm lớp học", variant: "destructive" });
    }
  };

  const handleEdit = async () => {
    if (!selectedClass) return;
    
    try {
      await updateClass.mutateAsync({
        id: selectedClass.id,
        updates: {
          name: formData.name,
          level: formData.level,
          target_audience: formData.target_audience,
          max_students: formData.max_students,
          schedule: formData.schedule,
          start_date: formData.start_date || null,
          expected_end_date: formData.expected_end_date || null,
        },
      });
      toast({ title: "Cập nhật lớp học thành công" });
      setIsEditDialogOpen(false);
      setSelectedClass(null);
    } catch (error) {
      toast({ title: "Lỗi khi cập nhật lớp học", variant: "destructive" });
    }
  };

  const handleDelete = async () => {
    if (!selectedClass) return;
    
    try {
      await deleteClass.mutateAsync(selectedClass.id);
      toast({ title: "Xóa lớp học thành công" });
      setIsDeleteDialogOpen(false);
      setSelectedClass(null);
    } catch (error) {
      toast({ title: "Lỗi khi xóa lớp học", variant: "destructive" });
    }
  };

  const handleEndClass = async (classData: Class) => {
    try {
      await updateClass.mutateAsync({
        id: classData.id,
        updates: { status: "Đã kết thúc" },
      });
      toast({ title: "Đã kết thúc lớp học" });
    } catch (error) {
      toast({ title: "Lỗi khi kết thúc lớp học", variant: "destructive" });
    }
  };

  const handleAssignTrainees = async () => {
    if (!selectedClass || selectedTraineeIds.length === 0) return;
    
    try {
      await assignTrainees.mutateAsync({
        classId: selectedClass.id,
        traineeIds: selectedTraineeIds,
      });
      toast({ title: `Đã gán ${selectedTraineeIds.length} học viên vào lớp` });
      setIsAssignTraineeDialogOpen(false);
      setSelectedTraineeIds([]);
    } catch (error) {
      toast({ title: "Lỗi khi gán học viên", variant: "destructive" });
    }
  };

  const handleRemoveTrainee = async (traineeId: string) => {
    try {
      await removeTrainee.mutateAsync(traineeId);
      toast({ title: "Đã xóa học viên khỏi lớp" });
    } catch (error) {
      toast({ title: "Lỗi khi xóa học viên", variant: "destructive" });
    }
  };

  const handleAssignTeacher = async () => {
    if (!selectedClass || !selectedTeacherId) return;
    
    try {
      await assignTeacher.mutateAsync({
        classId: selectedClass.id,
        teacherId: selectedTeacherId,
      });
      toast({ title: "Đã gán giáo viên vào lớp" });
      setSelectedTeacherId("");
    } catch (error) {
      toast({ title: "Lỗi khi gán giáo viên", variant: "destructive" });
    }
  };

  const handleRemoveTeacher = async (classTeacherId: string) => {
    try {
      await removeTeacher.mutateAsync(classTeacherId);
      toast({ title: "Đã xóa giáo viên khỏi lớp" });
    } catch (error) {
      toast({ title: "Lỗi khi xóa giáo viên", variant: "destructive" });
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      level: "N5",
      target_audience: "Thực tập sinh",
      max_students: 30,
      schedule: "",
      start_date: "",
      expected_end_date: "",
    });
  };

  const openEditDialog = (classData: Class) => {
    setSelectedClass(classData);
    setFormData({
      name: classData.name,
      level: classData.level || "N5",
      target_audience: classData.target_audience || "Thực tập sinh",
      max_students: classData.max_students || 30,
      schedule: classData.schedule || "",
      start_date: classData.start_date || "",
      expected_end_date: classData.expected_end_date || "",
    });
    setIsEditDialogOpen(true);
  };

  const openAssignTraineeDialog = (classData: Class) => {
    setSelectedClass(classData);
    setSelectedTraineeIds([]);
    setIsAssignTraineeDialogOpen(true);
  };

  const openAssignTeacherDialog = (classData: Class) => {
    setSelectedClass(classData);
    setSelectedTeacherId("");
    setIsAssignTeacherDialogOpen(true);
  };

  const openDeleteDialog = (classData: Class) => {
    setSelectedClass(classData);
    setIsDeleteDialogOpen(true);
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "—";
    try {
      return format(new Date(dateStr), "dd/MM/yyyy");
    } catch {
      return "—";
    }
  };

  const handleAction = (action: string, classData: Class) => {
    setSelectedClass(classData);
    switch (action) {
      case "test_scores":
        navigate(`/education/classes/${classData.id}/test-scores`);
        break;
      case "review":
        setIsReviewsDialogOpen(true);
        break;
      case "export":
        exportClassData(
          classData.id, 
          classData.name, 
          classStudents || [], 
          classTeachers || [], 
          attendance || [], 
          testScores || []
        );
        toast({ title: "Xuất dữ liệu thành công" });
        break;
      case "view_students":
        navigate(`/education/classes/${classData.id}/students`);
        break;
      default:
        break;
    }
  };

  // Get assigned teacher IDs to filter them out
  const assignedTeacherIds = classTeachers?.map(ct => (ct.teacher as any)?.id).filter(Boolean) || [];
  const availableTeachersForClass = teachers?.filter(t => !assignedTeacherIds.includes(t.id)) || [];

  const renderFormFields = () => (
    <div className="space-y-4 py-4">
      <div>
        <Label>Tên lớp *</Label>
        <Input
          placeholder="Lớp N5 - Khóa 1"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Cấp độ</Label>
          <Select
            value={formData.level}
            onValueChange={(value) => setFormData({ ...formData, level: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {LEVELS.map((level) => (
                <SelectItem key={level} value={level}>
                  {level}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Đối tượng</Label>
          <Select
            value={formData.target_audience}
            onValueChange={(value) => setFormData({ ...formData, target_audience: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TARGET_AUDIENCES.map((ta) => (
                <SelectItem key={ta} value={ta}>
                  {ta}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Sĩ số tối đa</Label>
          <Input
            type="number"
            value={formData.max_students}
            onChange={(e) => setFormData({ ...formData, max_students: parseInt(e.target.value) || 30 })}
          />
        </div>
        <div>
          <Label>Lịch học</Label>
          <Input
            placeholder="Thứ 2,4,6 - 8:00-11:00"
            value={formData.schedule}
            onChange={(e) => setFormData({ ...formData, schedule: e.target.value })}
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Ngày khai giảng</Label>
          <Input
            type="date"
            value={formData.start_date}
            onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
          />
        </div>
        <div>
          <Label>Ngày dự kiến kết thúc</Label>
          <Input
            type="date"
            value={formData.expected_end_date}
            onChange={(e) => setFormData({ ...formData, expected_end_date: e.target.value })}
          />
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/education">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Danh sách Lớp học</h1>
            <p className="text-muted-foreground text-sm">
              Quản lý thông tin lớp học
            </p>
          </div>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="mr-2 h-4 w-4" />
              Thêm lớp học
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Thêm lớp học mới</DialogTitle>
            </DialogHeader>
            {renderFormFields()}
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Hủy
              </Button>
              <Button onClick={handleCreate} disabled={createClass.isPending}>
                Thêm
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Tìm theo tên hoặc mã lớp..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-4 space-y-2">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : filteredClasses.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              Không có lớp học nào
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="w-24">Mã lớp</TableHead>
                  <TableHead>Tên lớp</TableHead>
                  <TableHead>Cấp độ</TableHead>
                  <TableHead>Giáo viên</TableHead>
                  <TableHead>Lịch học</TableHead>
                  <TableHead>Ngày KG</TableHead>
                  <TableHead className="w-24">Sĩ số</TableHead>
                  <TableHead className="w-32">Trạng thái</TableHead>
                  <TableHead className="w-28 text-center">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredClasses.map((cls) => (
                  <TableRow 
                    key={cls.id} 
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleAction("view_students", cls)}
                  >
                    <TableCell className="font-mono text-sm">{cls.code}</TableCell>
                    <TableCell className="font-medium">{cls.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{cls.level || "N5"}</Badge>
                    </TableCell>
                    <TableCell className="text-sm">{(cls as any).teacher_names || "—"}</TableCell>
                    <TableCell className="text-sm">{cls.schedule || "—"}</TableCell>
                    <TableCell className="text-sm">{formatDate(cls.start_date)}</TableCell>
                    <TableCell>
                      <span className="flex items-center gap-1 text-primary">
                        <Users className="h-3 w-3" />
                        {(cls as any).current_students || 0}/{cls.max_students || 50}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={
                          cls.status === "Đang hoạt động"
                            ? "bg-green-100 text-green-800"
                            : cls.status === "Đã kết thúc"
                            ? "bg-gray-100 text-gray-600"
                            : "bg-muted text-muted-foreground"
                        }
                      >
                        {cls.status || "Đang hoạt động"}
                      </Badge>
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-52">
                          <DropdownMenuItem asChild>
                            <Link to={`/education/classes/${cls.id}/attendance`} className="flex items-center">
                              <Calendar className="mr-2 h-4 w-4" />
                              Điểm danh
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleAction("test_scores", cls)}>
                            <ClipboardCheck className="mr-2 h-4 w-4" />
                            Điểm kiểm tra
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleAction("review", cls)}>
                            <MessageSquare className="mr-2 h-4 w-4" />
                            Nhận xét/Blacklist
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleAction("export", cls)}>
                            <Download className="mr-2 h-4 w-4" />
                            Xuất dữ liệu
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => openAssignTraineeDialog(cls)}>
                            <UserPlus className="mr-2 h-4 w-4" />
                            Gán học viên
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openAssignTeacherDialog(cls)}>
                            <GraduationCap className="mr-2 h-4 w-4" />
                            Gán giáo viên
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => openEditDialog(cls)}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Sửa thông tin lớp
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleEndClass(cls)}>
                            <CheckCircle className="mr-2 h-4 w-4" />
                            Kết thúc lớp học
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onClick={() => openDeleteDialog(cls)}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Xóa lớp
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Sửa thông tin lớp học</DialogTitle>
          </DialogHeader>
          {renderFormFields()}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Hủy
            </Button>
            <Button onClick={handleEdit} disabled={updateClass.isPending}>
              Lưu thay đổi
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign Trainee Dialog */}
      <Dialog open={isAssignTraineeDialogOpen} onOpenChange={setIsAssignTraineeDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Gán học viên vào lớp {selectedClass?.name}</DialogTitle>
            <DialogDescription>
              Chọn học viên chưa có lớp để gán vào lớp này
            </DialogDescription>
          </DialogHeader>
          
          {/* Current students */}
          {classStudents && classStudents.length > 0 && (
            <div className="space-y-2">
              <Label className="text-sm font-medium">Học viên hiện tại ({classStudents.length})</Label>
              <ScrollArea className="h-32 border rounded-md p-2">
                <div className="space-y-1">
                  {classStudents.map((student) => (
                    <div key={student.id} className="flex items-center justify-between py-1 px-2 bg-muted/50 rounded">
                      <span className="text-sm">{student.trainee_code} - {student.full_name}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveTrainee(student.id)}
                        className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}

          {/* Available trainees */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Học viên chưa có lớp ({availableTrainees?.length || 0})</Label>
            {availableTrainees && availableTrainees.length > 0 ? (
              <ScrollArea className="h-64 border rounded-md p-2">
                <div className="space-y-1">
                  {availableTrainees.map((trainee) => (
                    <div 
                      key={trainee.id} 
                      className="flex items-center gap-2 py-1 px-2 hover:bg-muted/50 rounded cursor-pointer"
                      onClick={() => {
                        setSelectedTraineeIds(prev => 
                          prev.includes(trainee.id) 
                            ? prev.filter(id => id !== trainee.id)
                            : [...prev, trainee.id]
                        );
                      }}
                    >
                      <Checkbox 
                        checked={selectedTraineeIds.includes(trainee.id)}
                        onCheckedChange={(checked) => {
                          setSelectedTraineeIds(prev => 
                            checked 
                              ? [...prev, trainee.id]
                              : prev.filter(id => id !== trainee.id)
                          );
                        }}
                      />
                      <span className="text-sm">{trainee.trainee_code} - {trainee.full_name}</span>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            ) : (
              <div className="text-center py-8 text-muted-foreground border rounded-md">
                Không có học viên nào chưa được gán lớp
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAssignTraineeDialogOpen(false)}>
              Đóng
            </Button>
            <Button 
              onClick={handleAssignTrainees} 
              disabled={selectedTraineeIds.length === 0 || assignTrainees.isPending}
            >
              Gán {selectedTraineeIds.length > 0 ? `(${selectedTraineeIds.length})` : ""}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign Teacher Dialog */}
      <Dialog open={isAssignTeacherDialogOpen} onOpenChange={setIsAssignTeacherDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Gán giáo viên vào lớp {selectedClass?.name}</DialogTitle>
          </DialogHeader>
          
          {/* Current teachers */}
          {classTeachers && classTeachers.length > 0 && (
            <div className="space-y-2">
              <Label className="text-sm font-medium">Giáo viên hiện tại</Label>
              <div className="space-y-1 border rounded-md p-2">
                {classTeachers.map((ct) => {
                  const teacher = ct.teacher as any;
                  return (
                    <div key={ct.id} className="flex items-center justify-between py-1 px-2 bg-muted/50 rounded">
                      <span className="text-sm">
                        {teacher?.code} - {teacher?.full_name}
                        {teacher?.specialty && <span className="text-muted-foreground ml-2">({teacher.specialty})</span>}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveTeacher(ct.id)}
                        className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Add new teacher */}
          <div className="space-y-2">
            <Label>Thêm giáo viên</Label>
            <div className="flex gap-2">
              <Select value={selectedTeacherId} onValueChange={setSelectedTeacherId}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Chọn giáo viên..." />
                </SelectTrigger>
                <SelectContent>
                  {availableTeachersForClass.map((teacher) => (
                    <SelectItem key={teacher.id} value={teacher.id}>
                      {teacher.code} - {teacher.full_name}
                      {teacher.specialty && ` (${teacher.specialty})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button 
                onClick={handleAssignTeacher}
                disabled={!selectedTeacherId || assignTeacher.isPending}
              >
                Thêm
              </Button>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAssignTeacherDialogOpen(false)}>
              Đóng
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xóa lớp học</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn xóa lớp <strong>{selectedClass?.name}</strong>? 
              Hành động này không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Xóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Test Scores Dialog */}
      {selectedClass && (
        <TestScoresDialog
          open={isTestScoresDialogOpen}
          onOpenChange={setIsTestScoresDialogOpen}
          classId={selectedClass.id}
          className={selectedClass.name}
        />
      )}

      {/* Reviews Dialog */}
      {selectedClass && (
        <ReviewsDialog
          open={isReviewsDialogOpen}
          onOpenChange={setIsReviewsDialogOpen}
          classId={selectedClass.id}
          className={selectedClass.name}
        />
      )}

    </div>
  );
}
