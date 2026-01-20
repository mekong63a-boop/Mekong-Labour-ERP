import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
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
  BookOpen,
  PauseCircle,
  XCircle,
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
  LabelList,
} from "recharts";
import {
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
import { useQuery, useQueryClient } from "@tanstack/react-query";

// Color palette for charts
const COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
  "hsl(var(--primary))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
];

// Custom label renderer - red for non-zero values, black for zero
const renderCustomLabel = (props: any) => {
  const { x, y, value } = props;
  const isNonZero = value > 0;
  return (
    <text
      x={x}
      y={y}
      dy={-8}
      fill={isNonZero ? "#dc2626" : "#888888"}
      fontSize={isNonZero ? 14 : 11}
      fontWeight={isNonZero ? "bold" : "normal"}
      textAnchor="middle"
    >
      {value}
    </text>
  );
};

// Custom label renderer for bar charts (position right)
const renderBarLabel = (props: any) => {
  const { x, y, width, value } = props;
  const isNonZero = value > 0;
  return (
    <text
      x={x + width + 5}
      y={y + 12}
      fill={isNonZero ? "#dc2626" : "#888888"}
      fontSize={isNonZero ? 14 : 11}
      fontWeight={isNonZero ? "bold" : "normal"}
      textAnchor="start"
    >
      {value}
    </text>
  );
};

