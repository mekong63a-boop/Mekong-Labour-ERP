import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
  FileDown,
  Loader2,
  BookOpen,
  ClipboardCheck,
  Heart,
  Activity,
  History,
  Home,
  ArrowRight,
  GitBranch,
  FileSearch,
} from "lucide-react";
import { TraineeProfile } from "../hooks/useTraineeProfile";
import { formatVietnameseDate, formatVietnameseMonthYearRange } from "@/lib/vietnamese-utils";
import { supabase, SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface TraineeProfileViewProps {
  profile: TraineeProfile;
  onClose: () => void;
}

const formatDate = formatVietnameseDate;

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

// Format bilingual display: Japanese (Vietnamese) or just one if they're the same
const formatBilingual = (japanese: string | null | undefined, vietnamese: string | null | undefined) => {
  if (japanese && vietnamese && japanese !== vietnamese) {
    return `${japanese} (${vietnamese})`;
  }
  return japanese || vietnamese || "—";
};

const getStatusColor = (status: string) => {
  switch (status.toLowerCase()) {
    case 'present':
    case 'có mặt':
      return 'bg-green-100 text-green-800';
    case 'absent':
    case 'vắng':
      return 'bg-red-100 text-red-800';
    case 'late':
    case 'đi trễ':
      return 'bg-orange-100 text-orange-700';
    case 'excused':
    case 'nghỉ phép':
    case 'nghỉ có phép':
      return 'bg-blue-100 text-blue-700';
    case 'unexcused':
    case 'nghỉ không phép':
      return 'bg-red-100 text-red-700';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

const getStatusLabel = (status: string) => {
  switch (status.toLowerCase()) {
    case 'present':
      return 'Có mặt';
    case 'absent':
      return 'Vắng';
    case 'late':
      return 'Đi trễ';
    case 'excused':
      return 'Nghỉ có phép';
    case 'unexcused':
      return 'Nghỉ không phép';
    default:
      return status;
  }
};

// Các giai đoạn đã xuất cảnh - học viên đã rời khỏi KTX
const DEPARTED_STAGES = ["Xuất cảnh", "Đang làm việc", "Bỏ trốn", "Về trước hạn", "Hoàn thành hợp đồng"];

export function TraineeProfileView({ profile, onClose }: TraineeProfileViewProps) {
  const [isExporting, setIsExporting] = useState(false);

  // Check nếu học viên đã xuất cảnh
  const isDeparted = profile.departure_date || 
    (profile.progression_stage && DEPARTED_STAGES.includes(profile.progression_stage));

  const stageLabels: Record<string, string> = {
    registered: "Đăng ký",
    enrolled: "Nhập học",
    training: "Đào tạo",
    interview_passed: "Đậu phỏng vấn",
    document_processing: "Xử lý hồ sơ",
    ready_to_depart: "Sẵn sàng xuất cảnh",
    departed: "Đã xuất cảnh",
    post_departure: "Sau xuất cảnh",
    terminated: "Kết thúc",
  };

  // Helper to get stage label
  const getStageLabel = (stage: string | null) => {
    if (!stage) return "—";
    return stageLabels[stage] || stage;
  };

  const handleExportPDF = async () => {
    setIsExporting(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;

      if (!token) {
        toast.error("Vui lòng đăng nhập lại");
        return;
      }

      const response = await fetch(
        `${SUPABASE_URL}/functions/v1/export-trainee-pdf?trainee_code=${encodeURIComponent(profile.trainee_code)}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            apikey: SUPABASE_PUBLISHABLE_KEY,
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Lỗi xuất PDF");
      }

      const blob = await response.blob();
      
      // Lấy tên file từ header Content-Disposition của server
      const contentDisposition = response.headers.get("Content-Disposition");
      let filename = `${profile.trainee_code} - ${profile.full_name}.pdf`;
      
      if (contentDisposition) {
        // Parse RFC 5987 format: filename*=UTF-8''<encoded>
        const match = contentDisposition.match(/filename\*=UTF-8''(.+)/);
        if (match) {
          filename = decodeURIComponent(match[1]);
        }
      }
      
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success("Đã tải PDF thành công");
    } catch (error) {
      console.error("Export PDF error:", error);
      toast.error((error as Error).message || "Lỗi xuất PDF");
    } finally {
      setIsExporting(false);
    }
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
                {/* Hiển thị progression_stage (VN) thay vì workflow stage để tránh thuật ngữ cấm như "recruited" */}
                {profile.progression_stage && (
                  <Badge>{profile.progression_stage}</Badge>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportPDF}
              disabled={isExporting}
              className="gap-2"
            >
              {isExporting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Đang xuất...
                </>
              ) : (
                <>
                  <FileDown className="h-4 w-4" />
                  Xuất PDF
                </>
              )}
            </Button>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
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
                <InfoRow label="Dân tộc" value={profile.ethnicity} />
                <InfoRow label="Tôn giáo" value={profile.religion} />
                <InfoRow label="Tình trạng hôn nhân" value={profile.marital_status} />
                <InfoRow label="Trình độ học vấn" value={profile.education_level} />
                <InfoRow label="Diện chính sách" value={profile.policy_category} />
                <InfoRow label="Nguồn tuyển" value={profile.source} />
              </div>
            </Section>

            <Separator />

            {/* Contact Info */}
            <Section title="Thông tin liên hệ" icon={Phone}>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-x-4">
                <InfoRow label="Số điện thoại" value={profile.phone} icon={Phone} />
                <InfoRow label="Zalo" value={profile.zalo} />
                <InfoRow label="Email" value={profile.email} icon={Mail} />
                <InfoRow label="SĐT phụ huynh 1" value={profile.parent_phone_1} icon={Phone} />
                <InfoRow label="SĐT phụ huynh 2" value={profile.parent_phone_2} icon={Phone} />
              </div>
              {!profile.can_view_pii && (
                <p className="text-xs text-warning mt-2">
                  ⚠️ Thông tin nhạy cảm đã được ẩn do quyền truy cập
                </p>
              )}
            </Section>

            <Separator />

            {/* Address */}
            <Section title="Địa chỉ" icon={MapPin}>
              <InfoRow label="Địa chỉ thường trú" value={profile.permanent_address} />
              <InfoRow label="Địa chỉ hiện tại" value={profile.current_address} />
              <InfoRow label="Địa chỉ hộ khẩu" value={profile.household_address} />
            </Section>

            <Separator />

            {/* Documents */}
            <Section title="Giấy tờ" icon={FileText}>
              <div className="grid grid-cols-2 gap-x-4">
                <InfoRow label="Số CCCD" value={profile.cccd_number} />
                <InfoRow label="Ngày cấp CCCD" value={formatDate(profile.cccd_date)} />
                <InfoRow label="Nơi cấp CCCD" value={profile.cccd_place} />
                <InfoRow label="Số hộ chiếu" value={profile.passport_number} />
                <InfoRow label="Ngày cấp HC" value={formatDate(profile.passport_date)} />
              </div>
            </Section>

            <Separator />

            {/* Physical & Health */}
            <Section title="Thể chất & Sức khỏe" icon={Activity}>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-x-4">
                <InfoRow label="Chiều cao" value={profile.height ? `${profile.height} cm` : null} />
                <InfoRow label="Cân nặng" value={profile.weight ? `${profile.weight} kg` : null} />
                <InfoRow label="Nhóm máu" value={profile.blood_group} />
                <InfoRow label="Thị lực trái" value={profile.vision_left?.toString()} />
                <InfoRow label="Thị lực phải" value={profile.vision_right?.toString()} />
                <InfoRow label="Thính lực" value={(profile as any).hearing} />
                <InfoRow label="Viêm gan B" value={(profile as any).hepatitis_b} />
                <InfoRow label="Tay thuận" value={profile.dominant_hand} />
                <InfoRow label="Hút thuốc" value={profile.smoking} />
                <InfoRow label="Uống rượu" value={profile.drinking} />
                <InfoRow label="Xăm hình" value={profile.tattoo ? `Có${profile.tattoo_description ? `: ${profile.tattoo_description}` : ''}` : "Không"} />
                <InfoRow label="Tình trạng sức khỏe" value={profile.health_status} />
                <InfoRow label="Sở thích" value={profile.hobbies} />
              </div>
            </Section>

            <Separator />

            {/* Company & Union - Bilingual display - Only show for trainees who passed interview */}
            {profile.progression_stage && ![null, "", "Chưa đậu"].includes(profile.progression_stage) && (
              <>
                <Section title="Công ty & Nghiệp đoàn" icon={Building2}>
                  <div className="grid grid-cols-1 gap-x-4">
                    <InfoRow 
                      label="Công ty tiếp nhận" 
                      value={formatBilingual(profile.company?.name_japanese, profile.company?.name)} 
                    />
                    <InfoRow 
                      label="Nghiệp đoàn" 
                      value={formatBilingual(profile.union?.name_japanese, profile.union?.name)} 
                    />
                    <InfoRow 
                      label="Ngành nghề" 
                      value={formatBilingual(profile.job_category?.name_japanese, profile.job_category?.name)} 
                      icon={Briefcase} 
                    />
                  </div>
                </Section>
                <Separator />
              </>
            )}


            {/* Training History - Attendance + Test Scores */}
            {((profile.attendance && profile.attendance.length > 0) || (profile.test_scores && profile.test_scores.length > 0)) && (
              <>
                <Section title="Quá trình đào tạo" icon={BookOpen}>
                  {/* Test Scores Table - Only show evaluation, not scores */}
                  {profile.test_scores && profile.test_scores.length > 0 && (
                    <div className="mb-4">
                      <h4 className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
                        <ClipboardCheck className="h-3 w-3" />
                        Đánh giá
                      </h4>
                      <div className="rounded-md border overflow-hidden">
                         <Table>
                          <TableHeader>
                            <TableRow className="bg-muted/50">
                              <TableHead className="text-xs py-2">Ngày</TableHead>
                              <TableHead className="text-xs py-2">Lớp</TableHead>
                              <TableHead className="text-xs py-2">Bài kiểm tra</TableHead>
                              <TableHead className="text-xs py-2">Điểm</TableHead>
                              <TableHead className="text-xs py-2">Đánh giá</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {profile.test_scores.slice(0, 10).map((score) => (
                              <TableRow key={score.id}>
                                <TableCell className="text-xs py-1.5">{formatDate(score.test_date)}</TableCell>
                                <TableCell className="text-xs py-1.5">{score.class_name || "—"}</TableCell>
                                <TableCell className="text-xs py-1.5">{score.test_name}</TableCell>
                                <TableCell className="text-xs py-1.5">
                                  {score.score != null ? `${score.score}/${score.max_score}` : "—"}
                                </TableCell>
                                <TableCell className="text-xs py-1.5 font-medium">
                                  {score.evaluation || "—"}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                      {profile.test_scores.length > 10 && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Và {profile.test_scores.length - 10} kết quả khác...
                        </p>
                      )}
                    </div>
                  )}

                  {/* Attendance Table - Only show late/absent */}
                  {profile.attendance && profile.attendance.filter(att => 
                    att.status.toLowerCase() !== 'present' && att.status.toLowerCase() !== 'có mặt'
                  ).length > 0 && (
                    <div>
                      <h4 className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        Điểm danh (Đi trễ / Nghỉ)
                      </h4>
                      <div className="rounded-md border overflow-hidden">
                        <Table>
                          <TableHeader>
                            <TableRow className="bg-muted/50">
                              <TableHead className="text-xs py-2">Ngày</TableHead>
                              <TableHead className="text-xs py-2">Lớp</TableHead>
                              <TableHead className="text-xs py-2">Trạng thái</TableHead>
                              <TableHead className="text-xs py-2">Ghi chú</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {profile.attendance
                              .filter(att => att.status.toLowerCase() !== 'present' && att.status.toLowerCase() !== 'có mặt')
                              .slice(0, 10)
                              .map((att) => (
                              <TableRow key={att.id}>
                                <TableCell className="text-xs py-1.5">{formatDate(att.date)}</TableCell>
                                <TableCell className="text-xs py-1.5">{att.class_name || "—"}</TableCell>
                                <TableCell className="text-xs py-1.5">
                                  <span className={`px-1.5 py-0.5 rounded text-xs ${getStatusColor(att.status)}`}>
                                    {getStatusLabel(att.status)}
                                  </span>
                                </TableCell>
                                <TableCell className="text-xs py-1.5 text-muted-foreground">
                                  {att.notes || "—"}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                      {profile.attendance.filter(att => 
                        att.status.toLowerCase() !== 'present' && att.status.toLowerCase() !== 'có mặt'
                      ).length > 10 && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Và {profile.attendance.filter(att => 
                            att.status.toLowerCase() !== 'present' && att.status.toLowerCase() !== 'có mặt'
                          ).length - 10} buổi khác...
                        </p>
                      )}
                    </div>
                  )}
                </Section>
                <Separator />
              </>
            )}

            {/* Enrollment History - Lịch sử chuyển lớp */}
            {profile.enrollment_history && profile.enrollment_history.length > 0 && (
              <>
                <Section title="Lịch sử chuyển lớp" icon={History}>
                  <div className="space-y-2">
                    {profile.enrollment_history.map((enroll) => (
                      <div key={enroll.id} className="p-2 bg-muted/50 rounded text-sm">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{enroll.action_type}</span>
                          <span className="text-xs text-muted-foreground">{formatDate(enroll.action_date)}</span>
                        </div>
                        {(enroll.from_class || enroll.to_class) && (
                          <div className="text-xs text-muted-foreground mt-1">
                            {enroll.from_class && <span>Từ: {enroll.from_class}</span>}
                            {enroll.from_class && enroll.to_class && <span> → </span>}
                            {enroll.to_class && <span>Đến: {enroll.to_class}</span>}
                          </div>
                        )}
                        {enroll.notes && (
                          <p className="text-xs text-muted-foreground mt-1 italic">{enroll.notes}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </Section>
                <Separator />
              </>
            )}

            {/* Timeline - Chỉ các mục được phép theo SYSTEM RULE */}
            <Section title="Mốc thời gian" icon={Clock}>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-x-4">
                <InfoRow label="Ngày đăng ký" value={formatDate(profile.registration_date || profile.entry_date)} />
                <InfoRow label="Số lần PV" value={profile.interview_count?.toString()} />
                <InfoRow label="Ngày đậu PV" value={formatDate(profile.interview_pass_date)} />
                <InfoRow label="Ngày nộp hồ sơ" value={formatDate(profile.document_submission_date)} />
                <InfoRow label="Nộp OTIT" value={formatDate(profile.otit_entry_date)} />
                <InfoRow label="Nộp Nyukan" value={formatDate(profile.nyukan_entry_date)} />
                <InfoRow label="Có COE" value={formatDate(profile.coe_date)} />
                <InfoRow label="Ngày xuất cảnh" value={formatDate(profile.departure_date)} />
                <InfoRow label="Dự kiến nhập cảnh" value={profile.expected_entry_month} />
              </div>
            </Section>

            <Separator />

            {/* Education History */}
            {profile.education_history && profile.education_history.length > 0 && (
              <>
                <Section title="Học vấn" icon={GraduationCap}>
                  <div className="space-y-2">
                    {profile.education_history.map((edu) => (
                      <div key={edu.id} className="p-2 bg-muted/50 rounded text-sm">
                        <p className="font-medium">{edu.school_name}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                          {edu.level && <Badge variant="outline" className="text-xs">{edu.level}</Badge>}
                          {edu.major && <span>Chuyên ngành: {edu.major}</span>}
                          {(edu.start_year || edu.end_year || (edu as any).start_month || (edu as any).end_month) && (
                            <span>
                              {formatVietnameseMonthYearRange({
                                startMonth: (edu as any).start_month,
                                startYear: edu.start_year,
                                endMonth: (edu as any).end_month,
                                endYear: edu.end_year,
                              })}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </Section>
                <Separator />
              </>
            )}

            {/* Work History */}
            {profile.work_history && profile.work_history.length > 0 && (
              <>
                <Section title="Kinh nghiệm làm việc" icon={Briefcase}>
                  <div className="space-y-2">
                    {profile.work_history.map((work) => (
                      <div key={work.id} className="p-2 bg-muted/50 rounded text-sm">
                        <p className="font-medium">{work.company_name}</p>
                        <div className="text-xs text-muted-foreground mt-1">
                          {work.position && <span>Vị trí: {work.position}</span>}
                          {(work.start_date || work.end_date) && (
                            <span className="ml-2">({formatDate(work.start_date)} - {formatDate(work.end_date) || 'nay'})</span>
                          )}
                        </div>
                        {work.responsibilities && (
                          <p className="text-xs text-muted-foreground mt-1">{work.responsibilities}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </Section>
                <Separator />
              </>
            )}

            {/* Family Members */}
            {profile.family_members && profile.family_members.length > 0 && (
              <>
                <Section title="Thành viên gia đình" icon={Home}>
                  <div className="rounded-md border overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/50">
                          <TableHead className="text-xs py-2">Họ tên</TableHead>
                          <TableHead className="text-xs py-2">Quan hệ</TableHead>
                          <TableHead className="text-xs py-2">Năm sinh</TableHead>
                          <TableHead className="text-xs py-2">Nghề nghiệp</TableHead>
                          <TableHead className="text-xs py-2">Nơi ở</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {profile.family_members.map((member) => (
                          <TableRow key={member.id}>
                            <TableCell className="text-xs py-1.5">{member.full_name}</TableCell>
                            <TableCell className="text-xs py-1.5">{member.relationship}</TableCell>
                            <TableCell className="text-xs py-1.5">{member.birth_year || "—"}</TableCell>
                            <TableCell className="text-xs py-1.5">{member.occupation || "—"}</TableCell>
                            <TableCell className="text-xs py-1.5">
                              {member.location === "O" ? "Sống chung" : member.location === "X" ? "Sống riêng" : member.location || "—"}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </Section>
                <Separator />
              </>
            )}

            {/* Japan Relatives */}
            {profile.japan_relatives && profile.japan_relatives.length > 0 && (
              <>
                <Section title="Thân nhân tại Nhật" icon={Users}>
                  <div className="rounded-md border overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/50">
                          <TableHead className="text-xs py-2">Họ tên</TableHead>
                          <TableHead className="text-xs py-2">Quan hệ</TableHead>
                          <TableHead className="text-xs py-2">Tuổi</TableHead>
                          <TableHead className="text-xs py-2">Địa chỉ tại Nhật</TableHead>
                          <TableHead className="text-xs py-2">Tư cách lưu trú</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {profile.japan_relatives.map((rel) => (
                          <TableRow key={rel.id}>
                            <TableCell className="text-xs py-1.5">{rel.full_name}</TableCell>
                            <TableCell className="text-xs py-1.5">{rel.relationship || "—"}</TableCell>
                            <TableCell className="text-xs py-1.5">{rel.age || "—"}</TableCell>
                            <TableCell className="text-xs py-1.5">{rel.address_japan || "—"}</TableCell>
                            <TableCell className="text-xs py-1.5">{rel.residence_status || "—"}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </Section>
                <Separator />
              </>
            )}

            {/* Dormitory History */}
            {profile.dormitory_history && profile.dormitory_history.length > 0 && (
              <>
                <Section title="Lịch sử ở ký túc xá" icon={Home}>
                  <div className="rounded-md border overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/50">
                          <TableHead className="text-xs py-2">KTX</TableHead>
                          <TableHead className="text-xs py-2">Phòng</TableHead>
                          <TableHead className="text-xs py-2">Giường</TableHead>
                          <TableHead className="text-xs py-2">Ngày vào</TableHead>
                          <TableHead className="text-xs py-2">Ngày ra</TableHead>
                          <TableHead className="text-xs py-2">Trạng thái</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {profile.dormitory_history.map((dorm) => (
                          <TableRow key={dorm.id}>
                            <TableCell className="text-xs py-1.5">
                              <div>
                                <p className="font-medium">{dorm.dormitory_name || "—"}</p>
                                {dorm.from_dormitory_name && (
                                  <p className="text-muted-foreground">Từ: {dorm.from_dormitory_name}</p>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="text-xs py-1.5">{dorm.room_number || "—"}</TableCell>
                            <TableCell className="text-xs py-1.5">{dorm.bed_number || "—"}</TableCell>
                            <TableCell className="text-xs py-1.5">{formatDate(dorm.check_in_date)}</TableCell>
                            <TableCell className="text-xs py-1.5">{formatDate(dorm.check_out_date)}</TableCell>
                            <TableCell className="text-xs py-1.5">
                              {(() => {
                                // Logic: Nếu học viên đã xuất cảnh hoặc có check_out_date => Đã rời
                                const actualStatus = (dorm.check_out_date || isDeparted) 
                                  ? "Đã rời" 
                                  : (dorm.status || "Đang ở");
                                return (
                                  <Badge variant={actualStatus === "Đang ở" ? "default" : "secondary"}>
                                    {actualStatus}
                                  </Badge>
                                );
                              })()}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </Section>
                <Separator />
              </>
            )}


            {/* Interview History */}
            {profile.interview_history && profile.interview_history.length > 0 && (
              <>
                <Section title="Lịch sử phỏng vấn" icon={History}>
                  <div className="space-y-2">
                    {profile.interview_history.map((interview) => (
                      <div key={interview.id} className="p-2 bg-muted/50 rounded text-sm">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{formatDate(interview.interview_date)}</span>
                          <Badge variant={interview.result === "Đậu" || interview.result === "passed" ? "default" : "secondary"}>
                            {interview.result === "Chờ kết quả" || interview.result === "Chờ" ? "Chưa đậu" : (interview.result || "—")}
                          </Badge>
                        </div>
                        <div className="text-xs text-muted-foreground mt-1 space-y-0.5">
                          {(interview.company_name || interview.company_name_japanese) && (
                            <p>Công ty: {formatBilingual(interview.company_name_japanese, interview.company_name)}</p>
                          )}
                          {(interview.union_name || interview.union_name_japanese) && (
                            <p>Nghiệp đoàn: {formatBilingual(interview.union_name_japanese, interview.union_name)}</p>
                          )}
                          {(interview.job_name || interview.job_name_japanese) && (
                            <p>Ngành nghề: {formatBilingual(interview.job_name_japanese, interview.job_name)}</p>
                          )}
                          {interview.expected_entry_month && (
                            <p>Dự kiến nhập cảnh: {interview.expected_entry_month}</p>
                          )}
                        </div>
                        {interview.notes && (
                          <p className="text-xs text-muted-foreground mt-1 italic">{interview.notes}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </Section>
                <Separator />
              </>
            )}

            {/* Reviews (from trainee_reviews table) */}
            {profile.reviews && profile.reviews.length > 0 && (
              <>
                <Section title="Đánh giá" icon={FileText}>
                  <div className="space-y-2">
                    {profile.reviews.map((review) => (
                      <div key={review.id} className={`p-2 rounded text-sm ${review.is_blacklisted ? 'bg-destructive/10 border border-destructive/20' : 'bg-muted/50'}`}>
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">{review.review_type}</Badge>
                            {review.rating && (
                              <span className="text-muted-foreground">Điểm: {review.rating}/10</span>
                            )}
                          </div>
                          <span className="text-muted-foreground">{formatDate(review.created_at)}</span>
                        </div>
                        <p className="mt-1">{review.content}</p>
                        {review.is_blacklisted && review.blacklist_reason && (
                          <div className="mt-1 text-xs text-destructive">
                            <AlertTriangle className="h-3 w-3 inline mr-1" />
                            Blacklist: {review.blacklist_reason}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </Section>
                <Separator />
              </>
            )}

            {/* Notes - legacy trainee_notes */}
            {profile.trainee_notes && profile.trainee_notes.length > 0 && (
              <>
                <Section title="Ghi chú nghiệp vụ" icon={FileText}>
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

            {/* Workflow History - Lịch sử chuyển đổi giai đoạn */}
            {profile.workflow_history && profile.workflow_history.length > 0 && (
              <>
                <Section title="Lịch sử giai đoạn" icon={GitBranch}>
                  <div className="space-y-2">
                    {profile.workflow_history.map((wh) => (
                      <div key={wh.id} className="p-2 bg-muted/50 rounded text-sm border-l-2 border-primary/30">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {wh.from_stage ? (
                              <>
                                <Badge variant="outline" className="text-xs">
                                  {getStageLabel(wh.from_stage)}
                                </Badge>
                                <ArrowRight className="h-3 w-3 text-muted-foreground" />
                              </>
                            ) : null}
                            <Badge className="text-xs">
                              {getStageLabel(wh.to_stage)}
                            </Badge>
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {formatDate(wh.created_at)}
                          </span>
                        </div>
                        {wh.sub_status && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Trạng thái phụ: {wh.sub_status}
                          </p>
                        )}
                        {wh.reason && (
                          <p className="text-xs mt-1 italic">{wh.reason}</p>
                        )}
                        {wh.department_name && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Phòng ban: {wh.department_name}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </Section>
                <Separator />
              </>
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
