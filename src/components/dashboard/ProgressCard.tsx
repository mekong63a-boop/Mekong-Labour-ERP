import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Clock } from "lucide-react";

interface ProgressCardProps {
  title: string;
  label: string;
  value: number;
  max: number;
  isLoading?: boolean;
  showLastUpdated?: boolean;
  lastUpdated?: string;
}

export function ProgressCard({
  title,
  label,
  value,
  max,
  isLoading = false,
  showLastUpdated = false,
  lastUpdated,
}: ProgressCardProps) {
  const percentage = max > 0 ? Math.round((value / max) * 100) : 0;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base font-semibold">{title}</CardTitle>
        {showLastUpdated && lastUpdated && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            <span>Cập nhật {lastUpdated}</span>
          </div>
        )}
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-2 w-full" />
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-foreground">{label}</span>
              <span className="text-lg font-bold text-primary">{percentage}%</span>
            </div>
            <Progress value={percentage} className="h-2" />
            <p className="text-xs text-muted-foreground">
              {value} / {max} hoàn thành
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
