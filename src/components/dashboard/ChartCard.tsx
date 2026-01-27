import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ReactNode } from "react";

interface ChartCardProps {
  title: string;
  children: ReactNode;
  isLoading?: boolean;
  className?: string;
  headerAction?: ReactNode;
}

export function ChartCard({
  title,
  children,
  isLoading = false,
  className = "",
  headerAction,
}: ChartCardProps) {
  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base font-semibold">{title}</CardTitle>
        {headerAction}
      </CardHeader>
      <CardContent>
        {isLoading ? <Skeleton className="h-64 w-full" /> : children}
      </CardContent>
    </Card>
  );
}
