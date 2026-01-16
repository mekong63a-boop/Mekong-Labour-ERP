import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Trainee } from "@/types/trainee";
import { useInterviewHistory } from "@/hooks/useTraineeHistory";
import { Building2, Calendar, FileText, CheckCircle, XCircle, Clock } from "lucide-react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";

interface ProjectInterviewTabProps {
  trainee: Trainee;
}

export function ProjectInterviewTab({ trainee }: ProjectInterviewTabProps) {
  const { data: interviews, isLoading } = useInterviewHistory(trainee.id);

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "—";
    try {
      return format(new Date(dateStr), "dd/MM/yyyy", { locale: vi });
    } catch {
      return "—";
    }
  };

  // Check if trainee has passed interview (to determine if we should show "Chờ kết quả")
  const hasPassedInterview = trainee.progression_stage && 
    trainee.progression_stage !== "Chưa đậu";

  const getResultBadge = (result: string | null, isLatestInterview: boolean) => {
    switch (result?.toLowerCase()) {
      case "đậu":
      case "passed":
        return (
          <Badge className="bg-green-100 text-green-800">
            <CheckCircle className="h-3 w-3 mr-1" />
            Đậu
          </Badge>
        );
      case "rớt":
      case "failed":
        return (
          <Badge className="bg-red-100 text-red-800">
            <XCircle className="h-3 w-3 mr-1" />
            Rớt
          </Badge>
        );
      case "chờ":
      case "pending":
        // If trainee has passed interview, show "Đậu" instead of "Chờ kết quả" for the latest interview
        if (hasPassedInterview && isLatestInterview) {
          return (
            <Badge className="bg-green-100 text-green-800">
              <CheckCircle className="h-3 w-3 mr-1" />
              Đậu
            </Badge>
          );
        }
        return (
          <Badge className="bg-yellow-100 text-yellow-800">
            <Clock className="h-3 w-3 mr-1" />
            Chờ kết quả
          </Badge>
        );
      default:
        // If no result but trainee has passed interview and this is the latest interview
        if (!result && hasPassedInterview && isLatestInterview) {
          return (
            <Badge className="bg-green-100 text-green-800">
              <CheckCircle className="h-3 w-3 mr-1" />
              Đậu
            </Badge>
          );
        }
        return <Badge variant="secondary">{result || "—"}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Current Project Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Building2 className="h-5 w-5 text-primary" />
            Thông tin dự án hiện tại
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          <div>
            <Label className="text-muted-foreground text-xs">Loại TTS</Label>
            <p className="font-medium">{trainee.trainee_type || "—"}</p>
          </div>
          <div>
            <Label className="text-muted-foreground text-xs">Giai đoạn</Label>
            <Badge className="mt-1">{trainee.progression_stage || "Chưa đậu"}</Badge>
          </div>
          <div>
            <Label className="text-muted-foreground text-xs">Số lần phỏng vấn</Label>
            <p className="text-2xl font-bold text-primary">
              {interviews?.length || 0}
            </p>
          </div>
          <div>
            <Label className="text-muted-foreground text-xs">Tháng dự kiến nhập cảnh</Label>
            <p>{trainee.expected_entry_month || "—"}</p>
          </div>
        </CardContent>
      </Card>

      {/* Process Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Calendar className="h-5 w-5 text-primary" />
            Mốc thời gian xử lý hồ sơ
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
            <div className="p-3 border rounded-lg text-center">
              <p className="text-xs text-muted-foreground">Đậu phỏng vấn</p>
              <p className="font-medium text-sm mt-1">
                {/* Show interview pass date from trainee or from latest passed interview */}
                {trainee.interview_pass_date 
                  ? formatDate(trainee.interview_pass_date)
                  : interviews && interviews.length > 0 && interviews.some((i: any) => 
                      i.result?.toLowerCase() === "đậu" || i.result?.toLowerCase() === "passed"
                    )
                    ? formatDate(
                        interviews.find((i: any) => 
                          i.result?.toLowerCase() === "đậu" || i.result?.toLowerCase() === "passed"
                        )?.interview_date
                      )
                    : "—"
                }
              </p>
            </div>
            <div className="p-3 border rounded-lg text-center">
              <p className="text-xs text-muted-foreground">Nộp hồ sơ</p>
              <p className="font-medium text-sm mt-1">
                {formatDate(trainee.document_submission_date)}
              </p>
            </div>
            <div className="p-3 border rounded-lg text-center">
              <p className="text-xs text-muted-foreground">OTIT</p>
              <p className="font-medium text-sm mt-1">
                {formatDate(trainee.otit_entry_date)}
              </p>
            </div>
            <div className="p-3 border rounded-lg text-center">
              <p className="text-xs text-muted-foreground">Nyukan</p>
              <p className="font-medium text-sm mt-1">
                {formatDate(trainee.nyukan_entry_date)}
              </p>
            </div>
            <div className="p-3 border rounded-lg text-center">
              <p className="text-xs text-muted-foreground">COE</p>
              <p className="font-medium text-sm mt-1">
                {formatDate(trainee.coe_date)}
              </p>
            </div>
            <div className="p-3 border rounded-lg text-center">
              <p className="text-xs text-muted-foreground">Xuất cảnh</p>
              <p className="font-medium text-sm mt-1">
                {formatDate(trainee.departure_date)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Departure & Contract */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Xuất cảnh & Hợp đồng</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <Label className="text-muted-foreground text-xs">Ngày xuất cảnh</Label>
            <p className="font-medium">{formatDate(trainee.departure_date)}</p>
          </div>
          <div>
            <Label className="text-muted-foreground text-xs">Thời hạn hợp đồng</Label>
            <p className="font-medium">{trainee.contract_term ? `${trainee.contract_term} năm` : "—"}</p>
          </div>
          <div>
            <Label className="text-muted-foreground text-xs">Ngày dự kiến về nước</Label>
            <p className="font-medium">{formatDate(trainee.expected_return_date)}</p>
          </div>
          <div>
            <Label className="text-muted-foreground text-xs">Ngày về nước thực tế</Label>
            <p className="font-medium">{formatDate(trainee.return_date)}</p>
          </div>
          <div>
            <Label className="text-muted-foreground text-xs">Ngày hết hợp đồng</Label>
            <p className="font-medium">{formatDate(trainee.contract_end_date)}</p>
          </div>
          {trainee.early_return_date && (
            <>
              <div>
                <Label className="text-muted-foreground text-xs">Ngày về sớm</Label>
                <p className="font-medium text-destructive">
                  {formatDate(trainee.early_return_date)}
                </p>
              </div>
              <div>
                <Label className="text-muted-foreground text-xs">Lý do về sớm</Label>
                <p className="text-destructive">{trainee.early_return_reason || "—"}</p>
              </div>
            </>
          )}
          {trainee.absconded_date && (
            <div>
              <Label className="text-muted-foreground text-xs">Ngày bỏ trốn</Label>
              <p className="font-medium text-destructive">
                {formatDate(trainee.absconded_date)}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Interview History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <FileText className="h-5 w-5 text-primary" />
            Lịch sử phỏng vấn
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-20 w-full" />
          ) : !interviews || interviews.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              Chưa có lịch sử phỏng vấn
            </p>
          ) : (
            <div className="space-y-4">
              {interviews.map((interview: any, index: number) => (
                <div
                  key={interview.id}
                  className="relative pl-8 pb-4 border-l-2 border-primary/30 last:border-l-0"
                >
                  <div className="absolute left-[-9px] top-0 h-4 w-4 rounded-full bg-primary" />
                  <div className="bg-muted/30 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-medium">
                          Phỏng vấn lần {interviews.length - index}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {formatDate(interview.interview_date)}
                        </p>
                      </div>
                      {getResultBadge(interview.result, index === 0)}
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm mt-3">
                      <div>
                        <span className="text-muted-foreground">Công ty: </span>
                        <span className="font-medium">
                          {interview.companies?.name || "—"}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Nghiệp đoàn: </span>
                        <span className="font-medium">
                          {interview.unions?.name || "—"}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Ngành nghề: </span>
                        <span className="font-medium">
                          {interview.job_categories?.name || "—"}
                        </span>
                      </div>
                      {interview.expected_entry_month && (
                        <div>
                          <span className="text-muted-foreground">Tháng dự kiến: </span>
                          <span className="font-medium">
                            {interview.expected_entry_month}
                          </span>
                        </div>
                      )}
                    </div>
                    {interview.notes && (
                      <p className="text-sm text-muted-foreground mt-2 pt-2 border-t">
                        {interview.notes}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
