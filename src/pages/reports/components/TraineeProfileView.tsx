import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { X, User, Phone, MapPin, Calendar, Building2, GraduationCap, Briefcase } from "lucide-react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";

interface TraineeProfile {
  id: string;
  trainee_code: string;
  full_name: string;
  furigana: string | null;
  birth_date: string | null;
  gender: string | null;
  trainee_type: string | null;
  source: string | null;
  photo_url: string | null;
  phone: string | null;
  zalo: string | null;
  email: string | null;
  cccd_number: string | null;
  cccd_date: string | null;
  passport_number: string | null;
  passport_date: string | null;
  permanent_address: string | null;
  current_address: string | null;
  birthplace: string | null;
  entry_date: string | null;
  interview_pass_date: string | null;
  document_submission_date: string | null;
  otit_entry_date: string | null;
  nyukan_entry_date: string | null;
  coe_date: string | null;
  visa_date: string | null;
  departure_date: string | null;
  return_date: string | null;
  expected_return_date: string | null;
  progression_stage: string | null;
  simple_status: string | null;
  enrollment_status: string | null;
  notes: string | null;
  workflow: {
    current_stage?: string;
    sub_status?: string;
    transitioned_at?: string;
  };
  company: {
    id?: string;
    code?: string;
    name?: string;
    name_japanese?: string;
  };
  union: {
    id?: string;
    code?: string;
    name?: string;
    name_japanese?: string;
  };
  job_category: {
    id?: string;
    code?: string;
    name?: string;
  };
  class: {
    id?: string;
    code?: string;
    name?: string;
  };
  can_view_pii: boolean;
}

interface TraineeProfileViewProps {
  profile: TraineeProfile;
  onClose: () => void;
}

const formatDate = (dateStr: string | null) => {
  if (!dateStr) return "—";
  try {
    return format(new Date(dateStr), "dd/MM/yyyy", { locale: vi });
  } catch {
    return dateStr;
  }
};

const getStageLabel = (stage: string | null) => {
  const stageMap: Record<string, string> = {
    recruited: "Đã tuyển",
    trained: "Đang đào tạo",
    dormitory: "Ở KTX",
    ready_to_depart: "Sẵn sàng xuất cảnh",
    visa_processing: "Đang xử lý visa",
    departed: "Đã xuất cảnh",
    post_departure: "Sau xuất cảnh",
    archived: "Lưu trữ",
  };
  return stage ? stageMap[stage] || stage : "—";
};

const getTraineeTypeLabel = (type: string | null) => {
  const typeMap: Record<string, string> = {
    tts: "Thực tập sinh",
    tts3: "TTS 3 năm",
    knd: "Kỹ năng đặc định",
    student: "Du học sinh",
    engineer: "Kỹ sư",
  };
  return type ? typeMap[type] || type : "—";
};

