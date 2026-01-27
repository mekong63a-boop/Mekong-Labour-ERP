import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import {
  Users,
  GraduationCap,
  Plane,
  FileText,
  TrendingUp,
  TrendingDown,
  Target,
  Clock,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  LabelList,
} from "recharts";
import { cn } from "@/lib/utils";

// Single Source - PostgreSQL views
import {
  useTraineeKPIs,
  useMonthlyCombined,
  useTraineeBySource,
} from "@/hooks/useDashboardTrainee";

// Color palette for charts
const DONUT_COLORS = [
  "#F97316", // Orange
  "#EF4444", // Red
  "#006633", // Mekong Green
  "#3B82F6", // Blue
  "#8B5CF6", // Purple
  "#10B981", // Emerald
];

// Bar label renderer
const renderBarLabel = (props: { x?: number; y?: number; width?: number; value?: number }) => {
  const { x = 0, y = 0, width = 0, value = 0 } = props;
  if (value === 0) return null;
  return (
    <text
      x={x + width / 2}
      y={y - 5}
      fill="#dc2626"
      fontSize={12}
      fontWeight="bold"
      textAnchor="middle"
    >
      {value}
    </text>
  );
};

// Icon color classes
const iconColorClasses = {
  blue: "bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-400",
  green: "bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400",
  orange: "bg-orange-100 text-orange-600 dark:bg-orange-950 dark:text-orange-400",
  purple: "bg-purple-100 text-purple-600 dark:bg-purple-950 dark:text-purple-400",
};

