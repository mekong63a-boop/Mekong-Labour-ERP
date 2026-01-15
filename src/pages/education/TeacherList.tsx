import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
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
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useTeachers, useCreateTeacher, Teacher } from "@/hooks/useEducation";
import { Plus, Search, ArrowLeft, Mail, Phone, Pencil } from "lucide-react";
import { Link } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";

export default function TeacherList() {
  const { data: teachers, isLoading } = useTeachers();
  const createTeacher = useCreateTeacher();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
  const [formData, setFormData] = useState({
    code: "",
    full_name: "",
    phone: "",
    email: "",
    specialty: "Tiếng Nhật",
    status: "Đang làm việc",
    class_start_date: "",
    class_end_date: "",
  });

  const filteredTeachers = teachers?.filter((t) =>
    t.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.code.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const resetForm = () => {
    setFormData({
      code: "",
      full_name: "",
      phone: "",
      email: "",
      specialty: "Tiếng Nhật",
      status: "Đang làm việc",
      class_start_date: "",
      class_end_date: "",
    });
  };

  const handleCreate = async () => {
    if (!formData.code || !formData.full_name) {
      toast({ title: "Vui lòng nhập mã và họ tên giáo viên", variant: "destructive" });
      return;
    }

    try {
      await createTeacher.mutateAsync(formData);
      toast({ title: "Thêm giáo viên thành công" });
      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      toast({ title: "Lỗi khi thêm giáo viên", variant: "destructive" });
    }
  };

  const openEditDialog = (teacher: Teacher) => {
    setEditingTeacher(teacher);
    setFormData({
      code: teacher.code,
      full_name: teacher.full_name,
      phone: teacher.phone || "",
      email: teacher.email || "",
      specialty: teacher.specialty || "Tiếng Nhật",
      status: teacher.status || "Đang làm việc",
      class_start_date: (teacher as any).class_start_date || "",
      class_end_date: (teacher as any).class_end_date || "",
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdate = async () => {
    if (!editingTeacher || !formData.code || !formData.full_name) {
      toast({ title: "Vui lòng nhập mã và họ tên giáo viên", variant: "destructive" });
      return;
    }

    try {
      const { error } = await supabase
        .from("teachers")
        .update({
          code: formData.code,
          full_name: formData.full_name,
          phone: formData.phone || null,
          email: formData.email || null,
          specialty: formData.specialty || null,
          status: formData.status,
          class_start_date: formData.class_start_date || null,
          class_end_date: formData.class_end_date || null,
        } as any)
        .eq("id", editingTeacher.id);

      if (error) throw error;
      
      queryClient.invalidateQueries({ queryKey: ["teachers"] });
      toast({ title: "Cập nhật giáo viên thành công" });
      setIsEditDialogOpen(false);
      setEditingTeacher(null);
      resetForm();
    } catch (error) {
      toast({ title: "Lỗi khi cập nhật giáo viên", variant: "destructive" });
    }
  };

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
            <h1 className="text-2xl font-bold">Danh sách Giáo viên</h1>
            <p className="text-muted-foreground text-sm">
              Quản lý thông tin giáo viên
            </p>
          </div>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Thêm giáo viên
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Thêm giáo viên mới</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Mã giáo viên *</Label>
                  <Input
                    placeholder="GV001"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Họ và tên *</Label>
                  <Input
                    placeholder="Nguyễn Văn A"
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Số điện thoại</Label>
                  <Input
                    placeholder="0912345678"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Email</Label>
                  <Input
                    type="email"
                    placeholder="email@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <Label>Chuyên môn</Label>
                <Input
                  placeholder="Tiếng Nhật"
                  value={formData.specialty}
                  onChange={(e) => setFormData({ ...formData, specialty: e.target.value })}
                />
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Hủy
                </Button>
                <Button onClick={handleCreate} disabled={createTeacher.isPending}>
                  Thêm
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Tìm theo tên hoặc mã giáo viên..."
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
          ) : filteredTeachers.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              Không có giáo viên nào
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="w-24">Mã GV</TableHead>
                  <TableHead>Họ và tên</TableHead>
                  <TableHead>Chuyên môn</TableHead>
                  <TableHead>Liên hệ</TableHead>
                  <TableHead className="w-28">Ngày nhận lớp</TableHead>
                  <TableHead className="w-28">Ngày kết thúc</TableHead>
                  <TableHead className="w-32">Trạng thái</TableHead>
                  <TableHead className="w-20 text-center">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTeachers.map((teacher) => (
                  <TableRow key={teacher.id}>
                    <TableCell className="font-mono text-sm">{teacher.code}</TableCell>
                    <TableCell className="font-medium">{teacher.full_name}</TableCell>
                    <TableCell>{teacher.specialty || "—"}</TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1 text-sm">
                        {teacher.phone && (
                          <span className="flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {teacher.phone}
                          </span>
                        )}
                        {teacher.email && (
                          <span className="flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {teacher.email}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {(teacher as any).class_start_date || "—"}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {(teacher as any).class_end_date || "—"}
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={
                          teacher.status === "Đang làm việc"
                            ? "bg-green-100 text-green-800"
                            : "bg-muted text-muted-foreground"
                        }
                      >
                        {teacher.status || "Đang làm việc"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEditDialog(teacher)}
                        title="Chỉnh sửa"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Chỉnh sửa giáo viên</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Mã giáo viên *</Label>
                <Input
                  placeholder="GV001"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                />
              </div>
              <div>
                <Label>Họ và tên *</Label>
                <Input
                  placeholder="Nguyễn Văn A"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Số điện thoại</Label>
                <Input
                  placeholder="0912345678"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
              <div>
                <Label>Email</Label>
                <Input
                  type="email"
                  placeholder="email@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Chuyên môn</Label>
                <Input
                  placeholder="Tiếng Nhật"
                  value={formData.specialty}
                  onChange={(e) => setFormData({ ...formData, specialty: e.target.value })}
                />
              </div>
              <div>
                <Label>Trạng thái</Label>
                <Select
                  value={formData.status}
                  onValueChange={(v) => setFormData({ ...formData, status: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Đang làm việc">Đang làm việc</SelectItem>
                    <SelectItem value="Nghỉ phép">Nghỉ phép</SelectItem>
                    <SelectItem value="Đã nghỉ">Đã nghỉ</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Ngày nhận lớp</Label>
                <Input
                  type="date"
                  value={formData.class_start_date}
                  onChange={(e) => setFormData({ ...formData, class_start_date: e.target.value })}
                />
              </div>
              <div>
                <Label>Ngày kết thúc lớp</Label>
                <Input
                  type="date"
                  value={formData.class_end_date}
                  onChange={(e) => setFormData({ ...formData, class_end_date: e.target.value })}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => {
                setIsEditDialogOpen(false);
                setEditingTeacher(null);
                resetForm();
              }}>
                Hủy
              </Button>
              <Button onClick={handleUpdate}>
                Cập nhật
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
