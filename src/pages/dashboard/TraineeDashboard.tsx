import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Users,
  UserCheck,
  UserX,
  Plane,
  TrendingUp,
  GraduationCap,
  Building,
  CalendarDays,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import {
  useTraineeKPIs,
  useTraineeByStage,
  useTraineeByStatus,
  useTraineeByType,
  useTraineeMonthly,
  useTraineeBySource,
  useTraineeByBirthplace,
  useTraineeByGender,
  useTraineeDeparturesMonthly,
  useTraineePassedMonthly,
} from "@/hooks/useDashboardTrainee";

// Color palette for charts
const COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
  "#8884d8",
  "#82ca9d",
  "#ffc658",
  "#ff7300",
  "#00C49F",
  "#FFBB28",
  "#FF8042",
];

// KPI Card Component
function KPICard({
  title,
  value,
  icon: Icon,
  description,
  isLoading,
  variant = "default",
}: {
  title: string;
  value: number | string;
  icon: React.ElementType;
  description?: string;
  isLoading: boolean;
  variant?: "default" | "success" | "warning" | "danger";
}) {
  const variantClasses = {
    default: "bg-card",
    success: "bg-green-50 border-green-200",
    warning: "bg-amber-50 border-amber-200",
    danger: "bg-red-50 border-red-200",
  };

  return (
    <Card className={variantClasses[variant]}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-8 w-20" />
        ) : (
          <>
            <div className="text-2xl font-bold">{value}</div>
            {description && (
              <p className="text-xs text-muted-foreground mt-1">{description}</p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

// Chart Card Wrapper
function ChartCard({
  title,
  children,
  isLoading,
  className = "",
}: {
  title: string;
  children: React.ReactNode;
  isLoading: boolean;
  className?: string;
}) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-base font-semibold">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-64 w-full" />
        ) : (
          children
        )}
      </CardContent>
    </Card>
  );
}

