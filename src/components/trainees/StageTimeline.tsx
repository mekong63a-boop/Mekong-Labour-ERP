import { useStageTimeline } from "@/hooks/useStageTransition";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Clock, ArrowRight, User, AlertCircle } from "lucide-react";
import { formatVietnameseDatetime } from "@/lib/vietnamese-utils";

interface StageTimelineProps {
  traineeId: string;
}

const stageColorMap: Record<string, string> = {
  slate: "bg-slate-100 text-slate-800 border-slate-300",
  blue: "bg-blue-100 text-blue-800 border-blue-300",
  cyan: "bg-cyan-100 text-cyan-800 border-cyan-300",
  green: "bg-green-100 text-green-800 border-green-300",
  amber: "bg-amber-100 text-amber-800 border-amber-300",
  orange: "bg-orange-100 text-orange-800 border-orange-300",
  purple: "bg-purple-100 text-purple-800 border-purple-300",
  indigo: "bg-indigo-100 text-indigo-800 border-indigo-300",
  red: "bg-red-100 text-red-800 border-red-300",
  gray: "bg-gray-100 text-gray-800 border-gray-300",
};

export function StageTimeline({ traineeId }: StageTimelineProps) {
  const { data, isLoading, error } = useStageTimeline(traineeId);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-destructive">
          <AlertCircle className="h-8 w-8 mx-auto mb-2" />
          Lỗi tải timeline trạng thái
        </CardContent>
      </Card>
    );
  }

  const { current, history } = data || { current: null, history: [] };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Lịch sử trạng thái
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Current Stage */}
        {current && (
          <div className="mb-6 p-4 rounded-lg border-2 border-primary/20 bg-primary/5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Trạng thái hiện tại</p>
                <Badge 
                  className={`text-sm px-3 py-1 ${stageColorMap[current.ui_color] || stageColorMap.gray}`}
                >
                  {current.stage_name}
                </Badge>
                {current.stage_name_jp && (
                  <span className="ml-2 text-sm text-muted-foreground">
                    ({current.stage_name_jp})
                  </span>
                )}
              </div>
              {current.sub_status && (
                <Badge variant="outline" className="text-xs">
                  {current.sub_status}
                </Badge>
              )}
            </div>
            {current.transitioned_at && (
              <p className="text-xs text-muted-foreground mt-2">
                Cập nhật: {formatVietnameseDatetime(current.transitioned_at)}
              </p>
            )}
          </div>
        )}

        {/* History Timeline */}
        {history && history.length > 0 ? (
          <div className="space-y-3">
            {history.map((entry, index) => (
              <div
                key={entry.id}
                className={`relative pl-6 pb-3 ${
                  index < history.length - 1 ? "border-l-2 border-muted" : ""
                }`}
              >
                {/* Timeline dot */}
                <div className="absolute left-0 top-0 w-3 h-3 rounded-full bg-muted-foreground/30 -translate-x-[5px]" />
                
                <div className="flex items-start gap-2 flex-wrap">
                  {entry.from_name && (
                    <>
                      <Badge variant="outline" className="text-xs">
                        {entry.from_name}
                      </Badge>
                      <ArrowRight className="h-4 w-4 text-muted-foreground mt-0.5" />
                    </>
                  )}
                  <Badge variant="secondary" className="text-xs">
                    {entry.to_name}
                  </Badge>
                  {entry.sub_status && (
                    <Badge variant="outline" className="text-xs bg-red-50 text-red-700">
                      {entry.sub_status}
                    </Badge>
                  )}
                </div>

                <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                  <span>
                    {formatVietnameseDatetime(entry.changed_at)}
                  </span>
                  {entry.changed_by && (
                    <span className="flex items-center gap-1">
                      <User className="h-3 w-3" />
                      {entry.changed_by}
                    </span>
                  )}
                </div>

                {entry.reason && (
                  <p className="text-xs text-muted-foreground mt-1 italic">
                    "{entry.reason}"
                  </p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-muted-foreground text-sm py-4">
            Chưa có lịch sử thay đổi trạng thái
          </p>
        )}
      </CardContent>
    </Card>
  );
}
