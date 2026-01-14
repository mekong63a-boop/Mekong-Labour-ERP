import { useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
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
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useClasses, useCreateClass } from "@/hooks/useEducation";
import { Plus, Search, ArrowLeft, Users, Calendar } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

const LEVELS = ["N5", "N4", "N3", "N2", "N1"];
const TARGET_AUDIENCES = ["Thực tập sinh", "Kỹ năng đặc định", "Kỹ sư", "Du học sinh", "Khác"];

export default function ClassList() {
  const { data: classes, isLoading } = useClasses();
  const createClass = useCreateClass();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    code: "",
    name: "",
    level: "N5",
    target_audience: "Thực tập sinh",
    max_students: 30,
    schedule: "",
    start_date: "",
  });

  const filteredClasses = classes?.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.code.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const handleCreate = async () => {
    if (!formData.code || !formData.name) {
      toast({ title: "Vui lòng nhập mã và tên lớp", variant: "destructive" });
      return;
    }

    try {
      await createClass.mutateAsync({
        ...formData,
        start_date: formData.start_date || null,
      });
      toast({ title: "Thêm lớp học thành công" });
      setIsDialogOpen(false);
      setFormData({
        code: "",
        name: "",
        level: "N5",
        target_audience: "Thực tập sinh",
        max_students: 30,
        schedule: "",
        start_date: "",
      });
    } catch (error) {
      toast({ title: "Lỗi khi thêm lớp học", variant: "destructive" });
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "—";
    try {
      return format(new Date(dateStr), "dd/MM/yyyy");
    } catch {
      return "—";
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
            <h1 className="text-2xl font-bold">Danh sách Lớp học</h1>
            <p className="text-muted-foreground text-sm">
              Quản lý thông tin lớp học
            </p>
          </div>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Thêm lớp học
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Thêm lớp học mới</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Mã lớp *</Label>
                  <Input
                    placeholder="LOP001"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Tên lớp *</Label>
                  <Input
                    placeholder="Lớp N5 - Khóa 1"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
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
                  <Label>Ngày khai giảng</Label>
                  <Input
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <Label>Lịch học</Label>
                <Input
                  placeholder="Thứ 2,4,6 - 8:00-11:00"
                  value={formData.schedule}
                  onChange={(e) => setFormData({ ...formData, schedule: e.target.value })}
                />
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Hủy
                </Button>
                <Button onClick={handleCreate} disabled={createClass.isPending}>
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
                  <TableHead>Đối tượng</TableHead>
                  <TableHead>Lịch học</TableHead>
                  <TableHead>Ngày KG</TableHead>
                  <TableHead className="w-24">Sĩ số</TableHead>
                  <TableHead className="w-32">Trạng thái</TableHead>
                  <TableHead className="w-20">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredClasses.map((cls) => (
                  <TableRow key={cls.id}>
                    <TableCell className="font-mono text-sm">{cls.code}</TableCell>
                    <TableCell className="font-medium">{cls.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{cls.level || "N5"}</Badge>
                    </TableCell>
                    <TableCell className="text-sm">{cls.target_audience || "—"}</TableCell>
                    <TableCell className="text-sm">{cls.schedule || "—"}</TableCell>
                    <TableCell className="text-sm">{formatDate(cls.start_date)}</TableCell>
                    <TableCell>
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {cls.max_students || 0}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={
                          cls.status === "Đang hoạt động"
                            ? "bg-green-100 text-green-800"
                            : "bg-muted text-muted-foreground"
                        }
                      >
                        {cls.status || "Đang hoạt động"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" asChild>
                        <Link to={`/education/classes/${cls.id}/attendance`}>
                          <Calendar className="h-4 w-4" />
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
