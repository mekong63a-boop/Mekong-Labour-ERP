import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Trainee } from "@/types/trainee";
import { format } from "date-fns";
import { User, Phone, Mail, MapPin, Heart, Ruler, Scale, Droplets } from "lucide-react";

interface PersonalInfoTabProps {
  trainee: Trainee;
}

export function PersonalInfoTab({ trainee }: PersonalInfoTabProps) {
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
      {/* Basic Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <User className="h-5 w-5 text-primary" />
            Thông tin cá nhân
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          <div>
            <Label className="text-muted-foreground text-xs">Họ và tên</Label>
            <p className="font-medium">{trainee.full_name}</p>
          </div>
          <div>
            <Label className="text-muted-foreground text-xs">Furigana</Label>
            <p>{trainee.furigana || "—"}</p>
          </div>
          <div>
            <Label className="text-muted-foreground text-xs">Ngày sinh</Label>
            <p>{formatDate(trainee.birth_date)}</p>
          </div>
          <div>
            <Label className="text-muted-foreground text-xs">Giới tính</Label>
            <p>{trainee.gender || "—"}</p>
          </div>
          <div>
            <Label className="text-muted-foreground text-xs">Nơi sinh</Label>
            <p>{trainee.birthplace || "—"}</p>
          </div>
          <div>
            <Label className="text-muted-foreground text-xs">Dân tộc</Label>
            <p>{trainee.ethnicity || "—"}</p>
          </div>
          <div>
            <Label className="text-muted-foreground text-xs">Tình trạng hôn nhân</Label>
            <p>{trainee.marital_status || "—"}</p>
          </div>
          <div>
            <Label className="text-muted-foreground text-xs">Trình độ học vấn</Label>
            <p>{trainee.education_level || "—"}</p>
          </div>
        </CardContent>
      </Card>

      {/* Identity Documents */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Giấy tờ tùy thân</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          <div>
            <Label className="text-muted-foreground text-xs">Số CCCD</Label>
            <p className="font-mono">{trainee.cccd_number || "—"}</p>
          </div>
          <div>
            <Label className="text-muted-foreground text-xs">Ngày cấp CCCD</Label>
            <p>{formatDate(trainee.cccd_date)}</p>
          </div>
          <div>
            <Label className="text-muted-foreground text-xs">Nơi cấp CCCD</Label>
            <p>{trainee.cccd_place || "—"}</p>
          </div>
          <div>
            <Label className="text-muted-foreground text-xs">Số Passport</Label>
            <p className="font-mono">{trainee.passport_number || "—"}</p>
          </div>
          <div>
            <Label className="text-muted-foreground text-xs">Ngày cấp Passport</Label>
            <p>{formatDate(trainee.passport_date)}</p>
          </div>
        </CardContent>
      </Card>

      {/* Contact Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Phone className="h-5 w-5 text-primary" />
            Thông tin liên hệ
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          <div>
            <Label className="text-muted-foreground text-xs">Số điện thoại</Label>
            <p>{trainee.phone || "—"}</p>
          </div>
          <div>
            <Label className="text-muted-foreground text-xs">Email</Label>
            <p>{trainee.email || "—"}</p>
          </div>
          <div>
            <Label className="text-muted-foreground text-xs">Zalo</Label>
            <p>{trainee.zalo || "—"}</p>
          </div>
          <div>
            <Label className="text-muted-foreground text-xs">Facebook</Label>
            <p>{trainee.facebook || "—"}</p>
          </div>
          <div>
            <Label className="text-muted-foreground text-xs">SĐT Phụ huynh 1</Label>
            <p>{trainee.parent_phone_1 || "—"}</p>
          </div>
          <div>
            <Label className="text-muted-foreground text-xs">SĐT Phụ huynh 2</Label>
            <p>{trainee.parent_phone_2 || "—"}</p>
          </div>
        </CardContent>
      </Card>

      {/* Address */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <MapPin className="h-5 w-5 text-primary" />
            Địa chỉ
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label className="text-muted-foreground text-xs">Địa chỉ hiện tại</Label>
            <p>{trainee.current_address || "—"}</p>
          </div>
          <div>
            <Label className="text-muted-foreground text-xs">Địa chỉ thường trú</Label>
            <p>{trainee.permanent_address || "—"}</p>
          </div>
          <div>
            <Label className="text-muted-foreground text-xs">Địa chỉ hộ khẩu</Label>
            <p>{trainee.household_address || "—"}</p>
          </div>
          <div>
            <Label className="text-muted-foreground text-xs">Địa chỉ tạm trú</Label>
            <p>{trainee.temp_address || "—"}</p>
          </div>
        </CardContent>
      </Card>

      {/* Health */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Heart className="h-5 w-5 text-red-500" />
            Sức khỏe
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <div className="flex items-center gap-2">
            <Ruler className="h-4 w-4 text-muted-foreground" />
            <div>
              <Label className="text-muted-foreground text-xs">Chiều cao</Label>
              <p>{trainee.height ? `${trainee.height} cm` : "—"}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Scale className="h-4 w-4 text-muted-foreground" />
            <div>
              <Label className="text-muted-foreground text-xs">Cân nặng</Label>
              <p>{trainee.weight ? `${trainee.weight} kg` : "—"}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Droplets className="h-4 w-4 text-muted-foreground" />
            <div>
              <Label className="text-muted-foreground text-xs">Nhóm máu</Label>
              <p>{trainee.blood_group || "—"}</p>
            </div>
          </div>
          <div>
            <Label className="text-muted-foreground text-xs">Thị lực trái</Label>
            <p>{trainee.vision_left ?? "—"}</p>
          </div>
          <div>
            <Label className="text-muted-foreground text-xs">Thị lực phải</Label>
            <p>{trainee.vision_right ?? "—"}</p>
          </div>
          <div>
            <Label className="text-muted-foreground text-xs">Tay thuận</Label>
            <p>{trainee.dominant_hand || "—"}</p>
          </div>
          <div>
            <Label className="text-muted-foreground text-xs">Hút thuốc</Label>
            <p>{trainee.smoking || "—"}</p>
          </div>
          <div>
            <Label className="text-muted-foreground text-xs">Uống rượu</Label>
            <p>{trainee.drinking || "—"}</p>
          </div>
          <div>
            <Label className="text-muted-foreground text-xs">Hình xăm</Label>
            <p>{trainee.tattoo ? "Có" : "Không"}</p>
          </div>
          <div className="col-span-2">
            <Label className="text-muted-foreground text-xs">Tình trạng sức khỏe</Label>
            <p>{trainee.health_status || "—"}</p>
          </div>
        </CardContent>
      </Card>

      {/* Other Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Thông tin khác</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <Label className="text-muted-foreground text-xs">Tình trạng hiện tại</Label>
            <p>{trainee.current_situation || "—"}</p>
          </div>
          <div>
            <Label className="text-muted-foreground text-xs">Nguồn tuyển dụng</Label>
            <p>{trainee.source || "—"}</p>
          </div>
          <div>
            <Label className="text-muted-foreground text-xs">Sở thích</Label>
            <p>{trainee.hobbies || "—"}</p>
          </div>
          <div className="col-span-2">
            <Label className="text-muted-foreground text-xs">Ghi chú</Label>
            <p>{trainee.notes || "—"}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