export default function TraineeDashboard() {
  // Fetch all dashboard data
  const { data: kpis, isLoading: loadingKPIs } = useTraineeKPIs();
  const { data: stageData, isLoading: loadingStage } = useTraineeByStage();
  const { data: statusData, isLoading: loadingStatus } = useTraineeByStatus();
  const { data: typeData, isLoading: loadingType } = useTraineeByType();
  const { data: monthlyData, isLoading: loadingMonthly } = useTraineeMonthly();
  const { data: sourceData, isLoading: loadingSource } = useTraineeBySource();
  const { data: birthplaceData, isLoading: loadingBirthplace } = useTraineeByBirthplace();
  const { data: genderData, isLoading: loadingGender } = useTraineeByGender();
  const { data: departuresData, isLoading: loadingDepartures } = useTraineeDeparturesMonthly();
  const { data: passedData, isLoading: loadingPassed } = useTraineePassedMonthly();

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard Học viên</h1>
        <p className="text-muted-foreground">Tổng quan số liệu học viên</p>
      </div>

      {/* KPI Cards Row 1 */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <KPICard
          title="Tổng học viên"
          value={kpis?.total_trainees || 0}
          icon={Users}
          isLoading={loadingKPIs}
        />
        <KPICard
          title="Đang ở Nhật"
          value={kpis?.status_in_japan || 0}
          icon={Plane}
          isLoading={loadingKPIs}
          variant="success"
        />
        <KPICard
          title="Đang học"
          value={kpis?.status_studying || 0}
          icon={GraduationCap}
          isLoading={loadingKPIs}
        />
        <KPICard
          title="Đậu phỏng vấn"
          value={kpis?.stage_passed_interview || 0}
          icon={UserCheck}
          isLoading={loadingKPIs}
          variant="success"
        />
        <KPICard
          title="Chưa đậu"
          value={kpis?.stage_not_passed || 0}
          icon={UserX}
          isLoading={loadingKPIs}
          variant="warning"
        />
        <KPICard
          title="Đăng ký tháng này"
          value={kpis?.registered_this_month || 0}
          icon={CalendarDays}
          isLoading={loadingKPIs}
        />
      </div>

      {/* KPI Cards Row 2 */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
        <KPICard
          title="Thực tập sinh"
          value={kpis?.type_tts || 0}
          icon={Building}
          isLoading={loadingKPIs}
        />
        <KPICard
          title="Kỹ năng đặc định"
          value={kpis?.type_knd || 0}
          icon={Building}
          isLoading={loadingKPIs}
        />
        <KPICard
          title="Kỹ sư"
          value={kpis?.type_engineer || 0}
          icon={Building}
          isLoading={loadingKPIs}
        />
        <KPICard
          title="Xuất cảnh năm nay"
          value={kpis?.departed_this_year || 0}
          icon={TrendingUp}
          isLoading={loadingKPIs}
          variant="success"
        />
        <KPICard
          title="Đăng ký năm nay"
          value={kpis?.registered_this_year || 0}
          icon={TrendingUp}
          isLoading={loadingKPIs}
        />
      </div>

      {/* Charts Row 1: Line Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Registrations */}
        <ChartCard title="Đăng ký theo tháng (12 tháng)" isLoading={loadingMonthly}>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyData || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month_label" fontSize={12} />
                <YAxis fontSize={12} />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="registrations"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  dot={{ fill: "hsl(var(--primary))" }}
                  name="Đăng ký"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        {/* Monthly Departures & Passed */}
        <ChartCard 
          title="Xuất cảnh & Đậu PV theo tháng" 
          isLoading={loadingDepartures || loadingPassed}
        >
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={(departuresData || []).map((d, i) => ({
                  month_label: d.month_label,
                  departures: d.departures,
                  passed: passedData?.[i]?.passed_count || 0,
                }))}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month_label" fontSize={12} />
                <YAxis fontSize={12} />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="departures"
                  stroke="hsl(var(--chart-2))"
                  strokeWidth={2}
                  name="Xuất cảnh"
                />
                <Line
                  type="monotone"
                  dataKey="passed"
                  stroke="hsl(var(--chart-3))"
                  strokeWidth={2}
                  name="Đậu PV"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>

      {/* Charts Row 2: Pie Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* By Stage */}
        <ChartCard title="Phân bố theo giai đoạn" isLoading={loadingStage}>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stageData?.filter(d => d.count > 0) || []}
                  dataKey="count"
                  nameKey="stage"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={({ name, percent }) => 
                    percent > 0.05 ? `${(percent * 100).toFixed(0)}%` : ""
                  }
                >
                  {(stageData || []).map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => [value, "Số lượng"]} />
                <Legend 
                  layout="horizontal" 
                  verticalAlign="bottom" 
                  wrapperStyle={{ fontSize: "12px" }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        {/* By Status */}
        <ChartCard title="Phân bố theo trạng thái" isLoading={loadingStatus}>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData?.filter(d => d.count > 0) || []}
                  dataKey="count"
                  nameKey="status"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={({ name, percent }) => 
                    percent > 0.05 ? `${(percent * 100).toFixed(0)}%` : ""
                  }
                >
                  {(statusData || []).map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => [value, "Số lượng"]} />
                <Legend 
                  layout="horizontal" 
                  verticalAlign="bottom" 
                  wrapperStyle={{ fontSize: "12px" }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        {/* By Type */}
        <ChartCard title="Phân bố theo loại TTS" isLoading={loadingType}>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={typeData?.filter(d => d.count > 0) || []}
                  dataKey="count"
                  nameKey="trainee_type"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={({ name, percent }) => 
                    percent > 0.05 ? `${(percent * 100).toFixed(0)}%` : ""
                  }
                >
                  {(typeData || []).map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => [value, "Số lượng"]} />
                <Legend 
                  layout="horizontal" 
                  verticalAlign="bottom" 
                  wrapperStyle={{ fontSize: "12px" }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>

      {/* Charts Row 3: Bar Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* By Source */}
        <ChartCard title="Top 10 nguồn giới thiệu" isLoading={loadingSource}>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={sourceData || []} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" fontSize={12} />
                <YAxis 
                  type="category" 
                  dataKey="source" 
                  width={120} 
                  fontSize={11}
                  tickFormatter={(value) => 
                    value.length > 15 ? `${value.substring(0, 15)}...` : value
                  }
                />
                <Tooltip />
                <Bar dataKey="count" fill="hsl(var(--primary))" name="Số lượng" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        {/* By Birthplace */}
        <ChartCard title="Top 10 quê quán" isLoading={loadingBirthplace}>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={birthplaceData || []} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" fontSize={12} />
                <YAxis 
                  type="category" 
                  dataKey="birthplace" 
                  width={120} 
                  fontSize={11}
                  tickFormatter={(value) => 
                    value.length > 15 ? `${value.substring(0, 15)}...` : value
                  }
                />
                <Tooltip />
                <Bar dataKey="count" fill="hsl(var(--chart-2))" name="Số lượng" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>

      {/* Charts Row 4: Gender */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <ChartCard title="Phân bố theo giới tính" isLoading={loadingGender}>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={genderData?.filter(d => d.count > 0) || []}
                  dataKey="count"
                  nameKey="gender"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={({ name, percent }) => 
                    `${name}: ${(percent * 100).toFixed(0)}%`
                  }
                >
                  <Cell fill="hsl(var(--chart-1))" />
                  <Cell fill="hsl(var(--chart-4))" />
                  <Cell fill="hsl(var(--chart-5))" />
                </Pie>
                <Tooltip formatter={(value: number) => [value, "Số lượng"]} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>
    </div>
  );
}
