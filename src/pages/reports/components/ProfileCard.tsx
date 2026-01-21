import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { X, User, Phone, MapPin, Calendar, Building2, GraduationCap, Briefcase, FileDown, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { toast } from "sonner";

interface ProfileData {
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
  };
  company: {
    name?: string;
  };
  union: {
    name?: string;
  };
  job_category: {
    name?: string;
  };
  class: {
    code?: string;
    name?: string;
  };
  can_view_pii: boolean;
}

interface Props {
  profile: ProfileData;
  onClose: () => void;
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "—";
  try {
    return format(new Date(dateStr), "dd/MM/yyyy", { locale: vi });
  } catch {
    return dateStr;
  }
}

function getStageLabel(stage: string | null): string {
  if (!stage) return "—";
  const map: Record<string, string> = {
    recruited: "Đã tuyển",
    trained: "Đang đào tạo",
    dormitory: "Ở KTX",
    ready_to_depart: "Sẵn sàng xuất cảnh",
    visa_processing: "Đang xử lý visa",
    departed: "Đã xuất cảnh",
    post_departure: "Sau xuất cảnh",
    archived: "Lưu trữ",
  };
  return map[stage] || stage;
}

function getTypeLabel(type: string | null): string {
  if (!type) return "—";
  const map: Record<string, string> = {
    tts: "Thực tập sinh",
    tts3: "TTS 3 năm",
    knd: "Kỹ năng đặc định",
    student: "Du học sinh",
    engineer: "Kỹ sư",
  };
  return map[type] || type;
}

