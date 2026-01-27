import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Target } from "lucide-react";

interface TargetCardProps {
  title: string;
  achieved: number;
  target: number;
  isLoading?: boolean;
}

export function TargetCard({
  title,
  achieved,
  target,
  isLoading = false,
}: TargetCardProps) {
  const percentage = target > 0 ? Math.round((achieved / target) * 100) : 0;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base font-semibold">{title}</CardTitle>
        <Target className="h-5 w-5 text-primary" />
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-8 w-24" />
            <Skeleton className="h-2 w-full" />
          </div>
        ) : (
          <div className="space-y-3">
            <div className="text-2xl font-bold">
              <span className="text-primary">{achieved}</span>
              <span className="text-muted-foreground mx-1">/</span>
              <span>{target}</span>
            </div>
            <Progress value={percentage} className="h-2" />
            <p className="text-xs text-muted-foreground">
              Đã đạt {percentage}% chỉ tiêu
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
