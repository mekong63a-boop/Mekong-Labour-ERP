import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  X,
  User,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Building2,
  GraduationCap,
  Briefcase,
  FileText,
  AlertTriangle,
  Clock,
  Users,
} from "lucide-react";
import { TraineeProfile } from "../hooks/useTraineeProfile";
import { format } from "date-fns";
import { vi } from "date-fns/locale";

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

const InfoRow = ({ label, value, icon: Icon }: { label: string; value: string | null; icon?: React.ElementType }) => (
  <div className="flex items-start gap-2 py-1">
    {Icon && <Icon className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />}
    <div className="flex-1 min-w-0">
      <span className="text-xs text-muted-foreground">{label}</span>
      <p className="text-sm font-medium truncate">{value || "—"}</p>
    </div>
  </div>
);

const Section = ({ title, icon: Icon, children }: { title: string; icon: React.ElementType; children: React.ReactNode }) => (
  <div className="space-y-3">
    <h3 className="font-semibold text-sm flex items-center gap-2 text-foreground">
      <Icon className="h-4 w-4" />
      {title}
    </h3>
    <div className="pl-6 space-y-1">{children}</div>
  </div>
);

export function TraineeProfileView({ profile, onClose }: TraineeProfileViewProps) {
  const stageLabels: Record<string, string> = {
    recruited: "Tuyển dụng",
    trained: "Đào tạo",
    dormitory: "Ký túc xá",
    visa_processing: "Xử lý visa",
    ready_to_depart: "Sẵn sàng xuất cảnh",
    departed: "Đã xuất cảnh",
    post_departure: "Sau xuất cảnh",
    archived: "Lưu trữ",
  };

  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            {profile.photo_url ? (
              <img
                src={profile.photo_url}
                alt={profile.full_name}
                className="h-16 w-16 rounded-lg object-cover border"
              />
            ) : (
              <div className="h-16 w-16 rounded-lg bg-muted flex items-center justify-center">
                <User className="h-8 w-8 text-muted-foreground" />
              </div>
            )}
            <div>
              <CardTitle className="text-lg">{profile.full_name}</CardTitle>
              <p className="text-sm text-muted-foreground">{profile.furigana}</p>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline">{profile.trainee_code}</Badge>
                {profile.trainee_type && (
                  <Badge variant="secondary">{profile.trainee_type}</Badge>
                )}
                {profile.workflow?.current_stage && (
                  <Badge>{stageLabels[profile.workflow.current_stage] || profile.workflow.current_stage}</Badge>
                )}
              </div>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        <ScrollArea className="h-[600px] pr-4">
          <div className="space-y-6">
            {/* Personal Info */}
            <Section title="Thông tin cá nhân" icon={User}>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-x-4">
                <InfoRow label="Ngày sinh" value={formatDate(profile.birth_date)} icon={Calendar} />
                <InfoRow label="Giới tính" value={profile.gender} />
                <InfoRow label="Nơi sinh" value={profile.birthplace} icon={MapPin} />
                <InfoRow label="Nguồn" value={profile.source} />
              </div>
            </Section>

            <Separator />

            {/* Contact Info */}
            <Section title="Thông tin liên hệ" icon={Phone}>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-x-4">
                <InfoRow label="Số điện thoại" value={profile.phone} icon={Phone} />
                <InfoRow label="Zalo" value={profile.zalo} />
                <InfoRow label="Email" value={profile.email} icon={Mail} />
              </div>
              {!profile.can_view_pii && (
                <p className="text-xs text-amber-600 mt-2">
                  ⚠️ Thông tin nhạy cảm đã được ẩn do quyền truy cập
                </p>
              )}
            </Section>

            <Separator />

            {/* Address */}
            <Section title="Địa chỉ" icon={MapPin}>
              <InfoRow label="Địa chỉ thường trú" value={profile.permanent_address} />
              <InfoRow label="Địa chỉ hiện tại" value={profile.current_address} />
            </Section>

            <Separator />

            {/* Documents */}
            <Section title="Giấy tờ" icon={FileText}>
              <div className="grid grid-cols-2 gap-x-4">
                <InfoRow label="Số CCCD" value={profile.cccd_number} />
                <InfoRow label="Ngày cấp CCCD" value={formatDate(profile.cccd_date)} />
                <InfoRow label="Số hộ chiếu" value={profile.passport_number} />
                <InfoRow label="Ngày cấp HC" value={formatDate(profile.passport_date)} />
              </div>
            </Section>

            <Separator />

            {/* Company & Union */}
            <Section title="Công ty & Nghiệp đoàn" icon={Building2}>
              <div className="grid grid-cols-2 gap-x-4">
                <InfoRow label="Công ty tiếp nhận" value={profile.company?.name || "—"} />
                <InfoRow label="Tên tiếng Nhật" value={profile.company?.name_japanese || "—"} />
                <InfoRow label="Nghiệp đoàn" value={profile.union?.name || "—"} />
                <InfoRow label="Tên tiếng Nhật" value={profile.union?.name_japanese || "—"} />
                <InfoRow label="Ngành nghề" value={profile.job_category?.name || "—"} icon={Briefcase} />
              </div>
            </Section>

            <Separator />

            {/* Class */}
            {profile.class?.id && (
              <>
                <Section title="Lớp học" icon={GraduationCap}>
                  <div className="grid grid-cols-2 gap-x-4">
                    <InfoRow label="Mã lớp" value={profile.class.code || "—"} />
                    <InfoRow label="Tên lớp" value={profile.class.name || "—"} />
                    <InfoRow label="Tình trạng học" value={profile.enrollment_status} />
                  </div>
                </Section>
                <Separator />
              </>
            )}

            {/* Timeline */}
            <Section title="Mốc thời gian" icon={Clock}>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-x-4">
                <InfoRow label="Ngày đăng ký" value={formatDate(profile.entry_date)} />
                <InfoRow label="Ngày đậu PV" value={formatDate(profile.interview_pass_date)} />
                <InfoRow label="Nộp hồ sơ" value={formatDate(profile.document_submission_date)} />
                <InfoRow label="Đăng OTIT" value={formatDate(profile.otit_entry_date)} />
                <InfoRow label="Đăng Nyukan" value={formatDate(profile.nyukan_entry_date)} />
                <InfoRow label="COE" value={formatDate(profile.coe_date)} />
                <InfoRow label="Visa" value={formatDate(profile.visa_date)} />
                <InfoRow label="Xuất cảnh" value={formatDate(profile.departure_date)} />
                <InfoRow label="Về nước" value={formatDate(profile.return_date)} />
                <InfoRow label="Dự kiến về" value={formatDate(profile.expected_return_date)} />
              </div>
            </Section>

            <Separator />

            {/* Workflow Status */}
            {profile.workflow && (
              <>
                <Section title="Trạng thái quy trình" icon={Clock}>
                  <div className="grid grid-cols-2 gap-x-4">
                    <InfoRow 
                      label="Giai đoạn hiện tại" 
                      value={stageLabels[profile.workflow.current_stage || ""] || profile.workflow.current_stage || "—"} 
                    />
                    <InfoRow label="Trạng thái phụ" value={profile.workflow.sub_status || "—"} />
                    <InfoRow label="Ngày chuyển" value={formatDate(profile.workflow.transitioned_at || null)} />
                  </div>
                </Section>
                <Separator />
              </>
            )}

            {/* Interview History */}
            {profile.interview_history && profile.interview_history.length > 0 && (
              <>
                <Section title="Lịch sử phỏng vấn" icon={Users}>
                  <div className="space-y-2">
                    {profile.interview_history.map((interview, idx) => (
                      <div key={idx} className="p-2 bg-muted/50 rounded text-sm">
                        <div className="flex items-center justify-between">
                          <span>{formatDate(interview.interview_date)}</span>
                          <Badge variant={interview.result === "passed" ? "default" : "secondary"}>
                            {interview.result === "passed" ? "Đậu" : interview.result}
                          </Badge>
                        </div>
                        {interview.notes && (
                          <p className="text-xs text-muted-foreground mt-1">{interview.notes}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </Section>
                <Separator />
              </>
            )}

            {/* Notes */}
            {profile.trainee_notes && profile.trainee_notes.length > 0 && (
              <>
                <Section title="Ghi chú" icon={FileText}>
                  <div className="space-y-2">
                    {profile.trainee_notes.map((note) => (
                      <div key={note.id} className="p-2 bg-muted/50 rounded text-sm">
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <Badge variant="outline" className="text-xs">{note.note_type}</Badge>
                          <span>{formatDate(note.created_at)}</span>
                        </div>
                        <p className="mt-1">{note.content}</p>
                      </div>
                    ))}
                  </div>
                </Section>
                <Separator />
              </>
            )}

            {/* Violations */}
            {profile.violations && profile.violations.length > 0 && (
              <Section title="Vi phạm" icon={AlertTriangle}>
                <div className="space-y-2">
                  {profile.violations.map((violation) => (
                    <div key={violation.id} className="p-2 bg-destructive/10 rounded text-sm border border-destructive/20">
                      <div className="flex items-center justify-between">
                        <Badge variant="destructive" className="text-xs">{violation.violation_type}</Badge>
                        <span className="text-xs text-muted-foreground">{formatDate(violation.violation_date)}</span>
                      </div>
                      <p className="mt-1">{violation.description}</p>
                      <Badge variant="outline" className="mt-1 text-xs">{violation.status}</Badge>
                    </div>
                  ))}
                </div>
              </Section>
            )}

            {/* General Notes */}
            {profile.notes && (
              <Section title="Ghi chú chung" icon={FileText}>
                <p className="text-sm whitespace-pre-wrap">{profile.notes}</p>
              </Section>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
