import { useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { 
  User, Phone, Mail, MapPin, Building2, Calendar, 
  FileText, AlertTriangle, X, Printer
} from "lucide-react";
import { TraineeProfile } from "../hooks/useTraineeProfile";
import { format } from "date-fns";
import { vi } from "date-fns/locale";

interface TraineeProfileViewProps {
  profile: TraineeProfile;
  onClose: () => void;
}

const formatDate = (dateStr: string | null | undefined): string => {
  if (!dateStr) return "—";
  try {
    return format(new Date(dateStr), "dd/MM/yyyy", { locale: vi });
  } catch {
    return dateStr;
  }
};

const getStageLabel = (stage: string | null | undefined): string => {
  const labels: Record<string, string> = {
    recruited: "Mới tuyển",
    trained: "Đang học",
    dormitory: "Chờ xuất cảnh",
    visa_processing: "Xử lý visa",
    ready_to_depart: "Sẵn sàng XC",
    departed: "Đã xuất cảnh",
    post_departure: "Đang ở Nhật",
    archived: "Lưu trữ",
  };
  return labels[stage || ""] || stage || "—";
};

const getTypeLabel = (type: string | null | undefined): string => {
  const labels: Record<string, string> = {
    TTS: "Thực tập sinh",
    Tokutei: "Tokutei Ginou",
    "Kỹ_sư": "Kỹ sư",
  };
  return labels[type || ""] || type || "—";
};

export function TraineeProfileView({ profile, onClose }: TraineeProfileViewProps) {
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    const printContent = printRef.current;
    if (!printContent) return;

    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      alert("Vui lòng cho phép popup để xuất PDF");
      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Hồ sơ học viên - ${profile.trainee_code}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Segoe UI', Arial, sans-serif; padding: 20px; color: #333; }
          .header { display: flex; justify-content: space-between; align-items: start; margin-bottom: 20px; border-bottom: 2px solid #166534; padding-bottom: 15px; }
          .name { font-size: 24px; font-weight: bold; color: #166534; }
          .furigana { font-size: 14px; color: #666; margin-top: 4px; }
          .badges { display: flex; gap: 8px; }
          .badge { padding: 4px 12px; border-radius: 4px; font-size: 12px; font-weight: 500; }
          .badge-green { background: #dcfce7; color: #166534; }
          .badge-yellow { background: #fef3c7; color: #92400e; }
          .section { margin-bottom: 20px; }
          .section-title { font-size: 14px; font-weight: 600; color: #166534; margin-bottom: 10px; border-bottom: 1px solid #e5e7eb; padding-bottom: 5px; }
          .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
          .field { margin-bottom: 8px; }
          .field-label { font-size: 12px; color: #666; }
          .field-value { font-size: 14px; font-weight: 500; }
          .timeline { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-top: 10px; }
          .timeline-card { padding: 10px; border-radius: 6px; background: #f3f4f6; }
          .timeline-card.highlight { background: #fef3c7; }
          .timeline-label { font-size: 11px; color: #166534; margin-bottom: 4px; }
          .timeline-value { font-size: 14px; font-weight: 600; }
          @media print { body { padding: 10px; } }
        </style>
      </head>
      <body>
        ${printContent.innerHTML}
      </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  return (
    <Card className="border-primary/20">
      {/* Print-ready content */}
      <div ref={printRef} className="print-content">
        <CardContent className="p-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-3">
              <User className="h-6 w-6 text-primary print:hidden" />
              <div>
                <h2 className="text-lg font-semibold text-primary">
                  Thông tin học viên: {profile.trainee_code}
                </h2>
              </div>
            </div>
            <div className="flex items-center gap-2 print:hidden">
              <Button variant="outline" size="sm" onClick={handlePrint}>
                <Printer className="h-4 w-4 mr-1" />
                Xuất PDF
              </Button>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Name & Status */}
          <div className="flex items-start justify-between mb-6 pb-4 border-b">
            <div>
              <h1 className="text-2xl font-bold text-primary name">{profile.full_name}</h1>
              {profile.furigana && (
                <p className="text-sm text-muted-foreground mt-1 furigana">{profile.furigana}</p>
              )}
            </div>
            <div className="flex gap-2 badges">
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 badge badge-green">
                {getStageLabel(profile.workflow?.current_stage || profile.progression_stage)}
              </Badge>
              {profile.coe_date && (
                <Badge className="bg-amber-500 badge badge-yellow">COE</Badge>
              )}
            </div>
          </div>

          {/* Main content grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Personal Info */}
            <div className="section">
              <h3 className="text-sm font-semibold text-primary mb-3 flex items-center gap-2 section-title">
                <span className="print:hidden">📋</span> Thông tin cá nhân
              </h3>
              <div className="space-y-2">
                <div className="flex field">
                  <span className="text-muted-foreground text-sm w-24 field-label">Ngày sinh:</span>
                  <span className="font-medium field-value">{formatDate(profile.birth_date)}</span>
                </div>
                <div className="flex field">
                  <span className="text-muted-foreground text-sm w-24 field-label">Giới tính:</span>
                  <span className="font-medium field-value">{profile.gender || "—"}</span>
                </div>
                <div className="flex field">
                  <span className="text-muted-foreground text-sm w-24 field-label">Loại hình:</span>
                  <span className="font-medium field-value">{getTypeLabel(profile.trainee_type)}</span>
                </div>
                <div className="flex field">
                  <span className="text-muted-foreground text-sm w-24 field-label">Nguồn:</span>
                  <span className="font-medium field-value">{profile.source || "—"}</span>
                </div>
              </div>
            </div>

            {/* Contact Info */}
            <div className="section">
              <h3 className="text-sm font-semibold text-primary mb-3 flex items-center gap-2 section-title">
                <Phone className="h-4 w-4 print:hidden" /> Liên hệ
              </h3>
              <div className="space-y-2">
                <div className="flex field">
                  <span className="text-muted-foreground text-sm w-24 field-label">SĐT:</span>
                  <span className="font-medium field-value">{profile.phone || "—"}</span>
                </div>
                <div className="flex field">
                  <span className="text-muted-foreground text-sm w-24 field-label">Zalo:</span>
                  <span className="font-medium field-value">{profile.zalo || "—"}</span>
                </div>
                <div className="flex field">
                  <span className="text-muted-foreground text-sm w-24 field-label">CCCD:</span>
                  <span className="font-medium field-value">{profile.cccd_number || "—"}</span>
                </div>
                <div className="flex field">
                  <span className="text-muted-foreground text-sm w-24 field-label">Hộ chiếu:</span>
                  <span className="font-medium field-value">{profile.passport_number || "—"}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Address & Company */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Address */}
            <div className="section">
              <h3 className="text-sm font-semibold text-primary mb-3 flex items-center gap-2 section-title">
                <MapPin className="h-4 w-4 print:hidden" /> Địa chỉ
              </h3>
              <div className="space-y-2">
                <div className="flex field">
                  <span className="text-muted-foreground text-sm w-24 shrink-0 field-label">Thường trú:</span>
                  <span className="font-medium field-value">{profile.permanent_address || "—"}</span>
                </div>
                <div className="flex field">
                  <span className="text-muted-foreground text-sm w-24 shrink-0 field-label">Hiện tại:</span>
                  <span className="font-medium field-value">{profile.current_address || "—"}</span>
                </div>
              </div>
            </div>

            {/* Company */}
            <div className="section">
              <h3 className="text-sm font-semibold text-primary mb-3 flex items-center gap-2 section-title">
                <Building2 className="h-4 w-4 print:hidden" /> Công việc
              </h3>
              <div className="space-y-2">
                <div className="flex field">
                  <span className="text-muted-foreground text-sm w-24 shrink-0 field-label">Công ty:</span>
                  <span className="font-medium field-value">
                    {profile.company?.name_japanese || profile.company?.name || "—"}
                  </span>
                </div>
                <div className="flex field">
                  <span className="text-muted-foreground text-sm w-24 shrink-0 field-label">Nghiệp đoàn:</span>
                  <span className="font-medium field-value">
                    {profile.union?.name_japanese || profile.union?.name || "—"}
                  </span>
                </div>
                <div className="flex field">
                  <span className="text-muted-foreground text-sm w-24 shrink-0 field-label">Nghề:</span>
                  <span className="font-medium field-value">{profile.job_category?.name || "—"}</span>
                </div>
                <div className="flex field">
                  <span className="text-muted-foreground text-sm w-24 shrink-0 field-label">Đơn hàng:</span>
                  <span className="font-medium field-value">—</span>
                </div>
              </div>
            </div>
          </div>

          <Separator className="my-4" />

          {/* Timeline */}
          <div className="section">
            <h3 className="text-sm font-semibold text-primary mb-3 flex items-center gap-2 section-title">
              <Calendar className="h-4 w-4 print:hidden" /> Quá trình
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 timeline">
              <TimelineCard label="Ngày nhập học" value={profile.entry_date} />
              <TimelineCard label="Ngày đậu PV" value={profile.interview_pass_date} />
              <TimelineCard label="Ngày nộp hồ sơ" value={profile.document_submission_date} />
              <TimelineCard label="Ngày OTIT" value={profile.otit_entry_date} />
              <TimelineCard label="Ngày Nyukan" value={profile.nyukan_entry_date} />
              <TimelineCard label="Ngày có COE" value={profile.coe_date} />
              <TimelineCard label="Ngày xuất cảnh" value={profile.departure_date} highlight />
              <TimelineCard label="Ngày về nước" value={profile.return_date} />
            </div>
          </div>

          {/* Notes & Violations */}
          {(profile.trainee_notes?.length > 0 || profile.violations?.length > 0) && (
            <>
              <Separator className="my-4" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {profile.trainee_notes?.length > 0 && (
                  <div className="section">
                    <h3 className="text-sm font-semibold text-primary mb-3 flex items-center gap-2 section-title">
                      <FileText className="h-4 w-4 print:hidden" /> Ghi chú
                    </h3>
                    <div className="space-y-2">
                      {profile.trainee_notes.slice(0, 3).map((note) => (
                        <div key={note.id} className="text-sm p-2 bg-muted rounded">
                          <span className="text-muted-foreground">[{note.note_type}]</span> {note.content}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {profile.violations?.length > 0 && (
                  <div className="section">
                    <h3 className="text-sm font-semibold text-destructive mb-3 flex items-center gap-2 section-title">
                      <AlertTriangle className="h-4 w-4 print:hidden" /> Vi phạm
                    </h3>
                    <div className="space-y-2">
                      {profile.violations.slice(0, 3).map((v) => (
                        <div key={v.id} className="text-sm p-2 bg-destructive/10 rounded text-destructive">
                          [{v.violation_type}] {v.description}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </CardContent>
      </div>
    </Card>
  );
}

// Timeline card component
function TimelineCard({ 
  label, 
  value, 
  highlight = false 
}: { 
  label: string; 
  value: string | null | undefined; 
  highlight?: boolean;
}) {
  return (
    <div className={`p-3 rounded-lg border timeline-card ${highlight ? "bg-amber-50 border-amber-200 highlight" : "bg-muted/50"}`}>
      <p className="text-xs text-primary font-medium mb-1 timeline-label">{label}</p>
      <p className="text-sm font-semibold timeline-value">{formatDate(value)}</p>
    </div>
  );
}
