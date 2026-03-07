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
  CheckCircle,
  Building2,
} from "lucide-react";

// SINGLE SOURCE: KTX stats từ menu KTX
import { useDormitoryGenderStats } from "@/hooks/useDormitory";
// SINGLE SOURCE: Tổng học viên từ menu Học viên (trainee_stage_counts)
import { useTraineeStageCounts } from "@/hooks/useTraineeStageCounts";
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
  useMonthlyPassed,
  useDepartedByDepartureYear,
  useEducationTotal,
} from "@/hooks/useDashboardTrainee";

// Icon color classes
const iconColorClasses = {
  blue: "bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-400",
  green: "bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400",
  orange: "bg-orange-100 text-orange-600 dark:bg-orange-950 dark:text-orange-400",
  purple: "bg-purple-100 text-purple-600 dark:bg-purple-950 dark:text-purple-400",
  cyan: "bg-cyan-100 text-cyan-600 dark:bg-cyan-950 dark:text-cyan-400",
};

export default function TraineeDashboard() {
  const currentYear = new Date().getFullYear();

  // Single Source - PostgreSQL views
  const { data: kpis, isLoading: loadingKPIs } = useTraineeKPIs();
  const { data: monthlyCombined, isLoading: loadingMonthly } = useMonthlyCombined();
  const { data: sourceData, isLoading: loadingSource } = useTraineeBySource();
  const { data: companyData, isLoading: loadingCompany } = useTraineeByCompany();
  const { data: monthlyPassed, isLoading: loadingPassed } = useMonthlyPassed();
  
  // SINGLE SOURCE: Tổng học viên từ menu Học viên (trainee_stage_counts)
  const { data: stageCounts, isLoading: loadingStageCounts } = useTraineeStageCounts();
  
  // SINGLE SOURCE: Xuất cảnh theo năm departure_date từ menu Học viên
  const { data: departedByYear, isLoading: loadingDeparted } = useDepartedByDepartureYear();
  
  // SINGLE SOURCE: Sĩ số đang học từ menu Đào tạo (class_student_counts)
  const { data: educationTotal, isLoading: loadingEducation } = useEducationTotal();
  
  // SINGLE SOURCE: KTX từ menu KTX
  const { data: dormitoryStats, isLoading: loadingDormitory } = useDormitoryGenderStats();

  // SYSTEM RULE: activeOrders từ kpis view (đã tính sẵn ở DB)
  const activeOrders = kpis?.active_orders || 0;
  
  // SINGLE SOURCE: Tổng học viên = trainee_stage_counts.all (cùng nguồn menu Học viên)
  const totalTrainees = stageCounts?.all || 0;
  
  // SINGLE SOURCE: Học viên đang học = class_student_counts (cùng nguồn menu Đào tạo)
  const studyingCount = educationTotal?.total_studying || 0;
  
  // SINGLE SOURCE: Xuất cảnh năm nay = trainees có departure_date trong năm hiện tại
  const departedThisYear = useMemo(() => {
    if (!departedByYear) return 0;
    const currentYearData = departedByYear.find(s => s.year === currentYear);
    return currentYearData?.total || 0;
  }, [departedByYear, currentYear]);

  // Tính các năm có dữ liệu thực sự cho từng loại biểu đồ
  const recruitmentYears = useMemo(() => {
    if (!monthlyCombined) return [currentYear];
    const years = new Set<number>();
    monthlyCombined.forEach(item => {
      if (item.month_date && item.recruitment > 0) {
        years.add(new Date(item.month_date).getFullYear());
      }
    });
    return years.size > 0 ? Array.from(years).sort((a, b) => b - a) : [currentYear];
  }, [monthlyCombined, currentYear]);

  const departureYears = useMemo(() => {
    if (!monthlyCombined) return [currentYear];
    const years = new Set<number>();
    monthlyCombined.forEach(item => {
      if (item.month_date && item.departure > 0) {
        years.add(new Date(item.month_date).getFullYear());
      }
    });
    return years.size > 0 ? Array.from(years).sort((a, b) => b - a) : [currentYear];
  }, [monthlyCombined, currentYear]);

  const passedYears = useMemo(() => {
    if (!monthlyPassed) return [currentYear];
    const years = new Set<number>();
    monthlyPassed.forEach(item => {
      if (item.month_date && item.passed_count > 0) {
        years.add(new Date(item.month_date).getFullYear());
      }
    });
    return years.size > 0 ? Array.from(years).sort((a, b) => b - a) : [currentYear];
  }, [monthlyPassed, currentYear]);

  const companyYears = useMemo(() => {
    if (!companyData) return [currentYear];
    const years = new Set<number>();
    companyData.forEach(item => {
      if (item.year && item.count > 0) {
        years.add(item.year);
      }
    });
    return years.size > 0 ? Array.from(years).sort((a, b) => b - a) : [currentYear];
  }, [companyData, currentYear]);

  // State cho bộ lọc năm - mặc định là năm có dữ liệu mới nhất
  const [recruitmentYear, setRecruitmentYear] = useState<number | null>(null);
  const [departureYear, setDepartureYear] = useState<number | null>(null);
  const [passedYear, setPassedYear] = useState<number | null>(null);
  const [companyYear, setCompanyYear] = useState<number | null>(null);

  // Đặt giá trị mặc định khi dữ liệu load xong
  const effectiveRecruitmentYear = recruitmentYear ?? recruitmentYears[0] ?? currentYear;
  const effectiveDepartureYear = departureYear ?? departureYears[0] ?? currentYear;
  const effectivePassedYear = passedYear ?? passedYears[0] ?? currentYear;
  const effectiveCompanyYear = companyYear ?? companyYears[0] ?? currentYear;

  // SYSTEM RULE: Recruitment chart data - LỌC THEO recruitmentYear
  const recruitmentChartData = useMemo(() => {
    const months = ["T1", "T2", "T3", "T4", "T5", "T6", "T7", "T8", "T9", "T10", "T11", "T12"];
    
    const template = months.map((month, index) => ({
      month,
      monthNum: index + 1,
      recruitment: 0,
    }));
    
    if (!monthlyCombined) return template;
    
    monthlyCombined.forEach((item) => {
      if (item.month_date) {
        const itemDate = new Date(item.month_date);
        const itemYear = itemDate.getFullYear();
        const itemMonth = itemDate.getMonth() + 1;
        
        if (itemYear === effectiveRecruitmentYear) {
          const templateItem = template.find((t) => t.monthNum === itemMonth);
          if (templateItem) {
            templateItem.recruitment = item.recruitment || 0;
          }
        }
      }
    });
    
    return template;
  }, [monthlyCombined, effectiveRecruitmentYear]);

  // SYSTEM RULE: Departure chart data - LỌC THEO departureYear
  const departureChartData = useMemo(() => {
    const months = ["T1", "T2", "T3", "T4", "T5", "T6", "T7", "T8", "T9", "T10", "T11", "T12"];
    
    const template = months.map((month, index) => ({
      month,
      monthNum: index + 1,
      departure: 0,
    }));
    
    if (!monthlyCombined) return template;
    
    monthlyCombined.forEach((item) => {
      if (item.month_date) {
        const itemDate = new Date(item.month_date);
        const itemYear = itemDate.getFullYear();
        const itemMonth = itemDate.getMonth() + 1;
        
        if (itemYear === effectiveDepartureYear) {
          const templateItem = template.find((t) => t.monthNum === itemMonth);
          if (templateItem) {
            templateItem.departure = item.departure || 0;
          }
        }
      }
    });
    
    return template;
  }, [monthlyCombined, effectiveDepartureYear]);

  // SYSTEM RULE: Passed interview chart data - LỌC THEO passedYear
  const passedChartData = useMemo(() => {
    const months = ["T1", "T2", "T3", "T4", "T5", "T6", "T7", "T8", "T9", "T10", "T11", "T12"];
    
    const template = months.map((month, index) => ({
      month,
      monthNum: index + 1,
      passed: 0,
    }));
    
    if (!monthlyPassed) return template;
    
    monthlyPassed.forEach((item) => {
      if (item.month_date) {
        const itemDate = new Date(item.month_date);
        const itemYear = itemDate.getFullYear();
        const itemMonth = itemDate.getMonth() + 1;
        
        if (itemYear === effectivePassedYear) {
          const templateItem = template.find((t) => t.monthNum === itemMonth);
          if (templateItem) {
            templateItem.passed = item.passed_count || 0;
          }
        }
      }
    });
    
    return template;
  }, [monthlyPassed, effectivePassedYear]);

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

  // Top 10 công ty tuyển dụng trong năm - LỌC THEO effectiveCompanyYear
  const companyChartData = useMemo(() => {
    if (!companyData) return [];
    return companyData
      .filter(c => c.company_name && c.year === effectiveCompanyYear && c.count > 0)
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)
      .map(c => ({
        name: c.company_name || "Không xác định",
        value: c.count,
      }));
  }, [companyData, effectiveCompanyYear]);

  return (
    <div className="space-y-6">
      {/* KPI Cards Row - Display only, no navigation */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Total Trainees */}
         <Card>
          <CardContent className="p-5">
            {loadingStageCounts ? (
              <div className="space-y-3">
                <Skeleton className="h-12 w-12 rounded-2xl" />
                <Skeleton className="h-8 w-20" />
                <Skeleton className="h-4 w-32" />
              </div>
            ) : (
              <div className="flex gap-4">
                <div className="space-y-3 flex-1">
                  <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center", iconColorClasses.blue)}>
                    <Users className="h-6 w-6" />
                  </div>
                  <div className="space-y-1">
                    <div className="text-2xl font-bold text-foreground">
                      {totalTrainees}
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
                {/* Gender breakdown */}
                <div className="flex flex-col justify-center gap-1 min-w-[60px]">
                  <div className="flex items-center gap-1">
                    <span className="text-sm font-semibold text-blue-600">{kpis?.total_male || 0}</span>
                    <span className="text-xs text-muted-foreground">Nam</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-sm font-semibold text-red-500">{kpis?.total_female || 0}</span>
                    <span className="text-xs text-muted-foreground">Nữ</span>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Currently Studying */}
        <Card>
          <CardContent className="p-5">
            {loadingEducation ? (
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
                  <p className="text-xs text-muted-foreground">Đang đào tạo (từ menu Đào tạo)</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Trainees Departed - SINGLE SOURCE từ menu Học viên + departure_date */}
        <Card>
          <CardContent className="p-5">
            {loadingDeparted ? (
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
                    {departedThisYear}
                  </div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Xuất cảnh năm nay
                  </p>
                  <p className="text-xs text-muted-foreground">Đã xuất cảnh năm {currentYear}</p>
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

        {/* Dormitory Residents - SINGLE SOURCE từ menu KTX */}
        <Card>
          <CardContent className="p-5">
            {loadingDormitory ? (
              <div className="space-y-3">
                <Skeleton className="h-12 w-12 rounded-2xl" />
                <Skeleton className="h-8 w-20" />
              </div>
            ) : (
              <div className="flex gap-4">
                <div className="space-y-3 flex-1">
                  <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center", iconColorClasses.cyan)}>
                    <Building2 className="h-6 w-6" />
                  </div>
                  <div className="space-y-1">
                    <div className="text-2xl font-bold text-foreground">
                      {dormitoryStats?.total_residents || 0}
                    </div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Học viên KTX
                    </p>
                    <p className="text-xs text-muted-foreground">Đang ở ký túc xá</p>
                  </div>
                </div>
                {/* Gender breakdown */}
                <div className="flex flex-col justify-center gap-1 min-w-[60px]">
                  <div className="flex items-center gap-1">
                    <span className="text-sm font-semibold text-blue-600">{dormitoryStats?.male_count || 0}</span>
                    <span className="text-xs text-muted-foreground">Nam</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-sm font-semibold text-red-500">{dormitoryStats?.female_count || 0}</span>
                    <span className="text-xs text-muted-foreground">Nữ</span>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Charts Row - Three separate bar charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Bar Chart - Tuyển dụng trong năm */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div className="flex items-center gap-2">
              <CardTitle className="text-base font-semibold">Tuyển dụng</CardTitle>
              <span className="text-lg font-bold text-emerald-600">
                ({recruitmentChartData.reduce((sum, item) => sum + item.recruitment, 0)})
              </span>
            </div>
            <Select
              value={effectiveRecruitmentYear.toString()}
              onValueChange={(v) => setRecruitmentYear(parseInt(v))}
            >
              <SelectTrigger className="w-[90px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {recruitmentYears.map((y) => (
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
                  <BarChart data={recruitmentChartData} barSize={20} margin={{ top: 20, right: 5, left: 5, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="month" fontSize={10} tickLine={false} axisLine={false} interval={0} />
                    <YAxis fontSize={10} tickLine={false} axisLine={false} />
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

        {/* Bar Chart - Đậu phỏng vấn trong năm */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div className="flex items-center gap-2">
              <CardTitle className="text-base font-semibold">Đậu phỏng vấn</CardTitle>
              <span className="text-lg font-bold text-orange-600">
                ({passedChartData.reduce((sum, item) => sum + item.passed, 0)})
              </span>
            </div>
            <Select
              value={effectivePassedYear.toString()}
              onValueChange={(v) => setPassedYear(parseInt(v))}
            >
              <SelectTrigger className="w-[90px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {passedYears.map((y) => (
                  <SelectItem key={y} value={y.toString()}>
                    {y}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardHeader>
          <CardContent>
            {loadingPassed ? (
              <Skeleton className="h-64 w-full" />
            ) : (
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={passedChartData} barSize={20} margin={{ top: 20, right: 5, left: 5, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="month" fontSize={10} tickLine={false} axisLine={false} interval={0} />
                    <YAxis fontSize={10} tickLine={false} axisLine={false} />
                    <Tooltip
                      contentStyle={{
                        borderRadius: "8px",
                        border: "1px solid hsl(var(--border))",
                      }}
                    />
                    <Bar dataKey="passed" name="Đậu phỏng vấn" fill="#F97316" radius={[4, 4, 0, 0]}>
                      <LabelList 
                        dataKey="passed" 
                        position="inside" 
                        fill="#ffffff" 
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

        {/* Bar Chart - Xuất cảnh trong năm */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div className="flex items-center gap-2">
              <CardTitle className="text-base font-semibold">Xuất cảnh</CardTitle>
              <span className="text-lg font-bold text-blue-600">
                ({departureChartData.reduce((sum, item) => sum + item.departure, 0)})
              </span>
            </div>
            <Select
              value={effectiveDepartureYear.toString()}
              onValueChange={(v) => setDepartureYear(parseInt(v))}
            >
              <SelectTrigger className="w-[90px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {departureYears.map((y) => (
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
                  <BarChart data={departureChartData} barSize={20} margin={{ top: 20, right: 5, left: 5, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="month" fontSize={10} tickLine={false} axisLine={false} interval={0} />
                    <YAxis fontSize={10} tickLine={false} axisLine={false} />
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
          <CardTitle className="text-base font-semibold">Top 10 công ty tuyển dụng trong năm {effectiveCompanyYear}</CardTitle>
          <Select
            value={effectiveCompanyYear.toString()}
            onValueChange={(v) => setCompanyYear(parseInt(v))}
          >
            <SelectTrigger className="w-[100px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {companyYears.map((y) => (
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
              Không có dữ liệu công ty trong năm {effectiveCompanyYear}
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
      {/* Advanced Filter - Tra cứu nâng cao */}
      <DashboardAdvancedFilter />
    </div>
  );
}
