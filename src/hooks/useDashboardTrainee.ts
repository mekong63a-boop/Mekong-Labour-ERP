import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

// Types for dashboard views
export interface TraineeKPIs {
  total_trainees: number;
  total_male: number;
  total_female: number;
  status_studying: number;
  studying_male: number;
  studying_female: number;
  departed_this_year: number;
  departed_male: number;
  departed_female: number;
  stage_recruited: number;
  stage_visa_processing: number;
  stage_ready_to_depart: number;
  stage_departed: number;
  stage_in_japan: number;
  stage_post_departure: number;
  stage_archived: number;
  type_tts: number;
  type_knd: number;
  type_engineer: number;
  type_student: number;
  type_tts3: number;
  registered_this_month: number;
  registered_this_year: number;
  departed_this_month: number;
  active_orders: number;
}

export interface StageData { stage: string; count: number; }
export interface StatusData { status: string; count: number; }
export interface TypeData { trainee_type: string; count: number; }
export interface MonthlyData { month_label: string; registrations: number; }
export interface SourceData { source: string; count: number; }
export interface BirthplaceData { birthplace: string; count: number; }
export interface GenderData { gender: string; count: number; }
export interface DeparturesMonthlyData { month_label: string; departures: number; }
export interface PassedMonthlyData { month_label: string; month_date: string; passed_count: number; }
export interface MonthlyCombinedData { month_label: string; month_date: string; recruitment: number; departure: number; }
export interface CompanyData { company_id: string; company_name: string; year: number; count: number; }
export interface MonthlyPassedData { month_label: string; month_date: string; passed_count: number; }

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const queryView = async (viewName: string): Promise<any[]> => {
  const { data, error } = await supabase.from(viewName as "trainees").select("*");
  if (error) throw error;
  return data || [];
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const queryViewSingle = async (viewName: string): Promise<any> => {
  const { data, error } = await supabase.from(viewName as "trainees").select("*").limit(1);
  if (error) throw error;
  return data?.[0] || null;
};

export const useTraineeKPIs = () => useQuery({
  queryKey: ["dashboard-trainee-kpis"],
  queryFn: () => queryViewSingle("dashboard_trainee_kpis") as Promise<TraineeKPIs>,
  staleTime: 30 * 1000, // 30 seconds for fresher data
});

export const useTraineeByStage = () => useQuery({
  queryKey: ["dashboard-trainee-by-stage"],
  queryFn: () => queryView("dashboard_trainee_by_stage") as Promise<StageData[]>,
  staleTime: 30 * 1000,
});

export const useTraineeByStatus = () => useQuery({
  queryKey: ["dashboard-trainee-by-status"],
  queryFn: () => queryView("dashboard_trainee_by_status") as Promise<StatusData[]>,
  staleTime: 30 * 1000,
});

export const useTraineeByType = () => useQuery({
  queryKey: ["dashboard-trainee-by-type"],
  queryFn: () => queryView("dashboard_trainee_by_type") as Promise<TypeData[]>,
  staleTime: 30 * 1000,
});

export const useTraineeMonthly = () => useQuery({
  queryKey: ["dashboard-trainee-monthly"],
  queryFn: () => queryView("dashboard_trainee_monthly") as Promise<MonthlyData[]>,
  staleTime: 30 * 1000,
});

export const useTraineeBySource = () => useQuery({
  queryKey: ["dashboard-trainee-by-source"],
  queryFn: () => queryView("dashboard_trainee_by_source") as Promise<SourceData[]>,
  staleTime: 30 * 1000,
});

export const useTraineeByBirthplace = () => useQuery({
  queryKey: ["dashboard-trainee-by-birthplace"],
  queryFn: () => queryView("dashboard_trainee_by_birthplace") as Promise<BirthplaceData[]>,
  staleTime: 30 * 1000,
});

export const useTraineeByGender = () => useQuery({
  queryKey: ["dashboard-trainee-by-gender"],
  queryFn: () => queryView("dashboard_trainee_by_gender") as Promise<GenderData[]>,
  staleTime: 30 * 1000,
});

export const useTraineeDeparturesMonthly = () => useQuery({
  queryKey: ["dashboard-trainee-departures-monthly"],
  queryFn: () => queryView("dashboard_trainee_departures_monthly") as Promise<DeparturesMonthlyData[]>,
  staleTime: 30 * 1000,
});

export const useTraineePassedMonthly = () => useQuery({
  queryKey: ["dashboard-trainee-passed-monthly"],
  queryFn: () => queryView("dashboard_trainee_passed_monthly") as Promise<PassedMonthlyData[]>,
  staleTime: 30 * 1000,
});

// SYSTEM RULE: Monthly passed data from new view (with month_date for filtering)
export const useMonthlyPassed = () => useQuery({
  queryKey: ["dashboard-monthly-passed"],
  queryFn: () => queryView("dashboard_monthly_passed") as Promise<MonthlyPassedData[]>,
  staleTime: 30 * 1000,
});

// SYSTEM RULE: Combined monthly data từ DB view (thay thế useMemo combine ở frontend)
export const useMonthlyCombined = () => useQuery({
  queryKey: ["dashboard-monthly-combined"],
  queryFn: () => queryView("dashboard_monthly_combined") as Promise<MonthlyCombinedData[]>,
  staleTime: 30 * 1000,
});

// SYSTEM RULE: Top companies by recruited trainees
export const useTraineeByCompany = () => useQuery({
  queryKey: ["dashboard-trainee-by-company"],
  queryFn: () => queryView("dashboard_trainee_by_company") as Promise<CompanyData[]>,
  staleTime: 30 * 1000,
});

// SYSTEM RULE: Available years from all trainee data
export interface YearData { year: number; }
export const useAvailableYears = () => useQuery({
  queryKey: ["dashboard-available-years"],
  queryFn: () => queryView("dashboard_available_years") as Promise<YearData[]>,
  staleTime: 60 * 1000, // 1 minute - years don't change often
});

// SINGLE SOURCE: Post-departure stats từ view Sau xuất cảnh
export interface PostDepartureStatsData {
  year: string;
  working: number;
  early_return: number;
  absconded: number;
  completed: number;
  total: number;
}
export const usePostDepartureStats = () => useQuery({
  queryKey: ["post-departure-stats-by-year"],
  queryFn: () => queryView("post_departure_stats_by_year") as Promise<PostDepartureStatsData[]>,
  staleTime: 30 * 1000,
});

// SSOT: Xuất cảnh theo năm departure_date - SOURCE: Menu Học viên
export interface DepartedByYearData {
  year: number;
  total: number;
  male_count: number;
  female_count: number;
}
export const useDepartedByDepartureYear = () => useQuery({
  queryKey: ["dashboard-departed-by-departure-year"],
  queryFn: () => queryView("dashboard_departed_by_departure_year") as Promise<DepartedByYearData[]>,
  staleTime: 30 * 1000,
});

// SSOT: Tổng sĩ số đang học - SOURCE: Menu Đào tạo (class_student_counts)
export interface EducationTotalData {
  total_studying: number;
}
export const useEducationTotal = () => useQuery({
  queryKey: ["dashboard-education-total"],
  queryFn: () => queryViewSingle("dashboard_education_total") as Promise<EducationTotalData>,
  staleTime: 30 * 1000,
});
