import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trainee } from "@/types/trainee";
import { format } from "date-fns";
import { Calendar, CheckCircle2, Circle } from "lucide-react";

interface StatusTimelineProps {
  trainee: Trainee;
}

export function StatusTimeline({ trainee }: StatusTimelineProps) {
  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return null;
    try {
      return format(new Date(dateStr), "dd/MM/yyyy");
    } catch {
      return null;
    }
  };

  const formatDateTime = (dateStr: string | null) => {
    if (!dateStr) return "—";
    try {
      return format(new Date(dateStr), "dd/MM/yyyy HH:mm");
    } catch {
      return "—";
    }
  };

  // Define timeline milestones
  const milestones = [
    { 
      label: "Đăng ký", 
      date: trainee.registration_date,
      completed: !!trainee.registration_date
    },
    { 
      label: "Ngày phỏng vấn", 
      date: trainee.interview_pass_date,
      completed: !!trainee.interview_pass_date
    },
    { 
      label: "Nộp hồ sơ", 
      date: trainee.document_submission_date,
      completed: !!trainee.document_submission_date
    },
    { 
      label: "OTIT", 
      date: trainee.otit_entry_date,
      completed: !!trainee.otit_entry_date
    },
    { 
      label: "Nyukan", 
      date: trainee.nyukan_entry_date,
      completed: !!trainee.nyukan_entry_date
    },
    { 
      label: "COE", 
      date: trainee.coe_date,
      completed: !!trainee.coe_date
    },
    { 
      label: "Visa", 
      date: trainee.visa_date,
      completed: !!trainee.visa_date
    },
    { 
      label: "Xuất cảnh", 
      date: trainee.departure_date,
      completed: !!trainee.departure_date
    },
  ];

  // Filter to show only relevant milestones (completed or next one)
  const relevantMilestones = milestones.filter((m, index) => {
    if (m.completed) return true;
    // Show the first incomplete milestone
    const previousAllCompleted = milestones.slice(0, index).every(prev => prev.completed);
    return previousAllCompleted && index === milestones.findIndex(ms => !ms.completed);
  });

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Calendar className="h-4 w-4" />
          Mốc thời gian
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Current Status */}
          <div className="flex items-center gap-3 pb-3 border-b">
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm text-muted-foreground">Trạng thái:</span>
                {trainee.simple_status && (
                  <Badge variant="outline" className="bg-primary/10">{trainee.simple_status}</Badge>
                )}
                {trainee.progression_stage && (
                  <Badge variant="secondary">{trainee.progression_stage}</Badge>
                )}
              </div>
            </div>
          </div>

          {/* Timeline Milestones */}
          <div className="space-y-2">
            {relevantMilestones.map((milestone, index) => (
              <div key={milestone.label} className="flex items-center gap-3">
                {milestone.completed ? (
                  <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
                ) : (
                  <Circle className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                )}
                <div className="flex-1 flex items-center justify-between gap-2">
                  <span className={`text-sm ${milestone.completed ? 'text-foreground' : 'text-muted-foreground'}`}>
                    {milestone.label}
                  </span>
                  <span className={`text-sm ${milestone.completed ? 'font-medium text-primary' : 'text-muted-foreground'}`}>
                    {formatDate(milestone.date) || "—"}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Return dates if applicable */}
          {(trainee.return_date || trainee.early_return_date) && (
            <div className="pt-3 border-t space-y-2">
              {trainee.return_date && (
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-4 w-4 text-blue-600 flex-shrink-0" />
                  <div className="flex-1 flex items-center justify-between gap-2">
                    <span className="text-sm">Về nước</span>
                    <span className="text-sm font-medium text-blue-600">
                      {formatDate(trainee.return_date)}
                    </span>
                  </div>
                </div>
              )}
              {trainee.early_return_date && (
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-4 w-4 text-orange-600 flex-shrink-0" />
                  <div className="flex-1 flex items-center justify-between gap-2">
                    <span className="text-sm">Về trước hạn</span>
                    <span className="text-sm font-medium text-orange-600">
                      {formatDate(trainee.early_return_date)}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Created/Updated */}
          <div className="pt-3 border-t text-xs text-muted-foreground space-y-1">
            <p>Tạo: {formatDateTime(trainee.created_at)}</p>
            <p>Cập nhật: {formatDateTime(trainee.updated_at)}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
