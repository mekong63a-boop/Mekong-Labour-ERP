import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Trainee } from "@/types/trainee";
import { useUpdateTrainee } from "@/hooks/useTrainees";
import { useToast } from "@/hooks/use-toast";
import { Constants } from "@/integrations/supabase/types";
import { useAuth } from "@/hooks/useAuth";
import { formatVietnameseDate } from "@/lib/vietnamese-utils";

interface LegalSectionProps {
  trainee: Trainee;
}

export function LegalSection({ trainee }: LegalSectionProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    trainee_type: trainee.trainee_type || "",
    departure_date: trainee.departure_date || "",
    return_date: trainee.return_date || "",
  });

  const updateTrainee = useUpdateTrainee();
  const { toast } = useToast();
  const { isAdmin } = useAuth();

  // Chỉ Admin có quyền chỉnh sửa
  const canEdit = isAdmin;
  const traineeTypes = Constants.public.Enums.trainee_type;

  const handleSave = async () => {
    try {
      await updateTrainee.mutateAsync({
        id: trainee.id,
        updates: {
          trainee_type: formData.trainee_type as Trainee["trainee_type"],
          departure_date: formData.departure_date || null,
          return_date: formData.return_date || null,
        },
      });
      setIsEditing(false);
      toast({ title: "Đã lưu thông tin pháp lý" });
    } catch {
      toast({ title: "Lỗi khi lưu", variant: "destructive" });
    }
  };

  const formatDate = formatVietnameseDate;

  if (!isEditing) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Thông tin pháp lý / Xuất cảnh</CardTitle>
          {canEdit && (
            <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
              Sửa
            </Button>
          )}
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <div>
            <Label className="text-muted-foreground">Loại thực tập sinh</Label>
            <p>{trainee.trainee_type || "—"}</p>
          </div>
          <div>
            <Label className="text-muted-foreground">Ngày xuất cảnh</Label>
            <p>{formatDate(trainee.departure_date)}</p>
          </div>
          <div>
            <Label className="text-muted-foreground">Ngày về nước</Label>
            <p>{formatDate(trainee.return_date)}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Thông tin pháp lý / Xuất cảnh</CardTitle>
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
          <Label>Loại thực tập sinh</Label>
          <Select
            value={formData.trainee_type}
            onValueChange={(v) => setFormData({ ...formData, trainee_type: v })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Chọn loại" />
            </SelectTrigger>
            <SelectContent>
              {traineeTypes.map((type) => (
                <SelectItem key={type} value={type}>
                  {type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Ngày xuất cảnh</Label>
          <Input
            type="date"
            value={formData.departure_date}
            onChange={(e) =>
              setFormData({ ...formData, departure_date: e.target.value })
            }
          />
        </div>
        <div>
          <Label>Ngày về nước</Label>
          <Input
            type="date"
            value={formData.return_date}
            onChange={(e) => setFormData({ ...formData, return_date: e.target.value })}
          />
        </div>
      </CardContent>
    </Card>
  );
}
