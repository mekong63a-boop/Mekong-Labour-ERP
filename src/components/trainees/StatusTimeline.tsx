import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trainee } from "@/types/trainee";
import { format } from "date-fns";

interface StatusTimelineProps {
  trainee: Trainee;
}

export function StatusTimeline({ trainee }: StatusTimelineProps) {
  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "—";
    try {
      return format(new Date(dateStr), "dd/MM/yyyy HH:mm");
    } catch {
      return "—";
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Lịch sử trạng thái</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-3 h-3 rounded-full bg-primary" />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-medium">Trạng thái hiện tại:</span>
                {trainee.simple_status && (
                  <Badge variant="outline">{trainee.simple_status}</Badge>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="w-3 h-3 rounded-full bg-secondary" />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-medium">Giai đoạn:</span>
                {trainee.progression_stage && (
                  <Badge variant="secondary">{trainee.progression_stage}</Badge>
                )}
              </div>
            </div>
          </div>

          <div className="border-t pt-4 mt-4">
            <p className="text-sm text-muted-foreground">
              Tạo lúc: {formatDate(trainee.created_at)}
            </p>
            <p className="text-sm text-muted-foreground">
              Cập nhật lúc: {formatDate(trainee.updated_at)}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
