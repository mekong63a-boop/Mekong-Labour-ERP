import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Users,
  GraduationCap,
  Plane,
  FileText,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LabelList,
} from "recharts";
import { cn } from "@/lib/utils";

// Single Source - PostgreSQL views
import {
  useTraineeKPIs,
  useMonthlyCombined,
  useTraineeBySource,
  useTraineeByCompany,
  useAvailableYears,
} from "@/hooks/useDashboardTrainee";

// Icon color classes
const iconColorClasses = {
  blue: "bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-400",
  green: "bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400",
  orange: "bg-orange-100 text-orange-600 dark:bg-orange-950 dark:text-orange-400",
  purple: "bg-purple-100 text-purple-600 dark:bg-purple-950 dark:text-purple-400",
};

export default function TraineeDashboard() {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);

  // Single Source - PostgreSQL views
  const { data: kpis, isLoading: loadingKPIs } = useTraineeKPIs();
  const { data: monthlyCombined, isLoading: loadingMonthly } = useMonthlyCombined();
  const { data: sourceData, isLoading: loadingSource } = useTraineeBySource();
  const { data: companyData, isLoading: loadingCompany } = useTraineeByCompany();
  const { data: availableYears } = useAvailableYears();

  // SYSTEM RULE: activeOrders từ kpis view (đã tính sẵn ở DB)
  const activeOrders = kpis?.active_orders || 0;

  // Generate year options từ dữ liệu thực tế (các năm có học viên) - lấy từ DB view
  const yearOptions = useMemo(() => {
    const years = new Set<number>();
    // Thêm các năm từ DB view
    if (availableYears) {
      availableYears.forEach((item) => {
        if (item.year) {
          years.add(item.year);
        }
      });
    }
    // Luôn thêm năm hiện tại
    years.add(currentYear);
    // Convert to array và sort giảm dần
    return Array.from(years).sort((a, b) => b - a);
  }, [availableYears, currentYear]);

  // SYSTEM RULE: monthlyChartData từ dashboard_monthly_combined view
  // Đảm bảo hiển thị đủ 12 tháng trong năm VÀ LỌC THEO NĂM ĐƯỢC CHỌN
  const monthlyChartData = useMemo(() => {
    const months = ["T1", "T2", "T3", "T4", "T5", "T6", "T7", "T8", "T9", "T10", "T11", "T12"];
    
    // Tạo template 12 tháng với giá trị mặc định = 0
    const template = months.map((month, index) => ({
      month,
      monthNum: index + 1, // 1-12
      recruitment: 0,
      departure: 0,
    }));
    
    if (!monthlyCombined) return template;
    
    // Merge dữ liệu từ DB vào template - LỌC THEO NĂM
    // month_label từ DB có format "01/2026", "02/2026"...
    monthlyCombined.forEach((item) => {
      if (item.month_date) {
        const itemDate = new Date(item.month_date);
        const itemYear = itemDate.getFullYear();
        const itemMonth = itemDate.getMonth() + 1; // 1-12
        
        if (itemYear === selectedYear) {
          const templateItem = template.find((t) => t.monthNum === itemMonth);
          if (templateItem) {
            templateItem.recruitment = item.recruitment || 0;
            templateItem.departure = item.departure || 0;
          }
        }
      }
    });
    
    return template;
  }, [monthlyCombined, selectedYear]);

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

  // Format source data for horizontal bar chart
  const sourceChartData = useMemo(() => {
    if (!sourceData) return [];
    return sourceData
      .filter(s => s.source && s.count > 0)
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)
      .map(s => ({
        name: s.source || "Khác",
        value: s.count,
      }));
  }, [sourceData]);

  // Top 10 công ty tuyển dụng trong năm - LỌC THEO NĂM
  const companyChartData = useMemo(() => {
    if (!companyData) return [];
    return companyData
      .filter(c => c.company_name && c.year === selectedYear && c.count > 0)
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)
      .map(c => ({
        name: c.company_name || "Không xác định",
        value: c.count,
      }));
  }, [companyData, selectedYear]);

  // Calculate studying count - use status_studying from KPIs
  const studyingCount = useMemo(() => {
    if (!kpis) return 0;
    return kpis.status_studying || 0;
  }, [kpis]);

  return (
    <div className="space-y-6">
      {/* KPI Cards Row - Display only, no navigation */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Trainees */}
        <Card>
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
        <Card>
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

        {/* Trainees Departed */}
        <Card>
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
                    {kpis?.departed_this_year || 0}
                  </div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Xuất cảnh năm nay
                  </p>
                  <p className="text-xs text-muted-foreground">Đã xuất cảnh năm {selectedYear}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Active Orders */}
        <Card>
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

      {/* Charts Row - Two separate bar charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bar Chart - Tuyển dụng trong năm */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div className="flex items-center gap-3">
              <CardTitle className="text-base font-semibold">Tuyển dụng trong năm</CardTitle>
              <span className="text-lg font-bold text-emerald-600">
                (Tổng: {monthlyChartData.reduce((sum, item) => sum + item.recruitment, 0)})
              </span>
            </div>
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
                  <BarChart data={monthlyChartData} barSize={28} margin={{ top: 20, right: 10, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="month" fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis fontSize={11} tickLine={false} axisLine={false} />
                    <Tooltip
                      contentStyle={{
                        borderRadius: "8px",
                        border: "1px solid hsl(var(--border))",
                      }}
                    />
                    <Bar dataKey="recruitment" name="Tuyển dụng" fill="#006633" radius={[4, 4, 0, 0]}>
                      <LabelList 
                        dataKey="recruitment" 
                        position="inside" 
                        fill="#ffffff" 
                        fontSize={14} 
                        fontWeight="bold"
                        formatter={(value: number) => value > 0 ? value : ""}
                      />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Bar Chart - Xuất cảnh trong năm */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div className="flex items-center gap-3">
              <CardTitle className="text-base font-semibold">Xuất cảnh trong năm</CardTitle>
              <span className="text-lg font-bold text-blue-600">
                (Tổng: {monthlyChartData.reduce((sum, item) => sum + item.departure, 0)})
              </span>
            </div>
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
                  <BarChart data={monthlyChartData} barSize={28} margin={{ top: 20, right: 10, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="month" fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis fontSize={11} tickLine={false} axisLine={false} />
                    <Tooltip
                      contentStyle={{
                        borderRadius: "8px",
                        border: "1px solid hsl(var(--border))",
                      }}
                    />
                    <Bar dataKey="departure" name="Xuất cảnh" fill="#3B82F6" radius={[4, 4, 0, 0]}>
                      <LabelList 
                        dataKey="departure" 
                        position="inside" 
                        fill="#ffffff" 
                        fontSize={14} 
                        fontWeight="bold"
                        formatter={(value: number) => value > 0 ? value : ""}
                      />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Nguồn tuyển dụng - Horizontal Bar Chart */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold">Top 10 nguồn giới thiệu</CardTitle>
        </CardHeader>
        <CardContent>
          {loadingSource ? (
            <Skeleton className="h-64 w-full" />
          ) : (
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart 
                  data={sourceChartData.slice(0, 10)} 
                  layout="vertical" 
                  barSize={22}
                  margin={{ left: 10, right: 30 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                  <XAxis type="number" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis 
                    dataKey="name" 
                    type="category" 
                    fontSize={11} 
                    tickLine={false} 
                    width={120}
                    tickFormatter={(value) => value.length > 15 ? value.substring(0, 15) + "..." : value}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: "8px",
                      border: "1px solid hsl(var(--border))",
                    }}
                  />
                  <Bar dataKey="value" name="Số lượng" fill="#006633" radius={[0, 4, 4, 0]}>
                    <LabelList 
                      dataKey="value" 
                      position="insideRight" 
                      fill="#dc2626" 
                      fontSize={12} 
                      fontWeight="bold"
                      formatter={(value: number) => value > 0 ? value : ""}
                    />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Top 10 công ty tuyển dụng trong năm */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-base font-semibold">Top 10 công ty tuyển dụng trong năm {selectedYear}</CardTitle>
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
          {loadingCompany ? (
            <Skeleton className="h-64 w-full" />
          ) : companyChartData.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-muted-foreground">
              Không có dữ liệu công ty trong năm {selectedYear}
            </div>
          ) : (
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart 
                  data={companyChartData} 
                  layout="vertical" 
                  barSize={22}
                  margin={{ left: 10, right: 30 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                  <XAxis type="number" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis 
                    dataKey="name" 
                    type="category" 
                    fontSize={11} 
                    tickLine={false} 
                    width={150}
                    tickFormatter={(value) => value.length > 20 ? value.substring(0, 20) + "..." : value}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: "8px",
                      border: "1px solid hsl(var(--border))",
                    }}
                  />
                  <Bar dataKey="value" name="Số lượng" fill="#3B82F6" radius={[0, 4, 4, 0]}>
                    <LabelList 
                      dataKey="value" 
                      position="insideRight" 
                      fill="#dc2626" 
                      fontSize={12} 
                      fontWeight="bold"
                      formatter={(value: number) => value > 0 ? value : ""}
                    />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
