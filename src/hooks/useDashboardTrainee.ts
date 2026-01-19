import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

// Types for dashboard views
export interface TraineeKPIs {
  total_trainees: number;
  status_new: number;
  status_studying: number;
  status_reserved: number;
  status_stopped: number;
  status_not_studying: number;
  status_cancelled: number;
  status_in_japan: number;
  status_left_company: number;
  stage_not_passed: number;
  stage_passed_interview: number;
  stage_submitted: number;
  stage_otit: number;
  stage_nyukan: number;
  stage_coe: number;
  stage_visa: number;
  stage_departed: number;
  stage_working: number;
  stage_completed: number;
  stage_absconded: number;
  stage_early_return: number;
  type_tts: number;
  type_knd: number;
  type_engineer: number;
  type_student: number;
  type_tts3: number;
  registered_this_month: number;
  registered_this_year: number;
  departed_this_month: number;
  departed_this_year: number;
}

export interface StageData { stage: string; count: number; }
export interface StatusData { status: string; count: number; }
export interface TypeData { trainee_type: string; count: number; }
export interface MonthlyData { month_label: string; registrations: number; }
export interface SourceData { source: string; count: number; }
export interface BirthplaceData { birthplace: string; count: number; }
export interface GenderData { gender: string; count: number; }
export interface DeparturesMonthlyData { month_label: string; departures: number; }
export interface PassedMonthlyData { month_label: string; passed_count: number; }

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
