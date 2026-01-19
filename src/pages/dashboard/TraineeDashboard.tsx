import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Users,
  UserCheck,
  UserX,
  Plane,
  TrendingUp,
  GraduationCap,
  Building,
  CalendarDays,
  Filter,
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
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

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
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;
  
  // Filter states
  const [selectedYear, setSelectedYear] = useState<string>("all");
  const [selectedMonth, setSelectedMonth] = useState<string>("all");

  // Fetch all trainees with registration_date for filtering
  const { data: allTrainees = [], isLoading: loadingTrainees } = useQuery({
    queryKey: ["dashboard-trainees-raw"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("trainees")
        .select("id, registration_date, departure_date, interview_pass_date, trainee_type, progression_stage, simple_status, source, birthplace, gender");
      if (error) throw error;
      return data || [];
    },
    staleTime: 30 * 1000,
  });

  // Generate year options from data
  const yearOptions = useMemo(() => {
    const years = new Set<number>();
    allTrainees.forEach((t) => {
      if (t.registration_date) {
        years.add(new Date(t.registration_date).getFullYear());
      }
      if (t.departure_date) {
        years.add(new Date(t.departure_date).getFullYear());
      }
    });
    return Array.from(years).sort((a, b) => b - a);
  }, [allTrainees]);

  // Month options
  const monthOptions = [
    { value: "1", label: "Tháng 1" },
    { value: "2", label: "Tháng 2" },
    { value: "3", label: "Tháng 3" },
    { value: "4", label: "Tháng 4" },
    { value: "5", label: "Tháng 5" },
    { value: "6", label: "Tháng 6" },
    { value: "7", label: "Tháng 7" },
    { value: "8", label: "Tháng 8" },
    { value: "9", label: "Tháng 9" },
    { value: "10", label: "Tháng 10" },
    { value: "11", label: "Tháng 11" },
    { value: "12", label: "Tháng 12" },
  ];

  // Helper function to check if trainee matches filter based on relevant date
  const matchesFilter = (dateStr: string | null) => {
    if (!dateStr) return false;
    const date = new Date(dateStr);
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    
    if (selectedYear !== "all" && year !== parseInt(selectedYear)) return false;
    if (selectedMonth !== "all" && month !== parseInt(selectedMonth)) return false;
    
    return true;
  };

  // Filtered trainees based on registration_date (for total count)
  const filteredByRegistration = useMemo(() => {
    if (selectedYear === "all" && selectedMonth === "all") return allTrainees;
    
    return allTrainees.filter((t) => {
      if (!t.registration_date) return false;
      return matchesFilter(t.registration_date);
    });
  }, [allTrainees, selectedYear, selectedMonth]);

  // Calculate filtered KPIs - each metric uses the appropriate date
  const filteredKPIs = useMemo(() => {
    const result = {
      total: 0,
      status_in_japan: 0,
      status_studying: 0,
      stage_passed_interview: 0,
      stage_not_passed: 0,
      type_tts: 0,
      type_knd: 0,
      type_engineer: 0,
      departed_count: 0,
    };

    // Đếm tổng theo ngày đăng ký
    result.total = filteredByRegistration.length;

    // Với bộ lọc, đếm "Đang ở Nhật" theo ngày xuất cảnh
    allTrainees.forEach((t) => {
      // Đang ở Nhật: lọc theo departure_date (ngày xuất cảnh)
      if (t.simple_status === "Đang ở Nhật") {
        if (selectedYear === "all" && selectedMonth === "all") {
          result.status_in_japan++;
        } else if (t.departure_date && matchesFilter(t.departure_date)) {
          result.status_in_japan++;
        }
      }
    });

    // Các chỉ số khác lọc theo registration_date
    filteredByRegistration.forEach((t) => {
      if (t.simple_status === "Đang học") result.status_studying++;
      if (t.progression_stage && t.progression_stage !== "Chưa đậu") result.stage_passed_interview++;
      if (t.progression_stage === "Chưa đậu" || !t.progression_stage) result.stage_not_passed++;
      if (t.trainee_type === "Thực tập sinh") result.type_tts++;
      if (t.trainee_type === "Kỹ năng đặc định") result.type_knd++;
      if (t.trainee_type === "Kỹ sư") result.type_engineer++;
    });
    
    // Xuất cảnh: lọc theo departure_date
    allTrainees.forEach((t) => {
      if (t.departure_date) {
        if (selectedYear === "all" && selectedMonth === "all") {
          result.departed_count++;
        } else if (matchesFilter(t.departure_date)) {
          result.departed_count++;
        }
      }
    });

    return result;
  }, [allTrainees, filteredByRegistration, selectedYear, selectedMonth]);

  // Fetch all dashboard data (for non-filtered charts)
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

  const isFiltering = selectedYear !== "all" || selectedMonth !== "all";

  return (
    <div className="space-y-6">
      {/* Page Title with Filters */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard Học viên</h1>
          <p className="text-muted-foreground">
            Tổng quan số liệu học viên
            {isFiltering && (
              <span className="ml-2 text-primary font-medium">
                (Đang lọc: {selectedMonth !== "all" ? `Tháng ${selectedMonth}` : ""} 
                {selectedMonth !== "all" && selectedYear !== "all" ? "/" : ""}
                {selectedYear !== "all" ? selectedYear : ""})
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="Tháng" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả tháng</SelectItem>
              {monthOptions.map((m) => (
                <SelectItem key={m.value} value={m.value}>
                  {m.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={selectedYear} onValueChange={setSelectedYear}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Năm" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả năm</SelectItem>
              {yearOptions.map((y) => (
                <SelectItem key={y} value={y.toString()}>
                  {y}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* KPI Cards Row 1 */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <KPICard
          title="Tổng học viên"
          value={isFiltering ? filteredKPIs.total : (kpis?.total_trainees || 0)}
          icon={Users}
          isLoading={loadingKPIs || loadingTrainees}
        />
        <KPICard
          title="Đang ở Nhật"
          value={isFiltering ? filteredKPIs.status_in_japan : (kpis?.status_in_japan || 0)}
          icon={Plane}
          isLoading={loadingKPIs || loadingTrainees}
          variant="success"
        />
        <KPICard
          title="Đang học"
          value={isFiltering ? filteredKPIs.status_studying : (kpis?.status_studying || 0)}
          icon={GraduationCap}
          isLoading={loadingKPIs || loadingTrainees}
        />
        <KPICard
          title="Đậu phỏng vấn"
          value={isFiltering ? filteredKPIs.stage_passed_interview : (kpis?.stage_passed_interview || 0)}
          icon={UserCheck}
          isLoading={loadingKPIs || loadingTrainees}
          variant="success"
        />
        <KPICard
          title="Chưa đậu"
          value={isFiltering ? filteredKPIs.stage_not_passed : (kpis?.stage_not_passed || 0)}
          icon={UserX}
          isLoading={loadingKPIs || loadingTrainees}
          variant="warning"
        />
        <KPICard
          title={isFiltering ? "Đăng ký theo lọc" : "Đăng ký tháng này"}
          value={isFiltering ? filteredKPIs.total : (kpis?.registered_this_month || 0)}
          icon={CalendarDays}
          isLoading={loadingKPIs || loadingTrainees}
        />
      </div>

      {/* KPI Cards Row 2 */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
        <KPICard
          title="Thực tập sinh"
          value={isFiltering ? filteredKPIs.type_tts : (kpis?.type_tts || 0)}
          icon={Building}
          isLoading={loadingKPIs || loadingTrainees}
        />
        <KPICard
          title="Kỹ năng đặc định"
          value={isFiltering ? filteredKPIs.type_knd : (kpis?.type_knd || 0)}
          icon={Building}
          isLoading={loadingKPIs || loadingTrainees}
        />
        <KPICard
          title="Kỹ sư"
          value={isFiltering ? filteredKPIs.type_engineer : (kpis?.type_engineer || 0)}
          icon={Building}
          isLoading={loadingKPIs || loadingTrainees}
        />
        <KPICard
          title={isFiltering ? "Xuất cảnh theo lọc" : "Xuất cảnh năm nay"}
          value={isFiltering ? filteredKPIs.departed_count : (kpis?.departed_this_year || 0)}
          icon={TrendingUp}
          isLoading={loadingKPIs || loadingTrainees}
          variant="success"
        />
        <KPICard
          title={isFiltering ? "Đăng ký theo lọc" : "Đăng ký năm nay"}
          value={isFiltering ? filteredKPIs.total : (kpis?.registered_this_year || 0)}
          icon={TrendingUp}
          isLoading={loadingKPIs || loadingTrainees}
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
                data={(() => {
                  // Build a map from passedData keyed by month_label for reliable merge
                  const passedMap = new Map(
                    (passedData || []).map((p) => [p.month_label, p.passed_count])
                  );
                  return (departuresData || []).map((d) => ({
                    month_label: d.month_label,
                    departures: d.departures ?? 0,
                    passed: passedMap.get(d.month_label) ?? 0,
                  }));
                })()}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month_label" fontSize={12} />
                <YAxis fontSize={12} allowDecimals={false} />
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
