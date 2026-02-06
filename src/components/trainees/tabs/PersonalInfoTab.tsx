import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Trainee } from "@/types/trainee";
import { useDataMasking } from "@/hooks/useSecureData";
import { formatVietnameseDate } from "@/lib/vietnamese-utils";
import { User, Phone, Mail, MapPin, Heart, Ruler, Scale, Droplets, QrCode, Shirt } from "lucide-react";

interface PersonalInfoTabProps {
  trainee: Trainee;
}

export function PersonalInfoTab({ trainee }: PersonalInfoTabProps) {
  const { maskPhone, maskCCCD, maskPassport, maskEmail, maskAddress, canViewUnmasked } = useDataMasking();

  const formatDate = formatVietnameseDate;

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

      {/* Identity Documents - With masking */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Giấy tờ tùy thân</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <div>
            <Label className="text-muted-foreground text-xs">Số CCCD</Label>
            <p className="font-mono">{maskCCCD(trainee.cccd_number)}</p>
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
            <p className="font-mono">{maskPassport(trainee.passport_number)}</p>
          </div>
          <div>
            <Label className="text-muted-foreground text-xs">Ngày cấp Passport</Label>
            <p>{formatDate(trainee.passport_date)}</p>
          </div>
          <div>
            <Label className="text-muted-foreground text-xs">Nơi cấp Passport</Label>
            <p>{(trainee as any).passport_place || "—"}</p>
          </div>
        </CardContent>
      </Card>

      {/* Contact Info - With masking */}
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
            <p>{maskPhone(trainee.phone)}</p>
          </div>
          <div>
            <Label className="text-muted-foreground text-xs">Email</Label>
            <p>{maskEmail(trainee.email)}</p>
          </div>
          <div>
            <Label className="text-muted-foreground text-xs">Zalo</Label>
            <p>{maskPhone(trainee.zalo)}</p>
          </div>
          <div>
            <Label className="text-muted-foreground text-xs">Facebook</Label>
            <p>{trainee.facebook || "—"}</p>
          </div>
          <div>
            <Label className="text-muted-foreground text-xs">SĐT Phụ huynh 1</Label>
            <p>
              {(trainee as any).parent_phone_1_relation && <span className="text-primary font-medium">{(trainee as any).parent_phone_1_relation}: </span>}
              {maskPhone(trainee.parent_phone_1)}
            </p>
          </div>
          <div>
            <Label className="text-muted-foreground text-xs">SĐT Phụ huynh 2</Label>
            <p>
              {(trainee as any).parent_phone_2_relation && <span className="text-primary font-medium">{(trainee as any).parent_phone_2_relation}: </span>}
              {maskPhone(trainee.parent_phone_2)}
            </p>
          </div>
          <div>
            <Label className="text-muted-foreground text-xs">SĐT Phụ huynh 3</Label>
            <p>
              {(trainee as any).parent_phone_3_relation && <span className="text-primary font-medium">{(trainee as any).parent_phone_3_relation}: </span>}
              {maskPhone((trainee as any).parent_phone_3)}
            </p>
          </div>
          {(trainee as any).line_qr_url && (
            <div className="col-span-2">
              <Label className="text-muted-foreground text-xs flex items-center gap-1">
                <QrCode className="h-3 w-3" />
                Line QR
              </Label>
              <img 
                src={(trainee as any).line_qr_url} 
                alt="Line QR Code" 
                className="w-16 h-16 object-cover rounded border mt-1"
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Address - With masking */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <MapPin className="h-5 w-5 text-primary" />
            Địa chỉ
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label className="text-muted-foreground text-xs">Địa chỉ thường trú (trước sáp nhập)</Label>
            <p>{maskAddress(trainee.permanent_address)}</p>
          </div>
          <div>
            <Label className="text-muted-foreground text-xs">Địa chỉ thường trú (sau sáp nhập)</Label>
            <p>{maskAddress((trainee as any).permanent_address_new)}</p>
          </div>
          <div>
            <Label className="text-muted-foreground text-xs">Địa chỉ hiện tại</Label>
            <p>{maskAddress(trainee.current_address)}</p>
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
          <div>
            <Label className="text-muted-foreground text-xs">Thính lực</Label>
            <p>{(trainee as any).hearing || "—"}</p>
          </div>
          <div>
            <Label className="text-muted-foreground text-xs">Viêm gan B</Label>
            <p>{(trainee as any).hepatitis_b || "—"}</p>
          </div>
          <div className="col-span-2">
            <Label className="text-muted-foreground text-xs">Tình trạng sức khỏe</Label>
            <p>{trainee.health_status || "—"}</p>
          </div>
          
          {/* Clothing Sizes */}
          <div className="col-span-6 border-t pt-4 mt-2">
            <div className="flex items-center gap-2 mb-3">
              <Shirt className="h-4 w-4 text-muted-foreground" />
              <Label className="font-medium">Số đo</Label>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label className="text-muted-foreground text-xs">Size quần</Label>
                <p>{(trainee as any).pants_size || "—"}</p>
              </div>
              <div>
                <Label className="text-muted-foreground text-xs">Size áo</Label>
                <p>{(trainee as any).shirt_size || "—"}</p>
              </div>
              <div>
                <Label className="text-muted-foreground text-xs">Size giày</Label>
                <p>{(trainee as any).shoe_size || "—"}</p>
              </div>
            </div>
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