export default function TraineeDashboard() {
  const navigate = useNavigate();
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);

  // Navigate to detail list with filter
  const navigateToDetail = (filter: string) => {
    const params = new URLSearchParams();
    params.set("filter", filter);
    params.set("year", selectedYear.toString());
    navigate(`/dashboard/trainees/detail?${params.toString()}`);
  };

  // Single Source - PostgreSQL views
  const { data: kpis, isLoading: loadingKPIs } = useTraineeKPIs();
  const { data: monthlyCombined, isLoading: loadingMonthly } = useMonthlyCombined();
  const { data: sourceData, isLoading: loadingSource } = useTraineeBySource();

  // SYSTEM RULE: activeOrders từ kpis view (đã tính sẵn ở DB)
  const activeOrders = kpis?.active_orders || 0;

  // SYSTEM RULE: monthlyChartData từ dashboard_monthly_combined view
  // Chỉ format lại cho chart, không tính toán
  const monthlyChartData = useMemo(() => {
    if (!monthlyCombined) return [];
    return monthlyCombined.map((item) => ({
      month: item.month_label,
      recruitment: item.recruitment || 0,
      departure: item.departure || 0,
    }));
  }, [monthlyCombined]);

  // Generate year options (from 2020 to current + 1)
  const yearOptions = useMemo(() => {
    const years = [];
    for (let y = currentYear + 1; y >= 2020; y--) {
      years.push(y);
    }
    return years;
  }, [currentYear]);

  // Calculate growth rate from KPIs
  const growthPercent = useMemo(() => {
    if (!kpis) return 0;
    // Simple calculation: compare current month vs year average
    const yearTotal = kpis.registered_this_year || 0;
    const monthTotal = kpis.registered_this_month || 0;
    const avgPerMonth = yearTotal / 12;
    if (avgPerMonth === 0) return monthTotal > 0 ? 100 : 0;
    return Math.round(((monthTotal - avgPerMonth) / avgPerMonth) * 100);
  }, [kpis]);

  // Format time for last updated
  const lastUpdated = useMemo(() => {
    const now = new Date();
    return `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`;
  }, []);

  // Format source data for pie chart
  const sourceChartData = useMemo(() => {
    if (!sourceData) return [];
    return sourceData
      .filter(s => s.source && s.count > 0)
      .slice(0, 6)
      .map(s => ({
        name: s.source || "Khác",
        value: s.count,
      }));
  }, [sourceData]);

  // Calculate trainees in Japan (departed but not returned)
  const traineesInJapan = useMemo(() => {
    if (!kpis) return { inJapan: 0, total: 0 };
    return {
      inJapan: kpis.departed_this_year || 0,
      total: kpis.stage_departed || 0,
    };
  }, [kpis]);

  // Calculate studying count - use status_studying from KPIs
  const studyingCount = useMemo(() => {
    if (!kpis) return 0;
    return kpis.status_studying || 0;
  }, [kpis]);

  return (
    <div className="space-y-6">
      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Trainees */}
        <Card
          className="cursor-pointer hover:shadow-lg hover:-translate-y-0.5 transition-all"
          onClick={() => navigateToDetail("total")}
        >
          <CardContent className="p-5">
            {loadingKPIs ? (
              <div className="space-y-3">
                <Skeleton className="h-12 w-12 rounded-2xl" />
                <Skeleton className="h-8 w-20" />
                <Skeleton className="h-4 w-32" />
              </div>
            ) : (
              <div className="space-y-3">
                <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center", iconColorClasses.blue)}>
                  <Users className="h-6 w-6" />
                </div>
                <div className="space-y-1">
                  <div className="text-2xl font-bold text-foreground">
                    {kpis?.total_trainees || 0}
                  </div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Tổng số học viên
                  </p>
                  <p className="text-xs text-muted-foreground">Học viên toàn hệ thống</p>
                </div>
                {growthPercent !== 0 && (
                  <div className={cn(
                    "flex items-center gap-1 text-xs font-medium",
                    growthPercent >= 0 ? "text-emerald-600" : "text-red-600"
                  )}>
                    {growthPercent >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                    <span>{growthPercent >= 0 ? "+" : ""}{growthPercent}%</span>
                    <span className="text-muted-foreground font-normal">so với tháng trước</span>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Currently Studying */}
        <Card
          className="cursor-pointer hover:shadow-lg hover:-translate-y-0.5 transition-all"
          onClick={() => navigateToDetail("studying")}
        >
          <CardContent className="p-5">
            {loadingKPIs ? (
              <div className="space-y-3">
                <Skeleton className="h-12 w-12 rounded-2xl" />
                <Skeleton className="h-8 w-20" />
              </div>
            ) : (
              <div className="space-y-3">
                <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center", iconColorClasses.green)}>
                  <GraduationCap className="h-6 w-6" />
                </div>
                <div className="space-y-1">
                  <div className="text-2xl font-bold text-foreground">{studyingCount}</div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Học viên hiện tại
                  </p>
                  <p className="text-xs text-muted-foreground">Đang đào tạo</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Trainees in Japan */}
        <Card
          className="cursor-pointer hover:shadow-lg hover:-translate-y-0.5 transition-all"
          onClick={() => navigateToDetail("in_japan")}
        >
          <CardContent className="p-5">
            {loadingKPIs ? (
              <div className="space-y-3">
                <Skeleton className="h-12 w-12 rounded-2xl" />
                <Skeleton className="h-8 w-20" />
              </div>
            ) : (
              <div className="space-y-3">
                <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center", iconColorClasses.purple)}>
                  <Plane className="h-6 w-6" />
                </div>
                <div className="space-y-1">
                  <div className="text-2xl font-bold text-foreground">
                    <span className="text-primary">{traineesInJapan.inJapan}</span>
                    <span className="text-muted-foreground mx-1">/</span>
                    <span>{traineesInJapan.total}</span>
                  </div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Học viên tại Nhật
                  </p>
                  <p className="text-xs text-muted-foreground">Tỷ lệ xuất cảnh</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Active Orders */}
        <Card
          className="cursor-pointer hover:shadow-lg hover:-translate-y-0.5 transition-all"
          onClick={() => navigate("/orders")}
        >
          <CardContent className="p-5">
            {loadingKPIs ? (
              <div className="space-y-3">
                <Skeleton className="h-12 w-12 rounded-2xl" />
                <Skeleton className="h-8 w-20" />
              </div>
            ) : (
              <div className="space-y-3">
                <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center", iconColorClasses.orange)}>
                  <FileText className="h-6 w-6" />
                </div>
                <div className="space-y-1">
                  <div className="text-2xl font-bold text-foreground">{activeOrders}</div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Đơn tuyển dụng mới
                  </p>
                  <p className="text-xs text-muted-foreground">Cần bổ sung</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Charts Row - Bar Chart + Donut */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Grouped Bar Chart - Recruitment vs Departure */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base font-semibold">Tình hình tuyển dụng & Xuất cảnh</CardTitle>
            <Select
              value={selectedYear.toString()}
              onValueChange={(v) => setSelectedYear(parseInt(v))}
            >
              <SelectTrigger className="w-[100px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {yearOptions.map((y) => (
                  <SelectItem key={y} value={y.toString()}>
                    {y}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardHeader>
          <CardContent>
            {loadingMonthly ? (
              <Skeleton className="h-64 w-full" />
            ) : (
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyChartData} barGap={2} barCategoryGap="20%">
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="month" fontSize={12} tickLine={false} />
                    <YAxis fontSize={12} tickLine={false} axisLine={false} />
                    <Tooltip
                      contentStyle={{
                        borderRadius: "8px",
                        border: "1px solid hsl(var(--border))",
                      }}
                    />
                    <Legend />
                    <Bar
                      dataKey="recruitment"
                      name="Tuyển dụng"
                      fill="#22C55E"
                      radius={[4, 4, 0, 0]}
                    >
                      <LabelList dataKey="recruitment" content={renderBarLabel} />
                    </Bar>
                    <Bar
                      dataKey="departure"
                      name="Xuất cảnh"
                      fill="#3B82F6"
                      radius={[4, 4, 0, 0]}
                    >
                      <LabelList dataKey="departure" content={renderBarLabel} />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Donut Chart - Source Distribution */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Nguồn tuyển dụng</CardTitle>
          </CardHeader>
          <CardContent>
            {loadingSource ? (
              <Skeleton className="h-64 w-full" />
            ) : (
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={sourceChartData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="45%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={2}
                      label={({ percent }) =>
                        percent > 0.05 ? `${(percent * 100).toFixed(0)}%` : ""
                      }
                      labelLine={false}
                    >
                      {sourceChartData.map((_, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={DONUT_COLORS[index % DONUT_COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number, name: string) => [value, name]} />
                    <Legend
                      layout="horizontal"
                      verticalAlign="bottom"
                      wrapperStyle={{ fontSize: "11px", paddingTop: "10px" }}
                      formatter={(value, entry) => {
                        const item = sourceChartData.find((d) => d.name === value);
                        return `${value} (${item?.value || 0})`;
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row - Progress + Target */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Profile Completion Progress */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base font-semibold">Tiến độ đăng ký tháng này</CardTitle>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              <span>Cập nhật {lastUpdated}</span>
            </div>
          </CardHeader>
          <CardContent>
            {loadingKPIs ? (
              <div className="space-y-3">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-2 w-full" />
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-foreground">Đăng ký tháng này</span>
                  <span className="text-lg font-bold text-primary">
                    {kpis?.registered_this_month || 0}
                  </span>
                </div>
                <Progress 
                  value={Math.min(100, ((kpis?.registered_this_month || 0) / Math.max(1, (kpis?.registered_this_year || 1) / 12)) * 100)} 
                  className="h-2" 
                />
                <p className="text-xs text-muted-foreground">
                  {kpis?.registered_this_month || 0} / {Math.round((kpis?.registered_this_year || 0) / 12)} trung bình tháng
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Yearly Target */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base font-semibold">Chỉ tiêu năm {selectedYear}</CardTitle>
            <Target className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            {loadingKPIs ? (
              <div className="space-y-3">
                <Skeleton className="h-8 w-24" />
                <Skeleton className="h-2 w-full" />
              </div>
            ) : (
              <div className="space-y-3">
                <div className="text-2xl font-bold">
                  <span className="text-primary">{kpis?.departed_this_year || 0}</span>
                  <span className="text-muted-foreground mx-1">/</span>
                  <span>{kpis?.registered_this_year || 0}</span>
                </div>
                <Progress 
                  value={kpis?.registered_this_year ? Math.round((kpis.departed_this_year / kpis.registered_this_year) * 100) : 0} 
                  className="h-2" 
                />
                <p className="text-xs text-muted-foreground">
                  Đã xuất cảnh {kpis?.registered_this_year ? Math.round((kpis?.departed_this_year || 0) / kpis.registered_this_year * 100) : 0}% số đăng ký
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
