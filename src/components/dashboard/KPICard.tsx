import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface KPICardProps {
  title: string;
  value: number | string;
  subtitle?: string;
  icon: React.ElementType;
  iconColor: "blue" | "green" | "orange" | "purple" | "red";
  isLoading?: boolean;
  growthPercent?: number;
  onClick?: () => void;
  clickable?: boolean;
  ratio?: { current: number; total: number };
}

const iconColorClasses = {
  blue: "bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-400",
  green: "bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400",
  orange: "bg-orange-100 text-orange-600 dark:bg-orange-950 dark:text-orange-400",
  purple: "bg-purple-100 text-purple-600 dark:bg-purple-950 dark:text-purple-400",
  red: "bg-red-100 text-red-600 dark:bg-red-950 dark:text-red-400",
};

export function KPICard({
  title,
  value,
  subtitle,
  icon: Icon,
  iconColor,
  isLoading = false,
  growthPercent,
  onClick,
  clickable = false,
  ratio,
}: KPICardProps) {
  return (
    <Card
      className={cn(
        "bg-card border shadow-sm transition-all duration-200",
        clickable && "cursor-pointer hover:shadow-lg hover:-translate-y-0.5"
      )}
      onClick={clickable ? onClick : undefined}
    >
      <CardContent className="p-5">
        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-12 w-12 rounded-2xl" />
            <Skeleton className="h-8 w-20" />
            <Skeleton className="h-4 w-32" />
          </div>
        ) : (
          <div className="space-y-3">
            {/* Icon Box */}
            <div
              className={cn(
                "w-12 h-12 rounded-2xl flex items-center justify-center",
                iconColorClasses[iconColor]
              )}
            >
              <Icon className="h-6 w-6" />
            </div>

            {/* Value */}
            <div className="space-y-1">
              {ratio ? (
                <div className="text-2xl font-bold text-foreground">
                  <span className="text-primary">{ratio.current}</span>
                  <span className="text-muted-foreground mx-1">/</span>
                  <span>{ratio.total}</span>
                </div>
              ) : (
                <div className="text-2xl font-bold text-foreground">{value}</div>
              )}
              
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                {title}
              </p>
              
              {subtitle && (
                <p className="text-xs text-muted-foreground">{subtitle}</p>
              )}
            </div>

            {/* Growth Indicator */}
            {growthPercent !== undefined && (
              <div
                className={cn(
                  "flex items-center gap-1 text-xs font-medium",
                  growthPercent >= 0 ? "text-emerald-600" : "text-red-600"
                )}
              >
                {growthPercent >= 0 ? (
                  <TrendingUp className="h-3 w-3" />
                ) : (
                  <TrendingDown className="h-3 w-3" />
                )}
                <span>{growthPercent >= 0 ? "+" : ""}{growthPercent}%</span>
                <span className="text-muted-foreground font-normal">so với tháng trước</span>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