export function TraineeProfileView({ profile, onClose }: TraineeProfileViewProps) {
  return (
    <Card className="relative">
      <Button
        variant="ghost"
        size="icon"
        className="absolute right-2 top-2"
        onClick={onClose}
      >
        <X className="h-4 w-4" />
      </Button>

      <CardHeader className="pb-4">
        <div className="flex items-start gap-4">
          {profile.photo_url ? (
            <img
              src={profile.photo_url}
              alt={profile.full_name}
              className="w-24 h-32 object-cover rounded-lg border"
            />
          ) : (
            <div className="w-24 h-32 bg-muted rounded-lg border flex items-center justify-center">
              <User className="h-12 w-12 text-muted-foreground" />
            </div>
          )}
          <div className="flex-1">
            <CardTitle className="text-xl">{profile.full_name}</CardTitle>
            {profile.furigana && (
              <p className="text-sm text-muted-foreground mt-1">{profile.furigana}</p>
            )}
            <div className="flex flex-wrap gap-2 mt-2">
              <Badge variant="outline">{profile.trainee_code}</Badge>
              <Badge variant="secondary">{getTraineeTypeLabel(profile.trainee_type)}</Badge>
              {profile.workflow?.current_stage && (
                <Badge className="bg-primary">{getStageLabel(profile.workflow.current_stage)}</Badge>
              )}
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Personal Info */}
        <div>
          <h3 className="font-semibold flex items-center gap-2 mb-3">
            <User className="h-4 w-4" />
            Thông tin cá nhân
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Ngày sinh:</span>
              <span className="ml-2">{formatDate(profile.birth_date)}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Giới tính:</span>
              <span className="ml-2">{profile.gender === "male" ? "Nam" : profile.gender === "female" ? "Nữ" : "—"}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Nơi sinh:</span>
              <span className="ml-2">{profile.birthplace || "—"}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Nguồn:</span>
              <span className="ml-2">{profile.source || "—"}</span>
            </div>
          </div>
        </div>

        <Separator />

        {/* Contact Info */}
        <div>
          <h3 className="font-semibold flex items-center gap-2 mb-3">
            <Phone className="h-4 w-4" />
            Thông tin liên lạc
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Điện thoại:</span>
              <span className="ml-2">{profile.phone || "—"}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Zalo:</span>
              <span className="ml-2">{profile.zalo || "—"}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Email:</span>
              <span className="ml-2">{profile.email || "—"}</span>
            </div>
          </div>
        </div>

        <Separator />

        {/* Addresses */}
        <div>
          <h3 className="font-semibold flex items-center gap-2 mb-3">
            <MapPin className="h-4 w-4" />
            Địa chỉ
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Địa chỉ thường trú:</span>
              <p className="mt-1">{profile.permanent_address || "—"}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Địa chỉ hiện tại:</span>
              <p className="mt-1">{profile.current_address || "—"}</p>
            </div>
          </div>
        </div>

        <Separator />

        {/* Documents */}
        <div>
          <h3 className="font-semibold flex items-center gap-2 mb-3">
            <Briefcase className="h-4 w-4" />
            Giấy tờ
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Số CCCD:</span>
              <span className="ml-2">{profile.cccd_number || "—"}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Ngày cấp CCCD:</span>
              <span className="ml-2">{formatDate(profile.cccd_date)}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Số hộ chiếu:</span>
              <span className="ml-2">{profile.passport_number || "—"}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Ngày cấp HC:</span>
              <span className="ml-2">{formatDate(profile.passport_date)}</span>
            </div>
          </div>
        </div>

        <Separator />

        {/* Company & Class */}
        <div>
          <h3 className="font-semibold flex items-center gap-2 mb-3">
            <Building2 className="h-4 w-4" />
            Công ty & Nghiệp đoàn
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Công ty:</span>
              <span className="ml-2">{profile.company?.name || "—"}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Nghiệp đoàn:</span>
              <span className="ml-2">{profile.union?.name || "—"}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Ngành nghề:</span>
              <span className="ml-2">{profile.job_category?.name || "—"}</span>
            </div>
          </div>
        </div>

        <Separator />

        {/* Class */}
        <div>
          <h3 className="font-semibold flex items-center gap-2 mb-3">
            <GraduationCap className="h-4 w-4" />
            Lớp học
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Mã lớp:</span>
              <span className="ml-2">{profile.class?.code || "—"}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Tên lớp:</span>
              <span className="ml-2">{profile.class?.name || "—"}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Trạng thái học:</span>
              <span className="ml-2">{profile.enrollment_status || "—"}</span>
            </div>
          </div>
        </div>

        <Separator />

        {/* Timeline */}
        <div>
          <h3 className="font-semibold flex items-center gap-2 mb-3">
            <Calendar className="h-4 w-4" />
            Mốc thời gian
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Ngày nhập học:</span>
              <span className="ml-2">{formatDate(profile.entry_date)}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Đậu phỏng vấn:</span>
              <span className="ml-2">{formatDate(profile.interview_pass_date)}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Nộp hồ sơ:</span>
              <span className="ml-2">{formatDate(profile.document_submission_date)}</span>
            </div>
            <div>
              <span className="text-muted-foreground">COE:</span>
              <span className="ml-2">{formatDate(profile.coe_date)}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Visa:</span>
              <span className="ml-2">{formatDate(profile.visa_date)}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Xuất cảnh:</span>
              <span className="ml-2">{formatDate(profile.departure_date)}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Về nước:</span>
              <span className="ml-2">{formatDate(profile.return_date)}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Dự kiến về:</span>
              <span className="ml-2">{formatDate(profile.expected_return_date)}</span>
            </div>
          </div>
        </div>

        {/* Notes */}
        {profile.notes && (
          <>
            <Separator />
            <div>
              <h3 className="font-semibold mb-2">Ghi chú</h3>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{profile.notes}</p>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