export function ProfileCard({ profile, onClose }: Props) {
  const [isExporting, setIsExporting] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  async function handleExportPDF() {
    if (!contentRef.current) return;
    
    setIsExporting(true);
    try {
      const canvas = await html2canvas(contentRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
      });

      const imgWidth = 210;
      const pageHeight = 297;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      const pdf = new jsPDF("p", "mm", "a4");
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(canvas.toDataURL("image/png"), "PNG", 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(canvas.toDataURL("image/png"), "PNG", 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      const fileName = `HoSo_${profile.trainee_code}_${profile.full_name.replace(/\s+/g, "_")}.pdf`;
      pdf.save(fileName);
      toast.success("Đã xuất file PDF thành công!");
    } catch (err) {
      console.error("PDF export error:", err);
      toast.error("Lỗi khi xuất PDF");
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <Card className="relative">
      <div className="absolute right-2 top-2 flex gap-2">
        <Button variant="outline" size="sm" onClick={handleExportPDF} disabled={isExporting} className="gap-2">
          {isExporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileDown className="h-4 w-4" />}
          {isExporting ? "Đang xuất..." : "Xuất PDF"}
        </Button>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div ref={contentRef}>
        <CardHeader className="pb-4 pt-12">
          <div className="flex items-start gap-4">
            {profile.photo_url ? (
              <img src={profile.photo_url} alt={profile.full_name} className="w-24 h-32 object-cover rounded-lg border" />
            ) : (
              <div className="w-24 h-32 bg-muted rounded-lg border flex items-center justify-center">
                <User className="h-12 w-12 text-muted-foreground" />
              </div>
            )}
            <div className="flex-1">
              <CardTitle className="text-xl">{profile.full_name}</CardTitle>
              {profile.furigana && <p className="text-sm text-muted-foreground mt-1">{profile.furigana}</p>}
              <div className="flex flex-wrap gap-2 mt-2">
                <Badge variant="outline">{profile.trainee_code}</Badge>
                <Badge variant="secondary">{getTypeLabel(profile.trainee_type)}</Badge>
                {profile.workflow?.current_stage && (
                  <Badge className="bg-primary">{getStageLabel(profile.workflow.current_stage)}</Badge>
                )}
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          <div>
            <h3 className="font-semibold flex items-center gap-2 mb-3"><User className="h-4 w-4" />Thông tin cá nhân</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
              <div><span className="text-muted-foreground">Ngày sinh:</span><span className="ml-2">{formatDate(profile.birth_date)}</span></div>
              <div><span className="text-muted-foreground">Giới tính:</span><span className="ml-2">{profile.gender === "male" ? "Nam" : profile.gender === "female" ? "Nữ" : "—"}</span></div>
              <div><span className="text-muted-foreground">Nơi sinh:</span><span className="ml-2">{profile.birthplace || "—"}</span></div>
              <div><span className="text-muted-foreground">Nguồn:</span><span className="ml-2">{profile.source || "—"}</span></div>
            </div>
          </div>

          <Separator />

          <div>
            <h3 className="font-semibold flex items-center gap-2 mb-3"><Phone className="h-4 w-4" />Thông tin liên lạc</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
              <div><span className="text-muted-foreground">Điện thoại:</span><span className="ml-2">{profile.phone || "—"}</span></div>
              <div><span className="text-muted-foreground">Zalo:</span><span className="ml-2">{profile.zalo || "—"}</span></div>
              <div><span className="text-muted-foreground">Email:</span><span className="ml-2">{profile.email || "—"}</span></div>
            </div>
          </div>

          <Separator />

          <div>
            <h3 className="font-semibold flex items-center gap-2 mb-3"><MapPin className="h-4 w-4" />Địa chỉ</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div><span className="text-muted-foreground">Địa chỉ thường trú:</span><p className="mt-1">{profile.permanent_address || "—"}</p></div>
              <div><span className="text-muted-foreground">Địa chỉ hiện tại:</span><p className="mt-1">{profile.current_address || "—"}</p></div>
            </div>
          </div>

          <Separator />

          <div>
            <h3 className="font-semibold flex items-center gap-2 mb-3"><Briefcase className="h-4 w-4" />Giấy tờ</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
              <div><span className="text-muted-foreground">Số CCCD:</span><span className="ml-2">{profile.cccd_number || "—"}</span></div>
              <div><span className="text-muted-foreground">Ngày cấp CCCD:</span><span className="ml-2">{formatDate(profile.cccd_date)}</span></div>
              <div><span className="text-muted-foreground">Số hộ chiếu:</span><span className="ml-2">{profile.passport_number || "—"}</span></div>
              <div><span className="text-muted-foreground">Ngày cấp HC:</span><span className="ml-2">{formatDate(profile.passport_date)}</span></div>
            </div>
          </div>

          <Separator />

          <div>
            <h3 className="font-semibold flex items-center gap-2 mb-3"><Building2 className="h-4 w-4" />Công ty & Nghiệp đoàn</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
              <div><span className="text-muted-foreground">Công ty:</span><span className="ml-2">{profile.company?.name || "—"}</span></div>
              <div><span className="text-muted-foreground">Nghiệp đoàn:</span><span className="ml-2">{profile.union?.name || "—"}</span></div>
              <div><span className="text-muted-foreground">Ngành nghề:</span><span className="ml-2">{profile.job_category?.name || "—"}</span></div>
            </div>
          </div>

          <Separator />

          <div>
            <h3 className="font-semibold flex items-center gap-2 mb-3"><GraduationCap className="h-4 w-4" />Lớp học</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
              <div><span className="text-muted-foreground">Mã lớp:</span><span className="ml-2">{profile.class?.code || "—"}</span></div>
              <div><span className="text-muted-foreground">Tên lớp:</span><span className="ml-2">{profile.class?.name || "—"}</span></div>
              <div><span className="text-muted-foreground">Trạng thái học:</span><span className="ml-2">{profile.enrollment_status || "—"}</span></div>
            </div>
          </div>

          <Separator />

          <div>
            <h3 className="font-semibold flex items-center gap-2 mb-3"><Calendar className="h-4 w-4" />Mốc thời gian</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
              <div><span className="text-muted-foreground">Ngày nhập học:</span><span className="ml-2">{formatDate(profile.entry_date)}</span></div>
              <div><span className="text-muted-foreground">Đậu phỏng vấn:</span><span className="ml-2">{formatDate(profile.interview_pass_date)}</span></div>
              <div><span className="text-muted-foreground">Nộp hồ sơ:</span><span className="ml-2">{formatDate(profile.document_submission_date)}</span></div>
              <div><span className="text-muted-foreground">COE:</span><span className="ml-2">{formatDate(profile.coe_date)}</span></div>
              <div><span className="text-muted-foreground">Visa:</span><span className="ml-2">{formatDate(profile.visa_date)}</span></div>
              <div><span className="text-muted-foreground">Xuất cảnh:</span><span className="ml-2">{formatDate(profile.departure_date)}</span></div>
              <div><span className="text-muted-foreground">Về nước:</span><span className="ml-2">{formatDate(profile.return_date)}</span></div>
              <div><span className="text-muted-foreground">Dự kiến về:</span><span className="ml-2">{formatDate(profile.expected_return_date)}</span></div>
            </div>
          </div>

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
      </div>
    </Card>
  );
}
