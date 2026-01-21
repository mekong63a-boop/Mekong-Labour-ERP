import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
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
} from "lucide-react";
import { TraineeProfile } from "../hooks/useTraineeProfile";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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
      return 'bg-yellow-100 text-yellow-800';
    case 'excused':
    case 'nghỉ phép':
      return 'bg-blue-100 text-blue-800';
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
      return 'Nghỉ phép';
    default:
      return status;
  }
};

export function TraineeProfileView({ profile, onClose }: TraineeProfileViewProps) {
  const [isExporting, setIsExporting] = useState(false);

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
        `https://bcltzwpnhfpbfiuhfkxi.supabase.co/functions/v1/export-trainee-pdf?trainee_code=${encodeURIComponent(profile.trainee_code)}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            apikey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJjbHR6d3BuaGZwYmZpdWhma3hpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgyOTU0NDQsImV4cCI6MjA4Mzg3MTQ0NH0.ktTKQxMCXGhXaaa5OkfDrx9I0-YPESh8Z4kHNBQkCJ4",
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Lỗi xuất PDF");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `hoc-vien-${profile.trainee_code}.pdf`;
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
                {profile.workflow?.current_stage && (
                  <Badge>{stageLabels[profile.workflow.current_stage] || profile.workflow.current_stage}</Badge>
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
                <InfoRow label="SĐT phụ huynh 1" value={profile.parent_phone_1} icon={Phone} />
                <InfoRow label="SĐT phụ huynh 2" value={profile.parent_phone_2} icon={Phone} />
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

            {/* Company & Union - Bilingual display */}
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

            {/* Training History - Attendance + Test Scores */}
            {((profile.attendance && profile.attendance.length > 0) || (profile.test_scores && profile.test_scores.length > 0)) && (
              <>
                <Section title="Quá trình đào tạo" icon={BookOpen}>
                  {/* Test Scores Table */}
                  {profile.test_scores && profile.test_scores.length > 0 && (
                    <div className="mb-4">
                      <h4 className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
                        <ClipboardCheck className="h-3 w-3" />
                        Điểm kiểm tra
                      </h4>
                      <div className="rounded-md border overflow-hidden">
                        <Table>
                          <TableHeader>
                            <TableRow className="bg-muted/50">
                              <TableHead className="text-xs py-2">Ngày</TableHead>
                              <TableHead className="text-xs py-2">Lớp</TableHead>
                              <TableHead className="text-xs py-2">Bài kiểm tra</TableHead>
                              <TableHead className="text-xs py-2 text-right">Điểm</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {profile.test_scores.slice(0, 10).map((score) => (
                              <TableRow key={score.id}>
                                <TableCell className="text-xs py-1.5">{formatDate(score.test_date)}</TableCell>
                                <TableCell className="text-xs py-1.5">{score.class_code || "—"}</TableCell>
                                <TableCell className="text-xs py-1.5">{score.test_name}</TableCell>
                                <TableCell className="text-xs py-1.5 text-right font-medium">
                                  {score.score !== null ? `${score.score}/${score.max_score}` : "—"}
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

                  {/* Attendance Table */}
                  {profile.attendance && profile.attendance.length > 0 && (
                    <div>
                      <h4 className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        Điểm danh gần đây
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
                            {profile.attendance.slice(0, 10).map((att) => (
                              <TableRow key={att.id}>
                                <TableCell className="text-xs py-1.5">{formatDate(att.date)}</TableCell>
                                <TableCell className="text-xs py-1.5">{att.class_code || "—"}</TableCell>
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
                      {profile.attendance.length > 10 && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Và {profile.attendance.length - 10} buổi học khác...
                        </p>
                      )}
                    </div>
                  )}
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