// KPI Card Component with click support
function KPICard({
  title,
  value,
  icon: Icon,
  description,
  isLoading,
  variant = "default",
  onClick,
  clickable = false,
}: {
  title: string;
  value: number | string;
  icon: React.ElementType;
  description?: string;
  isLoading: boolean;
  variant?: "default" | "success" | "warning" | "danger" | "info";
  onClick?: () => void;
  clickable?: boolean;
}) {
  const variantClasses = {
    default: "bg-card border",
    success: "bg-green-50 border-green-200 dark:bg-green-950/30 dark:border-green-800",
    warning: "bg-amber-50 border-amber-200 dark:bg-amber-950/30 dark:border-amber-800",
    danger: "bg-red-50 border-red-200 dark:bg-red-950/30 dark:border-red-800",
    info: "bg-blue-50 border-blue-200 dark:bg-blue-950/30 dark:border-blue-800",
  };

  const textColorClasses = {
    default: "text-foreground",
    success: "text-green-700 dark:text-green-400",
    warning: "text-amber-700 dark:text-amber-400",
    danger: "text-red-700 dark:text-red-400",
    info: "text-blue-700 dark:text-blue-400",
  };

  return (
    <Card 
      className={`${variantClasses[variant]} ${clickable ? "cursor-pointer hover:shadow-md transition-shadow" : ""}`}
      onClick={clickable ? onClick : undefined}
    >
      <CardHeader className="flex flex-row items-center justify-between pb-2 pt-3 px-4">
        <CardTitle className="text-xs font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent className="px-4 pb-3">
        {isLoading ? (
          <Skeleton className="h-8 w-16" />
        ) : (
          <>
            <div className={`text-2xl font-bold ${textColorClasses[variant]}`}>{value}</div>
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
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const currentYear = new Date().getFullYear();
  
  // Filter states
  const [selectedYear, setSelectedYear] = useState<string>(currentYear.toString());
  const [selectedMonth, setSelectedMonth] = useState<string>("all");

  // Navigate to detail list with filter
  const navigateToDetail = (filter: string) => {
    const params = new URLSearchParams();
    params.set("filter", filter);
    params.set("year", selectedYear);
    params.set("month", selectedMonth);
    navigate(`/dashboard/trainees/detail?${params.toString()}`);
  };

  // Fetch all trainees with needed fields
  const { data: allTrainees = [], isLoading: loadingTrainees, refetch } = useQuery({
    queryKey: ["dashboard-trainees-raw"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("trainees")
        .select("id, registration_date, created_at, departure_date, interview_pass_date, trainee_type, progression_stage, simple_status, enrollment_status, source, birthplace, gender");
      if (error) throw error;
      return data || [];
    },
    staleTime: 30 * 1000,
  });

  // Generate year options from data - include all relevant date fields
  const yearOptions = useMemo(() => {
    const years = new Set<number>();
    // Add current year always
    years.add(currentYear);
    allTrainees.forEach((t) => {
      // Registration date (primary for "Đăng ký mới")
      if (t.registration_date) {
        years.add(new Date(t.registration_date).getFullYear());
      }
      // Created at (fallback for registration)
      if (t.created_at) {
        years.add(new Date(t.created_at).getFullYear());
      }
      // Departure date (for output metrics)
      if (t.departure_date) {
        years.add(new Date(t.departure_date).getFullYear());
      }
      // Interview pass date (for "Đậu phỏng vấn")
      if (t.interview_pass_date) {
        years.add(new Date(t.interview_pass_date).getFullYear());
      }
    });
    return Array.from(years).sort((a, b) => b - a);
  }, [allTrainees, currentYear]);

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

  // Helper function to check if date matches filter
  const matchesDateFilter = (dateStr: string | null) => {
    if (!dateStr) return false;
    const date = new Date(dateStr);
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    
    if (selectedYear !== "all" && year !== parseInt(selectedYear)) return false;
    if (selectedMonth !== "all" && month !== parseInt(selectedMonth)) return false;
    
    return true;
  };

  // Calculate KPIs - Split into Input and Output metrics
  const kpis = useMemo(() => {
    const result = {
      // PHẦN 1: SỐ LIỆU ĐẦU VÀO (based on created_at/registration)
      total: 0,
      registered_new: 0,  // Đăng ký mới theo filter
      not_studying: 0,    // Chưa học
      studying: 0,        // Đang học
      reserved: 0,        // Bảo lưu
      cancelled: 0,       // Hủy
      passed_interview: 0, // Đậu phỏng vấn
      
      // PHẦN 2: SỐ LIỆU ĐẦU RA (based on departure_date + trainee_type)
      departed_tts: 0,    // Thực tập sinh xuất cảnh
      departed_tts3: 0,   // Thực tập sinh số 3 xuất cảnh
      departed_student: 0, // Du học sinh xuất cảnh
      departed_knd: 0,    // Kỹ năng đặc định xuất cảnh
      departed_engineer: 0, // Kỹ sư xuất cảnh
      departed_total: 0,  // Tổng xuất cảnh
    };

    // Calculate total trainees (no filter for total)
    result.total = allTrainees.length;

    // Helper to check if a specific date matches filter
    const checkDateMatch = (dateStr: string | null) => {
      if (!dateStr) return false;
      const date = new Date(dateStr);
      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      if (selectedYear !== "all" && year !== parseInt(selectedYear)) return false;
      if (selectedMonth !== "all" && month !== parseInt(selectedMonth)) return false;
      return true;
    };

    const noFilter = selectedYear === "all" && selectedMonth === "all";

    // For each trainee, calculate relevant metrics
    allTrainees.forEach((t) => {
      // === PHẦN 1: SỐ LIỆU ĐẦU VÀO ===
      
      // 1. Đăng ký mới: Lọc theo registration_date (hoặc created_at nếu không có)
      const registrationDateStr = t.registration_date || t.created_at;
      const matchesRegistration = checkDateMatch(registrationDateStr);
      if (noFilter || matchesRegistration) {
        result.registered_new++;
      }

      // 2. Chưa học: Lọc theo registration_date
      if (!t.enrollment_status || t.enrollment_status === "Chưa học") {
        if (noFilter || matchesRegistration) {
          result.not_studying++;
        }
      }

      // 3. Đang học: Lọc theo registration_date
      if (t.enrollment_status === "Đang học" || t.simple_status === "Đang học") {
        if (noFilter || matchesRegistration) {
          result.studying++;
        }
      }

      // 4. Bảo lưu: Lọc theo registration_date
      if (t.enrollment_status === "Bảo lưu" || t.simple_status === "Bảo lưu") {
        if (noFilter || matchesRegistration) {
          result.reserved++;
        }
      }

      // 5. Hủy: Lọc theo registration_date
      if (t.simple_status === "Hủy" || t.enrollment_status === "Đã hủy") {
        if (noFilter || matchesRegistration) {
          result.cancelled++;
        }
      }

      // 6. Đậu phỏng vấn: Lọc theo interview_pass_date, KHÔNG tính học viên đã xuất cảnh
      const hasPassedInterview = t.interview_pass_date || (t.progression_stage && !["Chưa đậu", "Tuyển dụng"].includes(t.progression_stage as string));
      const hasNotDeparted = !t.departure_date; // Chưa xuất cảnh
      if (hasPassedInterview && hasNotDeparted) {
        const matchesInterviewDate = checkDateMatch(t.interview_pass_date);
        if (noFilter || matchesInterviewDate) {
          result.passed_interview++;
        }
      }

      // === PHẦN 2: SỐ LIỆU ĐẦU RA - Lọc theo departure_date ===
      if (t.departure_date) {
        const matchesDeparture = checkDateMatch(t.departure_date);
        if (noFilter || matchesDeparture) {
          result.departed_total++;
          
          // Count by trainee_type
          switch (t.trainee_type) {
            case "Thực tập sinh":
              result.departed_tts++;
              break;
            case "Thực tập sinh số 3":
              result.departed_tts3++;
              break;
            case "Du học sinh":
              result.departed_student++;
              break;
            case "Kỹ năng đặc định":
              result.departed_knd++;
              break;
            case "Kỹ sư":
              result.departed_engineer++;
              break;
          }
        }
      }
    });

    return result;
  }, [allTrainees, selectedYear, selectedMonth]);

  // Fetch chart data (using existing hooks)
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
                (Đang lọc: {selectedYear !== "all" ? selectedYear : ""}
                {selectedMonth !== "all" ? ` - Tháng ${selectedMonth}` : ""})
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
            <SelectTrigger className="w-[100px]">
              <SelectValue placeholder="Năm" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả</SelectItem>
              {yearOptions.map((y) => (
                <SelectItem key={y} value={y.toString()}>
                  {y}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* PHẦN 1: SỐ LIỆU ĐẦU VÀO */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          Phần I: Số liệu đầu vào
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
          <KPICard
            title="Tổng học viên"
            value={kpis.total}
            icon={Users}
            isLoading={loadingTrainees}
          />
          <KPICard
            title="Đăng ký mới"
            value={kpis.registered_new}
            icon={CalendarDays}
            isLoading={loadingTrainees}
            variant="info"
            clickable
            onClick={() => navigateToDetail("registered_new")}
          />
          <KPICard
            title="Chưa học"
            value={kpis.not_studying}
            icon={BookOpen}
            isLoading={loadingTrainees}
            clickable
            onClick={() => navigateToDetail("not_studying")}
          />
          <KPICard
            title="Đang học"
            value={kpis.studying}
            icon={GraduationCap}
            isLoading={loadingTrainees}
            variant="info"
            clickable
            onClick={() => navigateToDetail("studying")}
          />
          <KPICard
            title="Bảo lưu"
            value={kpis.reserved}
            icon={PauseCircle}
            isLoading={loadingTrainees}
            variant="warning"
            clickable
            onClick={() => navigateToDetail("reserved")}
          />
          <KPICard
            title="Hủy"
            value={kpis.cancelled}
            icon={XCircle}
            isLoading={loadingTrainees}
            variant="danger"
            clickable
            onClick={() => navigateToDetail("cancelled")}
          />
          <KPICard
            title="Đậu phỏng vấn"
            value={kpis.passed_interview}
            icon={UserCheck}
            isLoading={loadingTrainees}
            variant="success"
            clickable
            onClick={() => navigateToDetail("passed_interview")}
          />
        </div>
      </div>

      {/* PHẦN 2: SỐ LIỆU ĐẦU RA */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          Phần II: Số liệu đầu ra (Xuất cảnh theo diện)
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <KPICard
            title="Thực tập sinh"
            value={kpis.departed_tts}
            icon={Building}
            isLoading={loadingTrainees}
            variant="success"
            clickable
            onClick={() => navigateToDetail("departed_tts")}
          />
          <KPICard
            title="TTS số 3"
            value={kpis.departed_tts3}
            icon={Building}
            isLoading={loadingTrainees}
            variant="success"
            clickable
            onClick={() => navigateToDetail("departed_tts3")}
          />
          <KPICard
            title="Du học sinh"
            value={kpis.departed_student}
            icon={GraduationCap}
            isLoading={loadingTrainees}
            variant="success"
            clickable
            onClick={() => navigateToDetail("departed_student")}
          />
          <KPICard
            title="Kỹ năng đặc định"
            value={kpis.departed_knd}
            icon={Building}
            isLoading={loadingTrainees}
            variant="success"
            clickable
            onClick={() => navigateToDetail("departed_knd")}
          />
          <KPICard
            title="Kỹ sư"
            value={kpis.departed_engineer}
            icon={Building}
            isLoading={loadingTrainees}
            variant="success"
            clickable
            onClick={() => navigateToDetail("departed_engineer")}
          />
          <KPICard
            title="Tổng xuất cảnh"
            value={kpis.departed_total}
            icon={Plane}
            isLoading={loadingTrainees}
            variant="success"
            clickable
            onClick={() => navigateToDetail("departed_total")}
          />
        </div>
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
                >
                  <LabelList dataKey="registrations" content={renderCustomLabel} />
                </Line>
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
                >
                  <LabelList dataKey="departures" content={renderCustomLabel} />
                </Line>
                <Line
                  type="monotone"
                  dataKey="passed"
                  stroke="hsl(var(--chart-3))"
                  strokeWidth={2}
                  name="Đậu PV"
                >
                  <LabelList dataKey="passed" content={(props: any) => {
                    const { x, y, value } = props;
                    const isNonZero = value > 0;
                    return (
                      <text
                        x={x}
                        y={y}
                        dy={18}
                        fill={isNonZero ? "#dc2626" : "#888888"}
                        fontSize={isNonZero ? 14 : 11}
                        fontWeight={isNonZero ? "bold" : "normal"}
                        textAnchor="middle"
                      >
                        {value}
                      </text>
                    );
                  }} />
                </Line>
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
                <Bar dataKey="count" fill="hsl(var(--primary))" name="Số lượng">
                  <LabelList dataKey="count" content={renderBarLabel} />
                </Bar>
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
                <Bar dataKey="count" fill="hsl(var(--chart-2))" name="Số lượng">
                  <LabelList dataKey="count" content={renderBarLabel} />
                </Bar>
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
