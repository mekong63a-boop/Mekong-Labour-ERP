import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Trainee } from "@/types/trainee";
import { useUpdateTrainee } from "@/hooks/useTrainees";
import { useToast } from "@/hooks/use-toast";
import { useDataMasking } from "@/hooks/useSecureData";
import { useAuth } from "@/hooks/useAuth";
import { format } from "date-fns";

interface BasicInfoSectionProps {
  trainee: Trainee;
}

export function BasicInfoSection({ trainee }: BasicInfoSectionProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    full_name: trainee.full_name,
    furigana: trainee.furigana || "",
    birth_date: trainee.birth_date || "",
    gender: trainee.gender || "",
    phone: trainee.phone || "",
    zalo: trainee.zalo || "",
    facebook: trainee.facebook || "",
    expected_entry_month: trainee.expected_entry_month || "",
    notes: trainee.notes || "",
  });

  const updateTrainee = useUpdateTrainee();
  const { toast } = useToast();
  const { maskPhone, canViewUnmasked } = useDataMasking();
  const { isAdmin } = useAuth();

  // Chỉ Admin có quyền chỉnh sửa
  const canEdit = isAdmin;

  const handleSave = async () => {
    try {
      await updateTrainee.mutateAsync({
        id: trainee.id,
        updates: formData,
      });
      setIsEditing(false);
      toast({ title: "Đã lưu thông tin" });
    } catch {
      toast({ title: "Lỗi khi lưu", variant: "destructive" });
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

  if (!isEditing) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Thông tin cơ bản</CardTitle>
          {canEdit && (
            <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
              Sửa
            </Button>
          )}
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <div>
            <Label className="text-muted-foreground">Họ tên</Label>
            <p>{trainee.full_name}</p>
          </div>
          <div>
            <Label className="text-muted-foreground">Furigana</Label>
            <p>{trainee.furigana || "—"}</p>
          </div>
          <div>
            <Label className="text-muted-foreground">Ngày sinh</Label>
            <p>{formatDate(trainee.birth_date)}</p>
          </div>
          <div>
            <Label className="text-muted-foreground">Giới tính</Label>
            <p>{trainee.gender || "—"}</p>
          </div>
          <div>
            <Label className="text-muted-foreground">Số điện thoại</Label>
            <p>{maskPhone(trainee.phone)}</p>
          </div>
          <div>
            <Label className="text-muted-foreground">Zalo</Label>
            <p>{maskPhone(trainee.zalo)}</p>
          </div>
          <div>
            <Label className="text-muted-foreground">Facebook</Label>
            <p>{trainee.facebook || "—"}</p>
          </div>
          <div>
            <Label className="text-muted-foreground">Tháng dự kiến</Label>
            <p>{trainee.expected_entry_month || "—"}</p>
          </div>
          <div className="col-span-2">
            <Label className="text-muted-foreground">Ghi chú</Label>
            <p>{trainee.notes || "—"}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Thông tin cơ bản</CardTitle>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setIsEditing(false)}>
            Hủy
          </Button>
          <Button size="sm" onClick={handleSave} disabled={updateTrainee.isPending}>
            Lưu
          </Button>
        </div>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-4">
        <div>
          <Label>Họ tên</Label>
          <Input
            value={formData.full_name}
            onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
          />
        </div>
        <div>
          <Label>Furigana</Label>
          <Input
            value={formData.furigana}
            onChange={(e) => setFormData({ ...formData, furigana: e.target.value })}
          />
        </div>
        <div>
          <Label>Ngày sinh</Label>
          <Input
            type="date"
            value={formData.birth_date}
            onChange={(e) => setFormData({ ...formData, birth_date: e.target.value })}
          />
        </div>
        <div>
          <Label>Giới tính</Label>
          <Input
            value={formData.gender}
            onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
          />
        </div>
        <div>
          <Label>Số điện thoại</Label>
          <Input
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          />
        </div>
        <div>
          <Label>Zalo</Label>
          <Input
            value={formData.zalo}
            onChange={(e) => setFormData({ ...formData, zalo: e.target.value })}
          />
        </div>
        <div>
          <Label>Facebook</Label>
          <Input
            value={formData.facebook}
            onChange={(e) => setFormData({ ...formData, facebook: e.target.value })}
          />
        </div>
        <div>
          <Label>Tháng dự kiến</Label>
          <Input
            value={formData.expected_entry_month}
            onChange={(e) =>
              setFormData({ ...formData, expected_entry_month: e.target.value })
            }
          />
        </div>
        <div className="col-span-2">
          <Label>Ghi chú</Label>
          <Textarea
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          />
        </div>
      </CardContent>
    </Card>
  );
}