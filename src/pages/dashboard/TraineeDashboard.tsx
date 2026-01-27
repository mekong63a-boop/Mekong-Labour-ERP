import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Users,
  GraduationCap,
  Plane,
  FileText,
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
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

// Dashboard components
import { KPICard } from "@/components/dashboard/KPICard";
import { ChartCard } from "@/components/dashboard/ChartCard";
import { ProgressCard } from "@/components/dashboard/ProgressCard";
import { TargetCard } from "@/components/dashboard/TargetCard";

// Dashboard hooks
import {
  useTraineeByJobCategory,
  useYearlyTarget,
  useProfileCompletionRate,
  useMonthlyComparison,
  useGrowthRates,
  useTotalOrders,
  useTraineesInJapan,
  useCurrentlyStudying,
} from "@/hooks/useDashboardStats";

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

  // Fetch total trainees count
  const { data: totalTrainees = 0, isLoading: loadingTotal } = useQuery({
    queryKey: ["dashboard-total-trainees"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("trainees")
        .select("*", { count: "exact", head: true });
      if (error) throw error;
      return count || 0;
    },
    staleTime: 30 * 1000,
  });

  // Generate year options
  const { data: allTrainees = [] } = useQuery({
    queryKey: ["dashboard-trainees-years"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("trainees")
        .select("registration_date, created_at, departure_date");
      if (error) throw error;
      return data || [];
    },
    staleTime: 60 * 1000,
  });

  const yearOptions = useMemo(() => {
    const years = new Set<number>();
    years.add(currentYear);
    allTrainees.forEach((t) => {
      if (t.registration_date) years.add(new Date(t.registration_date).getFullYear());
      if (t.created_at) years.add(new Date(t.created_at).getFullYear());
      if (t.departure_date) years.add(new Date(t.departure_date).getFullYear());
    });
    return Array.from(years).sort((a, b) => b - a);
  }, [allTrainees, currentYear]);

  // Dashboard data hooks
  const { data: growthRates, isLoading: loadingGrowth } = useGrowthRates();
  const { data: currentlyStudying = 0, isLoading: loadingStudying } = useCurrentlyStudying();
  const { data: inJapanData, isLoading: loadingInJapan } = useTraineesInJapan();
  const { data: totalOrders = 0, isLoading: loadingOrders } = useTotalOrders();
  const { data: monthlyData, isLoading: loadingMonthly } = useMonthlyComparison(selectedYear);
  const { data: jobCategoryData, isLoading: loadingJobCategory } = useTraineeByJobCategory();
  const { data: profileCompletion, isLoading: loadingProfile } = useProfileCompletionRate();
  const { data: yearlyTarget, isLoading: loadingTarget } = useYearlyTarget(selectedYear);

  // Format time for last updated
  const lastUpdated = useMemo(() => {
    const now = new Date();
    return `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`;
  }, []);

  return (
    <div className="space-y-6">
      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Tổng số học viên"
          value={totalTrainees}
          subtitle="Học viên toàn hệ thống"
          icon={Users}
          iconColor="blue"
          isLoading={loadingTotal}
          growthPercent={growthRates?.registrationGrowth}
          clickable
          onClick={() => navigateToDetail("total")}
        />
        <KPICard
          title="Học viên hiện tại"
          value={currentlyStudying}
          subtitle="Đang đào tạo"
          icon={GraduationCap}
          iconColor="green"
          isLoading={loadingStudying}
          clickable
          onClick={() => navigateToDetail("studying")}
        />
        <KPICard
          title="Học viên tại Nhật"
          value={inJapanData?.inJapan || 0}
          subtitle="Tỷ lệ xuất cảnh thành công"
          icon={Plane}
          iconColor="purple"
          isLoading={loadingInJapan}
          ratio={
            inJapanData
              ? { current: inJapanData.inJapan, total: inJapanData.totalDeparted }
              : undefined
          }
          clickable
          onClick={() => navigateToDetail("in_japan")}
        />
        <KPICard
          title="Đơn tuyển dụng mới"
          value={totalOrders}
          subtitle="Cần bổ sung"
          icon={FileText}
          iconColor="orange"
          isLoading={loadingOrders}
          clickable
          onClick={() => navigate("/orders")}
        />
      </div>

      {/* Charts Row - Bar Chart + Donut */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Grouped Bar Chart - Recruitment vs Departure */}
        <ChartCard
          title="Tình hình tuyển dụng & Xuất cảnh"
          isLoading={loadingMonthly}
          className="lg:col-span-2"
          headerAction={
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
          }
        >
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData || []} barGap={2} barCategoryGap="20%">
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
        </ChartCard>

        {/* Donut Chart - Job Category */}
        <ChartCard title="Cơ cấu ngành nghề" isLoading={loadingJobCategory}>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={jobCategoryData || []}
                  dataKey="count"
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
                  {(jobCategoryData || []).map((_, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={DONUT_COLORS[index % DONUT_COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number, name: string) => [value, name]}
                />
                <Legend
                  layout="horizontal"
                  verticalAlign="bottom"
                  wrapperStyle={{ fontSize: "11px", paddingTop: "10px" }}
                  formatter={(value, entry) => {
                    const item = jobCategoryData?.find((d) => d.name === value);
                    return `${value} (${item?.count || 0})`;
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>

      {/* Bottom Row - Progress + Target */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ProgressCard
          title="Tiến độ hồ sơ học tập"
          label="Hoàn thiện hồ sơ"
          value={profileCompletion?.completedProfiles || 0}
          max={profileCompletion?.totalTrainees || 0}
          isLoading={loadingProfile}
          showLastUpdated
          lastUpdated={lastUpdated}
        />
        <TargetCard
          title={`Chỉ tiêu năm ${selectedYear}`}
          achieved={yearlyTarget?.achieved || 0}
          target={yearlyTarget?.target || 0}
          isLoading={loadingTarget}
        />
      </div>
    </div>
  );
}
